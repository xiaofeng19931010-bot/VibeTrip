import type { RoleType, MemoryArtifactMetadata, MemoryArtifactType } from '../schemas/index.js';
import { tripRepository } from '../repositories/trip.repository.js';
import { itineraryRepository } from '../repositories/itinerary.repository.js';
import { captureRepository } from '../repositories/capture.repository.js';
import { memoryArtifactRepository } from '../repositories/memory-artifact.repository.js';
import { storageService } from './storage.js';

export interface MemoryGenerationOptions {
  tripId: string;
  format: MemoryArtifactType;
  title?: string;
  captureIds?: string[];
}

function filterCapturesBySelection<T extends { id: string }>(items: T[], captureIds?: string[]) {
  if (!captureIds || captureIds.length === 0) {
    return items;
  }

  const allowedIds = new Set(captureIds);
  return items.filter((item) => allowedIds.has(item.id));
}

export interface HandbookContent {
  title: string;
  destination: string;
  dates: string;
  duration: number;
  roleDisplay: string;
  dailyMemories: DailyMemory[];
  totalPhotos: number;
  totalNotes: number;
}

export interface DailyMemory {
  dayNumber: number;
  date: string;
  summary: string;
  photos: string[];
  notes: string[];
  feeling?: string;
}

export interface PosterContent {
  title: string;
  subtitle: string;
  destination: string;
  dates: string;
  heroImage?: string;
  highlightPhotos: string[];
  quote?: string;
}

async function buildMemoryArtifactMetadata(
  options: MemoryGenerationOptions,
  contentType: 'markdown' | 'text',
): Promise<MemoryArtifactMetadata> {
  const trip = await tripRepository.findById(options.tripId);

  if (!trip) {
    throw new Error(`Trip not found: ${options.tripId}`);
  }

  const selectedCaptures = filterCapturesBySelection(
    await captureRepository.findByTripId(options.tripId),
    options.captureIds,
  );
  const bucket = options.format === 'handbook' ? 'memories' : 'posters';

  return {
    tripId: trip.id,
    format: options.format,
    generatedAt: new Date().toISOString(),
    contentType,
    bucket,
    captureIds: selectedCaptures.map((capture) => capture.id),
    captureCount: selectedCaptures.length,
    destination: trip.destination,
    role: trip.role,
  };
}

export const ROLE_DISPLAY_NAMES: Record<RoleType, string> = {
  parents: '带父母出行',
  family: '亲子时光',
  couple: '情侣之旅',
  friends: '闺蜜/朋友行',
  soldier: '特种兵旅行',
};

export async function generateHandbook(options: MemoryGenerationOptions): Promise<HandbookContent> {
  const trip = await tripRepository.findById(options.tripId);

  if (!trip) {
    throw new Error(`Trip not found: ${options.tripId}`);
  }

  const itineraries = await itineraryRepository.findByTripId(options.tripId);
  const captures = filterCapturesBySelection(
    await captureRepository.findByTripId(options.tripId),
    options.captureIds,
  );

  const dailyMemories: DailyMemory[] = [];

  for (const itinerary of itineraries) {
    const dayCaptures = captures.filter(c => {
      const captureDate = c.timestamp.split('T')[0];
      return captureDate === itinerary.date.split('T')[0];
    });

    const photos = dayCaptures
      .filter(c => c.type === 'photo')
      .map(c => c.content);

    const notes = dayCaptures
      .filter(c => c.type === 'note')
      .map(c => c.content);

    dailyMemories.push({
      dayNumber: itinerary.day_number,
      date: itinerary.date,
      summary: itinerary.summary || `第${itinerary.day_number}天`,
      photos,
      notes,
    });
  }

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    title: options.title || `${trip.destination}旅行手账`,
    destination: trip.destination,
    dates: `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`,
    duration,
    roleDisplay: ROLE_DISPLAY_NAMES[trip.role],
    dailyMemories,
    totalPhotos: captures.filter(c => c.type === 'photo').length,
    totalNotes: captures.filter(c => c.type === 'note').length,
  };
}

export async function generatePoster(options: MemoryGenerationOptions): Promise<PosterContent> {
  const trip = await tripRepository.findById(options.tripId);

  if (!trip) {
    throw new Error(`Trip not found: ${options.tripId}`);
  }

  const captures = filterCapturesBySelection(
    await captureRepository.findByTripId(options.tripId),
    options.captureIds,
  );
  const photos = captures.filter(c => c.type === 'photo').map(c => c.content);

  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);

  return {
    title: `${trip.destination}之旅`,
    subtitle: ROLE_DISPLAY_NAMES[trip.role],
    destination: trip.destination,
    dates: `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`,
    heroImage: photos[0],
    highlightPhotos: photos.slice(0, 4),
    quote: '记录美好旅行时光',
  };
}

