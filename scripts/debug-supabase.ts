import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkSupabase() {
    console.log('--- Fetching content_items from Supabase ---');
    const { data, error } = await supabase
        .from('content_items')
        .select('id, type, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkSupabase();
