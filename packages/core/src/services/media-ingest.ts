import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import { captureRepository } from '../repositories/capture.repository.js';
import { storageService } from './storage.js';
import type { CaptureType, GeoPoint } from '../schemas/index.js';

export interface MediaMetadata {
  filename: string;
  size: number;
  mimeType: string;
  capturedAt?: string;
  location?: GeoPoint;
}

export interface IngestResult {
  success: boolean;
  captureId?: string;
  metadata?: MediaMetadata;
  error?: string;
}

export async function ingestPhoto(
  tripId: string,
  filePath: string,
  metadata?: Partial<MediaMetadata>
): Promise<IngestResult> {
  try {
    const fileStats = await stat(filePath);
    const fileBuffer = await readFile(filePath);

    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    const uploaded = await storageService.upload({
      bucket: 'photos',
      path: `${tripId}/${Date.now()}.${ext}`,
      contentType: mimeTypes[ext] || 'image/jpeg',
    }, fileBuffer);

    const capture = await captureRepository.create({
      trip_id: tripId,
      type: 'photo',
      content: uploaded.url,
      location: metadata?.location,
      timestamp: metadata?.capturedAt,
      metadata: {
        originalPath: filePath,
        filename: metadata?.filename || filePath.split('/').pop(),
        size: fileStats.size,
        storagePath: uploaded.path,
      },
    });

    return {
      success: true,
      captureId: capture.id,
      metadata: {
        filename: metadata?.filename || filePath.split('/').pop() || 'unknown',
        size: fileStats.size,
        mimeType: mimeTypes[ext] || 'image/jpeg',
        capturedAt: metadata?.capturedAt,
        location: metadata?.location,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function ingestVoice(
  tripId: string,
  filePath: string,
  transcription?: string,
  metadata?: Partial<MediaMetadata>
): Promise<IngestResult> {
  try {
    const fileStats = await stat(filePath);
    const fileBuffer = await readFile(filePath);

    const uploaded = await storageService.upload({
      bucket: 'voice',
      path: `${tripId}/${Date.now()}.m4a`,
      contentType: 'audio/mp4',
    }, fileBuffer);

    const capture = await captureRepository.create({
      trip_id: tripId,
      type: 'voice',
      content: transcription || `Voice note: ${uploaded.url}`,
      location: metadata?.location,
      timestamp: metadata?.capturedAt,
      metadata: {
        originalPath: filePath,
        filename: metadata?.filename || 'voice note',
        size: fileStats.size,
        storagePath: uploaded.path,
        hasTranscription: !!transcription,
      },
    });

    return {
      success: true,
      captureId: capture.id,
      metadata: {
        filename: metadata?.filename || 'voice note',
        size: fileStats.size,
        mimeType: 'audio/mp4',
        capturedAt: metadata?.capturedAt,
        location: metadata?.location,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function ingestNote(
  tripId: string,
  content: string,
  metadata?: Partial<MediaMetadata>
): Promise<IngestResult> {
  try {
    const capture = await captureRepository.create({
      trip_id: tripId,
      type: 'note',
      content,
      location: metadata?.location,
      timestamp: metadata?.capturedAt || new Date().toISOString(),
      metadata: {
        filename: metadata?.filename || 'text note',
      },
    });

    return {
      success: true,
      captureId: capture.id,
      metadata: {
        filename: metadata?.filename || 'text note',
        size: content.length,
        mimeType: 'text/plain',
        capturedAt: metadata?.capturedAt,
        location: metadata?.location,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function ingestGPX(
  tripId: string,
  filePath: string,
  metadata?: Partial<MediaMetadata>
): Promise<IngestResult> {
  try {
    const fileBuffer = await readFile(filePath);
    const content = fileBuffer.toString('utf-8');

    const gpxData = parseGPX(content);
    const points: GeoPoint[] = gpxData.map(trackpoint => ({
      lat: trackpoint.lat,
      lng: trackpoint.lon,
    }));

    const uploaded = await storageService.upload({
      bucket: 'gpx',
      path: `${tripId}/${Date.now()}.gpx`,
      contentType: 'application/gpx+xml',
    }, fileBuffer);

    const capture = await captureRepository.create({
      trip_id: tripId,
      type: 'gpx',
      content: uploaded.url,
      location: points[0],
      timestamp: metadata?.capturedAt || gpxData[0]?.time || new Date().toISOString(),
      metadata: {
        originalPath: filePath,
        filename: metadata?.filename || filePath.split('/').pop(),
        storagePath: uploaded.path,
        pointCount: points.length,
        startTime: gpxData[0]?.time,
        endTime: gpxData[gpxData.length - 1]?.time,
      },
    });

    return {
      success: true,
      captureId: capture.id,
      metadata: {
        filename: metadata?.filename || filePath.split('/').pop() || 'track.gpx',
        size: fileBuffer.length,
        mimeType: 'application/gpx+xml',
        capturedAt: metadata?.capturedAt,
        location: points[0],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

interface GPXTrackPoint {
  lat: number;
  lon: number;
  time?: string;
  ele?: number;
}

function parseGPX(content: string): GPXTrackPoint[] {
  const points: GPXTrackPoint[] = [];
  const trkptRegex = /<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  const timeRegex = /<time>([^<]*)<\/time>/;
  const eleRegex = /<ele>([^<]*)<\/ele>/;

  let match;
  while ((match = trkptRegex.exec(content)) !== null) {
    const latStr = match[1];
    const lonStr = match[2];
    const innerContent = match[3] || '';

    if (!latStr || !lonStr) continue;

    const point: GPXTrackPoint = {
      lat: parseFloat(latStr),
      lon: parseFloat(lonStr),
    };

    const timeMatch = innerContent.match(timeRegex);
    if (timeMatch?.[1]) {
      point.time = timeMatch[1];
    }

    const eleMatch = innerContent.match(eleRegex);
    if (eleMatch?.[1]) {
      point.ele = parseFloat(eleMatch[1]);
    }

    points.push(point);
  }

  return points;
}

export async function bulkIngestMedia(
  tripId: string,
  items: Array<{
    type: CaptureType;
    path?: string;
    content?: string;
    metadata?: Partial<MediaMetadata>;
  }>
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];

  for (const item of items) {
    let result: IngestResult;

    switch (item.type) {
      case 'photo':
        result = item.path ? await ingestPhoto(tripId, item.path, item.metadata) : { success: false, error: 'Path required for photo' };
        break;
      case 'voice':
        result = item.path ? await ingestVoice(tripId, item.path, undefined, item.metadata) : { success: false, error: 'Path required for voice' };
        break;
      case 'note':
        result = item.content ? await ingestNote(tripId, item.content, item.metadata) : { success: false, error: 'Content required for note' };
        break;
      case 'gpx':
        result = item.path ? await ingestGPX(tripId, item.path, item.metadata) : { success: false, error: 'Path required for GPX' };
        break;
      default:
        result = { success: false, error: `Unknown media type: ${item.type}` };
    }

    results.push(result);
  }

  return results;
}

export const mediaIngestService = {
  ingestPhoto,
  ingestVoice,
  ingestNote,
  ingestGPX,
  bulkIngestMedia,
  ingest: async (filePath: string, options: { tripId?: string; type?: 'photo' | 'voice' | 'note' | 'gpx' }) => {
    const tripId = options.tripId || 'default';
    switch (options.type || 'photo') {
      case 'photo':
        return ingestPhoto(tripId, filePath);
      case 'voice':
        return ingestVoice(tripId, filePath);
      case 'note':
        return ingestNote(tripId, filePath);
      case 'gpx':
        return ingestGPX(tripId, filePath);
      default:
        return { success: false, error: `Unknown type: ${options.type}` };
    }
  },
};
