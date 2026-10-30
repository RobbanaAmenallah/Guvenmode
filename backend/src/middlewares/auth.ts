import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase.js';

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

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const adminKey = req.headers['x-admin-key'];

    // 1. Direct admin access via secure secret key (for admin dashboard / local dev)
    if (adminKey === 'guven-admin-2026' || adminKey === process.env.ADMIN_SECRET_KEY) {
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

    const token = authHeader.split(' ')[1];
    const supabase = getSupabase();

    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return next();
      }

      // Check user role from public.user_roles in Supabase
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const isDefaultAdmin = user.email?.toLowerCase() === 'guvenmode@gmail.com';

      req.user = {
        id: user.id,
        email: user.email || '',
        role: (roleData?.role as any) || (isDefaultAdmin ? 'super_admin' : 'customer')
      };
    } else {
      // Development simulated token
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
