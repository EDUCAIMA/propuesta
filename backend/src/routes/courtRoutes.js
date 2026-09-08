import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// List all courts
router.get('/', async (req, res) => {
  try {
    const courts = await prisma.court.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(courts);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar canchas' });
  }
});

// Create court
router.post('/', async (req, res) => {
  const { name, type, description } = req.body;
  try {
    const court = await prisma.court.create({
      data: { name, type, description }
    });
    res.status(201).json(court);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cancha' });
  }
});

// Delete court
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.court.delete({ where: { id } });
    res.json({ message: 'Cancha eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cancha' });
  }
});

export default router;
