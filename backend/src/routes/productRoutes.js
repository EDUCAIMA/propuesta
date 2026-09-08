import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// List all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar productos' });
  }
});

// Create product
router.post('/', async (req, res) => {
  const { name, category, price, image } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, category, price: parseFloat(price), image }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, image, available } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, category, price: parseFloat(price), image, available }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
