'use client';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-[var(--border)]">
      {tabs.map((tab) => {
        const isActive = tab.id === active;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${
                isActive
                  ? 'text-white bg-[var(--quantum)]/15 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
              }
            `}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-lg border border-[var(--quantum)]/30 pointer-events-none" />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
