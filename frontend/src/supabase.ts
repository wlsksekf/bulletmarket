import { createClient } from '@supabase/supabase-js';

// Get Environment Variables from Vite Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize client. If keys are missing, the client will fail gracefully on execution,
// allowing our hybrid login fallback to route requests to the local Spring Boot database instead.
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export default supabase;
