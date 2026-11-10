import rateLimit from 'express-rate-limit';

const rateLimitMessage = (msg: string) => ({
  success: false,
  error: {
    message: msg,
    statusCode: 429
  }
});

/** Global API rate limit across all endpoints */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Trop de requêtes effectuées. Veuillez patienter quelques minutes.')
});

/** Strict brute-force protection for login and registration */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Trop de tentatives de connexion. Réessayez dans 15 minutes.')
});

/** Rate limit for checkout and promo code validation to prevent enumeration */
export const checkoutAndPromoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Trop de tentatives. Veuillez réessayer dans quelques minutes.')
});

/** Rate limit for admin file/video uploads */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Limite de téléversements atteinte temporairement.')
});
