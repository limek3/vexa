'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type RefOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

export function RefSection({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('workspace-ref-section', className)}>
      <div className="workspace-ref-section-head flex items-start justify-between gap-3 px-3 py-2.5 md:px-4 md:py-3">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold tracking-[-0.02em] text-white">{title}</div>
          {description ? (
            <div className="mt-1 text-[11px] leading-4 text-white/40">{description}</div>
          ) : null}
        </div>
        {actions ? <div className="shrink-0 pt-0.5">{actions}</div> : null}
      </div>

      <div className="workspace-ref-section-inner px-3 pb-3 md:px-4 md:pb-4">
        <div className={cn('workspace-ref-section-shell', bodyClassName)}>{children}</div>
      </div>
    </section>
  );
}

export function RefRow({
  label,
  description,
  children,
  noBorder = false,
  alignStart = false,
  className,
}: {
  label: string;
  description?: string;
  children: ReactNode;
  noBorder?: boolean;
  alignStart?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'workspace-ref-row grid gap-2 px-3 py-3 lg:grid-cols-[188px_minmax(0,1fr)] lg:gap-4 md:px-4 md:py-3.5',
        !noBorder && 'border-b border-white/[0.06]',
        alignStart ? 'lg:items-start' : 'lg:items-center',
        className,
      )}
    >
      <div className="pr-2">
        <div className="text-[12px] font-semibold leading-4 text-white">{label}</div>
        {description ? <div className="mt-1 text-[10.5px] leading-4 text-white/35">{description}</div> : null}
      </div>
      <div className="min-w-0 lg:flex lg:justify-end">{children}</div>
    </div>
  );
}

export function RefSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<RefOption<T>>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('ref-segmented grid rounded-[10px] border border-white/[0.08] bg-black p-[3px]', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            data-active={active ? 'true' : 'false'}
            aria-pressed={active}
            className={cn(
              'ref-segmented-button inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] px-2.5 text-[11.5px] font-medium transition',
              active
                ? 'border border-white/[0.08] bg-white/[0.08] text-white'
                : 'border border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white',
            )}
          >
            {option.icon}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
