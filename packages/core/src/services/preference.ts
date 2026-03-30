export interface UserPreference {
  user_id: string;
  role?: string;
  wake_up_time?: string;
  sleep_time?: string;
  budget_level?: 'economy' | 'standard' | 'luxury';
  transport_preference?: 'plane' | 'train' | 'car' | 'any';
  activity_intensity?: 'relaxed' | 'moderate' | 'intense';
  dietary_restrictions?: string[];
  accessibility_needs?: string[];
  preferred_attractions?: string[];
  disliked_attractions?: string[];
  created_at: string;
  updated_at: string;
}

export interface PreferenceUpdate {
  field: keyof Omit<UserPreference, 'user_id' | 'created_at' | 'updated_at'>;
  value: string | string[] | number | boolean;
  source: 'explicit' | 'implicit';
  trip_id?: string;
}

export interface PreferenceInsight {
  field: string;
  current_value: string;
  suggested_value: string;
  confidence: number;
  reason: string;
}

export function inferPreferenceFromAction(
  action: string,
  currentPreferences: Partial<UserPreference>
): Partial<PreferenceUpdate> | null {
  const actionLower = action.toLowerCase();

  if (actionLower.includes('早起') || actionLower.includes('晚起')) {
    const wakeTime = actionLower.includes('早起') ? '07:00' : '09:00';
    return {
      field: 'wake_up_time',
      value: wakeTime,
      source: 'implicit',
    };
  }

  if (actionLower.includes('省钱') || actionLower.includes('预算')) {
    return {
      field: 'budget_level',
      value: actionLower.includes('省钱') ? 'economy' : 'standard',
      source: 'explicit',
    };
  }

  if (actionLower.includes('休闲') || actionLower.includes('特种兵')) {
    return {
      field: 'activity_intensity',
      value: actionLower.includes('休闲') ? 'relaxed' : 'intense',
      source: 'implicit',
    };
  }

  if (actionLower.includes('高铁') || actionLower.includes('飞机') || actionLower.includes('自驾')) {
    const transport = actionLower.includes('高铁') ? 'train' :
                      actionLower.includes('飞机') ? 'plane' : 'car';
    return {
      field: 'transport_preference',
      value: transport,
      source: 'explicit',
    };
  }

  return null;
}

export function mergePreferences(
  existing: Partial<UserPreference>,
  updates: PreferenceUpdate[]
): Partial<UserPreference> {
  const merged = { ...existing };

  for (const update of updates) {
    if (update.field in merged) {
      const currentVal = merged[update.field];
      if (update.source === 'explicit' || !currentVal) {
        (merged as Record<string, unknown>)[update.field] = update.value;
      }
    }
  }

  return merged;
}

export function calculatePreferenceMatch(
  preferences: Partial<UserPreference>,
  roleConfig: Record<string, unknown>
): number {
  let score = 0;
  let factors = 0;

  if (preferences.activity_intensity && roleConfig.activityIntensity) {
    if (preferences.activity_intensity === roleConfig.activityIntensity) {
      score += 1;
    }
    factors += 1;
  }

  if (preferences.budget_level && roleConfig.budgetLevel) {
    if (preferences.budget_level === roleConfig.budgetLevel) {
      score += 1;
    }
    factors += 1;
  }

  return factors > 0 ? score / factors : 0.5;
}