export function formatHandbookAsMarkdown(handbook: HandbookContent): string {
  let md = `# ${handbook.title}\n\n`;
  md += `📍 ${handbook.destination} | 📅 ${handbook.dates}\n`;
  md += `👥 ${handbook.roleDisplay} | 📸 ${handbook.totalPhotos}张照片 | 📝 ${handbook.totalNotes}条笔记\n\n`;
  md += `---\n\n`;

  for (const day of handbook.dailyMemories) {
    md += `## 第${day.dayNumber}天 - ${day.date}\n\n`;
    md += `${day.summary}\n\n`;

    if (day.photos.length > 0) {
      md += `### 📷 照片\n\n`;
      for (const photo of day.photos) {
        md += `![photo](${photo})\n`;
      }
      md += `\n`;
    }

    if (day.notes.length > 0) {
      md += `### 📝 笔记\n\n`;
      for (const note of day.notes) {
        md += `> ${note}\n\n`;
      }
    }

    md += `---\n\n`;
  }

  md += `\n*由 VibeTrip 自动生成*\n`;

  return md;
}

export function formatPosterAsText(poster: PosterContent): string {
  let text = `${poster.title}\n`;
  text += `${'='.repeat(20)}\n\n`;
  text += `📍 ${poster.destination}\n`;
  text += `📅 ${poster.dates}\n`;
  text += `${poster.subtitle}\n\n`;

  if (poster.heroImage) {
    text += `封面图: ${poster.heroImage}\n\n`;
  }

  if (poster.highlightPhotos.length > 0) {
    text += `精选照片:\n`;
    for (const photo of poster.highlightPhotos) {
      text += `  - ${photo}\n`;
    }
    text += `\n`;
  }

  if (poster.quote) {
    text += `"${poster.quote}"\n\n`;
  }

  text += `*由 VibeTrip 自动生成*\n`;

  return text;
}

export async function saveMemoryArtifact(
  options: MemoryGenerationOptions,
  content: string,
  contentType: 'markdown' | 'text'
): Promise<string> {
  const metadata = await buildMemoryArtifactMetadata(options, contentType);
  const artifact = await memoryArtifactRepository.create({
    trip_id: options.tripId,
    type: options.format,
    title: options.title || `${options.format} memory`,
    description: `${options.format} generated at ${new Date().toISOString()}`,
    metadata,
  });

  const ext = contentType === 'markdown' ? 'md' : 'txt';
  const bucket = metadata.bucket;

  const uploaded = await storageService.upload({
    bucket,
    path: `${options.tripId}/${artifact.id}.${ext}`,
    contentType: contentType === 'markdown' ? 'text/markdown' : 'text/plain',
  }, Buffer.from(content, 'utf-8'));

  await memoryArtifactRepository.update(artifact.id, {
    storage_url: uploaded.url,
    file_path: uploaded.path,
    status: 'completed',
  });

  return uploaded.url;
}

export async function generateAndSaveMemory(options: MemoryGenerationOptions): Promise<{
  artifactId: string;
  url: string;
  content: HandbookContent | PosterContent;
}> {
  let content: HandbookContent | PosterContent;
  let contentStr: string;
  let contentType: 'markdown' | 'text';

  if (options.format === 'handbook') {
    content = await generateHandbook(options);
    contentStr = formatHandbookAsMarkdown(content);
    contentType = 'markdown';
  } else {
    content = await generatePoster(options);
    contentStr = formatPosterAsText(content);
    contentType = 'text';
  }

  const metadata = await buildMemoryArtifactMetadata(options, contentType);

  const artifact = await memoryArtifactRepository.create({
    trip_id: options.tripId,
    type: options.format,
    title: options.title || `${content.destination}旅行记忆`,
    description: `${options.format} generated`,
    metadata,
  });

  const ext = contentType === 'markdown' ? 'md' : 'txt';
  const bucket = metadata.bucket;

  const uploaded = await storageService.upload({
    bucket,
    path: `${options.tripId}/${artifact.id}.${ext}`,
    contentType: contentType === 'markdown' ? 'text/markdown' : 'text/plain',
  }, Buffer.from(contentStr, 'utf-8'));

  await memoryArtifactRepository.update(artifact.id, {
    storage_url: uploaded.url,
    file_path: uploaded.path,
    status: 'completed',
  });

  return {
    artifactId: artifact.id,
    url: uploaded.url,
    content,
  };
}

export const memoryService = {
  generateHandbook,
  generatePoster,
  formatHandbookAsMarkdown,
  formatPosterAsText,
  saveMemoryArtifact,
  generateAndSaveMemory,
  generateMemory: async (tripId: string, options: { format?: 'handbook' | 'poster'; captureIds?: string[] }) => {
    const format = options.format || 'handbook';
    const result = await generateAndSaveMemory({ tripId, format, captureIds: options.captureIds });
    return {
      id: result.artifactId,
      url: result.url,
      title: 'title' in result.content ? result.content.title : `${format} memory`,
      format,
    };
  },
};
