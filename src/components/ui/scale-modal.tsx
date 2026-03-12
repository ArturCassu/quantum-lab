'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { BenchmarkPoint } from '@/lib/templates';
import { createPortal } from 'react-dom';

interface ScaleModalProps {
  point: BenchmarkPoint;
  templateTitle: string;
  onClose: () => void;
}

const MAX_SCROLL_PX = 80_000;
const QUANTUM_BAR_PX = 4;
const BAR_HEIGHT = 40;
const BAR_LEFT = 100;

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
  isQuantum?: boolean;
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
      label: 'Quântico terminou aqui',
      sublabel: formatTime(quantumMs),
      icon: '⚡',
      isQuantum: true,
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
        sublabel: `${(fraction * 100).toFixed(fraction < 0.1 ? 2 : 1)}%`,
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
  let lastPos = -0.08;
  for (const m of milestones) {
    if (m.position - lastPos > 0.06) {
      filtered.push(m);
      lastPos = m.position;
    }
  }

  return filtered;
}

function generateTicks(classicalBarPx: number, classicalMs: number) {
  // Smart ticks: use significant time boundaries
  const significantTimes = [
    1000, 5000, 10_000, 30_000, 60_000, 300_000, 600_000,
    3_600_000, 7_200_000, 14_400_000, 28_800_000,
    86_400_000, 172_800_000, 345_600_000, 604_800_000,
    2_592_000_000, 7_776_000_000, 15_552_000_000,
    31_536_000_000,
  ];

  const ticks: Array<{ x: number; label: string }> = [];
  for (const t of significantTimes) {
    const fraction = t / classicalMs;
    if (fraction > 0.02 && fraction < 0.98) {
      const x = fraction * classicalBarPx;
      ticks.push({ x, label: formatTime(t) });
    }
  }

  // Only add evenly-spaced fallback if very few significant ticks, and limit to 6
  if (ticks.length < 3) {
    const count = Math.min(Math.floor(classicalBarPx / 2000), 6);
    for (let i = 1; i <= count; i++) {
      const fraction = i / (count + 1);
      const x = fraction * classicalBarPx;
      const timeAtPoint = classicalMs * fraction;
      const tooClose = ticks.some((t) => Math.abs(t.x - x) < 600);
      if (!tooClose) {
        ticks.push({ x, label: formatTime(timeAtPoint) });
      }
    }
  }

  ticks.sort((a, b) => a.x - b.x);

  // Filter overlapping ticks — minimum spacing scales with bar size
  const minSpacing = Math.max(400, classicalBarPx / 12);
  const filtered: typeof ticks = [];
  let lastX = -minSpacing;
  for (const t of ticks) {
    if (t.x - lastX > minSpacing) {
      filtered.push(t);
      lastX = t.x;
    }
  }

  return filtered;
}

