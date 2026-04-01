import type { ShareChannel, RoleType, SharePackageMetadata } from '../schemas/index.js';
import type { Itinerary } from '../schemas/index.js';
import { tripRepository } from '../repositories/trip.repository.js';
import { itineraryRepository } from '../repositories/itinerary.repository.js';
import { captureRepository } from '../repositories/capture.repository.js';
import { memoryArtifactRepository } from '../repositories/memory-artifact.repository.js';
import { sharePackageRepository } from '../repositories/share-package.repository.js';

export interface ShareContent {
  title: string;
  body: string;
  hashtags: string[];
  images: string[];
  metadata?: SharePackageMetadata;
}

export interface ShareTemplate {
  channel: ShareChannel;
  style: 'casual' | 'formal' | 'romantic' | 'adventure';
  emojiEnabled: boolean;
}

export interface ShareGenerationOptions {
  style?: 'casual' | 'formal' | 'romantic' | 'adventure';
  memoryArtifactId?: string;
}

const CHANNEL_TEMPLATES: Record<ShareChannel, ShareTemplate> = {
  xhs: {
    channel: 'xhs',
    style: 'casual',
    emojiEnabled: true,
  },
  moments: {
    channel: 'moments',
    style: 'casual',
    emojiEnabled: false,
  },
  weibo: {
    channel: 'weibo',
    style: 'formal',
    emojiEnabled: true,
  },
  other: {
    channel: 'other',
    style: 'casual',
    emojiEnabled: true,
  },
};

const ROLE_HASHTAGS: Record<RoleType, string[]> = {
  parents: ['#带父母旅行', '#家庭出游', '#孝顺', '#旅行日记'],
  family: ['#亲子游', '#遛娃日常', '#家庭旅行', '#亲子时光'],
  couple: ['#情侣旅行', '#浪漫之旅', '#二人世界', '#甜蜜旅行'],
  friends: ['#闺蜜旅行', '#朋友出游', '#特种兵', '#旅行打卡'],
  soldier: ['#特种兵旅行', '#打卡', '#穷游', '#旅行记录'],
};

const DESTINATION_HASHTAGS: Record<string, string[]> = {
  '成都': ['#成都', '#成都旅游', '#天府之国'],
  '重庆': ['#重庆', '#重庆旅游', '#山城'],
  '北京': ['#北京', '#帝都', '#北京旅游'],
  '上海': ['#上海', '#魔都', '#上海旅游'],
  '杭州': ['#杭州', '#西湖', '#杭州旅游'],
  '丽江': ['#丽江', '#丽江古城', '#云南'],
  '大理': ['#大理', '#洱海', '#云南'],
  '三亚': ['#三亚', '#海岛', '#度假'],
  '厦门': ['#厦门', '#鼓浪屿', '#福建'],
};

const EMOJIS = {
  location: '📍',
  date: '📅',
  transport: '✈️',
  food: '🍜',
  attraction: '🏔️',
  photo: '📸',
  heart: '❤️',
  sparkle: '✨',
  rocket: '🚀',
};

export async function generateShareContent(
  tripId: string,
  channel: ShareChannel,
  options?: ShareGenerationOptions
): Promise<ShareContent> {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    throw new Error(`Trip not found: ${tripId}`);
  }

  const itineraries = await itineraryRepository.findByTripId(tripId);
  const captures = await captureRepository.findByTripId(tripId);
  const memoryArtifact = options?.memoryArtifactId
    ? await memoryArtifactRepository.findById(options.memoryArtifactId)
    : null;

  const template = CHANNEL_TEMPLATES[channel];
  const style = options?.style || template.style;

  const roleHashtags = ROLE_HASHTAGS[trip.role] || [];
  const destHashtags = DESTINATION_HASHTAGS[trip.destination] || [`#${trip.destination}`];

  const allHashtags = [...new Set([...roleHashtags, ...destHashtags])].slice(0, 10);

  const photos = captures
    .filter(c => c.type === 'photo')
    .map(c => c.content)
    .slice(0, 9);

  const body = generateBody(
    trip,
    itineraries,
    captures,
    style,
    template.emojiEnabled,
    memoryArtifact
      ? {
          title: memoryArtifact.title,
          url: memoryArtifact.storage_url || undefined,
          type: memoryArtifact.type,
        }
      : undefined,
  );

  const metadata: SharePackageMetadata = {
    tripId: trip.id,
    channel,
    style,
    generatedAt: new Date().toISOString(),
    memoryArtifactId: memoryArtifact?.id,
    memoryArtifactTitle: memoryArtifact?.title || undefined,
    memoryArtifactUrl: memoryArtifact?.storage_url || undefined,
  };

  return {
    title: memoryArtifact?.title ? `${memoryArtifact.title}分享版` : `${trip.destination}旅行回顾`,
    body,
    hashtags: allHashtags,
    images: photos,
    metadata,
  };
}

