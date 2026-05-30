const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const internshipsRoutes = require('./modules/internships/internships.routes');
const applicationsRoutes = require('./modules/applications/applications.routes');
const dailyLogsRoutes = require('./modules/daily-logs/daily-logs.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// ── Security & Core Middleware ────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled for easy dev static file rendering
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
  'https://internship-itms.web.app',
  'https://internship-itms.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Blocked by CORS policy.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statically serve uploads folder from the root of the project
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Morgan Logging ────────────────────────────────────────
app.use(morgan('dev'));

// ── Rate Limiter ──────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // Strict rate limit of 15 requests per minute on auth
  message: { success: false, message: 'Too many authentication attempts. Try again in 1 minute.' },
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// ── Base route ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ShadowQuant ITMS API Server',
    timestamp: new Date(),
  });
});

// ── API Route Declarations ────────────────────────────────
const v1 = '/api/v1';
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/users`, usersRoutes);
app.use(`${v1}/internships`, internshipsRoutes);
app.use(`${v1}/applications`, applicationsRoutes);
app.use(`${v1}/daily-logs`, dailyLogsRoutes);
app.use(`${v1}/analytics`, analyticsRoutes);
app.use(`${v1}/admin`, adminRoutes);

// ── Error Handlers ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