function ScaleModalContent({ point, templateTitle, onClose }: ScaleModalProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ratio = point.classicalMs / point.quantumMs;
  const realClassicalPx = QUANTUM_BAR_PX * ratio;
  const isCapped = realClassicalPx > MAX_SCROLL_PX;
  const classicalBarPx = Math.min(realClassicalPx, MAX_SCROLL_PX);
  const milestones = generateMilestones(point.classicalMs, point.quantumMs);
  const ticks = generateTicks(classicalBarPx, point.classicalMs);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    return () => {
      document.body.style.overflow = '';
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(el.scrollLeft / maxScroll);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 2;
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

  // Center of vertical area for bars
  const barsY = 'calc(50% - 60px)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(5, 5, 16, 0.98)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* ─── Header ─── */}
      <div
        style={{
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 24px',
          background: 'rgba(5, 5, 16, 0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#F0F0F5', margin: 0 }}>
              📏 Escala real — {templateTitle}
            </h2>
            <p style={{ fontSize: 12, color: '#8B8FA3', margin: '4px 0 0' }}>
              n = {point.label} · {formatTime(point.quantumMs)} (quântico) vs {formatTime(point.classicalMs)} (clássico) · Role para a direita →
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Speedup badge */}
            <div
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: '#a78bfa',
              }}
            >
              ⚡ {speedupText} mais rápido
            </div>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B8FA3',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Scrollable area ─── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          cursor: 'grab',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: classicalBarPx + 600,
            minWidth: '100%',
            height: '100%',
          }}
        >
          {/* ─── Quantum row ─── */}
          <div
            style={{
              position: 'absolute',
              left: BAR_LEFT,
              top: barsY,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transform: 'translateY(-30px)',
            }}
          >
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a78bfa', fontWeight: 600, width: 0, marginLeft: -BAR_LEFT, paddingLeft: 16, whiteSpace: 'nowrap' }}>
              ⚡ Quântico
            </span>
            <div
              style={{
                width: QUANTUM_BAR_PX,
                height: BAR_HEIGHT,
                borderRadius: 4,
                background: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)',
                boxShadow: '0 0 16px rgba(124,58,237,0.5), 0 0 4px rgba(124,58,237,0.8)',
                flexShrink: 0,
                marginLeft: BAR_LEFT - 8 - QUANTUM_BAR_PX,
              }}
            />
            <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#a78bfa' }}>
              {formatTime(point.quantumMs)}
            </span>
            <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'monospace' }}>
              ({QUANTUM_BAR_PX}px)
            </span>
          </div>

          {/* ─── Classical row ─── */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: barsY,
              display: 'flex',
              alignItems: 'center',
              transform: 'translateY(30px)',
            }}
          >
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#22d3ee', fontWeight: 600, width: BAR_LEFT, paddingLeft: 16, flexShrink: 0, whiteSpace: 'nowrap' }}>
              🐌 Clássico
            </span>
            <div
              style={{
                width: classicalBarPx,
                height: BAR_HEIGHT,
                borderRadius: '0 8px 8px 0',
                background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 30%, rgba(6,182,212,0.5) 100%)',
                boxShadow: '0 0 24px rgba(6,182,212,0.3)',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Subtle pattern inside the bar */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '0 8px 8px 0',
                background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 98px, rgba(255,255,255,0.06) 98px, rgba(255,255,255,0.06) 100px)',
              }} />
            </div>
          </div>

          {/* ─── Ticks below classical bar ─── */}
          {ticks.map((tick, i) => (
            <div
              key={`tick-${i}`}
              style={{
                position: 'absolute',
                left: BAR_LEFT + tick.x,
                top: barsY,
                transform: 'translateY(calc(30px + 48px))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#4B5563', marginTop: 4, whiteSpace: 'nowrap' }}>
                {tick.label}
              </span>
            </div>
          ))}

          {/* ─── Milestones ─── */}
          {milestones.map((m, idx) => {
            const x = m.position * classicalBarPx;
            if (x < 40 || x > classicalBarPx - 40) return null;

            // Alternate above/below the bars
            const isAbove = idx % 2 === 0;
            const verticalOffset = isAbove ? '-110px' : '120px';

            return (
              <div
                key={`ms-${idx}`}
                style={{
                  position: 'absolute',
                  left: BAR_LEFT + x,
                  top: barsY,
                  transform: `translate(-50%, ${verticalOffset})`,
                }}
              >
                {/* Connector line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    width: 1,
                    background: m.isQuantum
                      ? 'rgba(124,58,237,0.4)'
                      : 'rgba(255,255,255,0.06)',
                    ...(isAbove
                      ? { bottom: 0, height: 40 }
                      : { top: -40, height: 40 }),
                  }}
                />
                {/* Card */}
                <div
                  style={{
                    background: m.isQuantum
                      ? 'rgba(124,58,237,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${m.isQuantum ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 10,
                    padding: '8px 14px',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: m.isQuantum ? '#a78bfa' : '#F0F0F5' }}>
                      {m.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0 22px' }}>
                    {m.sublabel}
                  </p>
                </div>
              </div>
            );
          })}

          {/* ─── End marker ─── */}
          <div
            style={{
              position: 'absolute',
              left: BAR_LEFT + classicalBarPx,
              top: barsY,
              transform: 'translateY(-10px)',
            }}
          >
            <div
              style={{
                width: 3,
                height: BAR_HEIGHT + 20,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #22d3ee, #06b6d4)',
                boxShadow: '0 0 12px rgba(6,182,212,0.4)',
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 8, marginLeft: -60 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#22d3ee', whiteSpace: 'nowrap', margin: 0 }}>
                🏁 {formatTime(point.classicalMs)}
              </p>
              <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0', whiteSpace: 'nowrap' }}>
                Fim do tempo clássico
              </p>
            </div>
          </div>

          {/* ─── Overflow card ─── */}
          {isCapped && (
            <div
              style={{
                position: 'absolute',
                left: BAR_LEFT + classicalBarPx + 50,
                top: barsY,
                transform: 'translateY(-40px)',
              }}
            >
              <div
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 14,
                  padding: '20px 24px',
                  maxWidth: 360,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', margin: 0 }}>
                  ⚠️ Na escala real, a barra continuaria por mais {formatDistance(realClassicalPx - MAX_SCROLL_PX)}
                </p>
                <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Barra quântica</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#a78bfa' }}>{QUANTUM_BAR_PX}px</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Barra clássica (real)</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#22d3ee' }}>
                      {realClassicalPx > 1_000_000 ? formatDistance(realClassicalPx) : `${Math.round(realClassicalPx).toLocaleString('pt-BR')}px`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Você viu</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}>
                      {((MAX_SCROLL_PX / realClassicalPx) * 100).toFixed(4)}%
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>
                  Isso seria {formatDistance(realClassicalPx)} de tela física.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Footer with progress ─── */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 24px',
          background: 'rgba(5, 5, 16, 0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', marginBottom: 8, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 2,
                width: `${scrollProgress * 100}%`,
                background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                transition: 'width 0.1s',
                boxShadow: '0 0 8px rgba(124,58,237,0.3)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: '#6B7280', fontFamily: 'monospace' }}>
              📍 {Math.round(scrollProgress * 100)}% rolado
            </span>
            <span style={{ color: '#8B8FA3' }}>
              {isCapped
                ? `Mostrando ${((MAX_SCROLL_PX / realClassicalPx) * 100).toFixed(2)}% da escala real`
                : 'Escala 1:1 — proporção exata entre quântico e clássico'}
            </span>
            <span style={{ color: '#6B7280', fontFamily: 'monospace' }}>
              Use scroll ou arraste →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScaleModal(props: ScaleModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <ScaleModalContent {...props} />,
    document.body
  );
}
