import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
} as const;

const VARIANT_CLASSES = {
  primary:
    'bg-gradient-to-r from-[var(--quantum)] to-purple-500 text-white font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:brightness-110',
  secondary:
    'border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-white/5 hover:border-[var(--text-muted)]',
  ghost:
    'bg-transparent border-none text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2
          transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:pointer-events-none
          ${SIZE_CLASSES[size]}
          ${VARIANT_CLASSES[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
