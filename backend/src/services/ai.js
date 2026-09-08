import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Database-backed conversation context is loaded dynamically in processAIResponse

const SYSTEM_PROMPT = `Eres el asistente virtual oficial de 'ENCANTO - Los mejores planes en un solo lugar'.
Tu rol es amable, profesional y conciso, adaptado a WhatsApp.
Tu objetivo principal es ayudar a los clientes a consultar disponibilidad y reservar canchas deportivas (Fútbol, Tenis, Pádel, etc.) y brindar información básica.

REGLAS:
1. NUNCA inventes horarios ni disponibilidades. Si el cliente pregunta, usa la herramienta check_availability.
2. Antes de crear una reserva, debes conocer la fecha, hora, tipo de cancha, y nombre del cliente. Si falta algo, pregúntalo.
3. Para confirmar la reserva, debes usar la herramienta create_booking pasándole el ID real (UUID) de la cancha que obtuviste de check_availability. NUNCA uses nombres genéricos o tipos de deporte (como "TENIS" o "FUTBOL") en el campo courtId.
4. Mantén tus respuestas breves, con un máximo de 2-3 oraciones. Usa emojis con moderación.
5. Si un cliente está enojado, pide hablar con un humano o hace preguntas que no puedes responder (como quejas o devoluciones), utiliza la herramienta escalate_to_human.

PAGOS Y ABONOS:
6. La reserva se crea siempre en estado pendiente de pago (nadie paga nada todavía en create_booking). Si el cliente quiere pagar un abono (pago parcial) o el valor completo por este medio (transferencia, Nequi, Daviplata, etc.), dile que te envíe una FOTO o captura de pantalla del comprobante de pago antes de darlo por confirmado. Nunca marques ni le digas al cliente que un pago quedó confirmado sin haber recibido y revisado esa imagen.
7. Cuando el cliente envíe una imagen de un comprobante, obsérvala con cuidado dentro de la conversación e identifica: el valor pagado, y si es visible, el medio de pago (Nequi, Bancolombia, Daviplata, efectivo, etc.). Luego usa la herramienta register_payment_proof pasando el customerPhone (y la fecha/hora de la reserva si el cliente tiene más de una) para registrarlo; no necesitas ni debes inventar un ID de reserva. Si el texto del comprobante no es legible o no estás seguro del valor, indica legible:false y amountDetected:0, y pide al cliente una foto más clara.
8. Un pago registrado mediante comprobante queda pendiente de verificación por un operador humano (no lo trates como 100% confirmado ante el cliente; dile que su reserva queda apartada y el pago en revisión).
9. Este mismo mecanismo (enviar comprobante) sirve tanto para el abono inicial como para cuando el cliente paga el saldo restante más adelante en otra conversación.
`;

