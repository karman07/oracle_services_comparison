'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, ChevronDown, ChevronUp, MessageSquare, Bot } from 'lucide-react';
import { useRagQuery } from '../hooks/useRagQuery';
import { useTheme } from '../context/ThemeContext';

type Message = {
  role: 'user' | 'assistant';
  text: string;
  intent?: string;
  context_text?: string;
  records_used?: { route_records: number; schema_records: number; module_summaries: number };
};

const INTENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  route_removed:  { bg: '#FEF2F2', text: '#B91C1C', border: '#FCA5A5' },
  route_added:    { bg: '#ECFDF5', text: '#0F6E3D', border: '#A7F3D0' },
  route_modified: { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  schema:         { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  summary:        { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
};

const DARK_INTENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  route_removed:  { bg: '#2A0A0A', text: '#F87171', border: '#7F1D1D' },
  route_added:    { bg: '#052E1C', text: '#10B981', border: '#065F46' },
  route_modified: { bg: '#1C1400', text: '#FBBF24', border: '#78350F' },
  schema:         { bg: '#0F1E3D', text: '#60A5FA', border: '#1E3A6E' },
  summary:        { bg: '#1A0F3D', text: '#A78BFA', border: '#3730A3' },
};

const SUGGESTED_PROMPTS = [
  'What routes were removed?',
  'What changed in supplier routes?',
  'Which schemas changed the most?',
  'Which routes were impacted by Supplier schema?',
];

const FOLLOWUP_PROMPTS = [
  'What was the previous schema?',
  'Compare both versions',
];

function IntentChip({ intent, dark }: { intent: string; dark: boolean }) {
  const colorMap = dark ? DARK_INTENT_COLORS : INTENT_COLORS;
  const colors = colorMap[intent] ?? (dark
    ? { bg: '#1A2035', text: '#A8B4CC', border: '#1E2844' }
    : { bg: '#F3F6FB', text: '#64748B', border: '#DCE3EE' });

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '99px',
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-dm-mono), monospace',
      }}
    >
      {intent.replace(/_/g, ' ')}
    </span>
  );
}

function ContextTextCollapsible({ contextText, tokens }: { contextText: string; tokens: import('../context/ThemeContext').ThemeTokens }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: tokens.textMuted,
          fontSize: '12px',
          fontWeight: 600,
          padding: '2px 0',
        }}
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? 'Hide context' : 'Show context records'}
      </button>
      {open && (
        <pre
          style={{
            marginTop: '6px',
            padding: '10px 12px',
            background: tokens.bgTertiary,
            border: `1px solid ${tokens.borderColor}`,
            borderRadius: tokens.radiusMd,
            fontSize: '11.5px',
            color: tokens.textSecondary,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--font-dm-mono), monospace',
            lineHeight: 1.6,
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {contextText}
        </pre>
      )}
    </div>
  );
}

function RecordsBadges({ records, tokens }: {
  records: { route_records: number; schema_records: number; module_summaries: number };
  tokens: import('../context/ThemeContext').ThemeTokens;
}) {
  const items = [
    { label: 'routes', count: records.route_records },
    { label: 'schemas', count: records.schema_records },
    { label: 'modules', count: records.module_summaries },
  ].filter((i) => i.count > 0);

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
      {items.map((item) => (
        <span
          key={item.label}
          style={{
            fontSize: '10px',
            fontWeight: 600,
            padding: '1px 7px',
            borderRadius: '99px',
            background: tokens.accentBlueFaint,
            color: tokens.accentBlue,
            border: `1px solid ${tokens.accentBlue}35`,
            fontFamily: 'var(--font-dm-mono), monospace',
          }}
        >
          {item.count} {item.label}
        </span>
      ))}
    </div>
  );
}

