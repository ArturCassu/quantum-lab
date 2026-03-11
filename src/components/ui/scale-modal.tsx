'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { BenchmarkPoint } from '@/lib/templates';

interface ScaleModalProps {
  point: BenchmarkPoint;
  templateTitle: string;
  onClose: () => void;
}

const MAX_SCROLL_PX = 80_000;
const QUANTUM_BAR_PX = 4;
const VIEWPORT_PX = 900; // approximate

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}min`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h`;
  if (ms < 31_536_000_000) return `${(ms / 86_400_000).toFixed(0)} dias`;
  const years = ms / 31_536_000_000;
  if (years < 1_000) return `${years.toFixed(0)} anos`;
  if (years < 1_000_000) return `${(years / 1e3).toFixed(1)} mil anos`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} milhões de anos`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)} bilhões de anos`;
  return `${(years / 1e12).toFixed(1)} trilhões de anos`;
}

function formatDistance(px: number): string {
  // 1px ≈ 0.26mm on a standard 96dpi screen
  const mm = px * 0.2646;
  if (mm < 10) return `${mm.toFixed(1)}mm`;
  if (mm < 1000) return `${(mm / 10).toFixed(1)}cm`;
  if (mm < 1_000_000) return `${(mm / 1000).toFixed(1)}m`;
  return `${(mm / 1_000_000).toFixed(1)}km`;
}

interface Milestone {
  position: number; // 0-1 fraction of total classical bar
  label: string;
  sublabel: string;
  icon: string;
}

function generateMilestones(
  classicalMs: number,
  quantumMs: number,
  ratio: number
): Milestone[] {
  const milestones: Milestone[] = [];

  // "Quantum finished here" — always first
  const quantumFraction = quantumMs / classicalMs;
  if (quantumFraction < 0.8) {
    milestones.push({
      position: quantumFraction,
      label: 'O quântico terminou aqui',
      sublabel: formatTime(quantumMs),
      icon: '⚡',
    });
  }

  // Time milestones
  const timeMarkers: Array<{ ms: number; label: string; icon: string }> = [
    { ms: 1000, label: '1 segundo', icon: '⏱' },
    { ms: 60_000, label: '1 minuto', icon: '⏱' },
    { ms: 3_600_000, label: '1 hora', icon: '🕐' },
    { ms: 86_400_000, label: '1 dia', icon: '📅' },
    { ms: 2_592_000_000, label: '1 mês', icon: '📅' },
    { ms: 31_536_000_000, label: '1 ano', icon: '📆' },
    { ms: 31_536_000_000 * 100, label: '1 século', icon: '🏛️' },
    { ms: 31_536_000_000 * 1000, label: '1 milênio', icon: '⏳' },
    { ms: 31_536_000_000 * 1e6, label: '1 milhão de anos', icon: '🦕' },
    { ms: 31_536_000_000 * 1e9, label: '1 bilhão de anos', icon: '🌌' },
    { ms: 31_536_000_000 * 13.8e9, label: 'Idade do universo', icon: '🔭' },
  ];

  for (const marker of timeMarkers) {
    const fraction = marker.ms / classicalMs;
    if (fraction > 0.01 && fraction < 0.95) {
      milestones.push({
        position: fraction,
        label: marker.label,
        sublabel: `${((fraction) * 100).toFixed(fraction < 0.1 ? 2 : 1)}% do tempo clássico`,
        icon: marker.icon,
      });
    }
  }

  // Halfway
  milestones.push({
    position: 0.5,
    label: 'Metade do caminho',
    sublabel: formatTime(classicalMs / 2),
    icon: '🔹',
  });

  // Sort and deduplicate (remove milestones too close together)
  milestones.sort((a, b) => a.position - b.position);
  const filtered: Milestone[] = [];
  let lastPos = -0.05;
  for (const m of milestones) {
    if (m.position - lastPos > 0.03) {
      filtered.push(m);
      lastPos = m.position;
    }
  }

  return filtered;
}

