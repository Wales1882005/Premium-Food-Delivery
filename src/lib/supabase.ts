import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Authentication and database features will be disabled.');
}

let supabase: any = null;

try {
  console.log('Initializing Supabase with URL:', supabaseUrl);
  // Only initialize if we have a real-looking URL to avoid crashes
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Supabase Initialization Error:', error);
}

export { supabase };
