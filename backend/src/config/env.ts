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

const DEFAULT_SUPABASE_URL = 'https://ggxtshlqpdibwdgzhlmq.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHRzaGxxcGRpYndkZ3pobG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDY5MDMsImV4cCI6MjEwODYyMjkwM30.XO1hqgs4UBSKh7IN3kMiJ0UZp8hfnHZL7hm00Onv9xo';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHRzaGxxcGRpYndkZ3pobG1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzA0NjkwMywiZXhwIjoyMTA4NjIyOTAzfQ.uV19m6Pglo619x-2AzDLBWXnvig5rKkdKT_mC_iWzEY';

export const env = {
  ...parsed.data,
  SUPABASE_URL: parsed.data.SUPABASE_URL || DEFAULT_SUPABASE_URL,
  SUPABASE_ANON_KEY: parsed.data.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: parsed.data.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY,
  JWT_SECRET: parsed.data.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
};
