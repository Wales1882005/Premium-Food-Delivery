import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oormrkrzyycmkdffnmlc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ZnCSGuZupmtEqd68mczOtg_7P4hvq1o';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are missing in the platform settings. Using provided fallback values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
