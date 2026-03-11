interface ComplexityBadgeProps {
  complexity: string;
  variant: 'classical' | 'quantum';
}

const VARIANT_STYLES = {
  classical: {
    color: 'var(--classical)',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.3)',
  },
  quantum: {
    color: 'var(--quantum)',
    bg: 'rgba(124, 58, 237, 0.1)',
    border: 'rgba(124, 58, 237, 0.3)',
  },
} as const;

export function ComplexityBadge({ complexity, variant }: ComplexityBadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide border"
      style={{
        color: styles.color,
        backgroundColor: styles.bg,
        borderColor: styles.border,
      }}
    >
      {complexity}
    </span>
  );
}
