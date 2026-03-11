'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CodeBlock } from '@/components/ui/code-block';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function parseContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }

    const language = match[1] || 'python';
    const code = match[2];
    parts.push(
      <div key={key++} className="my-3">
        <CodeBlock code={code} language={language} accentColor="var(--quantum)" />
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={key++} className="whitespace-pre-wrap">
        {content.slice(lastIndex)}
      </span>
    );
  }

  return parts;
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[var(--quantum)] animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
}

interface AiChatProps {
  initialPrompt?: string;
}

export function AiChat({ initialPrompt }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When initialPrompt changes externally, fill the input
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      textareaRef.current?.focus();
    }
  }, [initialPrompt]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      // Handle streaming response
      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data) as { content?: string };
                  if (parsed.content) {
                    assistantContent += parsed.content;
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: 'assistant',
                        content: assistantContent,
                      };
                      return updated;
                    });
                  }
                } catch {
                  // skip non-JSON lines
                }
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming (mock) responses
        const data = await res.json() as { content?: string; message?: string };
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.content ?? data.message ?? 'Sem resposta.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Erro ao se comunicar com a API. Tente novamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col rounded-2xl border border-[var(--border)] overflow-hidden h-[600px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(124,58,237,0.03) 0%, var(--bg-card) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text)]">
          🤖 Especialista Quântico
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Pergunte se uma operação pode ser otimizada com computação quântica
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-[var(--text-muted)]/50 text-center max-w-xs">
              Descreva uma operação, cole um script Python ou pergunte sobre
              algoritmos quânticos.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${
                  msg.role === 'user'
                    ? 'bg-white/[0.06] text-[var(--text)] rounded-br-md'
                    : 'border-l-2 border-[var(--quantum)] bg-[var(--quantum)]/5 text-[var(--text)] rounded-bl-md'
                }
              `}
            >
              {msg.role === 'assistant' ? parseContent(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="border-l-2 border-[var(--quantum)] bg-[var(--quantum)]/5 rounded-2xl rounded-bl-md px-4 py-3">
              <LoadingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--border)]">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva uma operação ou cole um script Python..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm bg-white/[0.03] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--quantum)]/40 transition-colors"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 px-5 py-3 rounded-xl text-sm font-medium text-black transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 shadow-lg shadow-amber-500/20"
            style={{
              backgroundColor: 'var(--accent)',
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