const tools = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Check if there are any courts available for a specific date and time.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          time: { type: 'string', description: 'Time in HH:MM format (24h)' },
          courtType: { type: 'string', description: 'Type of court: FUTBOL, TENIS, PADEL' }
        },
        required: ['date', 'time', 'courtType']
      },
      parse: JSON.parse,
      function: async ({ date, time, courtType }) => {
        const startTime = new Date(`${date}T${time}:00-05:00`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour

        const courts = await prisma.court.findMany({ where: { type: courtType } });
        const availableCourts = [];

        for (const court of courts) {
          const conflict = await prisma.booking.findFirst({
            where: {
              courtId: court.id,
              status: { not: 'CANCELLED' },
              OR: [
                { startTime: { lt: endTime, gte: startTime } },
                { endTime: { gt: startTime, lte: endTime } }
              ]
            }
          });
          if (!conflict) availableCourts.push(court);
        }

        if (availableCourts.length > 0) {
          return { available: true, courts: availableCourts.map(c => ({ id: c.id, name: c.name })) };
        } else {
          return { available: false, message: 'No hay canchas disponibles para ese horario.' };
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Create a new court booking for a customer. The booking always starts as PENDING with no payment recorded; use register_payment_proof afterwards if the customer sends a payment receipt.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          customerPhone: { type: 'string' },
          courtId: { type: 'string', description: 'The exact "id" field of one court object from the most recent check_availability result. Never invent or reuse an old UUID, and never pass the court name or sport type (e.g. "TENIS" or "FUTBOL") in this field.' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          time: { type: 'string', description: 'Time in HH:MM format (24h)' }
        },
        required: ['customerName', 'customerPhone', 'courtId', 'date', 'time']
      },
      parse: JSON.parse,
      function: async ({ customerName, customerPhone, courtId, date, time }) => {
        const startTime = new Date(`${date}T${time}:00-05:00`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const court = await prisma.court.findUnique({ where: { id: courtId } });
        if (!court) {
          return { success: false, message: 'El ID de cancha proporcionado no existe. Vuelve a llamar a check_availability para obtener un ID de cancha válido y actualizado, y luego reintenta la reserva.' };
        }

        // Check for conflicts
        const conflict = await prisma.booking.findFirst({
          where: {
            courtId: courtId,
            status: { not: 'CANCELLED' },
            OR: [
              { startTime: { lt: endTime, gte: startTime } },
              { endTime: { gt: startTime, lte: endTime } }
            ]
          }
        });

        if (conflict) {
          return { success: false, message: 'La cancha ya está reservada en ese horario. Por favor dile al cliente que elija otra hora, fecha u otra cancha.' };
        }

        // Find or create customer
        const customer = await prisma.customer.upsert({
          where: { phone: customerPhone },
          update: { name: customerName },
          create: { name: customerName, phone: customerPhone }
        });

        // Resolve real price from the settings-configured price grid (COURT_PRICING[courtId][hourKey])
        const dbSettings = await getSettings();
        let totalPrice = 0;
        let priceConfigured = true;
        try {
          const pricing = dbSettings.COURT_PRICING ? JSON.parse(dbSettings.COURT_PRICING) : {};
          const hourKey = String(time).split(':')[0].padStart(2, '0');
          const configured = pricing?.[courtId]?.[hourKey];
          if (configured !== undefined && configured !== null && configured !== '') {
            totalPrice = parseFloat(configured) || 0;
          } else {
            priceConfigured = false;
          }
        } catch {
          priceConfigured = false;
        }

        // Create booking
        const booking = await prisma.booking.create({
          data: {
            courtId,
            customerId: customer.id,
            startTime,
            endTime,
            totalPrice,
            status: 'PENDING'
          }
        });

        return {
          success: true,
          bookingId: booking.id,
          totalPrice,
          message: priceConfigured
            ? `Reserva creada exitosamente en estado pendiente. Valor total: ${totalPrice}.`
            : `Reserva creada exitosamente en estado pendiente. El precio de este horario no está configurado en el sistema (quedó en 0); infórmale al cliente que el valor se confirmará con el personal, y avisa que un operador debe configurar el precio de esta cancha/horario.`
        };
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'register_payment_proof',
      description: 'Register a payment receipt/proof (comprobante) the customer sent as an image, for the initial deposit or for a later payment of the remaining balance. Only call this after visually reading the receipt image present in the conversation. You do NOT need a booking ID: the booking is resolved automatically from the customer phone (and date/time if the customer has more than one reservation).',
      parameters: {
        type: 'object',
        properties: {
          customerPhone: { type: 'string', description: 'Phone number of the customer who sent the receipt, exactly as used in this conversation.' },
          date: { type: 'string', description: 'Date (YYYY-MM-DD) of the reservation this payment is for, if known. Omit if unsure.' },
          time: { type: 'string', description: 'Time (HH:MM 24h) of the reservation this payment is for, if known. Omit if unsure.' },
          amountDetected: { type: 'number', description: 'The payment amount you read from the receipt image. Pass 0 if the image is unreadable.' },
          paymentMethod: { type: 'string', description: 'Payment method/platform visible on the receipt, e.g. Nequi, Bancolombia, Daviplata, Efectivo. Use "DESCONOCIDO" if not visible.' },
          legible: { type: 'boolean', description: 'Whether the receipt image was clear enough to confidently read an amount.' }
        },
        required: ['customerPhone', 'amountDetected', 'paymentMethod', 'legible']
      },
      parse: JSON.parse,
      function: async ({ customerPhone, date, time, amountDetected, paymentMethod, legible }, ctx) => {
        const customer = await prisma.customer.findUnique({ where: { phone: customerPhone } });
        if (!customer) {
          return { success: false, message: 'No se encontró ningún cliente con ese teléfono. Confirma que la reserva ya fue creada con create_booking antes de registrar un pago.' };
        }

        let booking = null;
        if (date && time) {
          const startTime = new Date(`${date}T${time}:00-05:00`);
          booking = await prisma.booking.findFirst({
            where: { customerId: customer.id, startTime, status: { not: 'CANCELLED' } }
          });
        }

        if (!booking) {
          // Fall back to the customer's most recent non-cancelled, not-yet-fully-paid booking
          const candidates = await prisma.booking.findMany({
            where: { customerId: customer.id, status: { not: 'CANCELLED' } },
            orderBy: { createdAt: 'desc' }
          });
          booking = candidates.find(b => b.amountPaid < b.totalPrice) || candidates[0] || null;
        }

        if (!booking) {
          return { success: false, message: 'Este cliente no tiene ninguna reserva registrada todavía. Crea la reserva primero con create_booking antes de registrar un pago.' };
        }

        if (!legible || !amountDetected) {
          await prisma.paymentReceipt.create({
            data: {
              bookingId: booking.id,
              imageData: ctx?.lastImage || '',
              amountDetected: 0,
              paymentMethod: paymentMethod || 'DESCONOCIDO',
              legible: false,
              status: 'PENDING_REVIEW'
            }
          });
          return { success: true, message: 'El comprobante no se pudo leer con claridad. Pídele al cliente una foto más clara y nítida del comprobante, evitando reflejos o recortes.' };
        }

        await prisma.paymentReceipt.create({
          data: {
            bookingId: booking.id,
            imageData: ctx?.lastImage || '',
            amountDetected,
            paymentMethod: paymentMethod || 'DESCONOCIDO',
            legible: true,
            status: 'PENDING_REVIEW'
          }
        });

        const newAmountPaid = (booking.amountPaid || 0) + amountDetected;
        const newStatus = newAmountPaid >= booking.totalPrice && booking.totalPrice > 0 ? 'CONFIRMED' : 'PARCIAL';

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            amountPaid: newAmountPaid,
            status: newStatus,
            isPaid: newStatus === 'CONFIRMED'
          }
        });

        const saldo = Math.max(0, booking.totalPrice - newAmountPaid);

        return {
          success: true,
          message: `Comprobante registrado por ${amountDetected} (${paymentMethod || 'medio no especificado'}). Saldo pendiente: ${saldo}. Este pago queda apartado en la reserva y pendiente de verificación por un operador humano; no lo confirmes como definitivo ante el cliente.`
        };
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_customer_info',
      description: 'Guardar o actualizar el nombre del cliente en la base de datos en cuanto lo mencione en el chat.',
      parameters: {
        type: 'object',
        properties: {
          customerName: { type: 'string', description: 'Nombre completo o preferido del cliente.' }
        },
        required: ['customerName']
      },
      parse: JSON.parse,
      function: async ({ customerName }, ctx) => {
        if (!ctx?.phone) return { success: false, message: 'No se encontró teléfono del cliente en el contexto.' };
        await prisma.customer.upsert({
          where: { phone: ctx.phone },
          update: { name: customerName },
          create: { name: customerName, phone: ctx.phone }
        });
        await prisma.chatState.upsert({
          where: { phone: ctx.phone },
          update: { name: customerName, updatedAt: new Date() },
          create: { phone: ctx.phone, name: customerName, autoPilot: true }
        });
        return { success: true, message: `Nombre de cliente guardado exitosamente como "${customerName}".` };
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description: 'Escalate the conversation to a human operator.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for escalation' }
        },
        required: ['reason']
      },
      parse: JSON.parse,
      function: async ({ reason }) => {
        // This is handled in the route layer normally by checking the tool call
        return { success: true, message: 'La conversación ha sido marcada para intervención humana.' };
      }
    }
  }
];

