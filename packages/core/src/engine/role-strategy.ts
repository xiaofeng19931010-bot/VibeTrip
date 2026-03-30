import type { RoleType } from '../schemas/index.js';

export interface PacingStrategy {
  activitiesPerDay: number;
  includeRestDays: boolean;
  restDayFrequency?: number;
}

export interface WalkingStrategy {
  maxWalkingMinutes: number;
  maxStepsPerDay: number;
  preferFlatTerrain: boolean;
  requireWheelchairAccess: boolean;
}

export interface ScheduleStrategy {
  wakeUpTime: string;
  breakfastTime: string;
  lunchTime: string;
  lunchDurationMinutes: number;
  dinnerTime: string;
  sleepTime: string;
  includeNap: boolean;
  napDurationMinutes?: number;
}

export interface BudgetStrategy {
  dailyBudget: number;
  accommodationRatio: number;
  foodRatio: number;
  transportRatio: number;
  attractionRatio: number;
  souvenirRatio: number;
}

export interface AccessibilityStrategy {
  requireWheelchairAccess: boolean;
  requireElevatorAccess: boolean;
  requireGroundFloorAccess: boolean;
  maxStairs?: number;
}

export interface FamilyFacilityStrategy {
  requireBabyChair: boolean;
  requireBabyRoom: boolean;
  requireKidsPlayArea: boolean;
  requireStrollerFriendly: boolean;
}

export interface RomanceStrategy {
  preferredVenueTypes: string[];
  includeSunsetSpot: boolean;
  includeCandlelightDinner: boolean;
  preferredPhotoSpots: string[];
}

export interface PhotoStrategy {
  preferredPhotoSpots: string[];
  requireGoodLighting: boolean;
  avoidCrowds: boolean;
}

export interface RoleProfile {
  name: RoleType;
  displayName: string;
  description: string;
  pacing: PacingStrategy;
  walking: WalkingStrategy;
  schedule: ScheduleStrategy;
  budget: BudgetStrategy;
  accessibility: AccessibilityStrategy;
  familyFacility: FamilyFacilityStrategy;
  romance: RomanceStrategy;
  photo: PhotoStrategy;
}

export interface UserPreference {
  key: string;
  value: unknown;
  priority: 'high' | 'medium' | 'low';
}

export interface StrategyContext {
  role: RoleType;
  userPreferences?: UserPreference[];
  customInstructions?: string[];
}

const PARENTS_PROFILE: RoleProfile = {
  name: 'parents',
  displayName: '带父母出行',
  description: '适合带父母一起旅行，节奏舒缓，注重休息和无障碍设施',
  pacing: {
    activitiesPerDay: 2,
    includeRestDays: true,
    restDayFrequency: 3,
  },
  walking: {
    maxWalkingMinutes: 60,
    maxStepsPerDay: 5000,
    preferFlatTerrain: true,
    requireWheelchairAccess: false,
  },
  schedule: {
    wakeUpTime: '08:00',
    breakfastTime: '08:30',
    lunchTime: '12:00',
    lunchDurationMinutes: 90,
    dinnerTime: '18:00',
    sleepTime: '22:00',
    includeNap: true,
    napDurationMinutes: 60,
  },
  budget: {
    dailyBudget: 1500,
    accommodationRatio: 0.4,
    foodRatio: 0.25,
    transportRatio: 0.15,
    attractionRatio: 0.1,
    souvenirRatio: 0.1,
  },
  accessibility: {
    requireWheelchairAccess: false,
    requireElevatorAccess: true,
    requireGroundFloorAccess: true,
    maxStairs: 3,
  },
  familyFacility: {
    requireBabyChair: false,
    requireBabyRoom: false,
    requireKidsPlayArea: false,
    requireStrollerFriendly: false,
  },
  romance: {
    preferredVenueTypes: [],
    includeSunsetSpot: false,
    includeCandlelightDinner: false,
    preferredPhotoSpots: [],
  },
  photo: {
    preferredPhotoSpots: ['经典打卡点', '文化景观'],
    requireGoodLighting: true,
    avoidCrowds: false,
  },
};

