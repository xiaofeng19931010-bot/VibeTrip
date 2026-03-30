import type { RoleType } from '../schemas/index.js';
import type { RoleProfile } from './role-strategy.js';
import { getStrategyForContext } from './role-strategy.js';

export interface PlanRequest {
  description: string;
  role?: RoleType;
  days?: number;
  budget?: number;
  userId: string;
  customInstructions?: string[];
}

export interface ClarifyingQuestion {
  question: string;
  options?: string[];
  required: boolean;
}

export interface PlannedItem {
  dayNumber: number;
  type: 'transport' | 'accommodation' | 'attraction' | 'restaurant' | 'break' | 'other';
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  order: number;
}

export interface PlannedDay {
  dayNumber: number;
  date: string;
  summary: string;
  items: PlannedItem[];
}

export interface PlanResult {
  success: boolean;
  tripId?: string;
  questions?: ClarifyingQuestion[];
  itinerary?: PlannedDay[];
  error?: string;
  isFallback: boolean;
}

export function generateClarifyingQuestions(description: string): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = [];
  const lower = description.toLowerCase();

  if (!lower.includes('天') && !lower.includes('days')) {
    questions.push({
      question: '您计划旅行几天？',
      options: ['1-2天', '3-5天', '6-8天', '8天以上'],
      required: true,
    });
  }

  if (!lower.includes('预算') && !lower.includes('钱')) {
    questions.push({
      question: '您的预算范围是？',
      options: ['1000以下', '1000-3000', '3000-5000', '5000以上'],
      required: false,
    });
  }

  if (!lower.includes('带') && !lower.includes('和')) {
    questions.push({
      question: '您是和谁一起旅行？',
      options: ['独自一人', '情侣/夫妻', '带父母', '带孩子', '朋友一起'],
      required: true,
    });
  }

  if (!lower.includes('季节') && !lower.includes('什么时候')) {
    questions.push({
      question: '您计划什么时候出发？',
      options: ['春天', '夏天', '秋天', '冬天', '不确定'],
      required: false,
    });
  }

  return questions.slice(0, 5);
}

export function generateFallbackItinerary(
  description: string,
  days: number,
  role: RoleType,
  budget?: number
): PlannedDay[] {
  const strategy = getStrategyForContext({ role, customInstructions: [] });
  const itinerary: PlannedDay[] = [];

  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayDate = date.toISOString().split('T')[0];
    const items: PlannedItem[] = [];

    items.push({
      dayNumber: i + 1,
      type: 'transport',
      title: '前往目的地',
      description: '根据您选择的交通方式安排',
      order: 0,
    });

    const numActivities = Math.min(strategy.pacing.activitiesPerDay, 4);
    for (let j = 0; j < numActivities; j++) {
      items.push({
        dayNumber: i + 1,
        type: 'attraction',
        title: `景点 ${j + 1}`,
        description: '待根据您的偏好推荐',
        order: j + 1,
      });
    }

    if (strategy.schedule.includeNap && i === 0) {
      items.push({
        dayNumber: i + 1,
        type: 'break',
        title: '午休时间',
        startTime: strategy.schedule.lunchTime,
        order: numActivities + 1,
      });
    }

    items.push({
      dayNumber: i + 1,
      type: 'restaurant',
      title: '用餐',
      description: '根据当地美食推荐',
      order: numActivities + 2,
    });

    itinerary.push({
      dayNumber: i + 1,
      date: dayDate ?? new Date().toISOString().split('T')[0] ?? '',
      summary: `第${i + 1}天行程 - ${strategy.pacing.activitiesPerDay}个活动`,
      items: items.sort((a, b) => a.order - b.order),
    });
  }

  return itinerary;
}

export function extractDestination(description: string): string {
  const patterns = [
    /去(.+?)3天/,
    /去(.+?)玩/,
    /去(.+?)(旅行|游玩)/,
    /到(.+?)(旅行|玩|游玩)/,
    /(.+?)三日游/,
    /(.+?)五日游/,
    /旅行去(.+?)/,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const simpleMatch = description.match(/去(.+)/);
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1].trim();
  }

  return '未知目的地';
}

export function extractDays(description: string): number | undefined {
  const patterns = [
    /(\d+)天/,
    /(\d+)晚/,
    /(\d+)-?天/,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return undefined;
}

export function extractBudget(description: string): number | undefined {
  const patterns = [
    /预算\s*(\d+)/,
    /(\d+)\s*元/,
    /(\d+)k/i,
    /(\d+)\s*千/,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const budget = parseInt(match[1], 10);
      if (match[0].includes('k') || match[0].includes('千')) {
        return budget * 1000;
      }
      return budget;
    }
  }

  return undefined;
}

export function extractRole(description: string): RoleType | undefined {
  const lower = description.toLowerCase();

  if (lower.includes('带父母') || lower.includes('和父母') || lower.includes('爸妈')) {
    return 'parents';
  }
  if (lower.includes('带孩子') || lower.includes('带娃') || lower.includes('亲子')) {
    return 'family';
  }
  if (lower.includes('情侣') || lower.includes('夫妻') || lower.includes('蜜月')) {
    return 'couple';
  }
  if (lower.includes('朋友') || lower.includes('闺蜜') || lower.includes('特种兵')) {
    return 'friends';
  }

  return undefined;
}

export function parsePlanRequest(request: PlanRequest): {
  destination: string;
  days: number;
  role: RoleType;
  budget: number | undefined;
  questions: ClarifyingQuestion[];
  isComplete: boolean;
} {
  const destination = extractDestination(request.description);
  const days = request.days ?? extractDays(request.description) ?? 3;
  const role = request.role ?? extractRole(request.description) ?? 'friends';
  const budget = request.budget ?? extractBudget(request.description);

  const questions = generateClarifyingQuestions(request.description);

  const isComplete = questions.filter(q => q.required).length === 0;

  return {
    destination,
    days,
    role,
    budget,
    questions,
    isComplete,
  };
}
