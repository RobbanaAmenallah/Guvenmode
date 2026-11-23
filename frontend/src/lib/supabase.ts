import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL || 'https://ggxtshlqpdibwdgzhlmq.supabase.co';

const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneHRzaGxxcGRpYndkZ3pobG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNDY5MDMsImV4cCI6MjEwODYyMjkwM30.XO1hqgs4UBSKh7IN3kMiJ0UZp8hfnHZL7hm00Onv9xo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
