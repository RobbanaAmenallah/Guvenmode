import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../config/supabase.js';
import { db } from '../data/dbStore.js';
import { UserProfile, UserRole } from '../types/index.js';
import { uuidv4 } from '../utils/uuid.js';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Adresse e-mail et mot de passe requis', statusCode: 400 }
        });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const supabase = getSupabase();

      if (supabase) {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: String(password)
        });

        if (authErr || !authData.user) {
          return res.status(401).json({
            success: false,
            error: {
              message: authErr?.message === 'Invalid login credentials'
                ? 'Adresse e-mail ou mot de passe incorrect'
                : authErr?.message || 'Échec de la connexion',
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

      // Fallback in-memory
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
          token: `token-${Date.now()}`
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { message: 'Adresse e-mail et mot de passe requis', statusCode: 400 }
        });
      }

      if (String(password).length < 6) {
        return res.status(400).json({
          success: false,
          error: { message: 'Le mot de passe doit contenir au moins 6 caractères', statusCode: 400 }
        });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const supabase = getSupabase();

      if (supabase) {
        // Create user in Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: String(password),
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
        const token = authData.session?.access_token || `token-${Date.now()}`;

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
        await supabase.from('user_roles').insert({
          user_id: user.id,
          role: 'customer'
        });

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
            token
          }
        });
      }

      // Fallback
      const userProfile: UserProfile = {
        id: uuidv4(),
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
          token: `token-${Date.now()}`
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
