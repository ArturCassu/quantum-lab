'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AiChat } from '@/components/sections/ai-chat';

const EXAMPLES = [
  {
    label: 'Busca linear → quântica',
    prompt:
      'Tenho um script que faz busca linear em uma lista. Existe versão quântica?',
  },
  {
    label: 'Geração de aleatórios',
    prompt:
      'Gere um script clássico e quântico para gerar números aleatórios',
  },
  {
    label: 'Multiplicação de matrizes',
    prompt:
      'A multiplicação de matrizes pode ser otimizada com computação quântica?',
  },
] as const;

export default function PlaygroundPage() {
  const [initialPrompt, setInitialPrompt] = useState('');

  return (
    <>
      <Header />

      <main className="min-h-screen max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">
            ⚛️ Playground Quântico
          </h1>
          <p className="mt-2 text-[var(--text-muted)] max-w-xl">
            Cole um script, descreva uma operação ou pergunte ao especialista IA
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT — Chat (60%) */}
          <div className="lg:col-span-3">
            <AiChat initialPrompt={initialPrompt} />
          </div>

          {/* RIGHT — How to use (40%) */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl border border-[var(--border)] p-6"
              style={{
                background:
                  'linear-gradient(180deg, rgba(124,58,237,0.03) 0%, var(--bg-card) 100%)',
              }}
            >
              <h3 className="text-lg font-semibold text-[var(--text)] mb-1">
                💡 Como usar
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Clique em um exemplo pra preencher o chat
              </p>

              <div className="space-y-3">
                {EXAMPLES.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setInitialPrompt(example.prompt)}
                    className="w-full text-left rounded-xl p-4 border border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--quantum)]/30 transition-all duration-200 cursor-pointer group"
                  >
                    <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--quantum)] transition-colors">
                      {example.label}
                    </span>
                    <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
                      {example.prompt}
                    </p>
                  </button>
                ))}
              </div>

              {/* Tips */}
              <div className="mt-6 pt-5 border-t border-[var(--border)]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  Dicas
                </h4>
                <ul className="space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
                  <li>
                    📋 Cole trechos de código Python pra análise
                  </li>
                  <li>
                    🔬 Pergunte sobre complexidade e Big-O
                  </li>
                  <li>
                    ⚡ Peça comparações lado a lado (clássico vs quântico)
                  </li>
                  <li>
                    🎯 Seja específico sobre o problema que quer resolver
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
