import express from 'express';
import { sendMessage as sendMessageWhapi, downloadMedia } from '../services/whatsapp.js';
import { sendMessageMeta } from '../services/metaWhatsApp.js';
import { processAIResponse } from '../services/ai.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const getProviderSettings = async () => {
  const settingsList = await prisma.setting.findMany();
  return settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
};

const dispatchMessage = async (to, text) => {
  const settings = await getProviderSettings();
  if (settings.WHATSAPP_PROVIDER === 'meta') {
    return sendMessageMeta(to, text);
  } else {
    return sendMessageWhapi(to, text);
  }
};

// Helper functions for persistent database-backed ChatState and Message storage

const getChatState = async (phone, defaultName = 'Cliente') => {
  let state = await prisma.chatState.findUnique({ where: { phone } });
  if (!state) {
    state = await prisma.chatState.create({
      data: { phone, name: defaultName, autoPilot: true }
    });
  }
  return state;
};

const updateChatAutopilot = async (phone, autoPilot) => {
  return prisma.chatState.upsert({
    where: { phone },
    update: { autoPilot, updatedAt: new Date() },
    create: { phone, name: 'Cliente', autoPilot }
  });
};

const saveMessage = async (phone, name, text, fromMe, type = 'msg', autoPilot = true, media = null) => {
  // Update last activity / ensure ChatState exists
  await prisma.chatState.upsert({
    where: { phone },
    update: { name, updatedAt: new Date() },
    create: { phone, name, autoPilot }
  });

  // Create message record
  return prisma.message.create({
    data: {
      phone, name, text, fromMe, type, autoPilot,
      mediaUrl: media?.url || null,
      mediaType: media?.type || null
    }
  });
};

