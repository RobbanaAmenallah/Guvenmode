import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase.js';
import { env } from '../config/env.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'super_admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const rawAdminKey = req.headers['x-admin-key'];
    const adminKey = typeof rawAdminKey === 'string' ? rawAdminKey : '';

    // 1. Optional machine-to-machine admin key ONLY if explicitly configured with a strong non-default secret
    if (
      env.ADMIN_SECRET_KEY &&
      env.ADMIN_SECRET_KEY !== 'guven-admin-2026' &&
      adminKey &&
      safeEqual(adminKey, env.ADMIN_SECRET_KEY)
    ) {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@guvenmode.com',
        role: 'super_admin'
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      return next();
    }

    const supabase = getSupabase();

    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return next();
      }

      // Check user role strictly from public.user_roles in Supabase
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      req.user = {
        id: user.id,
        email: user.email || '',
        role: (roleData?.role as AuthenticatedUser['role']) || 'customer'
      };
    } else if (env.NODE_ENV !== 'production') {
      // Development-only offline fallback when Supabase is not configured
      if (token.startsWith('admin-')) {
        req.user = {
          id: 'admin-dev-id',
          email: 'direction@guvenmode.tn',
          role: 'admin'
        };
      } else if (token.startsWith('user-')) {
        req.user = {
          id: token.replace('user-', ''),
          email: 'client@guvenmode.tn',
          role: 'customer'
        };
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentification requise pour cette opération', statusCode: 401 }
    });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({
      success: false,
      error: { message: 'Accès réservé aux administrateurs autorisés', statusCode: 403 }
    });
  }
  next();
}
