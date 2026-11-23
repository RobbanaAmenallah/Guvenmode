import { Router } from 'express';
import { publicRoutes } from './publicRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import { getSupabase } from '../config/supabase.js';

export const apiRouter = Router();

apiRouter.use('/', publicRoutes);
apiRouter.use('/me', customerRoutes);
apiRouter.use('/admin', adminRoutes);

// Active health check endpoint with database connectivity check
apiRouter.get('/health', async (req, res) => {
  let dbStatus = 'not_configured';
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { error } = await supabase.from('site_settings').select('key').limit(1);
      dbStatus = error ? 'error' : 'connected';
    } catch {
      dbStatus = 'unreachable';
    }
  }

  const isHealthy = dbStatus === 'connected' || (!supabase && process.env.NODE_ENV !== 'production');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    store: 'GÜVEN MODE API',
    database: dbStatus,
    version: '1.2.0-atomic-hardened',
    timestamp: new Date().toISOString()
  });
});
