import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupWhatsAppRoutes } from './routes/whatsappRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import courtRoutes from './routes/courtRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import manillaRoutes from './routes/manillaRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import customerRoutes from './routes/customerRoutes.js';

const prisma = new PrismaClient();

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Allow all origins for local dev
});
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));


// Setup WhatsApp Routes with Socket.io instance
app.use('/api/whatsapp', setupWhatsAppRoutes(io));
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/health-check', healthRoutes);
app.use('/api/piscina', manillaRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/customers', customerRoutes);

// Socket.io connections
io.on('connection', (socket) => {
  console.log('Frontend connected to Socket.io');
  socket.on('disconnect', () => {
    console.log('Frontend disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Encanto Backend running on port ${PORT}`);
});
