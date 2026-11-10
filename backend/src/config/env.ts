import crypto from 'crypto';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((v) => parseInt(v, 10)).default('5000'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  ADMIN_SECRET_KEY: z.string().min(16).optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = {
  ...parsed.data,
  JWT_SECRET: parsed.data.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
};
