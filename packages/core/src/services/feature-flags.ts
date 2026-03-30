export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface GrayscaleGroup {
  id: string;
  name: string;
  description?: string;
  apiKeyPrefixes: string[];
  enabledFeatures: string[];
}

const featureFlags = new Map<string, FeatureFlag>();
const grayscaleGroups = new Map<string, GrayscaleGroup>();

export function setFeatureFlag(flag: FeatureFlag): void {
  featureFlags.set(flag.name, flag);
}

export function getFeatureFlag(name: string): FeatureFlag | undefined {
  return featureFlags.get(name);
}

export function isFeatureEnabled(name: string, userId?: string): boolean {
  const flag = featureFlags.get(name);

  if (!flag) {
    return false;
  }

  if (!flag.enabled) {
    return false;
  }

  if (flag.rolloutPercentage >= 100) {
    return true;
  }

  if (flag.rolloutPercentage <= 0) {
    return false;
  }

  if (!userId) {
    return Math.random() * 100 < flag.rolloutPercentage;
  }

  const hash = hashUserId(userId, name);
  return hash < flag.rolloutPercentage;
}

function hashUserId(userId: string, featureName: string): number {
  const str = `${userId}:${featureName}`;
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash % 100);
}

export function registerGrayscaleGroup(group: GrayscaleGroup): void {
  grayscaleGroups.set(group.id, group);
}

export function getGrayscaleGroup(apiKey: string): GrayscaleGroup | undefined {
  for (const group of grayscaleGroups.values()) {
    if (group.apiKeyPrefixes.some(prefix => apiKey.startsWith(prefix))) {
      return group;
    }
  }
  return undefined;
}

export function isFeatureEnabledForApiKey(
  featureName: string,
  apiKey: string
): boolean {
  const flag = featureFlags.get(featureName);

  if (!flag) {
    return false;
  }

  if (!flag.enabled) {
    return false;
  }

  const group = getGrayscaleGroup(apiKey);

  if (group) {
    return group.enabledFeatures.includes(featureName);
  }

  if (flag.rolloutPercentage >= 100) {
    return true;
  }

  if (flag.rolloutPercentage <= 0) {
    return false;
  }

  const hash = hashUserId(apiKey, featureName);
  return hash < flag.rolloutPercentage;
}

export function enableFeatureForGroup(
  groupId: string,
  featureName: string
): void {
  const group = grayscaleGroups.get(groupId);

  if (!group) {
    return;
  }

  if (!group.enabledFeatures.includes(featureName)) {
    group.enabledFeatures.push(featureName);
  }
}

export function disableFeatureForGroup(
  groupId: string,
  featureName: string
): void {
  const group = grayscaleGroups.get(groupId);

  if (!group) {
    return;
  }

  group.enabledFeatures = group.enabledFeatures.filter(f => f !== featureName);
}

export function initializeDefaultFeatureFlags(): void {
  setFeatureFlag({
    name: 'memory_generation',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Enable memory generation feature',
  });

  setFeatureFlag({
    name: 'share_generation',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Enable share generation feature',
  });

  setFeatureFlag({
    name: 'llm_planning',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Enable LLM-based trip planning',
  });

  setFeatureFlag({
    name: 'voice_transcription',
    enabled: false,
    rolloutPercentage: 0,
    description: 'Enable voice transcription (requires external service)',
  });

  registerGrayscaleGroup({
    id: 'beta',
    name: 'Beta Users',
    description: 'Early adopters who get access to new features',
    apiKeyPrefixes: ['vbt_beta_', 'vbt_test_'],
    enabledFeatures: ['memory_generation', 'share_generation', 'llm_planning'],
  });

  registerGrayscaleGroup({
    id: 'internal',
    name: 'Internal',
    description: 'Internal testing group',
    apiKeyPrefixes: ['vbt_int_'],
    enabledFeatures: ['*'],
  });
}

export const featureFlagsService = {
  setFeatureFlag,
  getFeatureFlag,
  isFeatureEnabled,
  isFeatureEnabledForApiKey,
  enableFeatureForGroup,
  disableFeatureForGroup,
  registerGrayscaleGroup,
  getGrayscaleGroup,
  initializeDefaultFeatureFlags,
};
