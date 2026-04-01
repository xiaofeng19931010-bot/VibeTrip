import type { CaptureMetadata, CaptureType, GeoPoint } from '../schemas/index.js';
import { captureRepository } from '../repositories/capture.repository.js';
import { persistCapture } from './media-ingest.js';

export interface CaptureStrategy {
  lowPowerMode: boolean;
  gpsIntervalMs: number;
  distanceThreshold: number;
 停留ThresholdMs: number;
  maxCapturesPerDay: number;
}

export interface CaptureSession {
  tripId: string;
  isActive: boolean;
  startedAt: string;
  lastCaptureAt?: string;
  locationPoints: GeoPoint[];
  stayPoints: StayPoint[];
}

export interface StayPoint {
  location: GeoPoint;
  arrivalTime: string;
  departureTime?: string;
  durationMs?: number;
}

export interface CaptureOptions {
  type: CaptureType;
  content: string;
  location?: GeoPoint;
  timestamp?: string;
  metadata?: CaptureMetadata;
}

const DEFAULT_STRATEGY: CaptureStrategy = {
  lowPowerMode: true,
  gpsIntervalMs: 60000,
  distanceThreshold: 100,
 停留ThresholdMs: 300000,
  maxCapturesPerDay: 100,
};

const sessions = new Map<string, CaptureSession>();

export function startCaptureSession(tripId: string, strategy: Partial<CaptureStrategy> = {}): CaptureSession {
  const mergedStrategy = { ...DEFAULT_STRATEGY, ...strategy };

  const session: CaptureSession = {
    tripId,
    isActive: true,
    startedAt: new Date().toISOString(),
    locationPoints: [],
    stayPoints: [],
  };

  sessions.set(tripId, session);

  return session;
}

export function stopCaptureSession(tripId: string): CaptureSession | null {
  const session = sessions.get(tripId);

  if (!session) {
    return null;
  }

  session.isActive = false;

  for (const stayPoint of session.stayPoints) {
    if (!stayPoint.departureTime) {
      stayPoint.departureTime = new Date().toISOString();
      stayPoint.durationMs = new Date(stayPoint.departureTime).getTime() - new Date(stayPoint.arrivalTime).getTime();
    }
  }

  return session;
}

export function getCaptureSession(tripId: string): CaptureSession | null {
  return sessions.get(tripId) || null;
}

export function isCaptureActive(tripId: string): boolean {
  const session = sessions.get(tripId);
  return session?.isActive ?? false;
}

export async function recordLocation(
  tripId: string,
  location: GeoPoint,
  timestamp?: string
): Promise<void> {
  const session = sessions.get(tripId);

  if (!session || !session.isActive) {
    return;
  }

  const now = timestamp || new Date().toISOString();
  const lastPoint = session.locationPoints[session.locationPoints.length - 1];

  if (lastPoint) {
    const distance = calculateDistance(lastPoint, location);
    if (distance < DEFAULT_STRATEGY.distanceThreshold) {
      return;
    }
  }

  session.locationPoints.push(location);
  session.lastCaptureAt = now;

  await persistCapture({
    tripId,
    type: 'gpx',
    content: JSON.stringify({ lat: location.lat, lng: location.lng }),
    location,
    timestamp: now,
    metadata: { source: 'capture_session', captureType: 'location' },
  });
}

export async function ingestMedia(
  tripId: string,
  options: CaptureOptions
): Promise<{ success: boolean; captureId?: string; reason?: string }> {
  const session = sessions.get(tripId);

  if (!session || !session.isActive) {
    return { success: false, reason: 'capture_session_inactive' };
  }

  const timestamp = options.timestamp || new Date().toISOString();

  const capture = await persistCapture({
    tripId,
    type: options.type,
    content: options.content,
    location: options.location,
    timestamp,
    metadata: {
      source: 'capture_session',
      ...options.metadata,
    },
  });

  session.lastCaptureAt = timestamp;
  return { success: true, captureId: capture.id };
}

export async function ingestMediaInSession(
  tripId: string,
  options: CaptureOptions
): Promise<{ success: boolean; captureId?: string; reason?: string }> {
  return ingestMedia(tripId, options);
}

export async function importCapture(
  tripId: string,
  options: CaptureOptions
): Promise<{ success: boolean; captureId: string }> {
  const capture = await persistCapture({
    tripId,
    type: options.type,
    content: options.content,
    location: options.location,
    timestamp: options.timestamp,
    metadata: {
      source: options.metadata?.source ?? 'manual',
      ...options.metadata,
    },
  });

  return { success: true, captureId: capture.id };
}

export async function getTripCaptures(tripId: string): Promise<{
  total: number;
  byType: Record<CaptureType, number>;
  locations: GeoPoint[];
  stayPoints: StayPoint[];
}> {
  const captures = await captureRepository.findByTripId(tripId);
  const session = sessions.get(tripId);

  const byType: Record<CaptureType, number> = {
    photo: 0,
    voice: 0,
    note: 0,
    gpx: 0,
  };

  for (const capture of captures) {
    byType[capture.type]++;
  }

  return {
    total: captures.length,
    byType,
    locations: session?.locationPoints || [],
    stayPoints: session?.stayPoints || [],
  };
}

function calculateDistance(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371000;
  const lat1Rad = (p1.lat * Math.PI) / 180;
  const lat2Rad = (p2.lat * Math.PI) / 180;
  const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const captureService = {
  startCaptureSession,
  stopCaptureSession,
  getCaptureSession,
  isCaptureActive,
  recordLocation,
  ingestMedia,
  ingestMediaInSession,
  importCapture,
  getTripCaptures,
  startCapture: async (tripId: string) => {
    const session = startCaptureSession(tripId);
    return { captureId: session.tripId, isActive: session.isActive, startedAt: session.startedAt };
  },
  stopCapture: async (tripId: string) => {
    return stopCaptureSession(tripId);
  },
  getCaptureStatus: async (tripId: string) => {
    const session = getCaptureSession(tripId);
    if (!session) return { isActive: false };
    const captures = await getTripCaptures(tripId);
    return {
      isActive: session.isActive,
      startedAt: session.startedAt,
      lastCaptureAt: session.lastCaptureAt,
      totalCaptures: captures.total,
      locations: session.locationPoints,
    };
  },
};
