'use client';

import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenHeroProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ScreenHero({
  title,
  subtitle,
  icon,
  badge,
  onBack,
  actions,
  children,
  className,
}: ScreenHeroProps) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="mx-auto max-w-2xl">
        <div
          className={cn(
            'rounded-lg border border-border/70 bg-card p-3 shadow-premium-sm',
            className
          )}
        >
          <div className="flex items-start gap-2.5 px-1 pb-2 pt-1">
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface-secondary text-muted-foreground transition hover:bg-card hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}

            {icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/18 bg-primary/10 text-primary">
                {icon}
              </div>
            )}

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
                {badge}
              </div>

              {subtitle && (
                <p className="mt-0.5 text-[12px] leading-[1.45] text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>

            {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
          </div>

          {children}
        </div>
      </div>
    </header>
  );
}

interface HeroStatProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
}

export function HeroStat({ value, label, icon }: HeroStatProps) {
  return (
    <div className="rounded-md border border-border/70 bg-surface-secondary p-2 text-center">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p className="text-[14px] font-semibold tracking-tight text-foreground">{value}</p>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

interface HeroSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
}

export function HeroSearch({ value, onChange, placeholder, icon }: HeroSearchProps) {
  return (
    <div className="relative mt-1.5">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-md border border-border/70 bg-surface-secondary pr-3 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/35 focus:bg-card',
          icon ? 'pl-9' : 'pl-3'
        )}
      />
    </div>
  );
}

interface HeroInfoBarProps {
  children: ReactNode;
  className?: string;
}

export function HeroInfoBar({ children, className }: HeroInfoBarProps) {
  return (
    <div
      className={cn(
        'mt-1.5 flex items-center justify-between rounded-md border border-border/70 bg-surface-secondary px-2.5 py-1.5',
        className
      )}
    >
      {children}
    </div>
  );
}

interface HeroTabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function HeroTabs({ tabs, activeTab, onTabChange }: HeroTabsProps) {
  return (
    <div className="mt-1.5 grid gap-1.5 rounded-md border border-border/70 bg-surface-secondary p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md px-2.5 py-2 text-[11px] font-medium transition-all',
            activeTab === tab.id
              ? 'bg-card text-foreground shadow-premium-sm'
              : 'text-muted-foreground'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
