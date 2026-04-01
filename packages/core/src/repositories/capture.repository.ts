import { randomUUID } from 'crypto';
import { getGlobalSupabaseClient } from '../supabase/index.js';
import type { Capture, CaptureMetadata, CaptureType, GeoPoint } from '../schemas/index.js';

export interface CreateCaptureInput {
  trip_id: string;
  type: CaptureType;
  content: string;
  location?: GeoPoint;
  timestamp?: string;
  metadata?: CaptureMetadata;
}

export class CaptureRepository {
  async findById(id: string): Promise<Capture | null> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('captures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Capture;
  }

  async findByTripId(tripId: string): Promise<Capture[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('captures')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []) as Capture[];
  }

  async findByTripIdAndDateRange(
    tripId: string,
    startDate: string,
    endDate: string
  ): Promise<Capture[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('captures')
      .select('*')
      .eq('trip_id', tripId)
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []) as Capture[];
  }

  async create(input: CreateCaptureInput): Promise<Capture> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const capture = {
      id: randomUUID(),
      trip_id: input.trip_id,
      type: input.type,
      content: input.content,
      location: input.location ?? null,
      timestamp: input.timestamp ?? new Date().toISOString(),
      metadata: input.metadata ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('captures')
      .insert(capture as never)
      .select()
      .single();

    if (error) throw error;

    return data as Capture;
  }

  async createMany(inputs: CreateCaptureInput[]): Promise<Capture[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const captures = inputs.map((input) => ({
      id: randomUUID(),
      trip_id: input.trip_id,
      type: input.type,
      content: input.content,
      location: input.location ?? null,
      timestamp: input.timestamp ?? new Date().toISOString(),
      metadata: input.metadata ?? null,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await client
      .from('captures')
      .insert(captures as never)
      .select();

    if (error) throw error;

    return (data || []) as Capture[];
  }

  async delete(id: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await client
      .from('captures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByTripId(tripId: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await client
      .from('captures')
      .delete()
      .eq('trip_id', tripId);

    if (error) throw error;
  }

  async countByTripId(tripId: string): Promise<number> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { count, error } = await client
      .from('captures')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (error) throw error;

    return count ?? 0;
  }
}

export const captureRepository = new CaptureRepository();
