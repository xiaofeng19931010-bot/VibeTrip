'use client';

import { TripPlan, ClarifyingQuestion } from './types';
import { 
  getVibeConfig, 
  getFontSizeClass, 
  getRandomSticker,
  getRandomStamp,
  getPatternClass,
  generateVibeClasses 
} from './vibe-config';

interface TripCardProps {
  plan: TripPlan;
  onConfirm?: () => void;
  onModify?: (field: string, value: string) => void;
}

export function TripCard({ plan, onConfirm, onModify }: TripCardProps) {
  const vibe = getVibeConfig(plan.role);
  const fontSize = getFontSizeClass(plan.role);
  const stamp = getRandomStamp(plan.role);
  const randomSticker = getRandomSticker(plan.role);
  const patternClass = getPatternClass(plan.role);
  const vibeClasses = generateVibeClasses(plan.role);

  return (
    <div className={`vibe-card ${patternClass} relative overflow-hidden`}>
      <div className="vibe-pattern-waves absolute inset-0 opacity-30 pointer-events-none" />

      <div 
        className="absolute -top-2 -right-2 px-3 py-1 text-xs font-semibold text-white rounded transform rotate-12 shadow-md z-10"
        style={{ background: `linear-gradient(135deg, ${vibe.theme.primaryColor}, ${vibe.theme.secondaryColor})` }}
      >
        {stamp}
      </div>

      <div className="relative z-10">
        <div className="mb-4">
          <div 
            className={`inline-flex items-center gap-2 px-3 py-1 ${vibe.theme.borderRadius} text-sm font-semibold text-white mb-3`}
            style={{ background: `linear-gradient(135deg, ${vibe.theme.primaryColor}15, ${vibe.theme.secondaryColor}15)` }}
          >
            <span>{randomSticker}</span>
            <span>
              {plan.role === 'parents' ? '👴👵 带父母' :
               plan.role === 'couple' ? '💑🌹 情侣游' :
               plan.role === 'friends' ? '🎒🕶️ 闺蜜游' : '🎯 特种兵'}
            </span>
          </div>

          <h2 
            className={`${vibe.typography.displaySize} font-bold mb-1`}
            style={{ color: vibe.theme.primaryColor, fontFamily: vibe.theme.fontDisplay }}
          >
            {plan.destination}
          </h2>
          
          <p className={`${vibe.typography.captionSize}`} style={{ color: vibe.theme.accentColor }}>
            ⏱️ {plan.days}天行程 · {plan.itinerary.length}个目的地
          </p>
        </div>

        <div 
          className="h-px w-full my-4"
          style={{ background: `linear-gradient(90deg, transparent, ${vibe.theme.secondaryColor}50, transparent)` }}
        />

        <div className="space-y-4">
          {plan.itinerary.map((day) => (
            <div 
              key={day.dayNumber} 
              className={`${vibe.theme.borderRadius} p-4 border-l-4 relative`}
              style={{ 
                background: `linear-gradient(145deg, ${vibe.theme.gradientStart}80, ${vibe.theme.gradientEnd}60)`,
                borderLeftColor: vibe.theme.primaryColor,
              }}
            >
              <div className="vibe-pattern-waves absolute inset-0 opacity-20 pointer-events-none" />

              <div className="relative flex justify-between items-center mb-2">
                <span className={`${vibe.typography.headingSize} font-bold`} style={{ color: vibe.theme.primaryColor, fontFamily: vibe.theme.fontDisplay }}>
                  🌅 Day {day.dayNumber}
                </span>
                <span className={`${vibe.typography.captionSize}`} style={{ color: vibe.theme.textColor + '99' }}>
                  {day.date}
                </span>
              </div>

              <p className={`${vibe.typography.bodySize} mb-3`} style={{ color: vibe.theme.textColor, fontFamily: vibe.theme.fontBody }}>
                {day.summary}
              </p>

              <div className="space-y-2">
                {day.items.slice(0, 5).map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-2.5 bg-white/60 backdrop-blur-sm rounded-lg border-l-2 transition-all duration-200 hover:bg-white/80"
                    style={{ borderLeftColor: vibe.theme.secondaryColor }}
                  >
                    <span className={`${vibe.typography.headingSize}`}>
                      {item.type === 'transport' ? '🚗' :
                       item.type === 'accommodation' ? '🏨' :
                       item.type === 'attraction' ? '🏛️' :
                       item.type === 'restaurant' ? '🍜' :
                       item.type === 'break' ? '☕' : '📍'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`${vibe.typography.bodySize} font-medium block truncate`} style={{ color: vibe.theme.textColor }}>
                        {item.title}
                      </span>
                      {item.location && (
                        <span className={`${vibe.typography.captionSize} block truncate`} style={{ color: vibe.theme.textColor + 'CC' }}>
                          📍 {item.location}
                        </span>
                      )}
                      {item.startTime && item.endTime && (
                        <span className={`${vibe.typography.captionSize} block`} style={{ color: vibe.theme.accentColor }}>
                          ⏰ {item.startTime} - {item.endTime}
                        </span>
                      )}
                    </div>
                    <span className={`${vibe.typography.captionSize} opacity-60`}>
                      {getRandomSticker(plan.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-dashed" style={{ borderColor: vibe.theme.secondaryColor + '40' }}>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            style={{ background: `linear-gradient(135deg, ${vibe.theme.primaryColor}, ${vibe.theme.secondaryColor})` }}
          >
            ✨ 确认行程
          </button>
          <button
            onClick={() => onModify?.('budget', '')}
            className="flex-1 py-3.5 font-semibold rounded-xl border-2 transition-all hover:-translate-y-0.5"
            style={{ 
              borderColor: vibe.theme.primaryColor,
              color: vibe.theme.primaryColor,
              background: 'transparent'
            }}
          >
            📝 调整预算
          </button>
        </div>
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
  const patternClass = getPatternClass(role);

  return (
    <div className={`vibe-card ${patternClass}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💬</span>
        <h3 className={`${vibe.typography.headingSize} font-bold`} style={{ color: vibe.theme.primaryColor, fontFamily: vibe.theme.fontDisplay }}>
          需要确认一些信息
        </h3>
        <span className={`vibe-badge ml-auto ${vibe.theme.borderRadius}`}
          style={{ background: `linear-gradient(135deg, ${vibe.theme.primaryColor}, ${vibe.theme.secondaryColor})` }}
        >
          {questions.length} 个问题
        </span>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div 
            key={idx} 
            className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border-l-4"
            style={{ borderLeftColor: vibe.theme.accentColor }}
          >
            <p className={`${vibe.typography.bodySize} font-medium mb-2`}>
              <span 
                className={`inline-block px-1.5 py-0.5 ${vibe.theme.borderRadius} text-xs font-semibold text-white mr-2`}
                style={{ backgroundColor: vibe.theme.accentColor }}
              >
                Q{idx + 1}
              </span>
              {q.question}
            </p>
            {q.options && (
              <div className="flex flex-wrap gap-2 mt-3">
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => q.field && onAnswer(q.field, opt)}
                    className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105"
                    style={{ 
                      background: `linear-gradient(135deg, ${vibe.theme.cardBg}, ${vibe.theme.gradientStart})`,
                      border: `1px solid ${vibe.theme.primaryColor}30`,
                      color: vibe.theme.textColor,
                      fontFamily: vibe.theme.fontBody,
                    }}
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
    label: '带父母出行', 
    desc: '节奏舒缓，大字号，经典打卡',
    gradient: 'from-emerald-600 to-emerald-400',
    icon: '🌿',
  },
  { 
    id: 'family', 
    label: '亲子遛娃', 
    desc: '母婴友好，亲子设施，亲近自然',
    gradient: 'from-orange-500 to-amber-400',
    icon: '🎈',
  },
  { 
    id: 'couple', 
    label: '情侣度假', 
    desc: '浪漫氛围，小众出片，仪式感',
    gradient: 'from-pink-600 to-pink-400',
    icon: '💕',
  },
  { 
    id: 'friends', 
    label: '闺蜜/特种兵', 
    desc: '紧凑路线，网红打卡，AA结算',
    gradient: 'from-violet-600 to-violet-400',
    icon: '⚡',
  },
];

export function RoleSelectionCard({ onSelect }: RoleSelectionCardProps) {
  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="text-center mb-4">
        <h2 
          className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 bg-clip-text text-transparent"
          style={{ fontFamily: "'Bangers', cursive" }}
        >
          🎯 选择你的出行类型
        </h2>
        <p className="text-slate-500 text-base">
          告诉我你的旅行场景，我来为你定制专属行程
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${role.gradient} border-none cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group text-left`}
          >
            <div className="absolute -top-6 -right-6 text-7xl opacity-20 transform rotate-12">
              {role.icon}
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl drop-shadow-md">{role.icon}</span>
              <span 
                className="text-xl font-bold text-white drop-shadow"
                style={{ fontFamily: "'Bangers', cursive" }}
              >
                {role.label}
              </span>
            </div>
            
            <p className="text-white/90 text-sm leading-relaxed">
              {role.desc}
            </p>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
          </button>
        ))}
      </div>

      <p className="text-slate-400 text-sm mt-4">
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

  return (
    <div 
      className="flex items-center gap-4 px-5 py-4 rounded-2xl shadow-sm"
      style={{ 
        background: `linear-gradient(135deg, ${vibe.theme.gradientStart}, ${vibe.theme.gradientEnd})`,
        border: `1px solid ${vibe.theme.secondaryColor}30`
      }}
    >
      <div className="flex gap-1.5">
        {['●', '○', '○'].map((dot, idx) => (
          <span
            key={idx}
            className="text-xs animate-pulse"
            style={{ 
              color: [vibe.theme.primaryColor, vibe.theme.secondaryColor, vibe.theme.accentColor][idx],
              animationDelay: `${idx * 0.2}s`
            }}
          >
            {dot}
          </span>
        ))}
      </div>
      <span className={`${vibe.typography.bodySize}`} style={{ color: vibe.theme.primaryColor, fontFamily: vibe.theme.fontBody }}>
        正在为你规划行程<span className="opacity-60">...</span>
      </span>
      <span className="text-xl">{getRandomSticker(role)}</span>
    </div>
  );
}
