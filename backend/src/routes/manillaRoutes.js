import express from 'express';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// List all wristband types
router.get('/types', async (req, res) => {
  try {
    const types = await prisma.manillaType.findMany({
      where: { active: true },
      orderBy: { price: 'desc' }
    });
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar tipos de manillas' });
  }
});

// Create or update wristband type
router.post('/types', async (req, res) => {
  const { id, name, price, color } = req.body;
  try {
    if (id) {
      const updated = await prisma.manillaType.update({
        where: { id },
        data: { name, price: parseFloat(price), color }
      });
      return res.json(updated);
    }
    const created = await prisma.manillaType.create({
      data: { name, price: parseFloat(price), color }
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar tipo de manilla' });
  }
});

// Delete (soft delete or hard)
router.delete('/types/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.manillaType.update({
      where: { id },
      data: { active: false }
    });
    res.json({ message: 'Tipo de manilla eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// Register one or more wristband sales in a single checkout (cart)
router.post('/sales', async (req, res) => {
  const { items, paymentMethod, sellerId } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No hay manillas para registrar' });
  }
  try {
    const types = await prisma.manillaType.findMany({
      where: { id: { in: items.map(i => i.typeId) } }
    });
    const typeMap = new Map(types.map(t => [t.id, t]));

    const rows = [];
    for (const item of items) {
      const type = typeMap.get(item.typeId);
      if (!type) continue;
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      for (let i = 0; i < quantity; i++) {
        rows.push({
          reference: `#MN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          typeId: type.id,
          priceSold: type.price,
          paymentMethod,
          sellerId
        });
      }
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Los tipos de manilla seleccionados ya no existen' });
    }

    const created = await prisma.$transaction(
      rows.map(data => prisma.manillaSale.create({ data, include: { type: true } }))
    );

    res.status(201).json(created);
  } catch (error) {
    console.error('Error registering sale:', error);
    res.status(500).json({ error: 'Error al registrar las ventas' });
  }
});

// List all sales for a given day (defaults to today, Colombia timezone)
router.get('/sales', async (req, res) => {
  try {
    const bogotaTodayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const dateStr = req.query.date || bogotaTodayStr;
    const startOfDay = new Date(`${dateStr}T00:00:00-05:00`);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const sales = await prisma.manillaSale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: { type: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar ventas' });
  }
});

// Get statistics of wristband sales (pool invoicing) for today and current month in Colombia timezone
router.get('/stats', async (req, res) => {
  try {
    const bogotaDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const startOfTodayBogota = new Date(`${bogotaDateStr}T00:00:00-05:00`);
    const startOfMonthBogota = new Date(`${bogotaDateStr.substring(0, 7)}-01T00:00:00-05:00`);

    const todaySales = await prisma.manillaSale.aggregate({
      where: {
        createdAt: {
          gte: startOfTodayBogota
        }
      },
      _sum: {
        priceSold: true
      },
      _count: true
    });

    const monthSales = await prisma.manillaSale.aggregate({
      where: {
        createdAt: {
          gte: startOfMonthBogota
        }
      },
      _sum: {
        priceSold: true
      }
    });

    res.json({
      today: todaySales._sum.priceSold || 0,
      todayCount: todaySales._count || 0,
      month: monthSales._sum.priceSold || 0
    });
  } catch (error) {
    console.error('Error calculating piscina stats:', error);
    res.status(500).json({ error: 'Error al calcular estadísticas de piscina' });
  }
});

export default router;

