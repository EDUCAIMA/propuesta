import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// List sales (optionally filter by type, e.g. ?type=RESTAURANTE)
router.get('/', async (req, res) => {
  const { type } = req.query;
  try {
    const sales = await prisma.sale.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar ventas' });
  }
});

// Get statistics of sales (today + month) in Colombia timezone, optionally filtered by type
router.get('/stats', async (req, res) => {
  const { type } = req.query;
  try {
    const bogotaDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const startOfToday = new Date(`${bogotaDateStr}T00:00:00-05:00`);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Start of current month in Bogotá time
    const bogotaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const startOfMonth = new Date(`${bogotaDate.getFullYear()}-${String(bogotaDate.getMonth() + 1).padStart(2, '0')}-01T00:00:00-05:00`);

    const [todayStats, monthStats] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: startOfToday, lt: endOfToday },
          ...(type ? { type } : {})
        },
        _sum: { totalAmount: true },
        _count: true
      }),
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: startOfMonth, lt: endOfToday },
          ...(type ? { type } : {})
        },
        _sum: { totalAmount: true },
        _count: true
      })
    ]);

    res.json({
      ventasHoy: todayStats._count || 0,
      totalHoy: todayStats._sum.totalAmount || 0,
      ventasMes: monthStats._count || 0,
      totalMes: monthStats._sum.totalAmount || 0
    });
  } catch (error) {
    console.error('Error calculating sales stats:', error);
    res.status(500).json({ error: 'Error al calcular estadísticas de ventas' });
  }
});

// Create sale
router.post('/', async (req, res) => {
  const { type, items, totalAmount, customerId, status } = req.body;
  try {
    const sale = await prisma.sale.create({
      data: {
        type,
        items,
        totalAmount: parseFloat(totalAmount),
        status: status || 'COMPLETED',
        ...(customerId ? { customerId } : {})
      }
    });
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
});

export default router;
