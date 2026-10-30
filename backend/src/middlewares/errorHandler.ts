import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Une erreur interne est survenue sur le serveur';

  console.error(`[Error] ${req.method} ${req.url} -> ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: err.details || null
    }
  });
}
