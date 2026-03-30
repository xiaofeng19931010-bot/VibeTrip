import { randomUUID } from 'crypto';
import { getGlobalSupabaseClient } from '../supabase/index.js';
import type { Trip, TripStatus, RoleType } from '../schemas/index.js';
import { TripSchema } from '../schemas/index.js';

export interface CreateTripInput {
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  role: RoleType;
  budget?: number;
  preferences?: Record<string, unknown>;
}

export interface UpdateTripInput {
  title?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  role?: RoleType;
  status?: TripStatus;
  budget?: number;
  preferences?: Record<string, unknown>;
}

const STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  draft: ['planned'],
  planned: ['traveling', 'archived'],
  traveling: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

export function canTransitionStatus(current: TripStatus, next: TripStatus): boolean {
  return STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}

export class TripRepository {
  async findById(id: string): Promise<Trip | null> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return TripSchema.parse(data) as Trip;
  }

  async findByUserId(userId: string): Promise<Trip[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as Trip[];
  }

  async create(input: CreateTripInput): Promise<Trip> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const now = new Date().toISOString();
    const trip = {
      id: randomUUID(),
      ...input,
      status: 'draft' as const,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await client
      .from('trips')
      .insert(trip as never)
      .select()
      .single();

    if (error) throw error;

    return TripSchema.parse(data) as Trip;
  }

  async update(id: string, input: UpdateTripInput): Promise<Trip> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Trip not found: ${id}`);
    }

    if (input.status && input.status !== existing.status) {
      if (!canTransitionStatus(existing.status, input.status)) {
        throw new Error(
          `Invalid status transition: ${existing.status} -> ${input.status}`
        );
      }
    }

    const { data, error } = await client
      .from('trips')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return TripSchema.parse(data) as Trip;
  }

  async delete(id: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await client
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async transitionStatus(id: string, newStatus: TripStatus): Promise<Trip> {
    return this.update(id, { status: newStatus });
  }
}

export const tripRepository = new TripRepository();
