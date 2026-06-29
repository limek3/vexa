'use client';

import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  type LucideIcon,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import type { BookingStatus } from '@/lib/types';
import { cn, getInitials } from '@/lib/utils';

export type MasterTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet' | 'blue' | 'mint';
export type MasterButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const toneClasses: Record<MasterTone, { badge: string; soft: string; icon: string; dot: string }> = {
  neutral: {
    badge: 'border-[var(--cb-master-border)] bg-[var(--cb-master-muted)] text-[var(--cb-master-text-soft)]',
    soft: 'border-[var(--cb-master-border)] bg-[var(--cb-master-muted)]',
    icon: 'border-[var(--cb-master-border)] bg-[var(--cb-master-muted)] text-[var(--cb-master-text-soft)]',
    dot: 'bg-[var(--cb-master-text-faint)]',
  },
  brand: {
    badge: 'border-[color-mix(in_srgb,var(--cb-master-brand)_18%,transparent)] bg-[color-mix(in_srgb,var(--cb-master-brand)_10%,transparent)] text-[var(--cb-master-brand-strong)]',
    soft: 'border-[color-mix(in_srgb,var(--cb-master-brand)_14%,transparent)] bg-[color-mix(in_srgb,var(--cb-master-brand)_7%,var(--cb-master-card))]',
    icon: 'border-[color-mix(in_srgb,var(--cb-master-brand)_16%,transparent)] bg-[color-mix(in_srgb,var(--cb-master-brand)_10%,transparent)] text-[var(--cb-master-brand-strong)]',
    dot: 'bg-[var(--cb-master-brand)]',
  },
  success: {
    badge: 'border-emerald-500/18 bg-emerald-500/9 text-emerald-700 dark:text-emerald-300',
    soft: 'border-emerald-500/14 bg-emerald-500/8',
    icon: 'border-emerald-500/16 bg-emerald-500/9 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  warning: {
    badge: 'border-amber-500/18 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    soft: 'border-amber-500/14 bg-amber-500/8',
    icon: 'border-amber-500/16 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  danger: {
    badge: 'border-rose-500/18 bg-rose-500/9 text-rose-700 dark:text-rose-300',
    soft: 'border-rose-500/14 bg-rose-500/8',
    icon: 'border-rose-500/16 bg-rose-500/9 text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  violet: {
    badge: 'border-violet-500/18 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    soft: 'border-violet-500/14 bg-violet-500/8',
    icon: 'border-violet-500/16 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  blue: {
    badge: 'border-sky-500/18 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    soft: 'border-sky-500/14 bg-sky-500/8',
    icon: 'border-sky-500/16 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  mint: {
    badge: 'border-teal-500/18 bg-teal-500/10 text-teal-700 dark:text-teal-300',
    soft: 'border-teal-500/14 bg-teal-500/8',
    icon: 'border-teal-500/16 bg-teal-500/10 text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
};

const buttonClasses: Record<MasterButtonVariant, string> = {
  primary:
    'border-transparent bg-[linear-gradient(180deg,#8469ff_0%,#6f54f5_100%)] text-white shadow-[0_16px_36px_rgba(124,92,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(124,92,255,0.26)]',
  secondary:
    'border-[var(--cb-master-border)] bg-[var(--cb-master-card)] text-[var(--cb-master-text)] shadow-[0_10px_26px_rgba(20,24,44,0.036)] hover:-translate-y-0.5 hover:border-[var(--cb-master-border-strong)] hover:bg-[var(--cb-master-card-hover)]',
  ghost:
    'border-transparent bg-transparent text-[var(--cb-master-text-soft)] hover:bg-[var(--cb-master-muted)] hover:text-[var(--cb-master-text)]',
  danger:
    'border-rose-500/14 bg-rose-500/9 text-rose-700 hover:-translate-y-0.5 hover:bg-rose-500/13 dark:text-rose-300',
};

export function MasterPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <WorkspaceShell>
      <main className={cn('cb-master-ui min-h-screen bg-[var(--cb-master-bg)] text-[var(--cb-master-text)]', className)}>
        <div className="mx-auto w-full max-w-[1120px] px-5 py-6 sm:px-7 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </WorkspaceShell>
  );
}

export function MasterStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-4 lg:space-y-5', className)}>{children}</div>;
}

