import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get statistics of registered customers (total and new today) in Colombia timezone
router.get('/stats', async (req, res) => {
  try {
    const bogotaDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const startOfToday = new Date(`${bogotaDateStr}T00:00:00-05:00`);

    const total = await prisma.customer.count();
    const nuevosHoy = await prisma.customer.count({
      where: { createdAt: { gte: startOfToday } }
    });

    res.json({ total, nuevosHoy });
  } catch (error) {
    console.error('Error calculating customer stats:', error);
    res.status(500).json({ error: 'Error al calcular estadísticas de clientes' });
  }
});

export default router;
