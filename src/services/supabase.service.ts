import { createClient } from '@supabase/supabase-js';
import config from '../config/config';

const supabase = createClient(
  config.SUPABASE_URL || '',
  config.SUPABASE_SERVICE_KEY || ''
);

export const supabaseStorage = {
  async uploadFile(
    buffer: Buffer,
    filename: string,
    folder: string = 'posts'
  ): Promise<{ success: boolean; url?: string; message: string; error?: string }> {
    try {
      if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_KEY) {
        return { success: false, message: 'Supabase is not configured', error: 'SUPABASE_NOT_CONFIGURED' };
      }

      const bucket = config.SUPABASE_BUCKET || 'uploads';
      const filePath = `${folder}/${Date.now()}-${filename}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: getContentType(filename),
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return { 
          success: false, 
          message: `Failed to upload to Supabase: ${error.message}`, 
          error: error.message 
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrl,
        message: 'File uploaded successfully'
      };
    } catch (error: any) {
      console.error('Supabase service error:', error);
      return { 
        success: false, 
        message: `Upload failed: ${error.message}`, 
        error: error.message 
      };
    }
  }
};

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm'
  };
  return types[ext || ''] || 'application/octet-stream';
}
