import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { authenticate } from './middlewares/auth.js';
import { globalLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Trust first reverse proxy (Render / Cloudflare) for accurate client IP rate limiting
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
}));

// Strict CORS Allowlist
const extraOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = new Set<string>([
  env.FRONTEND_URL,
  'https://guvenmode-frontend.onrender.com',
  ...extraOrigins,
  ...(env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:5173'] : [])
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (health checks, mobile apps, curl) or same-origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    const corsErr: any = new Error('Origine non autorisée par la politique CORS');
    corsErr.statusCode = 403;
    return callback(corsErr);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Global rate limiting & Authentication parser
app.use('/api', globalLimiter);
app.use(authenticate);

// Mount API routes
app.use('/api', apiRouter);

// Serve frontend static build if present
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`✨ GÜVEN MODE BACKEND API RUNNING ON PORT ${port}`);
    console.log(`🌐 Base URL: http://0.0.0.0:${port}`);
    console.log(`✨ Health: http://0.0.0.0:${port}/api/health`);
    console.log(`====================================================`);
  });
}

export default app;
