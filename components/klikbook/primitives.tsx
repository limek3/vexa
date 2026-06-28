'use client';

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type DivProps = HTMLAttributes<HTMLDivElement>;

export const KbCard = forwardRef<HTMLDivElement, DivProps & { tone?: 'surface' | 'soft' | 'dark' }>(
  function KbCard({ className, tone = 'surface', children, ...rest }, ref) {
    const cls =
      tone === 'dark'
        ? 'kb-card-dark relative overflow-hidden p-6'
        : tone === 'soft'
          ? 'kb-card-soft p-6'
          : 'kb-card p-6';
    return (
      <div ref={ref} className={cn(cls, className)} {...rest}>
        {children}
      </div>
    );
  },
);

export function KbDisplay({
  level = 1,
  children,
  className,
}: {
  level?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  const Tag = (`h${level}` as 'h1' | 'h2' | 'h3');
  const sizeClass = level === 1 ? 'kb-h1' : level === 2 ? 'kb-h2' : 'kb-h3';
  return <Tag className={cn('kb-display', sizeClass, className)}>{children}</Tag>;
}

export function KbEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('kb-eyebrow', className)}>{children}</span>;
}

export type KbButtonVariant = 'primary' | 'navy' | 'outline' | 'ghost';
type KbButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: KbButtonVariant;
  size?: 'sm' | 'md' | 'lg';
};

export const KbButton = forwardRef<HTMLButtonElement, KbButtonProps>(function KbButton(
  { variant = 'primary', size = 'md', className, children, ...rest },
  ref,
) {
  const variantCls =
    variant === 'primary'
      ? 'kb-btn-primary'
      : variant === 'navy'
        ? 'kb-btn-navy'
        : variant === 'outline'
          ? 'kb-btn-outline'
          : 'kb-btn-ghost';
  const sizeCls = size === 'sm' ? 'h-9 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-11 px-5';
  return (
    <button ref={ref} className={cn('kb-btn', variantCls, sizeCls, className)} {...rest}>
      {children}
    </button>
  );
});

export function KbChip({
  tone = 'default',
  children,
  className,
  active,
  count,
  onClick,
}: {
  tone?: 'default' | 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'active';
  children: ReactNode;
  className?: string;
  active?: boolean;
  count?: number | string;
  onClick?: () => void;
}) {
  const cls =
    active || tone === 'active'
      ? 'kb-chip-active'
      : tone === 'confirmed'
        ? 'kb-chip-confirmed'
        : tone === 'pending'
          ? 'kb-chip-pending'
          : tone === 'cancelled'
            ? 'kb-chip-cancelled'
            : tone === 'completed'
              ? 'kb-chip-completed'
              : 'kb-chip-default';
  return (
    <button type="button" onClick={onClick} className={cn('kb-chip', cls, onClick ? 'cursor-pointer' : '', className)}>
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px]',
            active || tone === 'active' ? 'bg-white/15 text-white' : 'bg-black/5 text-[var(--kb-text-secondary)]',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

type Tone = 'lavender' | 'sage' | 'peach' | 'cream' | 'sky' | 'coral';

export function KbIconTile({
  tone,
  children,
  size = 44,
  className,
}: {
  tone: Tone;
  children: ReactNode;
  size?: number;
  className?: string;
}) {
  const style: CSSProperties = { width: size, height: size, borderRadius: 14 };
  return (
    <span className={cn('kb-icon-tile', `kb-icon-tile-${tone}`, className)} style={style}>
      {children}
    </span>
  );
}

export function KbStatCard({
  label,
  value,
  delta,
  deltaTone = 'positive',
  caption,
  icon,
  iconTone = 'lavender',
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
  caption?: ReactNode;
  icon?: ReactNode;
  iconTone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn('kb-card flex items-start gap-4 p-5', className)}>
      {icon && <KbIconTile tone={iconTone}>{icon}</KbIconTile>}
      <div className="min-w-0 flex-1">
        <div className="kb-eyebrow mb-2 truncate">{label}</div>
        <div className="kb-metric text-[28px] leading-none text-[var(--kb-text)]">{value}</div>
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          {delta && (
            <span
              className={cn(
                'font-medium',
                deltaTone === 'positive'
                  ? 'text-[var(--kb-status-confirmed)]'
                  : deltaTone === 'negative'
                    ? 'text-[var(--kb-coral)]'
                    : 'text-[var(--kb-text-muted)]',
              )}
            >
              {delta}
            </span>
          )}
          {caption && <span className="text-[var(--kb-text-muted)]">{caption}</span>}
        </div>
      </div>
    </div>
  );
}

export function KbDarkSummary({
  eyebrow,
  title,
  value,
  delta,
  children,
  className,
}: {
  eyebrow?: string;
  title?: string;
  value: ReactNode;
  delta?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('kb-card-dark relative overflow-hidden p-6', className)}>
      <div className="relative z-[1]">
        {eyebrow && (
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/55">{eyebrow}</div>
        )}
        {title && <div className="mt-2 text-[15px] text-white/80">{title}</div>}
        <div className="kb-metric mt-3 text-[40px] leading-none text-white">{value}</div>
        {delta && <div className="mt-2 text-[13px] text-[#7DCB9C]">{delta}</div>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}

export function KbSectionTitle({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <KbEyebrow className="mb-3 block">{eyebrow}</KbEyebrow>}
        <h2 className="kb-display kb-h2">{title}</h2>
        {description && (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--kb-text-secondary)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function KbDivider({ className }: { className?: string }) {
  return <hr className={cn('kb-divider', className)} />;
}

export function KbAvatar({
  src,
  alt,
  size = 36,
  fallback,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  fallback?: string;
  className?: string;
}) {
  const style: CSSProperties = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn('kb-avatar', className)} style={style} />;
  }
  const initials = (fallback || alt)
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn('kb-avatar inline-flex items-center justify-center text-[12px] font-semibold text-[var(--kb-text-secondary)]', className)}
      style={style}
    >
      {initials || '·'}
    </span>
  );
}
