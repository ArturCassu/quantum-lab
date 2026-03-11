import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ComparisonCard } from '@/components/sections/comparison-card';
import { TEMPLATES } from '@/lib/templates';

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="min-h-screen">
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(124,58,237,0.12) 0%, transparent 60%), ' +
                'radial-gradient(ellipse 40% 40% at 60% 40%, rgba(6,182,212,0.08) 0%, transparent 60%)',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Computação{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #7c3aed 0%, #a78bfa 40%, #c084fc 100%)',
                }}
              >
                Quântica
              </span>
              <br />
              <span className="text-[var(--text-muted)]">vs Clássica</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              Compare algoritmos lado a lado. Entenda onde — e por que — a
              computação quântica faz diferença.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#comparisons"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 text-base rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-[var(--quantum)] to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:brightness-110"
              >
                Ver Comparações
              </a>
              <Link
                href="/playground"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 text-base rounded-xl font-medium transition-all duration-200 border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-white/5 hover:border-[var(--text-muted)]"
              >
                Playground IA →
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Comparisons ───────────────────────────────────────────── */}
        <section id="comparisons" className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 rounded-full bg-[var(--quantum)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--quantum)]">
              Comparações
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-12">
            Algoritmos clássicos vs quânticos
          </h2>

          <div className="space-y-8">
            {TEMPLATES.map((template) => (
              <ComparisonCard key={template.id} template={template} />
            ))}
          </div>
        </section>

        {/* ─── CTA to Playground ─────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div
            className="rounded-2xl border border-[var(--border)] p-8 sm:p-12 text-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, var(--bg-card) 50%, rgba(6,182,212,0.05) 100%)',
            }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
              Quer testar com seus próprios scripts?
            </h3>
            <p className="mt-3 text-[var(--text-muted)] max-w-lg mx-auto">
              Use o playground de IA pra analisar seu código e descobrir se ele
              pode ser otimizado com computação quântica.
            </p>
            <div className="mt-8">
              <Link
                href="/playground"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 text-base rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-[var(--quantum)] to-purple-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:brightness-110"
              >
                Abrir Playground →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
