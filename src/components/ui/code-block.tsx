'use client';

import { useState, useCallback, useMemo } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
  accentColor?: string;
}

const KEYWORDS = new Set([
  'def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif',
  'for', 'while', 'in', 'not', 'and', 'or', 'is', 'None', 'True',
  'False', 'with', 'as', 'try', 'except', 'finally', 'raise', 'yield',
  'break', 'continue', 'pass', 'lambda', 'global', 'nonlocal', 'assert',
  'del', 'print', 'range', 'len', 'int', 'float', 'str', 'list', 'dict',
  'set', 'tuple', 'bool', 'type', 'isinstance', 'enumerate', 'zip', 'map',
  'filter', 'sorted', 'sum', 'min', 'max', 'abs', 'round', 'format',
  'super', 'self', 'async', 'await',
]);

function highlightLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  // Tokenize with regex: comments, triple-quoted strings, double strings, single strings, numbers, words, rest
  const regex = /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|([^\w])/g;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(line)) !== null) {
    const [full, comment, str, num, word, other] = match;

    if (comment) {
      tokens.push(
        <span key={key++} className="text-emerald-400/80">{comment}</span>
      );
    } else if (str) {
      tokens.push(
        <span key={key++} className="text-[var(--accent)]">{str}</span>
      );
    } else if (num) {
      tokens.push(
        <span key={key++} className="text-[var(--classical)]">{num}</span>
      );
    } else if (word) {
      if (KEYWORDS.has(word)) {
        tokens.push(
          <span key={key++} className="text-[var(--quantum)] font-semibold">{word}</span>
        );
      } else {
        tokens.push(<span key={key++}>{word}</span>);
      }
    } else {
      tokens.push(<span key={key++}>{other}</span>);
    }
  }

  return tokens;
}

export function CodeBlock({ code, language = 'python', label, accentColor }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => code.trimEnd().split('\n'), [code]);

  const highlightedLines = useMemo(
    () => lines.map((line) => highlightLine(line)),
    [lines]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const borderColor = accentColor ?? 'var(--border)';

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor, backgroundColor: '#0A0A1A' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor }}
      >
        <div className="flex items-center gap-2">
          {label && (
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: accentColor ?? 'var(--text-muted)' }}
            >
              {label}
            </span>
          )}
          <span className="text-xs text-[var(--text-muted)]">{language}</span>
        </div>

        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1 rounded-md transition-all duration-200 hover:bg-white/5"
          style={{ color: copied ? '#10B981' : 'var(--text-muted)' }}
        >
          {copied ? '✓ Copiado!' : 'Copiar'}
        </button>
      </div>

      {/* Code area */}
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm leading-relaxed">
          <code>
            {highlightedLines.map((tokens, i) => (
              <div key={i} className="flex">
                <span className="inline-block w-10 shrink-0 text-right pr-4 select-none text-[var(--text-muted)]/40 text-xs leading-relaxed">
                  {i + 1}
                </span>
                <span className="text-[var(--text)] flex-1">
                  {tokens.length > 0 ? tokens : '\u00A0'}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
