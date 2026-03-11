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

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}min`;
  if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h`;
  if (ms < 31_536_000_000) {
    const days = ms / 86_400_000;
    const d = days < 10 ? days.toFixed(1) : Math.round(days).toString();
    return `${d} ${days < 1.05 ? 'dia' : 'dias'}`;
  }
  const years = ms / 31_536_000_000;
  if (years < 1_000) {
    const y = years < 10 ? years.toFixed(1) : Math.round(years).toString();
    return `${y} ${years < 1.05 ? 'ano' : 'anos'}`;
  }
  if (years < 1_000_000) return `${(years / 1e3).toFixed(1)} mil anos`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} milhões de anos`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)} bilhões de anos`;
  return `${(years / 1e12).toFixed(1)} trilhões de anos`;
}

function formatDistance(px: number): string {
  const mm = px * 0.2646;
  if (mm < 10) return `${mm.toFixed(1)}mm`;
  if (mm < 1000) return `${(mm / 10).toFixed(1)}cm`;
  if (mm < 1_000_000) return `${(mm / 1000).toFixed(1)}m`;
  return `${(mm / 1_000_000).toFixed(1)}km`;
}

interface Milestone {
  position: number;
  label: string;
  sublabel: string;
  icon: string;
}

function generateMilestones(
  classicalMs: number,
  quantumMs: number,
): Milestone[] {
  const milestones: Milestone[] = [];

  const quantumFraction = quantumMs / classicalMs;
  if (quantumFraction < 0.8) {
    milestones.push({
      position: quantumFraction,
      label: 'O quântico terminou aqui',
      sublabel: formatTime(quantumMs),
      icon: '⚡',
    });
  }

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
        sublabel: `${(fraction * 100).toFixed(fraction < 0.1 ? 2 : 1)}% do tempo clássico`,
        icon: marker.icon,
      });
    }
  }

  milestones.push({
    position: 0.5,
    label: 'Metade do caminho',
    sublabel: formatTime(classicalMs / 2),
    icon: '🔹',
  });

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
  const milestones = generateMilestones(point.classicalMs, point.quantumMs);

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

  // Track scroll progress (horizontal)
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(el.scrollLeft / maxScroll);
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

  // Convert vertical scroll (mouse wheel) into horizontal scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      // Only hijack vertical scroll when there's horizontal room
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const speedupText = ratio < 1000
    ? `${ratio.toFixed(0)}×`
    : ratio < 1e6
    ? `${(ratio / 1e3).toFixed(1)}K×`
    : ratio < 1e9
    ? `${(ratio / 1e6).toFixed(1)}M×`
    : ratio < 1e12
    ? `${(ratio / 1e9).toFixed(1)}B×`
    : `${(ratio / 1e12).toFixed(1)}T×`;

  const tickSpacing = 300;
  const tickCount = Math.min(Math.floor(classicalBarPx / tickSpacing), 60);

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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Escala real — {templateTitle}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Entrada: n = {point.label} • Role para a direita e sinta a diferença →
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

      {/* Horizontal scrollable area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{ cursor: 'grab' }}
      >
        <div
          className="relative h-full"
          style={{ width: `${classicalBarPx + 600}px`, minWidth: '100%' }}
        >
          {/* Quantum bar — tiny, at the start */}
          <div className="absolute left-[40px] top-[40px] flex items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-muted)] w-16 flex-shrink-0 text-right">
              Quântico
            </span>
            <div
              className="rounded-full flex-shrink-0"
              style={{
                width: `${QUANTUM_BAR_PX}px`,
                height: '32px',
                background: 'var(--quantum)',
                boxShadow: '0 0 12px var(--quantum-glow)',
              }}
            />
            <span className="text-sm font-mono font-bold" style={{ color: 'var(--quantum)' }}>
              {formatTime(point.quantumMs)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              ({QUANTUM_BAR_PX}px)
            </span>
          </div>

          {/* Classical bar — extends far to the right */}
          <div className="absolute left-[110px] top-[100px] flex items-center">
            <span className="text-xs font-mono text-[var(--text-muted)] w-16 flex-shrink-0 text-right mr-3 -ml-[86px]">
              Clássico
            </span>
            <div
              className="rounded-r-lg flex-shrink-0"
              style={{
                width: `${classicalBarPx}px`,
                height: '32px',
                background: 'linear-gradient(90deg, var(--classical) 0%, rgba(6, 182, 212, 0.3) 100%)',
                boxShadow: '0 0 20px var(--classical-glow)',
              }}
            />
          </div>

          {/* Scale ticks below the bar */}
          {Array.from({ length: tickCount }, (_, i) => {
            const x = (i + 1) * tickSpacing;
            const fraction = x / classicalBarPx;
            const timeAtPoint = point.classicalMs * fraction;
            return (
              <div
                key={`tick-${i}`}
                className="absolute flex flex-col items-center"
                style={{ left: `${110 + x}px`, top: '140px' }}
              >
                <div
                  className="h-2 w-px"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                />
                <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-50 mt-1 whitespace-nowrap">
                  {formatTime(timeAtPoint)}
                </span>
              </div>
            );
          })}

          {/* Milestones — positioned along the bar */}
          {milestones.map((m, idx) => {
            const x = m.position * classicalBarPx;
            if (x < 30 || x > classicalBarPx - 30) return null;

            const isQuantum = m.icon === '⚡';
            // Alternate milestones above/below to avoid overlap
            const isAbove = idx % 2 === 0;

            return (
              <div
                key={`milestone-${idx}`}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${110 + x}px`,
                  top: isAbove ? '170px' : '170px',
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Connector line */}
                <div
                  className="w-px h-4 flex-shrink-0"
                  style={{ background: isQuantum ? 'var(--quantum)' : 'rgba(255,255,255,0.15)' }}
                />
                {/* Milestone card */}
                <div
                  className="rounded-lg px-3 py-2 border whitespace-nowrap mt-1"
                  style={{
                    background: isQuantum
                      ? 'rgba(124, 58, 237, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isQuantum
                      ? 'rgba(124, 58, 237, 0.3)'
                      : 'var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{m.icon}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isQuantum ? 'var(--quantum)' : 'var(--text)' }}
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

          {/* End of classical bar */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: `${110 + classicalBarPx}px`, top: '84px' }}
          >
            <div
              className="h-[64px] w-1 rounded-full"
              style={{ background: 'var(--classical)' }}
            />
            <div className="mt-2 text-center">
              <p className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--classical)' }}>
                🏁 Fim — {formatTime(point.classicalMs)}
              </p>
            </div>
          </div>

          {/* If capped, show how much more it would be */}
          {isCapped && (
            <div
              className="absolute"
              style={{ left: `${110 + classicalBarPx + 40}px`, top: '60px' }}
            >
              <div
                className="rounded-xl border p-5 max-w-sm"
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

      {/* Fixed bottom bar — progress + stats */}
      <div
        className="flex-shrink-0 border-t border-[var(--border)] px-6 py-3"
        style={{ background: 'rgba(5, 5, 16, 0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-5xl mx-auto">
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