export function MasterPageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between', className)}>
      <div className="max-w-3xl">
        {eyebrow ? (
          <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cb-master-text-faint)]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.045em] text-[var(--cb-master-text)] sm:text-[38px]">
          {title}
        </h1>
        {description ? <p className="mt-2.5 max-w-2xl text-[14px] leading-6 text-[var(--cb-master-text-soft)]">{description}</p> : null}
        {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function MasterCard({
  children,
  className,
  padding = 'md',
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-[18px] border border-[var(--cb-master-border)] bg-[var(--cb-master-card)] shadow-[var(--cb-master-shadow)] backdrop-blur-xl',
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:border-[var(--cb-master-border-strong)] hover:bg-[var(--cb-master-card-hover)] hover:shadow-[var(--cb-master-shadow-strong)]',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-[18px]',
        padding === 'lg' && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MasterSectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        <h2 className="text-[16px] font-semibold leading-tight tracking-[-0.03em] text-[var(--cb-master-text)]">{title}</h2>
        {description ? <p className="mt-1.5 text-[12px] leading-5 text-[var(--cb-master-text-soft)]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MasterButton({
  children,
  href,
  variant = 'secondary',
  className,
  disabled,
  type = 'button',
  ...buttonProps
}: {
  children: ReactNode;
  href?: string;
  variant?: MasterButtonVariant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
} & Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'type' | 'disabled'>) {
  const classes = cn(
    'inline-flex h-10 items-center justify-center gap-2 rounded-[13px] border px-4 text-[12px] font-semibold tracking-[-0.015em] transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cb-master-ring)] disabled:pointer-events-none disabled:opacity-50',
    buttonClasses[variant],
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} {...buttonProps}>
      {children}
    </button>
  );
}

export function MasterIconBox({ icon: Icon, tone = 'brand', className }: { icon: LucideIcon; tone?: MasterTone; className?: string }) {
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-[12px] border shadow-[0_8px_18px_rgba(20,24,44,0.026)]', toneClasses[tone].icon, className)}>
      <Icon className="size-[15px]" />
    </span>
  );
}

export function MasterBadge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: MasterTone; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-semibold tracking-[-0.01em]', toneClasses[tone].badge, className)}>
      {children}
    </span>
  );
}

export function MasterDot({ tone = 'neutral', className }: { tone?: MasterTone; className?: string }) {
  return <span className={cn('size-2 rounded-full', toneClasses[tone].dot, className)} />;
}

export function MasterStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const map: Record<BookingStatus, { label: string; tone: MasterTone }> = {
    new: { label: 'Новая', tone: 'warning' },
    confirmed: { label: 'Подтверждена', tone: 'success' },
    completed: { label: 'Завершена', tone: 'violet' },
    no_show: { label: 'Не пришёл', tone: 'danger' },
    cancelled: { label: 'Отменена', tone: 'danger' },
  };
  const item = map[status] ?? { label: 'Статус', tone: 'neutral' as MasterTone };
  return <MasterBadge tone={item.tone} className={className}>{item.label}</MasterBadge>;
}

export function MasterStatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: MasterTone;
  className?: string;
}) {
  return (
    <MasterCard padding="sm" className={cn('min-h-[112px]', className)} interactive>
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[var(--cb-master-text-soft)]">{label}</p>
          <div className="mt-3 truncate text-[25px] font-semibold tracking-[-0.055em] text-[var(--cb-master-text)]">{value}</div>
          {hint ? <p className="mt-2 text-[11px] leading-5 text-[var(--cb-master-text-soft)]">{hint}</p> : null}
        </div>
        {icon ? <MasterIconBox icon={icon} tone={tone} /> : null}
      </div>
    </MasterCard>
  );
}

export function MasterAvatar({
  name,
  image,
  size = 'md',
  className,
}: {
  name?: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = size === 'sm' ? 'size-9 text-[11px]' : size === 'lg' ? 'size-14 text-[15px]' : 'size-11 text-[13px]';

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name || 'Аватар'} className={cn(sizeClass, 'shrink-0 rounded-full object-cover ring-2 ring-[var(--cb-master-card)]', className)} />
    );
  }

  return (
    <span className={cn(sizeClass, 'grid shrink-0 place-items-center rounded-full bg-[var(--cb-master-brand-soft)] font-semibold text-[var(--cb-master-brand-strong)] ring-2 ring-[var(--cb-master-card)]', className)}>
      {getInitials(name || 'КБ') || 'КБ'}
    </span>
  );
}

