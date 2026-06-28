
'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('workspace-card rounded-[28px] p-5 sm:p-6', className)}>{children}</div>;
}

export function SurfaceHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</div>
        ) : null}
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-foreground sm:text-2xl">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function KpiItem({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}) {
  return (
    <Surface className="p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-[28px] font-semibold tracking-[-0.05em] text-foreground">{value}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {trend ? <span className="workspace-pill">{trend}</span> : null}
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
    </Surface>
  );
}

export function LabelValueList({
  items,
  dense = false,
}: {
  items: Array<{ label: string; value: ReactNode; hint?: ReactNode }>;
  dense?: boolean;
}) {
  return (
    <div className={cn('divide-y divide-border/70 rounded-2xl border border-border/70 bg-background/40', dense ? '' : '')}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('flex items-start justify-between gap-4 px-4', dense ? 'py-3' : 'py-4')}
        >
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{item.label}</div>
            {item.hint ? <div className="mt-1 text-xs text-muted-foreground">{item.hint}</div> : null}
          </div>
          <div className="shrink-0 text-right text-sm text-muted-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function StatusDot({ tone = 'default' }: { tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const styles = {
    default: 'bg-primary/70',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  }[tone];

  return <span className={cn('inline-flex size-2 rounded-full', styles)} />;
}

export function MiniBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const styles = {
    default: 'border-primary/15 bg-primary/8 text-primary',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    danger: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  }[tone];

  return <span className={cn('inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium', styles)}>{children}</span>;
}
