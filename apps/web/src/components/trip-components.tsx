'use client';

import { TripPlan, ClarifyingQuestion } from './types';
import { 
  getVibeConfig, 
  getFontSizeClass, 
  getRandomSticker,
  getRandomStamp,
  generateDynamicStyles 
} from './vibe-config';

interface TripCardProps {
  plan: TripPlan;
  onSelectOption?: (option: string, value: string) => void;
  onConfirm?: () => void;
  onModify?: (field: string, value: string) => void;
}

export function TripCard({ plan, onSelectOption, onConfirm, onModify }: TripCardProps) {
  const vibe = getVibeConfig(plan.role);
  const fontSize = getFontSizeClass(plan.role);
  const stamp = getRandomStamp(plan.role);
  const randomSticker = getRandomSticker(plan.role);
  const styleId = `vibe-style-${plan.role}`;

  if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = generateDynamicStyles(plan.role);
      document.head.appendChild(styleEl);
    }
  }

  return (
    <div
      className="vibe-card vibe-animate-float"
      style={{
        background: vibe.theme.cardBg,
        borderRadius: vibe.theme.borderRadius,
        boxShadow: vibe.theme.shadow,
        border: `${vibe.effects.borderWidth} ${vibe.effects.borderStyle} ${vibe.decoration.patternColor}20`,
        backdropFilter: vibe.effects.glassmorphism ? `blur(${vibe.effects.backdropBlur})` : undefined,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div 
        className="vibe-stamp"
        style={{
          background: `linear-gradient(135deg, ${vibe.theme.primaryColor}, ${vibe.theme.secondaryColor})`,
          color: 'white',
          fontFamily: vibe.theme.fontDisplay,
        }}
      >
        {stamp}
      </div>

      <div 
        className="vibe-badge"
        style={{
          background: `linear-gradient(135deg, ${vibe.theme.primaryColor}15, ${vibe.theme.secondaryColor}15)`,
          border: `1px solid ${vibe.theme.primaryColor}30`,
        }}
      >
        {randomSticker} {plan.role === 'parents' ? '👴👵 带父母' :
         plan.role === 'family' ? '👶🍼 亲子游' :
         plan.role === 'couple' ? '💑🌹 情侣游' :
         plan.role === 'friends' ? '🎒🕶️ 闺蜜游' : '🎯 特种兵'}
      </div>

      <div style={{ marginTop: vibe.spacing.cardPadding }}>
        <div 
          className="vibe-text-display"
          style={{ 
            color: vibe.theme.primaryColor,
            fontFamily: vibe.theme.fontDisplay,
            fontSize: vibe.typography.displaySize,
            letterSpacing: vibe.typography.letterSpacing,
          }}
        >
          {plan.destination}
        </div>
        
        <div 
          className="vibe-text-body"
          style={{
            color: vibe.theme.accentColor,
            fontFamily: vibe.theme.fontBody,
            fontSize: vibe.typography.captionSize,
            marginTop: '8px',
          }}
        >
          ⏱️ {plan.days}天行程 · {plan.itinerary.length}个目的地
        </div>
      </div>

      <div 
        style={{ 
          height: '1px', 
          background: `linear-gradient(90deg, transparent, ${vibe.theme.secondaryColor}50, transparent)`,
          margin: vibe.spacing.sectionGap + ' 0',
        }} 
      />

      <div className="itinerary-list">
        {plan.itinerary.map((day, dayIdx) => (
          <div 
            key={day.dayNumber} 
            className="day-section"
            style={{
              marginBottom: vibe.spacing.sectionGap,
              padding: vibe.spacing.cardPadding,
              background: `linear-gradient(145deg, ${vibe.theme.gradientStart}80, ${vibe.theme.gradientEnd}60)`,
              borderRadius: `calc(${vibe.theme.borderRadius} * 0.7)`,
              borderLeft: `4px solid ${vibe.theme.primaryColor}`,
              position: 'relative',
            }}
          >
            <div 
              className="vibe-pattern-waves"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: `calc(${vibe.theme.borderRadius} * 0.7)`,
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            />

            <div 
              className="day-header vibe-text-heading"
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontFamily: vibe.theme.fontDisplay,
                fontSize: vibe.typography.headingSize,
                color: vibe.theme.primaryColor,
                position: 'relative',
              }}
            >
              <span className="day-title">
                🌅 Day {day.dayNumber}
              </span>
              <span 
                className="day-date vibe-text-body"
                style={{
                  fontFamily: vibe.theme.fontBody,
                  fontSize: vibe.typography.captionSize,
                  color: vibe.theme.textColor + '99',
                }}
              >
                {day.date}
              </span>
            </div>

            <p 
              className="day-summary vibe-text-body"
              style={{
                fontFamily: vibe.theme.fontBody,
                fontSize: vibe.typography.bodySize,
                color: vibe.theme.textColor,
                lineHeight: vibe.typography.lineHeight,
                marginTop: vibe.spacing.itemGap,
              }}
            >
              {day.summary}
            </p>

            <div 
              className="day-items"
              style={{
                marginTop: vibe.spacing.itemGap,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {day.items.slice(0, 5).map((item, idx) => (
                <div 
                  key={idx} 
                  className="itinerary-item"
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 14px',
                    background: `${vibe.theme.cardBg}`,
                    borderRadius: `calc(${vibe.theme.borderRadius} * 0.5)`,
                    borderLeft: `3px solid ${vibe.theme.secondaryColor}`,
                    transition: `all ${vibe.theme.animationDuration} ease`,
                  }}
                >
                  <span 
                    className="item-icon"
                    style={{
                      fontSize: vibe.typography.headingSize,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    }}
                  >
                    {item.type === 'transport' ? '🚗' :
                     item.type === 'accommodation' ? '🏨' :
                     item.type === 'attraction' ? '🏛️' :
                     item.type === 'restaurant' ? '🍜' :
                     item.type === 'break' ? '☕' : '📍'}
                  </span>
                  <div className="item-content" style={{ flex: 1 }}>
                    <span 
                      className={`item-title ${fontSize}`}
                      style={{
                        fontFamily: vibe.theme.fontBody,
                        fontSize: vibe.typography.bodySize,
                        fontWeight: 600,
                        color: vibe.theme.textColor,
                      }}
                    >
                      {item.title}
                    </span>
                    {item.location && (
                      <span 
                        className="item-location"
                        style={{
                          display: 'block',
                          fontFamily: vibe.theme.fontBody,
                          fontSize: vibe.typography.captionSize,
                          color: vibe.theme.textColor + 'CC',
                          marginTop: '2px',
                        }}
                      >
                        📍 {item.location}
                      </span>
                    )}
                    {item.startTime && item.endTime && (
                      <span 
                        className="item-time"
                        style={{
                          display: 'block',
                          fontFamily: vibe.theme.fontBody,
                          fontSize: vibe.typography.captionSize,
                          color: vibe.theme.accentColor,
                          marginTop: '2px',
                        }}
                      >
                        ⏰ {item.startTime} - {item.endTime}
                      </span>
                    )}
                  </div>
                  <span 
                    className="item-sticker"
                    style={{
                      fontSize: vibe.typography.captionSize,
                      opacity: 0.7,
                    }}
                  >
                    {getRandomSticker(plan.role)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div 
        className="trip-actions"
        style={{
          display: 'flex',
          gap: '16px',
          marginTop: vibe.spacing.sectionGap,
          paddingTop: vibe.spacing.cardPadding,
          borderTop: `1px dashed ${vibe.theme.secondaryColor}40`,
        }}
      >
        <button
          onClick={onConfirm}
          className="vibe-button vibe-button-primary"
          style={{
            flex: 1,
            background: `linear-gradient(135deg, ${vibe.theme.primaryColor}, ${vibe.theme.secondaryColor})`,
            color: 'white',
            fontFamily: vibe.theme.fontBody,
            fontSize: vibe.typography.bodySize,
            fontWeight: 600,
            padding: '14px 24px',
            borderRadius: vibe.theme.borderRadius,
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${vibe.theme.primaryColor}40`,
            transition: `all ${vibe.theme.animationDuration} ease`,
          }}
        >
          ✨ 确认行程
        </button>
        <button
          onClick={() => onModify?.('budget', '')}
          className="vibe-button vibe-button-secondary"
          style={{
            flex: 1,
            background: 'transparent',
            border: `2px solid ${vibe.theme.primaryColor}`,
            color: vibe.theme.primaryColor,
            fontFamily: vibe.theme.fontBody,
            fontSize: vibe.typography.bodySize,
            fontWeight: 600,
            padding: '14px 24px',
            borderRadius: vibe.theme.borderRadius,
            cursor: 'pointer',
            transition: `all ${vibe.theme.animationDuration} ease`,
          }}
        >
          📝 调整预算
        </button>
      </div>
    </div>
  );
}

interface ClarifyingQuestionsCardProps {
  questions: ClarifyingQuestion[];
  onAnswer: (field: string, value: string) => void;
  role: string;
}

export function ClarifyingQuestionsCard({ questions, onAnswer, role }: ClarifyingQuestionsCardProps) {
  const vibe = getVibeConfig(role);
  const styleId = `vibe-style-q-${role}`;

  if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = generateDynamicStyles(role);
      document.head.appendChild(styleEl);
    }
  }

  return (
    <div
      className="vibe-card"
      style={{
        background: `linear-gradient(145deg, ${vibe.theme.gradientStart}, ${vibe.theme.gradientEnd})`,
        borderRadius: vibe.theme.borderRadius,
        boxShadow: vibe.theme.shadow,
        border: `2px solid ${vibe.theme.secondaryColor}40`,
        backdropFilter: vibe.effects.glassmorphism ? `blur(${vibe.effects.backdropBlur})` : undefined,
        padding: vibe.spacing.cardPadding,
      }}
    >
      <div 
        className="vibe-text-heading"
        style={{ 
          fontFamily: vibe.theme.fontDisplay,
          fontSize: vibe.typography.headingSize,
          color: vibe.theme.primaryColor,
          marginBottom: vibe.spacing.sectionGap,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '1.5em' }}>💬</span>
        <span>需要确认一些信息</span>
        <span 
          className="vibe-badge"
          style={{
            marginLeft: 'auto',
            fontSize: vibe.typography.captionSize,
          }}
        >
          {questions.length} 个问题
        </span>
      </div>

      <div className="questions-list">
        {questions.map((q, idx) => (
          <div 
            key={idx} 
            className="question-item"
            style={{
              padding: vibe.spacing.cardPadding,
              background: vibe.theme.cardBg,
              borderRadius: `calc(${vibe.theme.borderRadius} * 0.7)`,
              marginBottom: vibe.spacing.itemGap,
              borderLeft: `4px solid ${vibe.theme.accentColor}`,
              transition: `all ${vibe.theme.animationDuration} ease`,
            }}
          >
            <p 
              className="question-text vibe-text-body"
              style={{
                fontFamily: vibe.theme.fontBody,
                fontSize: vibe.typography.bodySize,
                color: vibe.theme.textColor,
                lineHeight: vibe.typography.lineHeight,
                marginBottom: vibe.spacing.itemGap,
              }}
            >
              <span 
                className="vibe-highlight"
                style={{
                  background: vibe.effects.highlightColor,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginRight: '6px',
                }}
              >
                Q{idx + 1}
              </span>
              {q.question}
            </p>
            {q.options && (
              <div 
                className="question-options"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    className="option-btn"
                    style={{
                      background: `linear-gradient(135deg, ${vibe.theme.cardBg}, ${vibe.theme.gradientStart})`,
                      border: `1px solid ${vibe.theme.primaryColor}30`,
                      color: vibe.theme.textColor,
                      padding: '10px 18px',
                      borderRadius: `calc(${vibe.theme.borderRadius} * 0.6)`,
                      fontFamily: vibe.theme.fontBody,
                      fontSize: vibe.typography.captionSize,
                      cursor: 'pointer',
                      transition: `all ${vibe.theme.animationDuration} ease`,
                      boxShadow: `0 2px 8px ${vibe.theme.primaryColor}10`,
                    }}
                    onClick={() => q.field && onAnswer(q.field, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface RoleSelectionCardProps {
  onSelect: (role: string) => void;
}

const ROLES = [
  { 
    id: 'parents', 
    label: '👴👵 带父母出行', 
    desc: '节奏舒缓，大字号，经典打卡',
    gradient: 'linear-gradient(135deg, #2D5A4A, #8FB339)',
    icon: '🌿',
  },
  { 
    id: 'family', 
    label: '👶🍼 亲子遛娃', 
    desc: '母婴友好，亲子设施，亲近自然',
    gradient: 'linear-gradient(135deg, #FF6B35, #FFB347)',
    icon: '🎈',
  },
  { 
    id: 'couple', 
    label: '💑🌹 情侣度假', 
    desc: '浪漫氛围，小众出片，仪式感',
    gradient: 'linear-gradient(135deg, #E84393, #FD79A8)',
    icon: '💕',
  },
  { 
    id: 'friends', 
    label: '🎒🕶️ 闺蜜/特种兵', 
    desc: '紧凑路线，网红打卡，AA结算',
    gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
    icon: '⚡',
  },
];

export function RoleSelectionCard({ onSelect }: RoleSelectionCardProps) {
  return (
    <div 
      className="role-selection-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        padding: '40px 20px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 
          className="vibe-text-display"
          style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #6C5CE7, #E84393, #FF6B35)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
          }}
        >
          🎯 选择你的出行类型
        </h2>
        <p 
          className="vibe-text-body"
          style={{
            color: '#666',
            fontSize: '1rem',
          }}
        >
          告诉我你的旅行场景，我来为你定制专属行程
        </p>
      </div>

      <div 
        className="role-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '900px',
        }}
      >
        {ROLES.map((role) => (
          <button
            key={role.id}
            className="role-btn vibe-animate-float"
            onClick={() => onSelect(role.id)}
            style={{
              background: role.gradient,
              border: 'none',
              borderRadius: '20px',
              padding: '28px 24px',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
            }}
          >
            <div 
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '80px',
                opacity: 0.15,
                transform: 'rotate(15deg)',
              }}
            >
              {role.icon}
            </div>
            
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <span 
                style={{
                  fontSize: '2.2rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                }}
              >
                {role.icon}
              </span>
              <span 
                style={{
                  fontFamily: "'Bangers', cursive",
                  fontSize: '1.4rem',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {role.label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}
              </span>
            </div>
            
            <p 
              style={{
                fontFamily: "'Quicksand', sans-serif",
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {role.desc}
            </p>

            <div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'rgba(255,255,255,0.3)',
              }}
            />
          </button>
        ))}
      </div>

      <p 
        style={{
          color: '#999',
          fontSize: '0.85rem',
          marginTop: '16px',
        }}
      >
        ✨ 选择后将基于 AI 为你生成个性化行程
      </p>
    </div>
  );
}

interface StreamingIndicatorProps {
  role: string;
}

export function StreamingIndicator({ role }: StreamingIndicatorProps) {
  const vibe = getVibeConfig(role);

  const dots = ['●', '○', '○'];
  const colors = [vibe.theme.primaryColor, vibe.theme.secondaryColor, vibe.theme.accentColor];

  return (
    <div
      className="streaming-indicator"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 24px',
        background: `linear-gradient(135deg, ${vibe.theme.gradientStart}, ${vibe.theme.gradientEnd})`,
        borderRadius: vibe.theme.borderRadius,
        boxShadow: vibe.theme.shadow,
        border: `1px solid ${vibe.theme.secondaryColor}30`,
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        {dots.map((dot, idx) => (
          <span
            key={idx}
            style={{
              color: colors[idx],
              fontSize: '12px',
              animation: `vibe-pulse 1.2s ease-in-out ${idx * 0.2}s infinite`,
            }}
          >
            {dot}
          </span>
        ))}
      </div>
      <span 
        className="vibe-text-body"
        style={{
          fontFamily: vibe.theme.fontBody,
          fontSize: vibe.typography.bodySize,
          color: vibe.theme.primaryColor,
        }}
      >
        正在为你规划行程<span style={{ opacity: 0.6 }}>...</span>
      </span>
      <span style={{ fontSize: '1.2em' }}>
        {getRandomSticker(role)}
      </span>
    </div>
  );
}