const FAMILY_PROFILE: RoleProfile = {
  name: 'family',
  displayName: '亲子出行',
  description: '适合带孩子一起旅行，注重亲子设施和安全',
  pacing: {
    activitiesPerDay: 3,
    includeRestDays: false,
  },
  walking: {
    maxWalkingMinutes: 90,
    maxStepsPerDay: 8000,
    preferFlatTerrain: true,
    requireWheelchairAccess: false,
  },
  schedule: {
    wakeUpTime: '07:30',
    breakfastTime: '08:00',
    lunchTime: '12:00',
    lunchDurationMinutes: 60,
    dinnerTime: '18:30',
    sleepTime: '21:00',
    includeNap: true,
    napDurationMinutes: 30,
  },
  budget: {
    dailyBudget: 2000,
    accommodationRatio: 0.35,
    foodRatio: 0.25,
    transportRatio: 0.15,
    attractionRatio: 0.15,
    souvenirRatio: 0.1,
  },
  accessibility: {
    requireWheelchairAccess: false,
    requireElevatorAccess: true,
    requireGroundFloorAccess: false,
    maxStairs: 5,
  },
  familyFacility: {
    requireBabyChair: true,
    requireBabyRoom: true,
    requireKidsPlayArea: true,
    requireStrollerFriendly: true,
  },
  romance: {
    preferredVenueTypes: [],
    includeSunsetSpot: false,
    includeCandlelightDinner: false,
    preferredPhotoSpots: [],
  },
  photo: {
    preferredPhotoSpots: ['主题乐园', '动物园', '儿童游乐场'],
    requireGoodLighting: false,
    avoidCrowds: false,
  },
};

const COUPLE_PROFILE: RoleProfile = {
  name: 'couple',
  displayName: '情侣出行',
  description: '适合情侣旅行，浪漫氛围优先',
  pacing: {
    activitiesPerDay: 2,
    includeRestDays: false,
  },
  walking: {
    maxWalkingMinutes: 120,
    maxStepsPerDay: 15000,
    preferFlatTerrain: false,
    requireWheelchairAccess: false,
  },
  schedule: {
    wakeUpTime: '09:00',
    breakfastTime: '09:30',
    lunchTime: '12:30',
    lunchDurationMinutes: 60,
    dinnerTime: '19:00',
    sleepTime: '23:00',
    includeNap: false,
  },
  budget: {
    dailyBudget: 3000,
    accommodationRatio: 0.4,
    foodRatio: 0.25,
    transportRatio: 0.1,
    attractionRatio: 0.15,
    souvenirRatio: 0.1,
  },
  accessibility: {
    requireWheelchairAccess: false,
    requireElevatorAccess: false,
    requireGroundFloorAccess: false,
  },
  familyFacility: {
    requireBabyChair: false,
    requireBabyRoom: false,
    requireKidsPlayArea: false,
    requireStrollerFriendly: false,
  },
  romance: {
    preferredVenueTypes: ['浪漫餐厅', '海景', '山顶', '花园'],
    includeSunsetSpot: true,
    includeCandlelightDinner: true,
    preferredPhotoSpots: ['浪漫打卡点', '夕阳观景地', '特色建筑'],
  },
  photo: {
    preferredPhotoSpots: ['浪漫打卡点', '夕阳观景地', '特色建筑', '自然风光'],
    requireGoodLighting: true,
    avoidCrowds: true,
  },
};

const FRIENDS_PROFILE: RoleProfile = {
  name: 'friends',
  displayName: '闺蜜/特种兵',
  description: '适合朋友结伴，节奏紧凑，打卡拍照优先',
  pacing: {
    activitiesPerDay: 5,
    includeRestDays: false,
  },
  walking: {
    maxWalkingMinutes: 180,
    maxStepsPerDay: 25000,
    preferFlatTerrain: false,
    requireWheelchairAccess: false,
  },
  schedule: {
    wakeUpTime: '07:00',
    breakfastTime: '07:30',
    lunchTime: '12:00',
    lunchDurationMinutes: 45,
    dinnerTime: '19:30',
    sleepTime: '23:30',
    includeNap: false,
  },
  budget: {
    dailyBudget: 1000,
    accommodationRatio: 0.25,
    foodRatio: 0.25,
    transportRatio: 0.2,
    attractionRatio: 0.2,
    souvenirRatio: 0.1,
  },
  accessibility: {
    requireWheelchairAccess: false,
    requireElevatorAccess: false,
    requireGroundFloorAccess: false,
  },
  familyFacility: {
    requireBabyChair: false,
    requireBabyRoom: false,
    requireKidsPlayArea: false,
    requireStrollerFriendly: false,
  },
  romance: {
    preferredVenueTypes: [],
    includeSunsetSpot: false,
    includeCandlelightDinner: false,
    preferredPhotoSpots: [],
  },
  photo: {
    preferredPhotoSpots: ['网红打卡点', '美食', '街景'],
    requireGoodLighting: false,
    avoidCrowds: false,
  },
};

