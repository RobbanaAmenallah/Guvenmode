import { Router } from 'express';
import { publicRoutes } from './publicRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { adminRoutes } from './adminRoutes.js';

export const apiRouter = Router();

apiRouter.use('/', publicRoutes);
apiRouter.use('/me', customerRoutes);
apiRouter.use('/admin', adminRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'GÜVEN MODE API',
    version: '1.0.1-service-role-verified',
    timestamp: new Date().toISOString()
  });
});
