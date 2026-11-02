import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { authenticate } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

const app = express();

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin
    if (!origin) return callback(null, true);
    
    // Allow specified FRONTEND_URL, local dev, or any *.onrender.com deployment
    if (
      origin === env.FRONTEND_URL ||
      origin === 'http://localhost:3000' ||
      origin === 'http://localhost:5173' ||
      origin.endsWith('.onrender.com') ||
      env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    // Also allow any frontend origin in production to avoid CORS headaches
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Authentication parser
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
