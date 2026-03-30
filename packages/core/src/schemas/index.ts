import { z } from 'zod';

export const RoleType = z.enum(['parents', 'family', 'couple', 'friends', 'soldier']);
export type RoleType = z.infer<typeof RoleType>;

export const TripStatus = z.enum(['draft', 'planned', 'traveling', 'completed', 'archived']);
export type TripStatus = z.infer<typeof TripStatus>;

export const ItineraryItemType = z.enum(['transport', 'accommodation', 'attraction', 'restaurant', 'break', 'other']);
export type ItineraryItemType = z.infer<typeof ItineraryItemType>;

export const CaptureType = z.enum(['photo', 'voice', 'note', 'gpx']);
export type CaptureType = z.infer<typeof CaptureType>;

export const MemoryArtifactType = z.enum(['handbook', 'poster', 'video']);
export type MemoryArtifactType = z.infer<typeof MemoryArtifactType>;

export const ShareChannel = z.enum(['xhs', 'moments', 'weibo', 'other']);
export type ShareChannel = z.infer<typeof ShareChannel>;

export const GeoPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const TripSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  title: z.string().min(1).max(200),
  destination: z.string().min(1),
  start_date: z.string(),
  end_date: z.string(),
  role: RoleType,
  status: TripStatus.default('draft'),
  budget: z.number().nullable().optional(),
  preferences: z.record(z.unknown()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Trip = z.infer<typeof TripSchema>;

export const ItineraryItemSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),
  day_number: z.number().int().positive(),
  type: ItineraryItemType,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: GeoPointSchema.optional(),
  address: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  order: z.number().int().default(0),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;

export const ItinerarySchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),
  day_number: z.number().int().positive(),
  date: z.string().datetime(),
  summary: z.string().optional(),
  items: z.array(ItineraryItemSchema).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Itinerary = z.infer<typeof ItinerarySchema>;

export const CaptureSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),
  type: CaptureType,
  content: z.string(),
  location: GeoPointSchema.optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});
export type Capture = z.infer<typeof CaptureSchema>;

export const MemoryArtifactSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),
  type: MemoryArtifactType,
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  storage_url: z.string().url().optional(),
  file_path: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type MemoryArtifact = z.infer<typeof MemoryArtifactSchema>;

export const SharePackageSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),
  channel: ShareChannel,
  title: z.string().min(1).max(200),
  content: z.string(),
  hashtags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type SharePackage = z.infer<typeof SharePackageSchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  trace_id: z.string(),
  actor_type: z.enum(['user', 'system', 'mcp', 'cli']),
  actor_id: z.string().optional(),
  tool_name: z.string().optional(),
  trip_id: z.string().uuid().optional(),
  status: z.enum(['success', 'error', 'denied']),
  cost_ms: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const UserPreferencesSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  default_role: RoleType.optional(),
  notification_enabled: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.string().default('zh-CN'),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
