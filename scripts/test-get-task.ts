import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function getVideoTask() {
    const { supabase } = await import('../lib/supabase');
    const { data, error } = await supabase.from('tasks').select('*').eq('type', 'video').limit(1);
    if (error || !data || data.length === 0) {
        console.log("No planned video tasks found.", error);
        return;
    }
    console.log(data[0].id);
}
getVideoTask();
