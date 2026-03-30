import { randomUUID } from 'crypto';
import { getGlobalSupabaseClient } from '../supabase/index.js';
import type { SharePackage, ShareChannel } from '../schemas/index.js';

export interface CreateSharePackageInput {
  trip_id: string;
  channel: ShareChannel;
  title: string;
  content: string;
  hashtags?: string[];
  images?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateSharePackageInput {
  title?: string;
  content?: string;
  hashtags?: string[];
  images?: string[];
  metadata?: Record<string, unknown>;
}

export class SharePackageRepository {
  async findById(id: string): Promise<SharePackage | null> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('share_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as SharePackage;
  }

  async findByTripId(tripId: string): Promise<SharePackage[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('share_packages')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as SharePackage[];
  }

  async findByTripIdAndChannel(tripId: string, channel: ShareChannel): Promise<SharePackage[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('share_packages')
      .select('*')
      .eq('trip_id', tripId)
      .eq('channel', channel)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as SharePackage[];
  }

  async create(input: CreateSharePackageInput): Promise<SharePackage> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const now = new Date().toISOString();
    const sharePackage = {
      id: randomUUID(),
      trip_id: input.trip_id,
      channel: input.channel,
      title: input.title,
      content: input.content,
      hashtags: input.hashtags || [],
      images: input.images || [],
      metadata: input.metadata || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await client
      .from('share_packages')
      .insert(sharePackage as never)
      .select()
      .single();

    if (error) throw error;

    return data as SharePackage;
  }

  async update(id: string, input: UpdateSharePackageInput): Promise<SharePackage> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('share_packages')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as SharePackage;
  }

  async delete(id: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await client
      .from('share_packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const sharePackageRepository = new SharePackageRepository();