export function RagChatPanel() {
  const { tokens, theme } = useTheme();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastQuestion, setLastQuestion] = useState('');
  const { ask, loading, error, retry, sessionId } = useRagQuery();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function submitQuestion(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    setLastQuestion(trimmed);
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setQuestion('');

    try {
      const res = await ask(trimmed);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: res.answer,
          intent: res.intent,
          context_text: res.context_text,
          records_used: res.records_used,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Request failed. Please try again.' }]);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitQuestion(question);
  }

  function onRetry() {
    retry();
    setMessages((m) => m.slice(0, -1));
    submitQuestion(lastQuestion);
  }

  const hasMessages = messages.length > 0;

  return (
    <section style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: tokens.radiusMd,
              background: tokens.accentBlueFaint,
              border: `1px solid ${tokens.accentBlue}35`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={18} color={tokens.accentBlue} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: tokens.textPrimary }}>
              Ask About API Changes
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: tokens.textMuted }}>
              Powered by RAG — query route and schema changes in natural language
            </p>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div
        style={{
          background: tokens.bgCard,
          border: `1px solid ${tokens.borderColor}`,
          borderRadius: tokens.radiusLg,
          padding: '20px',
          minHeight: '320px',
          maxHeight: '520px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: tokens.shadowSm,
        }}
      >
        {!hasMessages && !loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '40px 0',
              color: tokens.textMuted,
            }}
          >
            <MessageSquare size={32} color={tokens.borderColorStrong} />
            <p style={{ margin: 0, fontSize: '14px', textAlign: 'center' }}>
              Ask a question about the Oracle SCM API changes between 25C and 26B.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '88%',
                  padding: '10px 14px',
                  borderRadius: isUser
                    ? `${tokens.radiusMd} ${tokens.radiusMd} 4px ${tokens.radiusMd}`
                    : `${tokens.radiusMd} ${tokens.radiusMd} ${tokens.radiusMd} 4px`,
                  background: isUser ? tokens.accentBlue : tokens.bgTertiary,
                  color: isUser ? tokens.accentBlueText : tokens.textPrimary,
                  border: isUser ? 'none' : `1px solid ${tokens.borderColor}`,
                  fontSize: '14px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {!isUser && msg.intent && (
                  <div style={{ marginBottom: '8px' }}>
                    <IntentChip intent={msg.intent} dark={isDark} />
                  </div>
                )}
                {msg.text}
                {!isUser && msg.records_used && (
                  <RecordsBadges records={msg.records_used} tokens={tokens} />
                )}
              </div>
              {!isUser && msg.context_text && (
                <div style={{ maxWidth: '88%', width: '100%' }}>
                  <ContextTextCollapsible contextText={msg.context_text} tokens={tokens} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.textMuted }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px' }}>Thinking…</span>
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: tokens.colorRemovedBg,
              border: `1px solid ${tokens.colorRemovedBorder}`,
              borderRadius: tokens.radiusMd,
              gap: '12px',
            }}
          >
            <span style={{ color: tokens.colorRemoved, fontSize: '13px' }}>
              {error}
            </span>
            <button
              onClick={onRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                background: tokens.colorRemoved,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: tokens.radiusSm,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={onSubmit}
        style={{ marginTop: '12px', display: 'flex', gap: '8px' }}
      >
        <input
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What changed in supplier routes?"
          disabled={loading}
          style={{
            flex: 1,
            padding: '11px 14px',
            background: tokens.bgCard,
            border: `1px solid ${tokens.borderColor}`,
            borderRadius: tokens.radiusMd,
            color: tokens.textPrimary,
            fontSize: '14px',
            outline: 'none',
            boxShadow: tokens.shadowSm,
          }}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '11px 18px',
            background: tokens.accentBlue,
            color: tokens.accentBlueText,
            border: 'none',
            borderRadius: tokens.radiusMd,
            cursor: loading || !question.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            opacity: loading || !question.trim() ? 0.6 : 1,
            transition: 'opacity 0.12s',
            flexShrink: 0,
          }}
        >
          <Send size={15} />
          Ask
        </button>
      </form>

      {/* Suggested prompts (shown before first message) */}
      {!hasMessages && (
        <div style={{ marginTop: '14px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: tokens.textMuted }}>
            Suggested questions
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => submitQuestion(prompt)}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  background: tokens.bgTertiary,
                  color: tokens.textSecondary,
                  border: `1px solid ${tokens.borderColor}`,
                  borderRadius: tokens.radiusMd,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'border-color 0.12s, color 0.12s',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up chips (shown after first exchange) */}
      {hasMessages && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ margin: '0 0 7px', fontSize: '12px', fontWeight: 600, color: tokens.textMuted }}>
            Follow-up
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FOLLOWUP_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => submitQuestion(prompt)}
                disabled={loading}
                style={{
                  padding: '5px 11px',
                  background: tokens.accentBlueFaint,
                  color: tokens.accentBlue,
                  border: `1px solid ${tokens.accentBlue}35`,
                  borderRadius: tokens.radiusMd,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: loading ? 0.5 : 1,
                  transition: 'opacity 0.12s',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session ID debug footer */}
      <div style={{ marginTop: '12px', textAlign: 'right' }}>
        <span
          style={{
            fontSize: '10px',
            color: tokens.textMuted,
            fontFamily: 'var(--font-dm-mono), monospace',
            opacity: 0.6,
          }}
          title="Session ID — sent with every query to maintain conversation context"
        >
          session: {sessionId.slice(0, 8)}
        </span>
      </div>

      {/* CSS for spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
