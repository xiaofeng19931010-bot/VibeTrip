'use client';

import { useState, useCallback } from 'react';
import { Message, ClarifyingQuestion } from '../components/types';
import { TripCard, ClarifyingQuestionsCard, RoleSelectionCard, StreamingIndicator } from '../components/trip-components';
import { getVibeConfig } from '../components/vibe-config';

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Message['plan'] | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[] | null>(null);

  const handleRoleSelect = useCallback((role: string) => {
    setSelectedRole(role);
    setShowRoleSelection(false);
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `好的！你是${role === 'parents' ? '带父母出行' : role === 'family' ? '亲子遛娃' : role === 'couple' ? '情侣度假' : '闺蜜/特种兵'}模式，我会为你匹配合适的行程～`,
    }]);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedRole) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const vibe = getVibeConfig(selectedRole);

    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      setIsStreaming(false);
      setCurrentPlan(data.plan || null);
      setClarifyingQuestions(data.questions || null);

      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.isStreaming) {
          return [...prev.slice(0, -1), {
            ...lastMsg,
            content: data.content || '行程已生成！',
            isStreaming: false,
            plan: data.plan,
          }];
        }
        return prev;
      });
    } catch {
      setIsStreaming(false);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.isStreaming) {
          return [...prev.slice(0, -1), {
            ...lastMsg,
            content: '抱歉，服务暂时不可用，请稍后重试～',
            isStreaming: false,
          }];
        }
        return prev;
      });
    }
  }, [input, selectedRole]);

  const handleAnswer = useCallback((field: string, value: string) => {
    setInput(prev => `${prev} ${field}: ${value}`);
    setClarifyingQuestions(null);
  }, []);

  const handleConfirmPlan = useCallback(() => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '✅ 行程已确认！祝你们旅途愉快～ 🌟',
    }]);
    setCurrentPlan(null);
    setShowRoleSelection(true);
    setSelectedRole(null);
  }, []);

  const vibe = selectedRole ? getVibeConfig(selectedRole) : null;

  return (
    <main
      className="chat-container"
      style={{
        backgroundColor: vibe?.theme.backgroundColor || '#F5F5F5',
        minHeight: '100vh',
      }}
    >
      <header
        className="chat-header"
        style={{ backgroundColor: vibe?.theme.primaryColor || '#4A90A4' }}
      >
        <h1 style={{ color: 'white' }}>🌍 VibeTrip</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>你的氛围感旅行搭子</p>
      </header>

      <div className="messages-area">
        {showRoleSelection && !selectedRole && (
          <RoleSelectionCard onSelect={handleRoleSelect} />
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            {msg.role === 'assistant' && msg.isStreaming && (
              <StreamingIndicator role={selectedRole || 'friends'} />
            )}

            {msg.content && (
              <div className="message-content">
                {msg.content}
              </div>
            )}

            {msg.role === 'assistant' && msg.plan && (
              <TripCard
                plan={msg.plan}
                onConfirm={handleConfirmPlan}
                onModify={(field, value) => setInput(`${field}: ${value}`)}
              />
            )}
          </div>
        ))}

        {clarifyingQuestions && clarifyingQuestions.length > 0 && (
          <ClarifyingQuestionsCard
            questions={clarifyingQuestions}
            onAnswer={handleAnswer}
            role={selectedRole || 'friends'}
          />
        )}
      </div>

      {!showRoleSelection && (
        <form onSubmit={handleSubmit} className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`描述你的旅行计划，比如："去成都玩3天，预算5000"`}
            disabled={isStreaming}
            style={{
              borderColor: vibe?.theme.primaryColor,
              color: vibe?.theme.textColor,
            }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            style={{ backgroundColor: vibe?.theme.primaryColor }}
          >
            {isStreaming ? '...' : '发送'}
          </button>
        </form>
      )}
    </main>
  );
}
