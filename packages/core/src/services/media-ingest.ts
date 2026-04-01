import { readFile } from 'fs/promises';
import { stat } from 'fs/promises';
import { captureRepository } from '../repositories/capture.repository.js';
import { storageService } from './storage.js';
import type { Capture, CaptureMetadata, CaptureType, GeoPoint } from '../schemas/index.js';

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

export interface UploadedAssetInput {
  bucket: string;
  path: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  publicUrl?: string;
}

export interface PersistCaptureInput {
  tripId: string;
  type: CaptureType;
  content: string;
  location?: GeoPoint;
  timestamp?: string;
  metadata?: CaptureMetadata;
}

export async function persistCapture(input: PersistCaptureInput): Promise<Capture> {
  return captureRepository.create({
    trip_id: input.tripId,
    type: input.type,
    content: input.content,
    location: input.location,
    timestamp: input.timestamp,
    metadata: input.metadata,
  });
}

function buildUploadedAssetMetadata(asset: UploadedAssetInput): CaptureMetadata {
  return {
    source: 'web_upload',
    bucket: asset.bucket,
    path: asset.path,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.size,
    publicUrl: asset.publicUrl,
  };
}

function inferCaptureTypeFromUploadedAsset(asset: UploadedAssetInput): CaptureType {
  const mimeType = asset.mimeType?.toLowerCase() ?? '';
  const fileName = asset.fileName.toLowerCase();

  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('audio/')) return 'voice';
  if (mimeType === 'application/gpx+xml' || fileName.endsWith('.gpx')) return 'gpx';
  return 'note';
}

export async function ingestUploadedAssets(
  tripId: string,
  assets: UploadedAssetInput[],
): Promise<Array<IngestResult & { asset: UploadedAssetInput; captureType?: CaptureType }>> {
  const results: Array<IngestResult & { asset: UploadedAssetInput; captureType?: CaptureType }> = [];

  for (const asset of assets) {
    try {
      const captureType = inferCaptureTypeFromUploadedAsset(asset);
      const timestamp = new Date().toISOString();
      const capture = await persistCapture({
        tripId,
        type: captureType,
        content: asset.publicUrl || `storage://${asset.bucket}/${asset.path}`,
        timestamp,
        metadata: buildUploadedAssetMetadata(asset),
      });

      results.push({
        success: true,
        captureId: capture.id,
        captureType,
        asset,
        metadata: {
          filename: asset.fileName,
          size: asset.size ?? 0,
          mimeType: asset.mimeType ?? 'application/octet-stream',
          capturedAt: timestamp,
        },
      });
    } catch (error) {
      results.push({
        success: false,
        asset,
        captureType: inferCaptureTypeFromUploadedAsset(asset),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
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

    const capture = await persistCapture({
      tripId,
      type: 'photo',
      content: uploaded.url,
      location: metadata?.location,
      timestamp: metadata?.capturedAt,
      metadata: {
        source: 'cli_upload',
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

    const capture = await persistCapture({
      tripId,
      type: 'voice',
      content: transcription || `Voice note: ${uploaded.url}`,
      location: metadata?.location,
      timestamp: metadata?.capturedAt,
      metadata: {
        source: 'cli_upload',
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
    const capture = await persistCapture({
      tripId,
      type: 'note',
      content,
      location: metadata?.location,
      timestamp: metadata?.capturedAt || new Date().toISOString(),
      metadata: {
        source: 'manual',
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

    const capture = await persistCapture({
      tripId,
      type: 'gpx',
      content: uploaded.url,
      location: points[0],
      timestamp: metadata?.capturedAt || gpxData[0]?.time || new Date().toISOString(),
      metadata: {
        source: 'cli_upload',
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
  persistCapture,
  ingestPhoto,
  ingestVoice,
  ingestNote,
  ingestGPX,
  ingestUploadedAssets,
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
