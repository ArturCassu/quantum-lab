'use client';

import { useState, useMemo } from 'react';
import type { Template } from '@/lib/templates';
import { CodeBlock } from '@/components/ui/code-block';
import { ComplexityBadge } from '@/components/ui/complexity-badge';
import { BenchmarkChart } from '@/components/ui/benchmark-chart';

interface ComparisonCardProps {
  template: Template;
}

const CODE_COLLAPSED_LINES = 15;

export function ComparisonCard({ template }: ComparisonCardProps) {
  const [expanded, setExpanded] = useState(false);

  const classicalLines = template.classicalCode.trimEnd().split('\n');
  const quantumLines = template.quantumCode.trimEnd().split('\n');

  const needsTruncation =
    classicalLines.length > CODE_COLLAPSED_LINES ||
    quantumLines.length > CODE_COLLAPSED_LINES;

  const classicalCode = useMemo(
    () =>
      expanded
        ? template.classicalCode
        : classicalLines.slice(0, CODE_COLLAPSED_LINES).join('\n'),
    [expanded, template.classicalCode, classicalLines]
  );

  const quantumCode = useMemo(
    () =>
      expanded
        ? template.quantumCode
        : quantumLines.slice(0, CODE_COLLAPSED_LINES).join('\n'),
    [expanded, template.quantumCode, quantumLines]
  );

  return (
    <div
      className="rounded-2xl border border-[var(--border)] overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.03) 0%, var(--bg-card) 50%, rgba(6,182,212,0.03) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{template.icon}</span>
          <div>
            <h3 className="text-xl font-semibold text-[var(--text)]">
              {template.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {template.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-6">
        {/* Classical */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--classical)' }}
            >
              Clássico
            </h4>
            <ComplexityBadge
              complexity={template.classicalComplexity}
              variant="classical"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            ⏱ {template.classicalTime}
          </p>
          <CodeBlock
            code={classicalCode}
            language="python"
            label="Clássico"
            accentColor="var(--classical)"
          />
        </div>

        {/* Quantum */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--quantum)' }}
            >
              Quântico
            </h4>
            <ComplexityBadge
              complexity={template.quantumComplexity}
              variant="quantum"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            ⏱ {template.quantumTime}
          </p>
          <CodeBlock
            code={quantumCode}
            language="python"
            label="Quântico"
            accentColor="var(--quantum)"
          />
        </div>
      </div>

      {/* Expand / Collapse */}
      {needsTruncation && (
        <div className="px-6 pt-3 flex justify-center">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer px-4 py-1.5 rounded-lg hover:bg-white/5"
          >
            {expanded
              ? '▲ Recolher código'
              : `▼ Expandir código (${Math.max(classicalLines.length, quantumLines.length)} linhas)`}
          </button>
        </div>
      )}

      {/* Benchmark Simulation */}
      <div className="px-6 pt-4">
        <BenchmarkChart
          benchmarks={template.benchmarks}
          templateId={template.id}
        />
      </div>

      {/* Explanation */}
      <div className="px-6 pt-4">
        <div className="rounded-xl p-4 border border-[var(--border)] bg-white/[0.02]">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            💡 {template.explanation}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="px-6 py-5 flex flex-wrap gap-2">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-medium border border-[var(--border)] text-[var(--text-muted)] bg-white/[0.02]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
