import { getGlobalSupabaseClient } from '../supabase/index.js';

export interface UploadOptions {
  bucket: string;
  path: string;
  contentType?: string;
  cacheControl?: string;
}

export interface UploadResult {
  path: string;
  url: string;
}

export interface DownloadResult {
  data: Buffer;
  contentType: string;
}

export class StorageService {
  private bucketPrefix: string = 'vibetrip';

  async upload(options: UploadOptions, file: Buffer | Blob | string): Promise<UploadResult> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const fileBuffer = typeof file === 'string' ? Buffer.from(file) : file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

    const { data, error } = await client.storage
      .from(`${this.bucketPrefix}-${options.bucket}`)
      .upload(options.path, fileBuffer, {
        contentType: options.contentType,
        cacheControl: options.cacheControl || '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const uploadedPath = typeof data === 'string' ? data : data?.path || options.path;
    const publicUrl = this.getPublicUrl(options.bucket, uploadedPath);

    return {
      path: uploadedPath,
      url: publicUrl,
    };
  }

  async download(bucket: string, path: string): Promise<DownloadResult> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client.storage
      .from(`${this.bucketPrefix}-${bucket}`)
      .download(path);

    if (error) {
      throw new Error(`Storage download failed: ${error.message}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const contentType = data.type;

    return { data: buffer, contentType };
  }

  async delete(bucket: string, path: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await client.storage
      .from(`${this.bucketPrefix}-${bucket}`)
      .remove([path]);

    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  }

  async listFiles(bucket: string, folderPath?: string): Promise<string[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client.storage
      .from(`${this.bucketPrefix}-${bucket}`)
      .list(folderPath || '', { limit: 100 });

    if (error) {
      throw new Error(`Storage list failed: ${error.message}`);
    }

    return (data || []).map(f => f.name);
  }

  getPublicUrl(bucket: string, path: string): string {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data } = client.storage
      .from(`${this.bucketPrefix}-${bucket}`)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}

export const storageService = new StorageService();
