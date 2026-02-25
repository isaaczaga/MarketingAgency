import { NextRequest } from 'next/server';
import { supabase } from './supabase';

export async function verifyServerAuth(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];

    // Validate the token against Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error("verifyServerAuth Failed:", error?.message);
        return null;
    }

    return user;
}
