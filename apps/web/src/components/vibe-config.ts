'use client';

export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type Pattern = 'dots' | 'lines' | 'waves' | 'grid' | 'none';

export interface VibeConfig {
  role: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    cardBg: string;
    gradientStart: string;
    gradientEnd: string;
    fontDisplay: string;
    fontBody: string;
    borderRadius: string;
    shadow: string;
    shadowHover: string;
    fontSize: FontSize;
    animationDuration: string;
  };
  stickers: string[];
  stamps: string[];
  decoration: {
    pattern: Pattern;
    patternColor: string;
    patternOpacity: number;
    badge: string;
  };
  typography: {
    displaySize: string;
    headingSize: string;
    bodySize: string;
    captionSize: string;
    lineHeight: string;
  };
  spacing: {
    cardPadding: string;
    sectionGap: string;
    itemGap: string;
  };
  effects: {
    glassmorphism: boolean;
    backdropBlur: string;
    borderStyle: string;
    borderWidth: string;
    highlightColor: string;
  };
}

const VIBE_PRESETS: Record<string, VibeConfig> = {
  parents: {
    role: 'parents',
    theme: {
      primaryColor: '#2D5A4A',
      secondaryColor: '#8FB339',
      backgroundColor: '#FDF8F3',
      textColor: '#3D3D3D',
      accentColor: '#E8A87C',
      cardBg: 'rgba(255, 255, 255, 0.85)',
      gradientStart: '#F5EDE6',
      gradientEnd: '#E8DFD5',
      fontDisplay: "'Noto Serif SC', serif",
      fontBody: "'Noto Sans SC', sans-serif",
      borderRadius: 'rounded-2xl',
      shadow: 'shadow-sm',
      shadowHover: 'hover:shadow-lg',
      fontSize: 'xl',
      animationDuration: 'duration-300',
    },
    stickers: ['🌿', '🍃', '☀️', '🧘', '🏞️', '🍵', '📿', '🦋'],
    stamps: ['✓ 已验证', '🌿 健康之旅', '⛰️ 山河静好'],
    decoration: {
      pattern: 'waves',
      patternColor: '#2D5A4A',
      patternOpacity: 0.06,
      badge: '品质之选',
    },
    typography: {
      displaySize: 'text-3xl',
      headingSize: 'text-xl',
      bodySize: 'text-base',
      captionSize: 'text-sm',
      lineHeight: 'leading-relaxed',
    },
    spacing: {
      cardPadding: 'p-6',
      sectionGap: 'gap-6',
      itemGap: 'gap-3',
    },
    effects: {
      glassmorphism: true,
      backdropBlur: 'backdrop-blur-md',
      borderStyle: 'border-solid',
      borderWidth: 'border',
      highlightColor: 'bg-emerald-100',
    },
  },
  family: {
    role: 'family',
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#FFB347',
      backgroundColor: '#FFF9F5',
      textColor: '#4A4A4A',
      accentColor: '#FF4757',
      cardBg: 'rgba(255, 255, 255, 0.9)',
      gradientStart: '#FFF3E6',
      gradientEnd: '#FFE4D1',
      fontDisplay: "'ZCOOL KuaiLe', cursive",
      fontBody: "'Nunito', sans-serif",
      borderRadius: 'rounded-3xl',
      shadow: 'shadow-md',
      shadowHover: 'hover:shadow-xl',
      fontSize: 'lg',
      animationDuration: 'duration-200',
    },
    stickers: ['🎈', '🎪', '🌈', '🦋', '🍦', '🎠', '🧸', '⭐'],
    stamps: ['🎉 精选', '🌈 亲子首选', '✨ 满分推荐'],
    decoration: {
      pattern: 'dots',
      patternColor: '#FF6B35',
      patternOpacity: 0.08,
      badge: '家庭欢乐',
    },
    typography: {
      displaySize: 'text-2xl',
      headingSize: 'text-lg',
      bodySize: 'text-base',
      captionSize: 'text-xs',
      lineHeight: 'leading-relaxed',
    },
    spacing: {
      cardPadding: 'p-5',
      sectionGap: 'gap-5',
      itemGap: 'gap-2',
    },
    effects: {
      glassmorphism: false,
      backdropBlur: '',
      borderStyle: 'border-dashed',
      borderWidth: 'border-2',
      highlightColor: 'bg-amber-100',
    },
  },
  couple: {
    role: 'couple',
    theme: {
      primaryColor: '#E84393',
      secondaryColor: '#FD79A8',
      backgroundColor: '#FFF5F8',
      textColor: '#4A4A4A',
      accentColor: '#D63031',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      gradientStart: '#FFF0F5',
      gradientEnd: '#FFE4EC',
      fontDisplay: "'Ma Shan Zheng', cursive",
      fontBody: "'Noto Serif SC', serif",
      borderRadius: 'rounded-3xl',
      shadow: 'shadow-md',
      shadowHover: 'hover:shadow-xl',
      fontSize: 'base',
      animationDuration: 'duration-400',
    },
    stickers: ['💕', '🌹', '✨', '🦢', '💌', '🌙', '🎻', '💫'],
    stamps: ['❤️ 浪漫之选', '💕 甜蜜时刻', '🌹 情侣圣地'],
    decoration: {
      pattern: 'waves',
      patternColor: '#E84393',
      patternOpacity: 0.05,
      badge: '情侣专属',
    },
    typography: {
      displaySize: 'text-2xl',
      headingSize: 'text-lg',
      bodySize: 'text-sm',
      captionSize: 'text-xs',
      lineHeight: 'leading-relaxed',
    },
    spacing: {
      cardPadding: 'p-6',
      sectionGap: 'gap-6',
      itemGap: 'gap-3',
    },
    effects: {
      glassmorphism: true,
      backdropBlur: 'backdrop-blur-lg',
      borderStyle: 'border-solid',
      borderWidth: 'border',
      highlightColor: 'bg-pink-100',
    },
  },
  friends: {
    role: 'friends',
    theme: {
      primaryColor: '#6C5CE7',
      secondaryColor: '#A29BFE',
      backgroundColor: '#F8F7FF',
      textColor: '#4A4A4A',
      accentColor: '#00B894',
      cardBg: 'rgba(255, 255, 255, 0.88)',
      gradientStart: '#F0EDFF',
      gradientEnd: '#E5DFFF',
      fontDisplay: "'Bangers', cursive",
      fontBody: "'Quicksand', sans-serif",
      borderRadius: 'rounded-xl',
      shadow: 'shadow-sm',
      shadowHover: 'hover:shadow-lg',
      fontSize: 'base',
      animationDuration: 'duration-150',
    },
    stickers: ['🔥', '⚡', '💫', '🎵', '🕶️', '🌊', '🎸', '💥'],
    stamps: ['✨ 网红打卡', '🔥 必去榜单', '⚡ 活力之旅'],
    decoration: {
      pattern: 'lines',
      patternColor: '#6C5CE7',
      patternOpacity: 0.1,
      badge: '闺蜜精选',
    },
    typography: {
      displaySize: 'text-2xl',
      headingSize: 'text-base',
      bodySize: 'text-sm',
      captionSize: 'text-xs',
      lineHeight: 'leading-normal',
    },
    spacing: {
      cardPadding: 'p-4',
      sectionGap: 'gap-4',
      itemGap: 'gap-2',
    },
    effects: {
      glassmorphism: true,
      backdropBlur: 'backdrop-blur-md',
      borderStyle: 'border-dotted',
      borderWidth: 'border-2',
      highlightColor: 'bg-violet-100',
    },
  },
  soldier: {
    role: 'soldier',
    theme: {
      primaryColor: '#2D3436',
      secondaryColor: '#636E72',
      backgroundColor: '#F5F5F5',
      textColor: '#2D3436',
      accentColor: '#0984E3',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      gradientStart: '#F8F9FA',
      gradientEnd: '#E9ECEF',
      fontDisplay: "'JetBrains Mono', monospace",
      fontBody: "'JetBrains Mono', monospace",
      borderRadius: 'rounded-lg',
      shadow: 'shadow-xs',
      shadowHover: 'hover:shadow-md',
      fontSize: 'sm',
      animationDuration: 'duration-100',
    },
    stickers: ['📍', '⚡', '🎯', '💪', '🔥', '📊', '🎖️', '🔝'],
    stamps: ['📍 必打卡', '🎯 精准推荐', '⚡ 高效行程'],
    decoration: {
      pattern: 'grid',
      patternColor: '#636E72',
      patternOpacity: 0.05,
      badge: '效率至上',
    },
    typography: {
      displaySize: 'text-xl',
      headingSize: 'text-sm',
      bodySize: 'text-xs',
      captionSize: 'text-xs',
      lineHeight: 'leading-tight',
    },
    spacing: {
      cardPadding: 'p-3',
      sectionGap: 'gap-3',
      itemGap: 'gap-1',
    },
    effects: {
      glassmorphism: false,
      backdropBlur: '',
      borderStyle: 'border-solid',
      borderWidth: 'border',
      highlightColor: 'bg-blue-100',
    },
  },
};

