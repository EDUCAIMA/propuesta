import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all bookings for a specific date
router.get('/', async (req, res) => {
  const { date } = req.query; // Expecting YYYY-MM-DD
  try {
    const start = new Date(`${date}T00:00:00-05:00`);
    const end = new Date(`${date}T23:59:59.999-05:00`);

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: start, lte: end }
      },
      include: {
        court: true,
        customer: true
      }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// Get statistics of court bookings (today + month) in Colombia timezone
router.get('/stats', async (req, res) => {
  try {
    const bogotaDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const startOfToday = new Date(`${bogotaDateStr}T00:00:00-05:00`);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Start of current month in Bogotá time
    const bogotaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const startOfMonth = new Date(`${bogotaDate.getFullYear()}-${String(bogotaDate.getMonth() + 1).padStart(2, '0')}-01T00:00:00-05:00`);

    const [todayBookings, monthBookings, totalCanchas] = await Promise.all([
      prisma.booking.findMany({
        where: { startTime: { gte: startOfToday, lt: endOfToday } }
      }),
      prisma.booking.findMany({
        where: { startTime: { gte: startOfMonth, lt: endOfToday } }
      }),
      prisma.court.count()
    ]);

    const pendientesPago = todayBookings.filter(b => b.status !== 'CONFIRMED').length;
    const ingresosHoy = todayBookings.reduce((acc, b) => acc + (b.amountPaid || 0), 0);
    const ingresosMes = monthBookings.reduce((acc, b) => acc + (b.amountPaid || 0), 0);

    res.json({
      reservasHoy: todayBookings.length,
      pendientesPago,
      ingresosHoy,
      ingresosMes,
      totalCanchas
    });
  } catch (error) {
    console.error('Error calculating booking stats:', error);
    res.status(500).json({ error: 'Error al calcular estadísticas de reservas' });
  }
});

// Create a booking or blockage
router.post('/', async (req, res) => {
  const { courtId, customerId, customerName, customerPhone, startTime, endTime, type, status, totalPrice, amountPaid, isPaid } = req.body;
  try {
    let finalCustomerId = customerId || null;

    if (!finalCustomerId && customerPhone) {
      const customer = await prisma.customer.upsert({
        where: { phone: customerPhone },
        update: { name: customerName || undefined },
        create: { name: customerName || 'Cliente', phone: customerPhone }
      });
      finalCustomerId = customer.id;
    }

    const booking = await prisma.booking.create({
      data: {
        courtId,
        customerId: finalCustomerId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        type: type || 'RESERVATION',
        status: status || 'PENDING',
        totalPrice: parseFloat(totalPrice || 0),
        amountPaid: parseFloat(amountPaid || 0),
        isPaid: isPaid || false
      },
      include: { customer: true }
    });
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating booking' });
  }
});

// Update a booking (e.g. finalize/facturar a pending or partial payment)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, amountPaid, isPaid, totalPrice } = req.body;
  try {
    const data = {};
    if (status !== undefined) data.status = status;
    if (amountPaid !== undefined) data.amountPaid = parseFloat(amountPaid);
    if (isPaid !== undefined) data.isPaid = isPaid;
    if (totalPrice !== undefined) data.totalPrice = parseFloat(totalPrice);

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: { customer: true }
    });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating booking' });
  }
});

// Delete a booking (cancel a reservation, freeing up the court slot)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting booking' });
  }
});

// List payment receipts (comprobantes) sent by customers via chat, for human review
router.get('/receipts', async (req, res) => {
  const { status } = req.query; // optional filter: PENDING_REVIEW | VERIFIED | REJECTED
  try {
    const receipts = await prisma.paymentReceipt.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: { include: { court: true, customer: true } }
      }
    });
    res.json(receipts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching receipts' });
  }
});

// Verify a receipt as authentic
router.post('/receipts/:id/verify', async (req, res) => {
  const { id } = req.params;
  const { reviewedBy } = req.body;
  try {
    const receipt = await prisma.paymentReceipt.update({
      where: { id },
      data: { status: 'VERIFIED', reviewedBy: reviewedBy || 'Operador', reviewedAt: new Date() }
    });
    res.json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error verifying receipt' });
  }
});

// Reject a receipt as fraudulent/invalid — reverts the credited amount on the booking
router.post('/receipts/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reviewedBy } = req.body;
  try {
    const receipt = await prisma.paymentReceipt.findUnique({ where: { id } });
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    const updatedReceipt = await prisma.paymentReceipt.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy: reviewedBy || 'Operador', reviewedAt: new Date() }
    });

    if (receipt.status !== 'REJECTED') {
      const booking = await prisma.booking.findUnique({ where: { id: receipt.bookingId } });
      if (booking) {
        const newAmountPaid = Math.max(0, (booking.amountPaid || 0) - receipt.amountDetected);
        const newStatus = newAmountPaid <= 0 ? 'PENDING' : (newAmountPaid >= booking.totalPrice ? 'CONFIRMED' : 'PARCIAL');
        await prisma.booking.update({
          where: { id: booking.id },
          data: { amountPaid: newAmountPaid, status: newStatus, isPaid: newStatus === 'CONFIRMED' }
        });
      }
    }

    res.json(updatedReceipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error rejecting receipt' });
  }
});

export default router;
