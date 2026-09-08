import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = express.Router();
const prisma = new PrismaClient();

const checkOpenAI = async (apiKey) => {
  if (!apiKey) return { status: 'error', message: 'No API Key' };
  try {
    // Simple light request to check if key is valid
    const res = await axios.get('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 5000
    });
    return { status: 'online', message: `${res.data.data.length} models available` };
  } catch (error) {
    return { status: 'offline', message: error.response?.data?.error?.message || 'Connection failed' };
  }
};

const checkWhapi = async (token) => {
  if (!token) return { status: 'error', message: 'No Token' };
  try {
    const res = await axios.get('https://gate.whapi.cloud/health', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });
    return { status: 'online', message: 'API responding' };
  } catch (error) {
    return { status: 'offline', message: 'Service unreachable' };
  }
};

router.get('/status', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const config = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const [openai, whapi] = await Promise.all([
      checkOpenAI(config.OPENAI_API_KEY || process.env.OPENAI_API_KEY),
      checkWhapi(config.WHAPI_TOKEN || process.env.WHAPI_TOKEN)
    ]);

    res.json({
      timestamp: new Date(),
      services: {
        openai,
        whatsapp: whapi,
        database: { status: 'online', message: 'Prisma connected' }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch health status' });
  }
});

export default router;
