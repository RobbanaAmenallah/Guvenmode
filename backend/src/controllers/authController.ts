import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getSupabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { UserProfile, UserRole } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';

const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const registerSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Le mot de passe doit contenir au moins une lettre et un chiffre'),
  firstName: z.string().trim().min(1, 'Prénom requis').max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
});

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Identifiants invalides', statusCode: 400 }
        });
      }

      const cleanEmail = parsed.data.email.toLowerCase();
      const password = parsed.data.password;
      const supabase = getSupabase();

      if (supabase) {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (authErr || !authData.user) {
          return res.status(401).json({
            success: false,
            error: {
              message: 'Adresse e-mail ou mot de passe incorrect',
              statusCode: 401
            }
          });
        }

        const user = authData.user;
        const token = authData.session?.access_token || '';

        // Fetch role from user_roles
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const role: UserRole = (roleRow?.role as UserRole) || 'customer';

        // Fetch profile from public.profiles
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          const newProfile = {
            id: user.id,
            email: cleanEmail,
            first_name: user.user_metadata?.first_name || cleanEmail.split('@')[0],
            last_name: user.user_metadata?.last_name || '',
            phone: user.user_metadata?.phone || null,
            updated_at: new Date().toISOString()
          };
          await supabase.from('profiles').insert(newProfile);
          profile = newProfile;
        }

        const userProfile: UserProfile = {
          id: user.id,
          email: cleanEmail,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url || null,
          role,
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        };

        return res.json({
          success: true,
          data: {
            user: userProfile,
            token
          }
        });
      }

      if (env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          error: { message: 'Service d\'authentification temporairement indisponible', statusCode: 503 }
        });
      }

      // Development-only offline fallback
      const isAdmin = cleanEmail === 'guvenmode@gmail.com' || cleanEmail === 'direction@guvenmode.com';
      const userProfile: UserProfile = {
        id: isAdmin ? '4f03dbf1-2b9e-4a6e-ace5-f8b9189de5be' : uuidv4(),
        email: cleanEmail,
        first_name: isAdmin ? 'Direction' : cleanEmail.split('@')[0],
        last_name: isAdmin ? 'GÜVEN MODE' : '',
        phone: '+216 28 827 626',
        avatar_url: null,
        role: isAdmin ? 'super_admin' : 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.json({
        success: true,
        data: {
          user: userProfile,
          token: `${isAdmin ? 'admin' : 'user'}-${userProfile.id}`
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: { message: parsed.error.issues[0]?.message || 'Données d\'inscription invalides', statusCode: 400 }
        });
      }

      const { firstName, lastName, phone } = parsed.data;
      const cleanEmail = parsed.data.email.toLowerCase();
      const password = parsed.data.password;
      const supabase = getSupabase();

      if (supabase) {
        // Create user in Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              first_name: firstName || '',
              last_name: lastName || '',
              phone: phone || ''
            }
          }
        });

        if (authErr || !authData.user) {
          return res.status(400).json({
            success: false,
            error: {
              message: authErr?.message === 'User already registered'
                ? 'Un compte existe déjà avec cette adresse e-mail'
                : authErr?.message || 'Erreur lors de l\'inscription',
              statusCode: 400
            }
          });
        }

        const user = authData.user;
        const token = authData.session?.access_token || '';

        // Insert into public.profiles
        await supabase.from('profiles').upsert({
          id: user.id,
          first_name: firstName || cleanEmail.split('@')[0],
          last_name: lastName || '',
          email: cleanEmail,
          phone: phone || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        // Assign customer role
        await supabase.from('user_roles').upsert({
          user_id: user.id,
          role: 'customer'
        }, { onConflict: 'user_id,role' });

        const userProfile: UserProfile = {
          id: user.id,
          email: cleanEmail,
          first_name: firstName || cleanEmail.split('@')[0],
          last_name: lastName || '',
          phone: phone || null,
          avatar_url: null,
          role: 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        return res.status(201).json({
          success: true,
          data: {
            user: userProfile,
            token,
            requiresEmailConfirmation: !authData.session
          }
        });
      }

      if (env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          error: { message: 'Service d\'inscription temporairement indisponible', statusCode: 503 }
        });
      }

      // Development-only offline fallback
      const userId = uuidv4();
      const userProfile: UserProfile = {
        id: userId,
        email: cleanEmail,
        first_name: firstName || cleanEmail.split('@')[0],
        last_name: lastName || '',
        phone: phone || null,
        avatar_url: null,
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: {
          user: userProfile,
          token: `user-${userId}`
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Non authentifié', statusCode: 401 }
        });
      }

      const supabase = getSupabase();
      if (supabase) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.user.id).maybeSingle();
        const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', req.user.id).maybeSingle();

        return res.json({
          success: true,
          data: {
            id: req.user.id,
            email: req.user.email,
            first_name: profile?.first_name || req.user.email.split('@')[0],
            last_name: profile?.last_name || '',
            phone: profile?.phone || null,
            avatar_url: profile?.avatar_url || null,
            role: roleRow?.role || req.user.role,
            created_at: profile?.created_at || new Date().toISOString(),
            updated_at: profile?.updated_at || new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        data: req.user
      });
    } catch (err) {
      next(err);
    }
  }
}