export function ScaleModal({ point, templateTitle, onClose }: ScaleModalProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ratio = point.classicalMs / point.quantumMs;
  const realClassicalPx = QUANTUM_BAR_PX * ratio;
  const isCapped = realClassicalPx > MAX_SCROLL_PX;
  const classicalBarPx = Math.min(realClassicalPx, MAX_SCROLL_PX);
  const milestones = generateMilestones(point.classicalMs, point.quantumMs, ratio);

  // Entrance animation
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Track scroll progress
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(el.scrollTop / maxScroll);
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const speedupText = ratio < 1000
    ? `${ratio.toFixed(0)}×`
    : ratio < 1e6
    ? `${(ratio / 1e3).toFixed(1)}K×`
    : ratio < 1e9
    ? `${(ratio / 1e6).toFixed(1)}M×`
    : ratio < 1e12
    ? `${(ratio / 1e9).toFixed(1)}B×`
    : `${(ratio / 1e12).toFixed(1)}T×`;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: 'rgba(5, 5, 16, 0.97)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Fixed header */}
      <div
        className="flex-shrink-0 border-b border-[var(--border)] px-6 py-4"
        style={{ background: 'rgba(5, 5, 16, 0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Escala real — {templateTitle}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Entrada: n = {point.label} • Role para baixo e sinta a diferença
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fixed quantum reference */}
      <div
        className="flex-shrink-0 px-6 py-3 border-b border-[var(--border)]"
        style={{ background: 'rgba(124, 58, 237, 0.05)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-muted)] w-20 flex-shrink-0">Quântico</span>
            <div
              className="rounded-full flex-shrink-0"
              style={{
                width: `${QUANTUM_BAR_PX}px`,
                height: '24px',
                background: 'var(--quantum)',
                boxShadow: '0 0 12px var(--quantum-glow)',
              }}
            />
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--quantum)' }}>
              {formatTime(point.quantumMs)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] ml-auto">
              {QUANTUM_BAR_PX}px
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-3xl mx-auto px-6">
          {/* Classical label */}
          <div className="flex items-center gap-3 py-4 sticky top-0 z-10" style={{ background: 'rgba(5, 5, 16, 0.9)' }}>
            <span className="text-xs font-mono text-[var(--text-muted)] w-20 flex-shrink-0">Clássico</span>
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--classical)' }}>
              {formatTime(point.classicalMs)}
            </span>
          </div>

          {/* The bar + milestones container */}
          <div className="relative pb-24" style={{ minHeight: `${classicalBarPx + 200}px` }}>
            {/* Classical bar */}
            <div
              className="absolute left-[40px] top-0 rounded-b-lg"
              style={{
                width: '32px',
                height: `${classicalBarPx}px`,
                background: 'linear-gradient(180deg, var(--classical) 0%, rgba(6, 182, 212, 0.3) 100%)',
                boxShadow: '0 0 20px var(--classical-glow)',
              }}
            />

            {/* Scale marks along the bar */}
            {Array.from({ length: Math.min(Math.floor(classicalBarPx / 200), 50) }, (_, i) => {
              const y = (i + 1) * 200;
              const fraction = y / classicalBarPx;
              const timeAtPoint = point.classicalMs * fraction;
              return (
                <div
                  key={`tick-${i}`}
                  className="absolute left-[78px] flex items-center gap-2"
                  style={{ top: `${y}px` }}
                >
                  <div
                    className="w-2 h-px"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                  <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-40">
                    {formatTime(timeAtPoint)}
                  </span>
                </div>
              );
            })}

            {/* Milestones */}
            {milestones.map((m, idx) => {
              const y = m.position * classicalBarPx;
              if (y < 20 || y > classicalBarPx - 20) return null;

              return (
                <div
                  key={`milestone-${idx}`}
                  className="absolute left-[90px] right-6 flex items-start gap-3"
                  style={{ top: `${y}px`, transform: 'translateY(-50%)' }}
                >
                  {/* Connector line */}
                  <div
                    className="w-6 h-px flex-shrink-0 mt-2.5"
                    style={{ background: m.icon === '⚡' ? 'var(--quantum)' : 'rgba(255,255,255,0.15)' }}
                  />
                  {/* Milestone card */}
                  <div
                    className="rounded-lg px-3 py-2 border"
                    style={{
                      background: m.icon === '⚡'
                        ? 'rgba(124, 58, 237, 0.1)'
                        : 'rgba(255, 255, 255, 0.03)',
                      borderColor: m.icon === '⚡'
                        ? 'rgba(124, 58, 237, 0.3)'
                        : 'var(--border)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.icon}</span>
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: m.icon === '⚡' ? 'var(--quantum)' : 'var(--text)',
                        }}
                      >
                        {m.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 ml-6">
                      {m.sublabel}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* End of bar */}
            <div
              className="absolute left-0 right-0 flex items-start pt-6 pl-6 gap-4"
              style={{ top: `${classicalBarPx}px` }}
            >
              <div
                className="w-[32px] h-1 rounded-full ml-[40px] flex-shrink-0"
                style={{ background: 'var(--classical)' }}
              />
              <div className="-mt-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--classical)' }}>
                  Fim da barra clássica
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {formatTime(point.classicalMs)}
                </p>
              </div>
            </div>

            {/* If capped, show how much more it would be */}
            {isCapped && (
              <div
                className="absolute left-0 right-0 px-6"
                style={{ top: `${classicalBarPx + 80}px` }}
              >
                <div
                  className="rounded-xl border p-5 text-center"
                  style={{
                    background: 'rgba(245, 158, 11, 0.05)',
                    borderColor: 'rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                    ⚠️ Na escala real, esta barra continuaria por mais {formatDistance(realClassicalPx - MAX_SCROLL_PX)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    A barra quântica tem {QUANTUM_BAR_PX}px. A clássica teria{' '}
                    <span className="font-mono font-bold text-[var(--text)]">
                      {realClassicalPx > 1_000_000
                        ? formatDistance(realClassicalPx)
                        : `${Math.round(realClassicalPx).toLocaleString('pt-BR')}px`}
                    </span>
                    {' '}— isso é {formatDistance(realClassicalPx)} de tela.
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Você rolou {formatDistance(MAX_SCROLL_PX)}, que representa apenas{' '}
                    <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
                      {((MAX_SCROLL_PX / realClassicalPx) * 100).toFixed(4)}%
                    </span>{' '}
                    do total.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom bar — progress + stats */}
      <div
        className="flex-shrink-0 border-t border-[var(--border)] px-6 py-3"
        style={{ background: 'rgba(5, 5, 16, 0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="w-full h-1 rounded-full bg-white/5 mb-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${scrollProgress * 100}%`,
                background: 'linear-gradient(90deg, var(--quantum), var(--classical))',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>
              Scroll: {Math.round(scrollProgress * 100)}%
            </span>
            <span className="font-mono">
              Diferença:{' '}
              <span className="font-bold" style={{ color: 'var(--quantum)' }}>
                {speedupText} mais rápido
              </span>
            </span>
            <span>
              {isCapped ? `Mostrando ${((MAX_SCROLL_PX / realClassicalPx) * 100).toFixed(2)}% da escala real` : 'Escala 1:1'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