const getSettings = async () => {
  const settingsList = await prisma.setting.findMany();
  return settingsList.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
};

export const processAIResponse = async (phone, messageText, onThought) => {
  const dbSettings = await getSettings();
  const apiKey = dbSettings.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const customPrompt = dbSettings.SYSTEM_PROMPT || SYSTEM_PROMPT;

  // Retrieve existing customer & chat state to feed known data to AI
  const [existingCustomer, chatState] = await Promise.all([
    prisma.customer.findUnique({ where: { phone } }),
    prisma.chatState.findUnique({ where: { phone } })
  ]);

  const knownName = existingCustomer?.name || (chatState?.name && chatState.name !== 'Cliente' ? chatState.name : null);

  let customerContext = `\n\nDATOS REGISTRADOS DEL CLIENTE (WHATSAPP: ${phone}):`;
  if (knownName) {
    customerContext += `\n- Nombre del cliente: "${knownName}"`;
    customerContext += `\n- Teléfono del cliente: "${phone}"`;
    customerContext += `\nINSTRUCCIÓN CRÍTICA: YA CONOCES EL NOMBRE (${knownName}) Y TELÉFONO (${phone}) DEL CLIENTE. ¡NO le vuelvas a pedir su nombre ni su número de teléfono bajo ninguna circunstancia! Dirígete a él como ${knownName} y usa este nombre y teléfono al crear reservas.`;
  } else {
    customerContext += `\n- Nombre: Aún no registrado.`;
    customerContext += `\n- Teléfono del cliente: "${phone}"`;
    customerContext += `\nINSTRUCCIÓN: El número de teléfono ya se conoce (${phone}). NUNCA le pidas su número de teléfono. Cuando el cliente diga su nombre por primera vez, usa INMEDIATAMENTE la herramienta save_customer_info para guardarlo en el sistema.`;
  }

  const nowInBogota = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const todayInBogota = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const dateContext = `\n\nFECHA Y HORA ACTUAL: ${nowInBogota} (America/Bogota). Formato de fecha de hoy: ${todayInBogota}. Usa esta referencia para calcular fechas relativas como "hoy", "mañana", "este sábado", etc. Nunca uses una fecha distinta a la real de hoy o posteriores como referencia.`;
  const systemMessage = { role: 'system', content: customPrompt + customerContext + dateContext };

  if (!apiKey) {
      console.warn("OPENAI_API_KEY is not set in DB or ENV. Skipping AI processing.");
      return "Lo siento, la inteligencia artificial está desactivada en este momento (Falta API Key).";
  }

  const customOpenai = new OpenAI({ apiKey });

  // Get last 15 messages from DB to use as AI context/memory
  const dbMessages = await prisma.message.findMany({
    where: { phone, type: 'msg' },
    orderBy: { createdAt: 'desc' },
    take: 15
  });

  // Reverse to put in chronological order
  dbMessages.reverse();

  // Track the most recent image sent by the customer so tool calls can attach it to a receipt record
  let lastCustomerImage = null;
  for (const msg of dbMessages) {
    if (!msg.fromMe && msg.mediaUrl) lastCustomerImage = msg.mediaUrl;
  }

  const history = dbMessages.map(msg => {
    if (msg.mediaUrl) {
      const content = [];
      if (msg.text) content.push({ type: 'text', text: msg.text });
      content.push({ type: 'image_url', image_url: { url: msg.mediaUrl } });
      return { role: msg.fromMe ? 'assistant' : 'user', content };
    }
    return { role: msg.fromMe ? 'assistant' : 'user', content: msg.text };
  });

  // Ensure current message is at the end of the history
  const lastHistoryMsg = history[history.length - 1];
  const lastHistoryText = Array.isArray(lastHistoryMsg?.content)
    ? lastHistoryMsg.content.find(c => c.type === 'text')?.text
    : lastHistoryMsg?.content;
  if (!lastHistoryMsg || lastHistoryText !== messageText) {
    history.push({ role: 'user', content: messageText });
  }

  if (onThought) onThought(`Analizando mensaje de ${phone}: "${messageText}"...`);

  try {
    let keepGoing = true;
    let currentMessages = [systemMessage, ...history];
    let finalMessage = "";

    while (keepGoing) {
      const response = await customOpenai.chat.completions.create({
        model: 'gpt-4o',
        messages: currentMessages,
        tools: tools.map(t => ({
          type: t.type,
          function: {
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters
          }
        }))
      });

      const responseMessage = response.choices[0].message;

      // Filter out functions from responseMessage structure to avoid Prisma or JSON conversion issues
      currentMessages.push({
        role: responseMessage.role,
        content: responseMessage.content,
        tool_calls: responseMessage.tool_calls
      });

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          if (onThought) {
            onThought(`Ejecutando herramienta: ${toolName} con argumentos: ${toolCall.function.arguments}`);
          }

          const toolObj = tools.find(t => t.function.name === toolName);
          let toolResult = "";
          if (toolObj && toolObj.function && toolObj.function.function) {
            try {
              const res = await toolObj.function.function(toolArgs, { phone, lastImage: lastCustomerImage });
              toolResult = JSON.stringify(res);
            } catch (err) {
              toolResult = JSON.stringify({ error: err.message });
            }
          } else {
            toolResult = JSON.stringify({ error: `Tool ${toolName} not found` });
          }

          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: toolResult
          });
        }
      } else {
        finalMessage = responseMessage.content || "";
        keepGoing = false;
      }
    }

    // History is saved to the database in the routes layer

    return finalMessage;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Lo siento, tuve un problema procesando tu mensaje. Intenta de nuevo más tarde.";
  }
};
