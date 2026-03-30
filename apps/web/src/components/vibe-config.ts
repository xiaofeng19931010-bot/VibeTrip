export interface VibeConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  };
  music: {
    playlistUrl: string;
    genre: string;
    mood: string;
  };
}

const VIBE_PRESETS: Record<string, VibeConfig> = {
  parents: {
    theme: {
      primaryColor: '#4A90A4',
      secondaryColor: '#7EB8C9',
      backgroundColor: '#F8F9FA',
      textColor: '#2C3E50',
      accentColor: '#E8B86D',
      fontSize: 'xlarge',
    },
    music: {
      playlistUrl: 'https://music.example.com/relaxing',
      genre: '轻音乐',
      mood: '舒缓放松',
    },
  },
  family: {
    theme: {
      primaryColor: '#FF9F43',
      secondaryColor: '#FFEAA7',
      backgroundColor: '#FFF9F0',
      textColor: '#2D3436',
      accentColor: '#FF6B6B',
      fontSize: 'large',
    },
    music: {
      playlistUrl: 'https://music.example.com/family',
      genre: '欢快',
      mood: '活泼温馨',
    },
  },
  couple: {
    theme: {
      primaryColor: '#E84393',
      secondaryColor: '#FD79A8',
      backgroundColor: '#FFF5F8',
      textColor: '#2D3436',
      accentColor: '#D63031',
      fontSize: 'medium',
    },
    music: {
      playlistUrl: 'https://music.example.com/romantic',
      genre: '浪漫',
      mood: '甜蜜温馨',
    },
  },
  friends: {
    theme: {
      primaryColor: '#6C5CE7',
      secondaryColor: '#A29BFE',
      backgroundColor: '#F5F5FF',
      textColor: '#2D3436',
      accentColor: '#00B894',
      fontSize: 'medium',
    },
    music: {
      playlistUrl: 'https://music.example.com/party',
      genre: '流行',
      mood: '活力四射',
    },
  },
  soldier: {
    theme: {
      primaryColor: '#2D3436',
      secondaryColor: '#636E72',
      backgroundColor: '#F5F5F5',
      textColor: '#2D3436',
      accentColor: '#0984E3',
      fontSize: 'small',
    },
    music: {
      playlistUrl: 'https://music.example.com/energetic',
      genre: '电子',
      mood: '动感有力',
    },
  },
};

export function getVibeConfig(role: string): VibeConfig {
  return VIBE_PRESETS[role.toLowerCase()] || VIBE_PRESETS.friends;
}

export function getVibeColor(role: string, colorKey: keyof VibeConfig['theme']): string {
  const config = getVibeConfig(role);
  return config.theme[colorKey] as string;
}

export function getVibeMusic(role: string): VibeConfig['music'] {
  return getVibeConfig(role).music;
}

export function getFontSizeClass(role: string): string {
  const size = getVibeConfig(role).theme.fontSize;
  const sizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  };
  return sizeMap[size];
}

export const DESTINATION_VIBES: Record<string, { theme?: Partial<VibeConfig['theme']>; music?: Partial<VibeConfig['music']> }> = {
  '成都': { theme: { primaryColor: '#E84393' } },
  '三亚': { theme: { primaryColor: '#00B894', backgroundColor: '#F0FFF4' } },
  '北京': { theme: { primaryColor: '#D63031' } },
  '上海': { theme: { primaryColor: '#6C5CE7' } },
  '丽江': { theme: { primaryColor: '#FDCB6E', backgroundColor: '#FFFBF0' } },
  '大理': { theme: { primaryColor: '#74B9FF', backgroundColor: '#F0F8FF' } },
};
