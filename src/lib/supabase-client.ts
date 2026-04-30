import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (typeof window !== 'undefined' && supabaseUrl && !supabaseAnonKey) {
  console.error("Supabase URL exists but ANON KEY is missing. Check .env.local!");
}

// We use the anon key on the client for public queries
export const supabaseClient = supabaseUrl.startsWith('http') && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
