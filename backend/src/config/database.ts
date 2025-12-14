import { createClient } from '@supabase/supabase-js';

// Ensure env vars are loaded
if (typeof process.env.SUPABASE_URL === 'undefined' || typeof process.env.SUPABASE_SERVICE_ROLE_KEY === 'undefined') {
  // Try loading dotenv if not already loaded
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv already loaded or not available
  }
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
}

// Admin client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client for user operations (respects RLS)
export const createSupabaseClient = (accessToken?: string) => {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  });

  return client;
};

