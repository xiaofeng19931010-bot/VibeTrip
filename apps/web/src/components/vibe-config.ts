'use client';

export interface VibeConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    cardBg: string;
    gradient: string;
    gradientStart: string;
    gradientEnd: string;
    fontDisplay: string;
    fontBody: string;
    borderRadius: string;
    shadow: string;
    shadowHover: string;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    animationDuration: string;
    blurIntensity: string;
  };
  music: {
    playlistUrl: string;
    genre: string;
    mood: string;
  };
  stickers: string[];
  stamps: string[];
  decoration: {
    pattern: 'dots' | 'lines' | 'waves' | 'grid' | 'none';
    patternColor: string;
    patternOpacity: number;
    stamp: string;
    badge: string;
  };
  typography: {
    displaySize: string;
    headingSize: string;
    bodySize: string;
    captionSize: string;
    lineHeight: string;
    letterSpacing: string;
  };
  spacing: {
    cardPadding: string;
    sectionGap: string;
    itemGap: string;
  };
  effects: {
    glassmorphism: boolean;
    backdropBlur: string;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    borderWidth: string;
    highlightColor: string;
  };
}

const VIBE_PRESETS: Record<string, VibeConfig> = {
  parents: {
    theme: {
      primaryColor: '#2D5A4A',
      secondaryColor: '#8FB339',
      backgroundColor: '#FDF8F3',
      textColor: '#3D3D3D',
      accentColor: '#E8A87C',
      cardBg: 'rgba(255, 255, 255, 0.85)',
      gradient: 'linear-gradient(145deg, #F5EDE6 0%, #E8DFD5 50%, #DDD5C8 100%)',
      gradientStart: '#F5EDE6',
      gradientEnd: '#DDD5C8',
      fontDisplay: "'Noto Serif SC', serif",
      fontBody: "'Noto Sans SC', sans-serif",
      borderRadius: '20px',
      shadow: '0 8px 32px rgba(45, 90, 74, 0.08)',
      shadowHover: '0 16px 48px rgba(45, 90, 74, 0.15)',
      fontSize: 'xlarge',
      animationDuration: '0.4s',
      blurIntensity: '12px',
    },
    music: {
      playlistUrl: 'https://music.example.com/relaxing',
      genre: '轻音乐',
      mood: '舒缓放松',
    },
    stickers: ['🌿', '🍃', '☀️', '🧘', '🏞️', '🍵', '📿', '🦋'],
    stamps: ['✓ 已验证', '🌿 健康之旅', '⛰️ 山河静好'],
    decoration: {
      pattern: 'waves',
      patternColor: '#2D5A4A',
      patternOpacity: 0.06,
      stamp: '🌿 养生之旅',
      badge: '品质之选',
    },
    typography: {
      displaySize: '2.5rem',
      headingSize: '1.5rem',
      bodySize: '1.125rem',
      captionSize: '0.875rem',
      lineHeight: '1.8',
      letterSpacing: '0.02em',
    },
    spacing: {
      cardPadding: '28px',
      sectionGap: '32px',
      itemGap: '16px',
    },
    effects: {
      glassmorphism: true,
      backdropBlur: '20px',
      borderStyle: 'solid',
      borderWidth: '1px',
      highlightColor: 'rgba(143, 179, 57, 0.3)',
    },
  },
  family: {
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#FFB347',
      backgroundColor: '#FFF9F5',
      textColor: '#4A4A4A',
      accentColor: '#FF4757',
      cardBg: 'rgba(255, 255, 255, 0.9)',
      gradient: 'linear-gradient(145deg, #FFF3E6 0%, #FFE4D1 50%, #FFDCC4 100%)',
      gradientStart: '#FFF3E6',
      gradientEnd: '#FFDCC4',
      fontDisplay: "'ZCOOL KuaiLe', cursive",
      fontBody: "'Nunito', sans-serif",
      borderRadius: '24px',
      shadow: '0 10px 40px rgba(255, 107, 53, 0.15)',
      shadowHover: '0 20px 60px rgba(255, 107, 53, 0.25)',
      fontSize: 'large',
      animationDuration: '0.3s',
      blurIntensity: '8px',
    },
    music: {
      playlistUrl: 'https://music.example.com/family',
      genre: '欢快',
      mood: '活泼温馨',
    },
    stickers: ['🎈', '🎪', '🌈', '🦋', '🍦', '🎠', '🧸', '⭐'],
    stamps: ['🎉 精选', '🌈 亲子首选', '✨ 满分推荐'],
    decoration: {
      pattern: 'dots',
      patternColor: '#FF6B35',
      patternOpacity: 0.08,
      stamp: '🎉 亲子天堂',
      badge: '家庭欢乐',
    },
    typography: {
      displaySize: '2.2rem',
      headingSize: '1.375rem',
      bodySize: '1rem',
      captionSize: '0.8rem',
      lineHeight: '1.6',
      letterSpacing: '0.01em',
    },
    spacing: {
      cardPadding: '24px',
      sectionGap: '28px',
      itemGap: '14px',
    },
    effects: {
      glassmorphism: false,
      backdropBlur: '0px',
      borderStyle: 'dashed',
      borderWidth: '2px',
      highlightColor: 'rgba(255, 179, 71, 0.4)',
    },
  },
  couple: {
    theme: {
      primaryColor: '#E84393',
      secondaryColor: '#FD79A8',
      backgroundColor: '#FFF5F8',
      textColor: '#4A4A4A',
      accentColor: '#D63031',
      cardBg: 'rgba(255, 255, 255, 0.92)',
      gradient: 'linear-gradient(145deg, #FFF0F5 0%, #FFE4EC 50%, #FFD5E2 100%)',
      gradientStart: '#FFF0F5',
      gradientEnd: '#FFD5E2',
      fontDisplay: "'Ma Shan Zheng', cursive",
      fontBody: "'Noto Serif SC', serif",
      borderRadius: '28px',
      shadow: '0 12px 48px rgba(232, 67, 147, 0.18)',
      shadowHover: '0 24px 72px rgba(232, 67, 147, 0.28)',
      fontSize: 'medium',
      animationDuration: '0.5s',
      blurIntensity: '16px',
    },
    music: {
      playlistUrl: 'https://music.example.com/romantic',
      genre: '浪漫',
      mood: '甜蜜温馨',
    },
    stickers: ['💕', '🌹', '✨', '🦢', '💌', '🌙', '🎻', '💫'],
    stamps: ['❤️ 浪漫之选', '💕 甜蜜时刻', '🌹 情侣圣地'],
    decoration: {
      pattern: 'waves',
      patternColor: '#E84393',
      patternOpacity: 0.05,
      stamp: '❤️ 浪漫满分',
      badge: '情侣专属',
    },
    typography: {
      displaySize: '2rem',
      headingSize: '1.25rem',
      bodySize: '0.95rem',
      captionSize: '0.75rem',
      lineHeight: '1.75',
      letterSpacing: '0.03em',
    },
    spacing: {
      cardPadding: '32px',
      sectionGap: '36px',
      itemGap: '18px',
    },
    effects: {
      glassmorphism: true,
      backdropBlur: '24px',
      borderStyle: 'solid',
      borderWidth: '1px',
      highlightColor: 'rgba(253, 121, 168, 0.35)',
    },
  },
  friends: {
    theme: {
      primaryColor: '#6C5CE7',
      secondaryColor: '#A29BFE',
      backgroundColor: '#F8F7FF',
      textColor: '#4A4A4A',
      accentColor: '#00B894',
      cardBg: 'rgba(255, 255, 255, 0.88)',
      gradient: 'linear-gradient(145deg, #F0EDFF 0%, #E5DFFF 50%, #D8D0FF 100%)',
      gradientStart: '#F0EDFF',
      gradientEnd: '#D8D0FF',
      fontDisplay: "'Bangers', cursive",
      fontBody: "'Quicksand', sans-serif",
      borderRadius: '16px',
      shadow: '0 6px 28px rgba(108, 92, 231, 0.12)',
      shadowHover: '0 14px 56px rgba(108, 92, 231, 0.22)',
      fontSize: 'medium',
      animationDuration: '0.25s',
      blurIntensity: '10px',
    },
    music: {
      playlistUrl: 'https://music.example.com/party',
      genre: '流行',
      mood: '活力四射',
    },
    stickers: ['🔥', '⚡', '💫', '🎵', '🕶️', '🌊', '🎸', '💥'],
    stamps: ['✨ 网红打卡', '🔥 必去榜单', '⚡ 活力之旅'],
    decoration: {
      pattern: 'lines',
      patternColor: '#6C5CE7',
      patternOpacity: 0.1,
      stamp: '⚡ 炸裂推荐',
      badge: '闺蜜精选',
    },
    typography: {
      displaySize: '2.1rem',
      headingSize: '1.3rem',
      bodySize: '0.95rem',
      captionSize: '0.7rem',
      lineHeight: '1.5',
      letterSpacing: '0.05em',
    },
    spacing: {
      cardPadding: '20px',
      sectionGap: '24px',
      itemGap: '12px',
    },
    effects: {
      glassmorphism: true,
      backdropBlur: '16px',
      borderStyle: 'dotted',
      borderWidth: '2px',
      highlightColor: 'rgba(0, 184, 148, 0.3)',
    },
  },
  soldier: {
    theme: {
      primaryColor: '#2D3436',
      secondaryColor: '#636E72',
      backgroundColor: '#F5F5F5',
      textColor: '#2D3436',
      accentColor: '#0984E3',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      gradient: 'linear-gradient(145deg, #F8F9FA 0%, #E9ECEF 50%, #DEE2E6 100%)',
      gradientStart: '#F8F9FA',
      gradientEnd: '#DEE2E6',
      fontDisplay: "'JetBrains Mono', monospace",
      fontBody: "'JetBrains Mono', monospace",
      borderRadius: '8px',
      shadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
      shadowHover: '0 6px 24px rgba(0, 0, 0, 0.12)',
      fontSize: 'small',
      animationDuration: '0.2s',
      blurIntensity: '4px',
    },
    music: {
      playlistUrl: 'https://music.example.com/energetic',
      genre: '电子',
      mood: '动感有力',
    },
    stickers: ['📍', '⚡', '🎯', '💪', '🔥', '📊', '🎖️', '🔝'],
    stamps: ['📍 必打卡', '🎯 精准推荐', '⚡ 高效行程'],
    decoration: {
      pattern: 'grid',
      patternColor: '#636E72',
      patternOpacity: 0.05,
      stamp: '📍 打卡地标',
      badge: '效率至上',
    },
    typography: {
      displaySize: '1.75rem',
      headingSize: '1.1rem',
      bodySize: '0.8rem',
      captionSize: '0.65rem',
      lineHeight: '1.4',
      letterSpacing: '0.08em',
    },
    spacing: {
      cardPadding: '16px',
      sectionGap: '20px',
      itemGap: '10px',
    },
    effects: {
      glassmorphism: false,
      backdropBlur: '0px',
      borderStyle: 'solid',
      borderWidth: '1px',
      highlightColor: 'rgba(9, 132, 227, 0.25)',
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
  const sizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
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

export function generateCSSVariables(role: string): Record<string, string> {
  const vibe = getVibeConfig(role);
  const t = vibe.theme;
  const d = vibe.decoration;
  const typ = vibe.typography;
  const sp = vibe.spacing;
  const eff = vibe.effects;

  return {
    '--vibe-primary': t.primaryColor,
    '--vibe-secondary': t.secondaryColor,
    '--vibe-bg': t.backgroundColor,
    '--vibe-text': t.textColor,
    '--vibe-accent': t.accentColor,
    '--vibe-card-bg': t.cardBg,
    '--vibe-gradient': t.gradient,
    '--vibe-gradient-start': t.gradientStart,
    '--vibe-gradient-end': t.gradientEnd,
    '--vibe-font-display': t.fontDisplay,
    '--vibe-font-body': t.fontBody,
    '--vibe-radius': t.borderRadius,
    '--vibe-shadow': t.shadow,
    '--vibe-shadow-hover': t.shadowHover,
    '--vibe-animation': t.animationDuration,
    '--vibe-blur': t.blurIntensity,
    '--vibe-pattern': d.pattern,
    '--vibe-pattern-color': d.patternColor,
    '--vibe-pattern-opacity': String(d.patternOpacity),
    '--vibe-stamp': d.stamp,
    '--vibe-badge': d.badge,
    '--vibe-display-size': typ.displaySize,
    '--vibe-heading-size': typ.headingSize,
    '--vibe-body-size': typ.bodySize,
    '--vibe-caption-size': typ.captionSize,
    '--vibe-line-height': typ.lineHeight,
    '--vibe-letter-spacing': typ.letterSpacing,
    '--vibe-card-padding': sp.cardPadding,
    '--vibe-section-gap': sp.sectionGap,
    '--vibe-item-gap': sp.itemGap,
    '--vibe-glass': eff.glassmorphism ? 'true' : 'false',
    '--vibe-backdrop-blur': eff.backdropBlur,
    '--vibe-border-style': eff.borderStyle,
    '--vibe-border-width': eff.borderWidth,
    '--vibe-highlight': eff.highlightColor,
  };
}

export function generateDynamicStyles(role: string): string {
  const vibe = getVibeConfig(role);
  const cssVars = generateCSSVariables(role);
  
  const varEntries = Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  
  const patternStyles = generatePatternStyle(vibe.decoration.pattern, vibe.decoration.patternColor, vibe.decoration.patternOpacity);
  
  return `
.vibe-root {
${varEntries}
}

${patternStyles}

.vibe-card {
  background: var(--vibe-card-bg);
  border-radius: var(--vibe-radius);
  box-shadow: var(--vibe-shadow);
  padding: var(--vibe-card-padding);
  transition: all var(--vibe-animation) ease;
  backdrop-filter: blur(var(--vibe-blur));
  border: var(--vibe-border-width) var(--vibe-border-style) var(--vibe-pattern-color);
}

.vibe-card:hover {
  box-shadow: var(--vibe-shadow-hover);
  transform: translateY(-2px);
}

.vibe-text-display {
  font-family: var(--vibe-font-display);
  font-size: var(--vibe-display-size);
  line-height: var(--vibe-line-height);
  letter-spacing: var(--vibe-letter-spacing);
  color: var(--vibe-text);
}

.vibe-text-heading {
  font-family: var(--vibe-font-display);
  font-size: var(--vibe-heading-size);
  color: var(--vibe-primary);
}

.vibe-text-body {
  font-family: var(--vibe-font-body);
  font-size: var(--vibe-body-size);
  line-height: var(--vibe-line-height);
  color: var(--vibe-text);
}

.vibe-stamp {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--vibe-primary);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: var(--vibe-caption-size);
  font-weight: 600;
  transform: rotate(12deg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.vibe-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, var(--vibe-primary), var(--vibe-secondary));
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: var(--vibe-caption-size);
  font-weight: 500;
}

.vibe-button {
  background: var(--vibe-gradient);
  color: var(--vibe-text);
  border: none;
  padding: 12px 24px;
  border-radius: var(--vibe-radius);
  font-family: var(--vibe-font-body);
  font-size: var(--vibe-body-size);
  cursor: pointer;
  transition: all var(--vibe-animation) ease;
  box-shadow: var(--vibe-shadow);
}

.vibe-button:hover {
  transform: scale(1.02);
  box-shadow: var(--vibe-shadow-hover);
}

.vibe-button-primary {
  background: var(--vibe-primary);
  color: white;
}

.vibe-button-secondary {
  background: transparent;
  border: 2px solid var(--vibe-primary);
  color: var(--vibe-primary);
}

.vibe-highlight {
  background: var(--vibe-highlight);
  padding: 2px 6px;
  border-radius: 4px;
}

@keyframes vibe-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes vibe-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.vibe-animate-float {
  animation: vibe-float 3s ease-in-out infinite;
}

.vibe-animate-pulse {
  animation: vibe-pulse 1.5s ease-in-out infinite;
}
`;
}

function generatePatternStyle(pattern: string, color: string, opacity: number): string {
  const colorRgb = hexToRgb(color);
  
  const patterns: Record<string, string> = {
    dots: `
.vibe-pattern-dots {
  background-image: radial-gradient(circle, rgba(${colorRgb}, ${opacity}) 1px, transparent 1px);
  background-size: 20px 20px;
}`,
    lines: `
.vibe-pattern-lines {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(${colorRgb}, ${opacity}) 10px,
    rgba(${colorRgb}, ${opacity}) 11px
  );
}`,
    waves: `
.vibe-pattern-waves {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 8px,
    rgba(${colorRgb}, ${opacity}) 8px,
    rgba(${colorRgb}, ${opacity}) 12px
  );
}`,
    grid: `
.vibe-pattern-grid {
  background-image: 
    linear-gradient(rgba(${colorRgb}, ${opacity}) 1px, transparent 1px),
    linear-gradient(90deg, rgba(${colorRgb}, ${opacity}) 1px, transparent 1px);
  background-size: 16px 16px;
}`,
    none: '',
  };
  
  return patterns[pattern] || patterns.none;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1]!, 16)}, ${parseInt(result[2]!, 16)}, ${parseInt(result[3]!, 16)}`;
}
