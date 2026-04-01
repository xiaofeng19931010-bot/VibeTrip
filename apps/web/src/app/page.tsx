'use client';

import { useState, useCallback } from 'react';
import { A2UIEnvelope, A2UIToolResult, Message } from '../components/types';
import { A2UIRenderer, A2UIStreamingCard } from '../components/a2ui-renderer';
import { RoleSelectionCard } from '../components/trip-components';
import { getVibeConfig } from '../components/vibe-config';

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(true);

  const handleRoleSelect = useCallback((role: string) => {
    setSelectedRole(role);
    setShowRoleSelection(false);
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `好的！你是${role === 'parents' ? '带父母出行' : role === 'family' ? '亲子遛娃' : role === 'couple' ? '情侣度假' : '闺蜜/特种兵'}模式，我会为你匹配合适的行程～`,
    }]);
  }, []);

  const startStreaming = useCallback(() => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    }]);
  }, []);

  const finishStreamingWithEnvelope = useCallback((envelope: A2UIEnvelope) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.isStreaming) {
        return [...prev.slice(0, -1), {
          ...lastMsg,
          content: '',
          ui: envelope,
          isStreaming: false,
        }];
      }
      return [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        ui: envelope,
      }];
    });
  }, []);

  const finishStreamingWithError = useCallback((content: string) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.isStreaming) {
        return [...prev.slice(0, -1), {
          ...lastMsg,
          content,
          isStreaming: false,
        }];
      }
      return prev;
    });
  }, []);

  const sendRound = useCallback(async (payload: Record<string, unknown>) => {
    setIsStreaming(true);
    startStreaming();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setIsStreaming(false);

      if (data?.envelope) {
        finishStreamingWithEnvelope(data.envelope as A2UIEnvelope);
        return;
      }

      finishStreamingWithError('抱歉，服务返回了无效的界面协议。');
    } catch {
      setIsStreaming(false);
      finishStreamingWithError('抱歉，服务暂时不可用，请稍后重试～');
    }
  }, [finishStreamingWithEnvelope, finishStreamingWithError, startStreaming]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedRole) return;

    const currentInput = input;
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: currentInput,
    }]);
    setInput('');

    await sendRound({
      message: currentInput,
      role: selectedRole,
    });
  }, [input, selectedRole, sendRound]);

  const handleToolResult = useCallback(async (toolResult: A2UIToolResult, envelope: A2UIEnvelope) => {
    if (!selectedRole) return;

    const summary = typeof toolResult.payload.intent === 'string'
      ? `已选择：${String(toolResult.payload.intent)}`
      : `已触发交互：${toolResult.action_id}`;

    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: summary,
    }]);

    await sendRound({
      role: selectedRole,
      toolResult,
      serverState: envelope.server_state,
    });
  }, [selectedRole, sendRound]);

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
              <A2UIStreamingCard role={selectedRole || 'friends'} />
            )}

            {msg.content && (
              <div className="message-content">
                {msg.content}
              </div>
            )}

            {msg.role === 'assistant' && msg.ui && selectedRole && (
              <A2UIRenderer
                envelope={msg.ui}
                role={selectedRole}
                onAction={(toolResult) => handleToolResult(toolResult, msg.ui!)}
              />
            )}
          </div>
        ))}
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