export const setupWhatsAppRoutes = (io) => {

  // Get statistics of WhatsApp activity (today) in Colombia timezone
  router.get('/stats', async (req, res) => {
    try {
      const bogotaDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
      const startOfToday = new Date(`${bogotaDateStr}T00:00:00-05:00`);

      const mensajesHoy = await prisma.message.count({
        where: { createdAt: { gte: startOfToday } }
      });
      const respondidosIA = await prisma.message.count({
        where: { createdAt: { gte: startOfToday }, fromMe: true, autoPilot: true }
      });
      const chatsActivos = await prisma.chatState.count();
      const requierenAtencion = await prisma.chatState.count({ where: { autoPilot: false } });

      res.json({ mensajesHoy, respondidosIA, chatsActivos, requierenAtencion });
    } catch (error) {
      console.error('Error calculating whatsapp stats:', error);
      res.status(500).json({ error: 'Error al calcular estadísticas de WhatsApp' });
    }
  });

  // GET all active chats
  router.get('/chats', async (req, res) => {
    try {
      const chats = await prisma.chatState.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      res.json(chats);
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: 'Failed to retrieve chats' });
    }
  });

  // GET messages history for a phone number
  router.get('/messages', async (req, res) => {
    try {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ error: 'Phone parameter is required' });
      }
      const messages = await prisma.message.findMany({
        where: { phone },
        orderBy: { createdAt: 'asc' }
      });
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  });

  // Webhook from Whapi
  router.post('/webhook', async (req, res) => {
    try {
      const messages = req.body.messages;
      if (!messages || messages.length === 0) {
        return res.status(200).send('OK');
      }

      for (const msg of messages) {
        if (msg.from_me) continue; // Ignore own messages

        const phone = msg.chat_id.split('@')[0];
        const senderName = msg.push_name || 'Cliente';

        let text = msg.text?.body || '';
        let media = null;

        if (msg.type === 'image' && msg.image) {
          const dataUri = await downloadMedia(msg.image.id, msg.image.mime_type);
          if (dataUri) {
            media = { url: dataUri, type: 'image' };
            text = msg.image.caption || '[Imagen recibida]';
          } else {
            text = msg.image.caption || '[Imagen recibida - no se pudo descargar]';
          }
        }

        // 1. Get current autopilot state
        const state = await getChatState(phone, senderName);

        // 2. Save incoming message to DB
        await saveMessage(phone, senderName, text, false, 'msg', state.autoPilot, media);

        // Notify frontend of incoming message
        io.emit('whatsapp_message', {
          phone,
          name: senderName,
          text,
          fromMe: false,
          autoPilot: state.autoPilot,
          mediaUrl: media?.url || null,
          timestamp: new Date()
        });

        if (state.autoPilot) {
          // Process via AI
          const responseText = await processAIResponse(phone, text, async (thought) => {
             // Save AI thought to DB
             await saveMessage(phone, 'Cerebro de Reservas', thought, false, 'thought', true);
             // Emit thoughts to frontend
             io.emit('ai_thought', { phone, thought, timestamp: new Date() });
          });

          // Send reply
          try {
            await dispatchMessage(phone, responseText);
          } catch (err) {
            console.warn("Failed to dispatch real WhatsApp message:", err.message);
          }

          // Save AI reply to DB
          await saveMessage(phone, 'AI OVERSEER', responseText, true, 'msg', true);

          // Notify frontend of AI reply
          io.emit('whatsapp_message', {
            phone,
            name: 'AI OVERSEER',
            text: responseText,
            fromMe: true,
            autoPilot: true,
            timestamp: new Date()
          });

        } else {
           console.log(`Manual mode active for ${phone}. Ignoring message for AI.`);
        }
      }

      res.status(200).send('Event processed');
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  // Endpoint for manual sending from Frontend
  router.post('/send', async (req, res) => {
    try {
      const { phone, text, operatorName } = req.body;
      const opName = operatorName || 'Operador';
      
      if (!phone || !text) {
        return res.status(400).json({ error: 'Phone and text are required' });
      }

      try {
        await dispatchMessage(phone, text);
      } catch (err) {
        console.warn("Failed to dispatch manual message via WhatsApp:", err.message);
      }

      // Force autopilot off when human replies
      await updateChatAutopilot(phone, false);

      // Save manual message to DB
      await saveMessage(phone, opName, text, true, 'msg', false);

      // Notify frontend
      io.emit('whatsapp_message', {
        phone,
        name: opName,
        text,
        fromMe: true,
        autoPilot: false,
        timestamp: new Date()
      });
      
      // Update toggle state explicitly to frontend
      io.emit('autopilot_status', { phone, autoPilot: false });

      res.json({ success: true });
    } catch (error) {
      console.error('Send Error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Endpoint to simulate incoming customer messages (optionally with an image, e.g. a payment receipt)
  router.post('/simulate', async (req, res) => {
    try {
      const { phone, text, name, imageBase64, imageMimeType } = req.body;
      if (!phone || (!text && !imageBase64)) {
        return res.status(400).json({ error: 'Phone and (text or imageBase64) are required' });
      }

      const senderName = name || 'Cliente';
      const media = imageBase64
        ? { url: imageBase64.startsWith('data:') ? imageBase64 : `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}`, type: 'image' }
        : null;
      const messageText = text || '[Imagen recibida]';

      // 1. Get current autopilot state
      const state = await getChatState(phone, senderName);

      // 2. Save incoming client message
      await saveMessage(phone, senderName, messageText, false, 'msg', state.autoPilot, media);

      // Emit incoming simulated client message to frontend
      io.emit('whatsapp_message', {
        phone,
        name: senderName,
        text: messageText,
        fromMe: false,
        autoPilot: state.autoPilot,
        mediaUrl: media?.url || null,
        timestamp: new Date()
      });

      // 3. If autopilot is ON, process via AI
      if (state.autoPilot) {
        const responseText = await processAIResponse(phone, messageText, async (thought) => {
           // Save thought to DB
           await saveMessage(phone, 'Cerebro de Reservas', thought, false, 'thought', true);
           io.emit('ai_thought', { phone, thought, timestamp: new Date() });
        });

        // Try dispatching but safely ignore failure
        try {
          await dispatchMessage(phone, responseText);
        } catch (err) {
          console.warn("Bypassed real WhatsApp dispatch for simulation:", err.message);
        }

        // Save AI response to DB
        await saveMessage(phone, 'AI OVERSEER', responseText, true, 'msg', true);

        // Emit AI reply
        io.emit('whatsapp_message', {
          phone,
          name: 'AI OVERSEER',
          text: responseText,
          fromMe: true,
          autoPilot: true,
          timestamp: new Date()
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Simulation Error:', error);
      res.status(500).json({ error: 'Simulation failed' });
    }
  });

  // Toggle autopilot from frontend
  router.post('/toggle-autopilot', async (req, res) => {
     try {
       const { phone, autoPilot } = req.body;
       await updateChatAutopilot(phone, !!autoPilot);
       io.emit('autopilot_status', { phone, autoPilot: !!autoPilot });
       res.json({ success: true, autoPilot: !!autoPilot });
     } catch (error) {
       console.error('Toggle Autopilot Error:', error);
       res.status(500).json({ error: 'Failed to toggle autopilot' });
     }
  });
  
  // Health check for WhatsApp Provider
  router.get('/status', async (req, res) => {
    try {
      const settings = await getProviderSettings();
      let status = { provider: settings.WHATSAPP_PROVIDER || 'whapi', connection: 'unknown' };
      
      if (settings.WHATSAPP_PROVIDER === 'meta') {
        status.connection = settings.META_TOKEN ? 'configured' : 'unconfigured';
      } else {
        const { checkStatus } = await import('../services/whatsapp.js');
        const whapiStatus = await checkStatus();
        status.connection = whapiStatus.status;
      }
      
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
