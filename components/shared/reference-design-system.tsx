"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type RefTone = "mint" | "blue" | "violet" | "orange" | "neutral";

const iconToneClass: Record<RefTone, string> = {
  mint: "cb-ref-icon-mint",
  blue: "cb-ref-icon-blue",
  violet: "cb-ref-icon-violet",
  orange: "cb-ref-icon-orange",
  neutral:
    "bg-black/[0.035] text-[var(--cb-ref-text-soft)] dark:bg-white/[0.055]",
};

export function RefPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-6 md:pt-7",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[var(--page-max-width)]">
        {children}
      </div>
    </main>
  );
}

export function RefPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="cb-ref-page-title text-[30px] leading-none md:text-[36px]">
          {title}
        </h1>
        {description ? (
          <p className="cb-ref-page-subtitle mt-2 max-w-[840px] text-[13px] leading-5 md:text-[14px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function RefCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("cb-ref-card rounded-[var(--cb-ref-radius-lg)]", className)}
    >
      {children}
    </section>
  );
}

export function RefSection({
  children,
  title,
  description,
  icon: Icon,
  actions,
  tone = "mint",
  className,
  bodyClassName,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  tone?: RefTone;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("cb-ref-section", className)}>
      {title || description || Icon || actions ? (
        <div className="flex min-h-[70px] items-center justify-between gap-4 border-b border-[var(--cb-ref-line)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon ? (
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-[14px]",
                  iconToneClass[tone],
                )}
              >
                <Icon className="size-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              {title ? (
                <h2 className="truncate text-[15px] font-bold tracking-[-0.025em] text-[var(--cb-ref-text)]">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-1 truncate text-[12px] text-[var(--cb-ref-text-soft)]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function RefMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "mint",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: RefTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "cb-ref-metric flex min-h-[96px] min-w-0 items-center justify-between gap-4 px-4 py-3.5",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-[12px] font-medium text-[var(--cb-ref-text-soft)]">
          {label}
        </div>
        <div className="mt-2 truncate text-[24px] font-bold leading-none tracking-[-0.05em] text-[var(--cb-ref-text)] tabular-nums">
          {value}
        </div>
        {hint ? (
          <div className="mt-2 truncate text-[11px] text-[var(--cb-ref-text-faint)]">
            {hint}
          </div>
        ) : null}
      </div>
      {Icon ? (
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-[16px]",
            iconToneClass[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      ) : null}
    </div>
  );
}

export function RefSegmentedControl<T extends string>({
  value,
  items,
  onChange,
  className,
}: {
  value: T;
  items: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "cb-ref-control inline-flex h-10 items-center rounded-[14px] border p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "h-8 min-w-[74px] rounded-[10px] px-3 text-[12px] font-semibold transition",
              active
                ? "bg-white text-[var(--cb-ref-text)] shadow-[0_8px_18px_rgba(22,35,55,0.07)] dark:bg-white/[0.09] dark:text-white"
                : "text-[var(--cb-ref-text-soft)] hover:text-[var(--cb-ref-text)]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function RefIconButton({
  icon: Icon,
  label,
  active,
  onClick,
  className,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "cb-ref-control grid size-10 place-items-center rounded-[14px] border transition active:scale-[0.98]",
        active && "cb-neutral-primary",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

export function RefBadge({
  children,
  tone = "mint",
  className,
}: {
  children: ReactNode;
  tone?: RefTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "cb-ref-pill px-3 py-1 text-[11px] font-semibold",
        tone !== "neutral" && iconToneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RefEmptyState({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "cb-ref-card grid min-h-[260px] place-items-center rounded-[var(--cb-ref-radius-lg)] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mx-auto max-w-[420px]">
        {Icon ? (
          <span className="cb-ref-icon-blue mx-auto mb-4 grid size-12 place-items-center rounded-[18px]">
            <Icon className="size-5" />
          </span>
        ) : null}
        <h3 className="text-[18px] font-bold tracking-[-0.035em] text-[var(--cb-ref-text)]">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 text-[13px] leading-5 text-[var(--cb-ref-text-soft)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
