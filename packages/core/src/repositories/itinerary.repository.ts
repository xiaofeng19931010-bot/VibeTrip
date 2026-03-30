import { randomUUID } from 'crypto';
import { getGlobalSupabaseClient } from '../supabase/index.js';
import type { Itinerary, ItineraryItem, ItineraryItemType, GeoPoint } from '../schemas/index.js';
import { ItinerarySchema, ItineraryItemSchema } from '../schemas/index.js';

export interface CreateItineraryInput {
  trip_id: string;
  day_number: number;
  date: string;
  summary?: string;
}

export interface CreateItineraryItemInput {
  trip_id: string;
  day_number: number;
  type: ItineraryItemType;
  title: string;
  description?: string;
  location?: GeoPoint;
  address?: string;
  start_time?: string;
  end_time?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateItineraryItemInput {
  type?: ItineraryItemType;
  title?: string;
  description?: string;
  location?: GeoPoint;
  address?: string;
  start_time?: string;
  end_time?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export class ItineraryRepository {
  async findByTripId(tripId: string): Promise<Itinerary[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('itineraries')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true });

    if (error) throw error;

    const itineraries = (data || []) as Itinerary[];

    for (const itinerary of itineraries) {
      itinerary.items = await this.findItemsByItineraryId(itinerary.id);
    }

    return itineraries;
  }

  async findItemsByItineraryId(itineraryId: string): Promise<ItineraryItem[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('itinerary_items')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('order', { ascending: true });

    if (error) throw error;

    return (data || []) as ItineraryItem[];
  }

  async findItemsByTripId(tripId: string): Promise<ItineraryItem[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number', { ascending: true })
      .order('order', { ascending: true });

    if (error) throw error;

    return (data || []) as ItineraryItem[];
  }

  async create(input: CreateItineraryInput): Promise<Itinerary> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const now = new Date().toISOString();
    const itinerary = {
      id: randomUUID(),
      ...input,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await client
      .from('itineraries')
      .insert(itinerary as never)
      .select()
      .single();

    if (error) throw error;

    const result = data as Itinerary;
    result.items = [];
    return result;
  }

  async createItem(input: CreateItineraryItemInput): Promise<ItineraryItem> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const now = new Date().toISOString();
    const item = {
      id: randomUUID(),
      ...input,
      order: input.order ?? 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await client
      .from('itinerary_items')
      .insert(item as never)
      .select()
      .single();

    if (error) throw error;

    return data as ItineraryItem;
  }

  async updateItem(id: string, input: UpdateItineraryItemInput): Promise<ItineraryItem> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('itinerary_items')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as ItineraryItem;
  }

  async deleteItem(id: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await client
      .from('itinerary_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteByTripId(tripId: string): Promise<void> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    await client
      .from('itinerary_items')
      .delete()
      .eq('trip_id', tripId);

    await client
      .from('itineraries')
      .delete()
      .eq('trip_id', tripId);
  }

  async bulkCreateItems(inputs: CreateItineraryItemInput[]): Promise<ItineraryItem[]> {
    const client = getGlobalSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }

    const now = new Date().toISOString();
    const items = inputs.map((input, index) => ({
      id: randomUUID(),
      ...input,
      order: input.order ?? index,
      created_at: now,
      updated_at: now,
    }));

    const { data, error } = await client
      .from('itinerary_items')
      .insert(items as never)
      .select();

    if (error) throw error;

    return (data || []) as ItineraryItem[];
  }
}

export const itineraryRepository = new ItineraryRepository();
