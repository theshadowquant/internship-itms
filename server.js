/**
 * ShadowQuant Dynamics – ITMS API Server
 * Production-grade Express application
 */

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const compression = require('compression');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const path       = require('path');
const logger     = require('./config/logger');
const db         = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ── Route imports ─────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const userRoutes          = require('./routes/users');
const internshipRoutes    = require('./routes/internships');
const applicationRoutes   = require('./routes/applications');
const taskRoutes          = require('./routes/tasks');
const dailyLogRoutes      = require('./routes/dailyLogs');
const performanceRoutes   = require('./routes/performance');
const documentRoutes      = require('./routes/documents');
const notificationRoutes  = require('./routes/notifications');
const adminRoutes         = require('./routes/admin');
const analyticsRoutes     = require('./routes/analytics');

const app = express();

// ── Security & Core Middleware ────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Request Logging ───────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: msg => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// ── Global Rate Limiter ───────────────────────────────────
app.use('/api', rateLimit({
  windowMs : 15 * 60 * 1000,  // 15 min
  max      : 300,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : { success: false, message: 'Too many requests. Please slow down.' },
}));

// Strict rate limit for auth endpoints
app.use('/api/auth', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Try again in 1 minute.' },
}));

// ── Health check ──────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', version: '1.0.0', db: 'connected', ts: new Date() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

// ── API Routes ────────────────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`,          authRoutes);
app.use(`${v1}/users`,         userRoutes);
app.use(`${v1}/internships`,   internshipRoutes);
app.use(`${v1}/applications`,  applicationRoutes);
app.use(`${v1}/tasks`,         taskRoutes);
app.use(`${v1}/daily-logs`,    dailyLogRoutes);
app.use(`${v1}/performance`,   performanceRoutes);
app.use(`${v1}/documents`,     documentRoutes);
app.use(`${v1}/notifications`, notificationRoutes);
app.use(`${v1}/admin`,         adminRoutes);
app.use(`${v1}/analytics`,     analyticsRoutes);

// ── Error Handling ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 ShadowQuant ITMS API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;