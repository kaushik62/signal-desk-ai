import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import followUpRoutes from './routes/followUps.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();

app.use(cors({
  origin: env.clientUrl,
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', requireAuth, leadRoutes);
app.use('/api/follow-ups', requireAuth, followUpRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;