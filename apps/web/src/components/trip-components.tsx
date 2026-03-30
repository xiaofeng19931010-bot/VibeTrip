'use client';

import { TripPlan, ClarifyingQuestion } from './types';
import { getVibeConfig, getFontSizeClass } from './vibe-config';

interface TripCardProps {
  plan: TripPlan;
  onSelectOption?: (option: string, value: string) => void;
  onConfirm?: () => void;
  onModify?: (field: string, value: string) => void;
}

export function TripCard({ plan, onSelectOption, onConfirm, onModify }: TripCardProps) {
  const vibe = getVibeConfig(plan.role);
  const fontSize = getFontSizeClass(plan.role);

  return (
    <div
      className="trip-card"
      style={{
        backgroundColor: vibe.theme.backgroundColor,
        borderLeft: `4px solid ${vibe.theme.primaryColor}`,
      }}
    >
      <div className="trip-header" style={{ color: vibe.theme.primaryColor }}>
        <span className="trip-role-badge" style={{ backgroundColor: vibe.theme.primaryColor }}>
          {plan.role === 'parents' ? '👴👵 带父母' :
           plan.role === 'family' ? '👶🍼 亲子游' :
           plan.role === 'couple' ? '💑🌹 情侣游' :
           plan.role === 'friends' ? '🎒🕶️ 闺蜜游' : '🎯 特种兵'}
        </span>
        <span className="trip-destination">{plan.destination}</span>
        <span className="trip-days" style={{ color: vibe.theme.accentColor }}>
          {plan.days}天行程
        </span>
      </div>

      <div className="itinerary-list">
        {plan.itinerary.map((day) => (
          <div key={day.dayNumber} className="day-section">
            <div className="day-header" style={{ color: vibe.theme.textColor }}>
              <span className={`day-title ${fontSize}`}>Day {day.dayNumber}</span>
              <span className="day-date">{day.date}</span>
            </div>
            <p className="day-summary" style={{ color: vibe.theme.textColor }}>{day.summary}</p>
            <div className="day-items">
              {day.items.slice(0, 5).map((item, idx) => (
                <div key={idx} className="itinerary-item" style={{ borderLeft: `2px solid ${vibe.theme.secondaryColor}` }}>
                  <span className="item-icon">
                    {item.type === 'transport' ? '🚗' :
                     item.type === 'accommodation' ? '🏨' :
                     item.type === 'attraction' ? '🏛️' :
                     item.type === 'restaurant' ? '🍜' :
                     item.type === 'break' ? '☕' : '📍'}
                  </span>
                  <div className="item-content">
                    <span className={`item-title ${fontSize}`}>{item.title}</span>
                    {item.location && (
                      <span className="item-location">📍 {item.location}</span>
                    )}
                    {item.startTime && item.endTime && (
                      <span className="item-time">{item.startTime} - {item.endTime}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="trip-actions">
        <button
          onClick={onConfirm}
          style={{ backgroundColor: vibe.theme.primaryColor }}
          className="confirm-btn"
        >
          确认行程 ✨
        </button>
        <button
          onClick={() => onModify?.('budget', '')}
          className="modify-btn"
          style={{ borderColor: vibe.theme.primaryColor, color: vibe.theme.primaryColor }}
        >
          调整预算
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

  return (
    <div
      className="questions-card"
      style={{
        backgroundColor: vibe.theme.backgroundColor,
        border: `2px solid ${vibe.theme.secondaryColor}`,
      }}
    >
      <div className="questions-header" style={{ color: vibe.theme.primaryColor }}>
        💬 需要确认一些信息
      </div>
      <div className="questions-list">
        {questions.map((q, idx) => (
          <div key={idx} className="question-item">
            <p className="question-text">{q.question}</p>
            {q.options && (
              <div className="question-options">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className="option-btn"
                    style={{
                      backgroundColor: 'white',
                      border: `1px solid ${vibe.theme.primaryColor}`,
                      color: vibe.theme.textColor,
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
  { id: 'parents', label: '👴👵 带父母出行', desc: '节奏舒缓，大字号，经典打卡' },
  { id: 'family', label: '👶🍼 亲子遛娃', desc: '母婴友好，亲子设施，亲近自然' },
  { id: 'couple', label: '💑🌹 情侣度假', desc: '浪漫氛围，小众出片，仪式感' },
  { id: 'friends', label: '🎒🕶️ 闺蜜/特种兵', desc: '紧凑路线，网红打卡，AA结算' },
];

export function RoleSelectionCard({ onSelect }: RoleSelectionCardProps) {
  return (
    <div className="role-selection-card">
      <h2 className="role-header">🎯 选择你的出行类型</h2>
      <div className="role-grid">
        {ROLES.map((role) => (
          <button
            key={role.id}
            className="role-btn"
            onClick={() => onSelect(role.id)}
          >
            <span className="role-label">{role.label}</span>
            <span className="role-desc">{role.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface StreamingIndicatorProps {
  role: string;
}

export function StreamingIndicator({ role }: StreamingIndicatorProps) {
  const vibe = getVibeConfig(role);

  return (
    <div className="streaming-indicator" style={{ color: vibe.theme.primaryColor }}>
      <span className="streaming-dot" style={{ backgroundColor: vibe.theme.primaryColor }}></span>
      <span>正在为你规划行程...</span>
    </div>
  );
}
