import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Authentication and database features will be disabled.');
}

if (supabaseAnonKey.startsWith('sb_publishable_') || supabaseAnonKey.startsWith('pk_')) {
  console.error('CRITICAL ERROR: VITE_SUPABASE_ANON_KEY appears to be a Stripe Publishable Key. Please check your environment variables in the platform settings.');
}

console.log('Initializing Supabase with URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseAnonKey?.substring(0, 10) + '...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
