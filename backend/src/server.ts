import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { authenticate } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
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

// Centralized Error Handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`✨ GÜVEN MODE BACKEND API RUNNING ON PORT ${env.PORT}`);
    console.log(`🌐 Base URL: http://localhost:${env.PORT}`);
    console.log(`✨ Health: http://localhost:${env.PORT}/api/health`);
    console.log(`====================================================`);
  });
}

export default app;