export function getVibeConfig(role: string): VibeConfig {
  return VIBE_PRESETS[role.toLowerCase()] || VIBE_PRESETS.friends;
}

export function getVibeColors(role: string) {
  return getVibeConfig(role).theme;
}

export function getFontSizeClass(role: string): string {
  const size = getVibeConfig(role).theme.fontSize;
  const sizeMap: Record<FontSize, string> = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  return sizeMap[size];
}

export function getRandomSticker(role: string): string {
  const stickers = getVibeConfig(role).stickers;
  return stickers[Math.floor(Math.random() * stickers.length)];
}

export function getRandomStamp(role: string): string {
  const stamps = getVibeConfig(role).stamps;
  return stamps[Math.floor(Math.random() * stamps.length)];
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    parents: '👴👵 带父母出行',
    family: '👶🍼 亲子遛娃',
    couple: '💑🌹 情侣度假',
    friends: '🎒🕶️ 闺蜜/特种兵',
  };
  return labels[role] || role;
}

export function getPatternClass(role: string): string {
  const pattern = getVibeConfig(role).decoration.pattern;
  const patternMap: Record<Pattern, string> = {
    dots: 'vibe-pattern-dots',
    lines: 'vibe-pattern-lines',
    waves: 'vibe-pattern-waves',
    grid: 'vibe-pattern-grid',
    none: '',
  };
  return patternMap[pattern] || '';
}

export function generateVibeClasses(role: string): {
  card: string;
  button: string;
  badge: string;
  input: string;
  textDisplay: string;
  textHeading: string;
  textBody: string;
} {
  const vibe = getVibeConfig(role);
  const t = vibe.theme;
  const e = vibe.effects;

  const glassEffect = e.glassmorphism ? `${e.backdropBlur} bg-white/80 border border-white/20` : 'bg-white border border-slate-100';

  return {
    card: `${glassEffect} ${t.borderRadius} ${t.shadow} ${t.shadowHover} ${t.animationDuration} transition-all`,
    button: `font-semibold ${t.borderRadius} ${t.animationDuration} transition-all cursor-pointer`,
    badge: `inline-flex items-center gap-1 px-3 py-1 ${t.borderRadius} text-xs font-medium text-white`,
    input: `flex-1 px-4 py-3 border-2 border-slate-200 ${t.borderRadius} text-base outline-none ${t.animationDuration} transition-colors`,
    textDisplay: `font-bold tracking-wide`,
    textHeading: `font-semibold`,
    textBody: `leading-relaxed`,
  };
}
