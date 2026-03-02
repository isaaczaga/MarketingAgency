import { getSupabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadBase64Image(base64Data: string): Promise<string> {
    const supabase = getSupabaseAdmin();

    // Ensure the bucket exists
    const bucketName = 'marketing_assets';

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const fileName = `auto-generated-${uuidv4()}.jpg`;

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false
        });

    if (error) {
        throw new Error(`Failed to upload image to Supabase: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

    return publicUrl;
}
