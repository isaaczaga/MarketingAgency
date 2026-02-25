
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing! Check .env.local");
}

// Client for public/anon operations (Frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for admin/server operations (Backend/Scripts only)
export const getSupabaseAdmin = () => {
    if (!supabaseServiceKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Cannot perform admin operations.");
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};