function generateBody(
  trip: {
    destination: string;
    role: RoleType;
    start_date: string;
    end_date: string;
  },
  itineraries: Itinerary[],
  captures: Array<{ type: string; content: string }>,
  style: 'casual' | 'formal' | 'romantic' | 'adventure',
  emojiEnabled: boolean,
  memoryArtifact?: {
    title: string;
    url?: string;
    type: string;
  },
): string {
  const e = emojiEnabled ? EMOJIS : {
    location: '', date: '', transport: '', food: '', attraction: '',
    photo: '', heart: '', sparkle: '', rocket: '',
  };

  const startDate = new Date(trip.start_date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  const endDate = new Date(trip.end_date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });

  const photoCount = captures.filter(c => c.type === 'photo').length;
  const noteCount = captures.filter(c => c.type === 'note').length;

  let body = '';

  switch (style) {
    case 'romantic':
      body = `${e.heart} 和最重要的人，一起走过${trip.destination}\n\n`;
      body += `${e.location} ${trip.destination} | ${e.date} ${startDate}-${endDate}\n`;
      body += `${e.sparkle} 这次旅行，我们留下了${photoCount}张照片和${noteCount}条回忆\n\n`;
      body += `${formatItinerarySummary(itineraries, e)}\n\n`;
      body += `${e.heart} 最好的风景在身边，最好的人在对面`;
      break;

    case 'adventure':
      body = `${e.rocket} 特种兵出击！${trip.destination}打卡完成！\n\n`;
      body += `${e.location} ${trip.destination} | ${e.date} ${startDate}-${endDate}\n`;
      body += `${e.photo} 产出${photoCount}张照片，极限完成！\n\n`;
      body += `${formatItinerarySummary(itineraries, e)}\n\n`;
      body += `${e.sparkle} #特种兵旅行 #打卡`;
      break;

    case 'formal':
      body += `📖 ${trip.destination}旅行报告\n\n`;
      body += `时间：${startDate} - ${endDate}\n`;
      body += `类型：${getRoleDisplayName(trip.role)}\n\n`;
      body += `行程概述：\n${formatItineraryFormal(itineraries)}\n\n`;
      body += `共拍摄${photoCount}张照片，记录${noteCount}条笔记。`;
      break;

    case 'casual':
    default:
      body = `${e.sparkle} 周末去${trip.destination}玩啦～${e.heart}\n\n`;
      body += `${e.location} ${trip.destination} | ${e.date} ${startDate}-${endDate}\n`;
      body += `${e.photo} 拍了${photoCount}张照片～\n\n`;
      body += `${formatItinerarySummary(itineraries, e)}\n\n`;
      body += `${e.sparkle} 开心的旅行！`;
      break;
  }

  if (memoryArtifact) {
    body += `\n\n已关联旅行记忆：${memoryArtifact.title}`;
    if (memoryArtifact.url) {
      body += `\n记忆产物：${memoryArtifact.url}`;
    }
  }

  return body;
}

function formatItinerarySummary(
  itineraries: Itinerary[],
  emojis: Record<string, string>
): string {
  const highlights: string[] = [];

  for (const day of itineraries.slice(0, 3)) {
    const attractions = day.items?.filter(i => i.type === 'attraction') || [];
    const restaurants = day.items?.filter(i => i.type === 'restaurant') || [];

    if (attractions[0]?.title) {
      highlights.push(`${emojis.attraction}${attractions[0].title}`);
    }
    if (restaurants[0]?.title) {
      highlights.push(`${emojis.food}${restaurants[0].title}`);
    }
  }

  return highlights.slice(0, 4).join(' | ');
}

function formatItineraryFormal(
  itineraries: Itinerary[]
): string {
  const lines: string[] = [];

  for (const day of itineraries) {
    const items = day.items?.map(i => `${i.start_time || ''} ${i.title}`).filter(Boolean) || [];
    if (items.length > 0) {
      lines.push(`第${day.day_number}天：${items.join(' → ')}`);
    }
  }

  return lines.join('\n');
}

function getRoleDisplayName(role: RoleType): string {
  const names: Record<RoleType, string> = {
    parents: '带父母出行',
    family: '亲子出游',
    couple: '情侣旅行',
    friends: '朋友结伴',
    soldier: '特种兵旅行',
  };
  return names[role] || '旅行';
}

export async function generateMultipleVersions(
  tripId: string,
  channel: ShareChannel
): Promise<ShareContent[]> {
  const styles: Array<'casual' | 'formal' | 'romantic' | 'adventure'> = ['casual', 'romantic'];
  const versions: ShareContent[] = [];

  for (const style of styles) {
    const content = await generateShareContent(tripId, channel, { style });
    versions.push(content);
  }

  return versions;
}

export async function saveSharePackage(
  tripId: string,
  channel: ShareChannel,
  content: ShareContent
): Promise<string> {
  const sharePackage = await sharePackageRepository.create({
    trip_id: tripId,
    channel,
    title: content.title,
    content: content.body,
    hashtags: content.hashtags,
    images: content.images,
    metadata: content.metadata,
  });

  return sharePackage.id;
}

export const shareService = {
  generateShareContent,
  generateMultipleVersions,
  saveSharePackage,
  generateShare: async (tripId: string, options: { channel?: 'xhs' | 'moments' | 'weibo' | 'other'; memoryArtifactId?: string }) => {
    const channel = options.channel || 'xhs';
    const content = await generateShareContent(tripId, channel, {
      memoryArtifactId: options.memoryArtifactId,
    });
    const id = await saveSharePackage(tripId, channel, content);
    return {
      id,
      title: content.title,
      body: content.body,
      hashtags: content.hashtags,
      images: content.images,
      memoryArtifactId: options.memoryArtifactId,
      copyableText: `${content.title}\n\n${content.body}\n\n${content.hashtags.join(' ')}`,
    };
  },
};
