import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl">⚛️</span>
          <span
            className="text-lg font-bold tracking-tight text-[var(--text)] group-hover:text-[var(--quantum)] transition-colors"
            style={{
              textShadow: '0 0 30px rgba(124, 58, 237, 0.3)',
            }}
          >
            Quantum Lab
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Comparações
          </Link>
          <Link
            href="/playground"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Playground
          </Link>
        </nav>
      </div>
    </header>
  );
}
