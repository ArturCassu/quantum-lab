'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BenchmarkPoint } from '@/lib/templates';
import { ScaleModal } from './scale-modal';

interface BenchmarkChartProps {
  benchmarks: BenchmarkPoint[];
  templateId: string;
  templateTitle: string;
}

type SimulationState = 'idle' | 'running' | 'done';

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
  if (years < 1_000_000) return `${years.toFixed(0)} anos`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)}M anos`;
  return `${(years / 1e9).toFixed(1)}B anos`;
}

function getSpeedupLabel(classical: number, quantum: number): string {
  if (quantum <= 0) return '';
  const ratio = classical / quantum;
  if (ratio < 1.1) return '~1×';
  if (ratio < 1000) return `${ratio.toFixed(0)}×`;
  if (ratio < 1e6) return `${(ratio / 1e3).toFixed(1)}K×`;
  if (ratio < 1e9) return `${(ratio / 1e6).toFixed(1)}M×`;
  if (ratio < 1e12) return `${(ratio / 1e9).toFixed(1)}B×`;
  return `${(ratio / 1e12).toFixed(1)}T×`;
}

export function BenchmarkChart({ benchmarks, templateId, templateTitle }: BenchmarkChartProps) {
  const [state, setState] = useState<SimulationState>('idle');
  const [activeStep, setActiveStep] = useState(-1);
  const [barWidths, setBarWidths] = useState<number[]>([]);
  const [scalePoint, setScalePoint] = useState<BenchmarkPoint | null>(null);
  const animationRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const runSimulation = useCallback(() => {
    setState('running');
    setActiveStep(-1);
    setBarWidths([]);

    const totalSteps = benchmarks.length;
    let step = 0;

    const runStep = () => {
      if (!mountedRef.current || step >= totalSteps) {
        if (mountedRef.current) setState('done');
        return;
      }

      setActiveStep(step);

      // Use ALL benchmarks for consistent scale from frame 1
      const allValues = benchmarks.flatMap((b) => [
        Math.log10(Math.max(b.classicalMs, 0.001)),
        Math.log10(Math.max(b.quantumMs, 0.001)),
      ]);
      const maxLog = Math.max(...allValues);
      const minLog = Math.min(...allValues);
      const range = maxLog - minLog || 1;

      const newWidths = benchmarks.slice(0, step + 1).flatMap((b) => {
        const classicalLog = Math.log10(Math.max(b.classicalMs, 0.001));
        const quantumLog = Math.log10(Math.max(b.quantumMs, 0.001));
        return [
          ((classicalLog - minLog) / range) * 85 + 15,
          ((quantumLog - minLog) / range) * 85 + 15,
        ];
      });

      setBarWidths(newWidths);

      step++;
      setTimeout(() => {
        if (mountedRef.current) runStep();
      }, 600);
    };

    setTimeout(runStep, 300);
  }, [benchmarks]);

  const reset = useCallback(() => {
    setState('idle');
    setActiveStep(-1);
    setBarWidths([]);
  }, []);

  const visibleBenchmarks = benchmarks.slice(0, activeStep + 1);

  return (
    <div className="space-y-4">
      {/* Play / Reset button */}
      <div className="flex items-center gap-3">
        <button
          onClick={state === 'done' ? reset : runSimulation}
          disabled={state === 'running'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background:
              state === 'done'
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, var(--classical) 0%, var(--quantum) 100%)',
            color: state === 'done' ? 'var(--text-muted)' : '#fff',
            border: '1px solid',
            borderColor: state === 'done' ? 'var(--border)' : 'transparent',
          }}
        >
          {state === 'idle' && (
            <>
              <PlayIcon />
              Simular benchmark
            </>
          )}
          {state === 'running' && (
            <>
              <SpinnerIcon />
              Simulando...
            </>
          )}
          {state === 'done' && (
            <>
              <ResetIcon />
              Reiniciar
            </>
          )}
        </button>

        {state !== 'idle' && (
          <span className="text-xs text-[var(--text-muted)]">
            {activeStep + 1} / {benchmarks.length} tamanhos de entrada
          </span>
        )}
      </div>

      {/* Chart area */}
      {state !== 'idle' && (
        <div
          className="rounded-xl border border-[var(--border)] p-4 space-y-3 overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-2">
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: 'var(--classical)' }}
              />
              Clássico
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ background: 'var(--quantum)' }}
              />
              Quântico
            </span>
            <span className="ml-auto font-mono">escala logarítmica</span>
          </div>

          {/* Bars */}
          {visibleBenchmarks.map((point, idx) => {
            const classicalWidth = barWidths[idx * 2] ?? 0;
            const quantumWidth = barWidths[idx * 2 + 1] ?? 0;
            const isActive = idx === activeStep;
            const speedup = getSpeedupLabel(point.classicalMs, point.quantumMs);
            const ratio = point.classicalMs / point.quantumMs;
            const showScaleButton = ratio > 10;

            return (
              <div
                key={`${templateId}-${point.label}`}
                className="space-y-1"
                style={{
                  opacity: isActive ? 1 : 0.7,
                  transition: 'opacity 0.3s',
                }}
              >
                {/* Input size label */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    n = {point.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {point.classicalMs > point.quantumMs && (
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: 'var(--quantum)',
                          background: 'rgba(124, 58, 237, 0.15)',
                        }}
                      >
                        ⚡ {speedup} mais rápido
                      </span>
                    )}
                    {showScaleButton && (
                      <button
                        onClick={() => setScalePoint(point)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full cursor-pointer transition-colors hover:bg-white/10"
                        style={{
                          color: 'var(--accent)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                        title="Ver diferença em escala real"
                      >
                        📏 Ver escala
                      </button>
                    )}
                  </div>
                </div>

                {/* Classical bar */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 rounded-r-md relative overflow-hidden"
                    style={{
                      width: `${classicalWidth}%`,
                      background: 'var(--classical)',
                      opacity: 0.8,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      minWidth: '2px',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap">
                    {formatTime(point.classicalMs)}
                  </span>
                </div>

                {/* Quantum bar */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-5 rounded-r-md relative overflow-hidden"
                    style={{
                      width: `${quantumWidth}%`,
                      background: 'var(--quantum)',
                      opacity: 0.8,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      minWidth: '2px',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap">
                    {formatTime(point.quantumMs)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Summary when done */}
          {state === 'done' && benchmarks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-center gap-4">
              <p className="text-xs text-[var(--text-muted)]">
                No maior input ({benchmarks[benchmarks.length - 1].label}), o
                algoritmo quântico é{' '}
                <span
                  className="font-bold"
                  style={{ color: 'var(--quantum)' }}
                >
                  {getSpeedupLabel(
                    benchmarks[benchmarks.length - 1].classicalMs,
                    benchmarks[benchmarks.length - 1].quantumMs
                  )}
                </span>{' '}
                mais rápido
              </p>
              <button
                onClick={() => setScalePoint(benchmarks[benchmarks.length - 1])}
                className="text-[11px] font-medium px-3 py-1 rounded-lg cursor-pointer transition-all hover:brightness-110"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                📏 Sentir a diferença
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scale modal */}
      {scalePoint && (
        <ScaleModal
          point={scalePoint}
          templateTitle={templateTitle}
          onClose={() => setScalePoint(null)}
        />
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14.72a1 1 0 001.5.86l11.5-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
    </svg>
  );
}