const SOLDIER_PROFILE: RoleProfile = {
  name: 'soldier',
  displayName: '特种兵',
  description: '极限打卡，高效率，覆盖尽可能多的景点',
  pacing: {
    activitiesPerDay: 8,
    includeRestDays: false,
  },
  walking: {
    maxWalkingMinutes: 240,
    maxStepsPerDay: 40000,
    preferFlatTerrain: false,
    requireWheelchairAccess: false,
  },
  schedule: {
    wakeUpTime: '06:00',
    breakfastTime: '06:30',
    lunchTime: '11:30',
    lunchDurationMinutes: 30,
    dinnerTime: '20:00',
    sleepTime: '00:00',
    includeNap: false,
  },
  budget: {
    dailyBudget: 600,
    accommodationRatio: 0.2,
    foodRatio: 0.2,
    transportRatio: 0.3,
    attractionRatio: 0.2,
    souvenirRatio: 0.1,
  },
  accessibility: {
    requireWheelchairAccess: false,
    requireElevatorAccess: false,
    requireGroundFloorAccess: false,
  },
  familyFacility: {
    requireBabyChair: false,
    requireBabyRoom: false,
    requireKidsPlayArea: false,
    requireStrollerFriendly: false,
  },
  romance: {
    preferredVenueTypes: [],
    includeSunsetSpot: false,
    includeCandlelightDinner: false,
    preferredPhotoSpots: [],
  },
  photo: {
    preferredPhotoSpots: ['热门打卡点', '地标建筑'],
    requireGoodLighting: false,
    avoidCrowds: false,
  },
};

export const ROLE_PROFILES: Record<RoleType, RoleProfile> = {
  parents: PARENTS_PROFILE,
  family: FAMILY_PROFILE,
  couple: COUPLE_PROFILE,
  friends: FRIENDS_PROFILE,
  soldier: SOLDIER_PROFILE,
};

export function getRoleProfile(role: RoleType): RoleProfile {
  return ROLE_PROFILES[role];
}

export function mergeWithUserPreferences(
  profile: RoleProfile,
  userPreferences?: UserPreference[]
): RoleProfile {
  if (!userPreferences || userPreferences.length === 0) {
    return profile;
  }

  const merged = { ...profile };

  for (const pref of userPreferences) {
    if (pref.priority === 'high') {
      switch (pref.key) {
        case 'activitiesPerDay':
          merged.pacing = { ...merged.pacing, activitiesPerDay: pref.value as number };
          break;
        case 'maxWalkingMinutes':
          merged.walking = { ...merged.walking, maxWalkingMinutes: pref.value as number };
          break;
        case 'wakeUpTime':
          merged.schedule = { ...merged.schedule, wakeUpTime: pref.value as string };
          break;
        case 'includeNap':
          merged.schedule = { ...merged.schedule, includeNap: pref.value as boolean };
          break;
        case 'dailyBudget':
          merged.budget = { ...merged.budget, dailyBudget: pref.value as number };
          break;
      }
    }
  }

  return merged;
}

export function parseUserInstructions(
  instructions: string[]
): UserPreference[] {
  const preferences: UserPreference[] = [];

  for (const instruction of instructions) {
    const lower = instruction.toLowerCase();

    if (lower.includes('不要早起') || lower.includes('睡到自然醒')) {
      preferences.push({ key: 'wakeUpTime', value: '09:00', priority: 'high' });
    }
    if (lower.includes('多休息') || lower.includes('慢节奏')) {
      preferences.push({ key: 'activitiesPerDay', value: 2, priority: 'high' });
      preferences.push({ key: 'includeNap', value: true, priority: 'high' });
    }
    if (lower.includes('少走路') || lower.includes('不想走')) {
      preferences.push({ key: 'maxWalkingMinutes', value: 60, priority: 'high' });
    }
    if (lower.includes('多打卡') || lower.includes('特种兵')) {
      preferences.push({ key: 'activitiesPerDay', value: 8, priority: 'high' });
    }
    if (lower.includes('亲子') || lower.includes('带孩子')) {
      preferences.push({
        key: 'familyFacility',
        value: {
          requireBabyChair: true,
          requireBabyRoom: true,
          requireKidsPlayArea: true,
          requireStrollerFriendly: true,
        },
        priority: 'high',
      });
    }
    if (lower.includes('浪漫')) {
      preferences.push({
        key: 'romance',
        value: {
          includeSunsetSpot: true,
          includeCandlelightDinner: true,
        },
        priority: 'medium',
      });
    }
  }

  return preferences;
}

export function getStrategyForContext(context: StrategyContext): RoleProfile {
  let profile = getRoleProfile(context.role);

  const userPrefs = parseUserInstructions(context.customInstructions || []);
  const allPrefs = [...(context.userPreferences || []), ...userPrefs];

  profile = mergeWithUserPreferences(profile, allPrefs);

  return profile;
}
