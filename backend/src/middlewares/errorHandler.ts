import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.status || err.statusCode || 500;
  const isProd500 = env.NODE_ENV === 'production' && statusCode >= 500;
  const message = isProd500
    ? 'Une erreur interne est survenue sur le serveur'
    : err.message || 'Une erreur interne est survenue sur le serveur';

  console.error(`[Error] ${req.method} ${req.url} -> ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(isProd500 ? {} : { details: err.details || null })
    }
  });
}