export function MasterInfoRow({
  icon,
  title,
  description,
  value,
  tone = 'neutral',
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  tone?: MasterTone;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-[16px] border border-[var(--cb-master-border)] bg-[var(--cb-master-muted)] p-3', className)}>
      {icon ? <MasterIconBox icon={icon} tone={tone} className="size-9 rounded-[13px]" /> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[var(--cb-master-text)]">{title}</div>
        {description ? <div className="mt-1 truncate text-[12px] text-[var(--cb-master-text-soft)]">{description}</div> : null}
      </div>
      {value ? <div className="shrink-0 text-[13px] font-semibold text-[var(--cb-master-text)]">{value}</div> : null}
    </div>
  );
}

export function MasterEmptyState({
  icon: Icon = CalendarClock,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[20px] border border-dashed border-[var(--cb-master-border-strong)] bg-[var(--cb-master-muted)] px-5 py-8 text-center', className)}>
      <div className="mx-auto grid size-12 place-items-center rounded-[18px] border border-[var(--cb-master-border)] bg-[var(--cb-master-card)] text-[var(--cb-master-text-soft)]">
        <Icon className="size-[18px]" />
      </div>
      <div className="mt-4 text-[15px] font-semibold text-[var(--cb-master-text)]">{title}</div>
      {description ? <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-[var(--cb-master-text-soft)]">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function MasterProgress({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-[var(--cb-master-muted-strong)]', className)}>
      <div className="h-full rounded-full bg-[var(--cb-master-brand)] transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export function MasterTimelineItem({
  time,
  title,
  description,
  meta,
  status,
  tone = 'brand',
  actions,
  className,
}: {
  time: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  status?: BookingStatus;
  tone?: MasterTone;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('group relative grid gap-3 rounded-[18px] border border-[var(--cb-master-border)] bg-[var(--cb-master-card)] p-4 transition hover:border-[var(--cb-master-border-strong)] hover:bg-[var(--cb-master-card-hover)] sm:grid-cols-[74px_minmax(0,1fr)]', className)}>
      <div className="flex items-start gap-2 sm:block">
        <div className="inline-flex min-w-[58px] justify-center rounded-[14px] border border-[var(--cb-master-border)] bg-[var(--cb-master-muted)] px-2.5 py-2 text-center text-[12px] font-semibold leading-tight text-[var(--cb-master-text)]">
          {time}
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <MasterDot tone={tone} />
          <h3 className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-[-0.025em] text-[var(--cb-master-text)]">{title}</h3>
          {status ? <MasterStatusBadge status={status} /> : null}
        </div>
        {description ? <p className="mt-2 text-[12px] leading-5 text-[var(--cb-master-text-soft)]">{description}</p> : null}
        {(meta || actions) ? (
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : <span />}
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MasterSplitGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]', className)}>{children}</div>;
}

export function MasterTwoColumn({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 lg:grid-cols-2', className)}>{children}</div>;
}

export function MasterKbd({ children }: { children: ReactNode }) {
  return <span className="rounded-md border border-[var(--cb-master-border)] bg-[var(--cb-master-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--cb-master-text-faint)]">{children}</span>;
}

export function MasterMiniTrend({ values, className }: { values: number[]; className?: string }) {
  const safeValues = values.length ? values : [24, 42, 33, 58, 46, 64, 72];
  const max = Math.max(...safeValues, 1);
  return (
    <div className={cn('flex h-14 items-end gap-1.5', className)}>
      {safeValues.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="min-w-0 flex-1 rounded-t-[8px] bg-[linear-gradient(180deg,var(--cb-master-brand)_0%,color-mix(in_srgb,var(--cb-master-brand)_24%,transparent)_100%)] opacity-[0.86]"
          style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function MasterChecklist({
  items,
  className,
}: {
  items: Array<{ label: ReactNode; done?: boolean; hint?: ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3 rounded-[16px] border border-[var(--cb-master-border)] bg-[var(--cb-master-muted)] p-3">
          <span className={cn('mt-0.5 grid size-7 place-items-center rounded-full border', item.done ? 'border-emerald-500/18 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'border-[var(--cb-master-border)] bg-[var(--cb-master-card)] text-[var(--cb-master-text-faint)]')}>
            {item.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-3.5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-[var(--cb-master-text)]">{item.label}</span>
            {item.hint ? <span className="mt-1 block text-[12px] leading-5 text-[var(--cb-master-text-soft)]">{item.hint}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MasterActionLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--cb-master-brand-strong)] transition hover:gap-2', className)}>
      {children}
      <ArrowRight className="size-4" />
    </Link>
  );
}
