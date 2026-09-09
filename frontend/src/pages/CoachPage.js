/**
 * CoachPage.js
 * The AI Coach — a System-styled chat interface where the user converses
 * with "The System" AI, backed by Claude with real tool access to their data.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4 animate-in">
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(225,29,72,0.3)]">
        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          psychology
        </span>
      </div>
      <div className="glass-panel px-4 py-3 rounded-2xl rounded-bl-sm max-w-[80%] border border-primary/20">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
            />
          ))}
          <span className="font-label-system text-[9px] text-primary-container tracking-[0.15em] ml-2 uppercase animate-pulse">
            SCANNING DATA...
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-in">
        <div
          className="px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%] text-sm font-body-main leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, rgba(225,29,72,0.25) 0%, rgba(157,23,77,0.20) 100%)',
            border: '1px solid rgba(225,29,72,0.3)',
            color: 'var(--color-on-surface)',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // System (assistant) message — styled as holographic panel
  return (
    <div className="flex items-end gap-3 mb-4 animate-in">
      {/* System avatar */}
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 flex-shrink-0 shadow-[0_0_12px_rgba(225,29,72,0.3)]">
        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          psychology
        </span>
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm max-w-[82%]"
        style={{
          background: 'linear-gradient(135deg, rgba(15,20,40,0.95) 0%, rgba(20,28,55,0.90) 100%)',
          border: '1px solid rgba(59,130,246,0.25)',
          boxShadow: '0 0 20px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* System label */}
        <div className="font-label-system text-[9px] text-blue-400/70 tracking-[0.2em] uppercase mb-2">
          ▸ THE SYSTEM
        </div>
        {/* Message text — pre-wrap to preserve line breaks from Claude */}
        <div
          className="text-sm font-body-main leading-relaxed whitespace-pre-wrap"
          style={{ color: 'rgba(220,230,255,0.9)' }}
        >
          {message.content}
        </div>
        {/* Show tools used if any */}
        {message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="mt-2 pt-2 border-t border-blue-400/10 flex flex-wrap gap-1">
            {message.toolsUsed.map(tool => (
              <span
                key={tool}
                className="text-[9px] font-label-system tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(59,130,246,0.12)',
                  color: 'rgba(96,165,250,0.8)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                ⚡ {tool.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "What should I train today based on my stats?",
  "How close am I to ranking up?",
  "What are my weakest stats and how do I fix them?",
  "Give me a workout plan for this week.",
  "How is my current streak?",
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoachPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);

    const userMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build the message array for the API — only role + content (not toolsUsed)
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await api.chatCoach(apiMessages);

      const assistantMessage = {
        role: 'assistant',
        content: result.reply,
        toolsUsed: result.tools_used || [],
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err.data?.detail || err.message || 'The System is temporarily unreachable.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 10rem)', minHeight: '500px' }}
    >
      {/* Header */}
      <div className="pt-4 pb-3 px-1 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(225,29,72,0.3) 0%, rgba(157,23,77,0.1) 100%)',
              border: '1px solid rgba(225,29,72,0.4)',
              boxShadow: '0 0 20px rgba(225,29,72,0.25)',
            }}
          >
            <span
              className="material-symbols-outlined text-primary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              psychology
            </span>
          </div>
          <div>
            <h1 className="font-monarch-display text-base text-primary tracking-widest uppercase crimson-text-glow">
              THE SYSTEM
            </h1>
            <p className="font-label-system text-[9px] text-on-surface-variant tracking-[0.15em] uppercase">
              AI Coach · Tool Access Enabled
            </p>
          </div>
          {/* Status badge */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-label-system text-[9px] text-emerald-400/80 tracking-widest uppercase">Online</span>
          </div>
        </div>
        {/* Separator line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-3" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-1 py-2" id="coach-messages">
        {/* Empty state / suggested prompts */}
        {messages.length === 0 && !isLoading && (
          <div className="pt-4 pb-6 animate-in">
            <div
              className="glass-panel rounded-xl p-4 mb-5 text-center mx-2"
              style={{
                background: 'linear-gradient(135deg, rgba(15,20,40,0.95) 0%, rgba(20,28,55,0.90) 100%)',
                border: '1px solid rgba(59,130,246,0.2)',
                boxShadow: '0 0 30px rgba(59,130,246,0.05)',
              }}
            >
              <div className="font-label-system text-[9px] text-blue-400/60 tracking-[0.2em] uppercase mb-2">
                ▸ SYSTEM INITIALISED
              </div>
              <p className="text-sm font-body-main text-on-surface-variant leading-relaxed">
                Hunter <span className="text-primary font-semibold">{user?.username}</span>, 
                I have access to your profile, combat history, and active quests. Ask me anything.
              </p>
            </div>

            <p className="font-label-system text-[9px] text-on-surface-variant tracking-widest uppercase text-center mb-3">
              Suggested Commands
            </p>
            <div className="flex flex-col gap-2 mx-2">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  id={`suggested-prompt-${i}`}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-2.5 rounded-xl text-sm font-body-main transition-all duration-200"
                  style={{
                    background: 'rgba(225,29,72,0.06)',
                    border: '1px solid rgba(225,29,72,0.15)',
                    color: 'rgba(220,220,240,0.8)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(225,29,72,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(225,29,72,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(225,29,72,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(225,29,72,0.15)';
                  }}
                >
                  <span className="text-primary/60 mr-2">›</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error state */}
        {error && (
          <div className="mx-2 mb-4 px-4 py-3 rounded-xl text-sm font-body-main animate-in"
            style={{
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.25)',
              color: 'rgba(252,165,165,0.9)',
            }}
          >
            <span className="font-label-system text-[9px] tracking-wider uppercase text-red-400/70 block mb-1">
              System Error
            </span>
            {error}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pt-3 pb-1">
        <div
          className="flex items-end gap-2 rounded-2xl p-2"
          style={{
            background: 'rgba(10,14,26,0.8)',
            border: '1px solid rgba(225,29,72,0.2)',
            boxShadow: '0 0 20px rgba(225,29,72,0.05)',
          }}
        >
          <textarea
            ref={inputRef}
            id="coach-input"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Transmit command to The System..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-sm font-body-main px-2 py-1 disabled:opacity-50"
            style={{
              color: 'rgba(220,230,255,0.9)',
              maxHeight: '120px',
              lineHeight: '1.5',
            }}
          />
          <button
            id="coach-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, rgba(225,29,72,0.8) 0%, rgba(157,23,77,0.8) 100%)'
                : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(225,29,72,0.3)',
            }}
          >
            <span className="material-symbols-outlined text-white text-base">
              send
            </span>
          </button>
        </div>
        <p className="font-label-system text-[8px] text-on-surface-variant/40 tracking-wider text-center mt-2">
          ENTER to send · SHIFT+ENTER for new line
        </p>
      </div>
    </div>
  );
}
