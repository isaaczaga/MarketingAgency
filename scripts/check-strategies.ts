import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    const { data: strategies, error: stratErr } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false });

    if (stratErr) {
        console.error("Error fetching strategies:", stratErr);
    } else {
        console.log(`Found ${strategies.length} strategies.`);
        if (strategies.length > 0) {
            console.log("Latest strategy:", strategies[0].id, "created_at:", strategies[0].created_at);
        }
    }

    const { data: singleStrategy, error: singleErr } = await supabase
        .from('strategies')
        .select('*')
        .single();

    if (singleErr) {
        console.error("Error fetching single strategy:", singleErr.message);
    } else {
        console.log("Single strategy success!");
    }
}

main();
