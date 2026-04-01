import { randomUUID } from 'crypto';
import { getGlobalSupabaseClient } from '../supabase/index.js';
import type { MemoryArtifact, MemoryArtifactMetadata, MemoryArtifactType } from '../schemas/index.js';

export interface CreateMemoryArtifactInput {
  trip_id: string;
  type: MemoryArtifactType;
  title: string;
  description?: string;
  storage_url?: string;
  file_path?: string;
  metadata?: MemoryArtifactMetadata;
}

export interface UpdateMemoryArtifactInput {
  title?: string;
  description?: string;
  storage_url?: string;
  file_path?: string;
  metadata?: MemoryArtifactMetadata;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export class MemoryArtifactRepository {
  async findById(id: string): Promise<MemoryArtifact | null> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('memory_artifacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as MemoryArtifact;
  }

  async findByTripId(tripId: string): Promise<MemoryArtifact[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('memory_artifacts')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as MemoryArtifact[];
  }

  async create(input: CreateMemoryArtifactInput): Promise<MemoryArtifact> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const now = new Date().toISOString();
    const artifact = {
      id: randomUUID(),
      ...input,
      status: 'pending' as const,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await client
      .from('memory_artifacts')
      .insert(artifact as never)
      .select()
      .single();

    if (error) throw error;

    return data as MemoryArtifact;
  }

  async update(id: string, input: UpdateMemoryArtifactInput): Promise<MemoryArtifact> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('memory_artifacts')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as MemoryArtifact;
  }

  async delete(id: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await client
      .from('memory_artifacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async findPendingByTripId(tripId: string): Promise<MemoryArtifact[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('memory_artifacts')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []) as MemoryArtifact[];
  }
}

export const memoryArtifactRepository = new MemoryArtifactRepository();
