'use client';

import { type ReactNode } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hover?: boolean;
}

export function CompactCard({ children, onClick, className, hover = true }: CompactCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full rounded-[16px] border border-border/70 bg-card p-3 text-left shadow-none',
        hover && onClick && 'transition-[background,border-color,box-shadow] hover:border-border hover:bg-surface-secondary',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface CompactListItemProps {
  icon?: ReactNode;
  iconTone?: 'emerald' | 'amber' | 'indigo' | 'rose' | 'blue' | 'violet' | 'slate';
  title: string;
  subtitle?: string;
  value?: string | ReactNode;
  onClick?: () => void;
  showArrow?: boolean;
  className?: string;
}

const toneClasses = {
  emerald: 'border-primary/16 bg-primary/8 text-primary',
  amber: 'border-primary/16 bg-primary/8 text-primary',
  indigo: 'border-primary/16 bg-primary/8 text-primary',
  rose: 'border-primary/16 bg-primary/8 text-primary',
  blue: 'border-primary/16 bg-primary/8 text-primary',
  violet: 'border-primary/16 bg-primary/8 text-primary',
  slate: 'border-border bg-accent text-muted-foreground',
};

export function CompactListItem({
  icon,
  iconTone = 'blue',
  title,
  subtitle,
  value,
  onClick,
  showArrow = true,
  className,
}: CompactListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-[16px] border border-border/70 bg-card p-3 text-left transition-[background,border-color,box-shadow] hover:border-border hover:bg-surface-secondary',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
            toneClasses[iconTone]
          )}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>

      {value && (
        <div className="shrink-0 text-[12px] font-medium text-muted-foreground">{value}</div>
      )}

      {showArrow && onClick && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      )}
    </button>
  );
}

interface QuickActionCardProps {
  icon: ReactNode;
  iconTone?: 'emerald' | 'amber' | 'indigo' | 'rose' | 'blue' | 'violet' | 'slate';
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function QuickActionCard({
  icon,
  iconTone = 'blue',
  title,
  description,
  onClick,
  className,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full overflow-hidden rounded-[16px] border border-border/70 bg-card p-3 text-left shadow-none transition-[background,border-color,box-shadow] hover:border-border hover:bg-surface-secondary',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
            toneClasses[iconTone]
          )}
        >
          {icon}
        </div>

        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-muted-foreground transition group-hover:bg-accent-soft group-hover:text-primary">
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>

      <div className="mt-2">
        <p className="text-[13px] font-semibold text-foreground transition group-hover:text-primary">
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-[1.45] text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function SectionHeader({ title, icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-2 flex items-center justify-between', className)}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h2>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-1 rounded-[13px] border px-2.5 py-1 text-[11px] font-medium transition-[background,border-color,color,transform] active:scale-[0.98] cb-menu-button-quiet"
        >
          {action.label}
          <ChevronRight className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-4 py-10 text-center shadow-premium-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-surface-secondary">
        {icon}
      </div>

      <h3 className="mt-3 text-[14px] font-semibold text-foreground">{title}</h3>

      <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-[1.45] text-muted-foreground">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 rounded-[15px] border px-4 py-2 text-[12px] font-medium transition-[background,border-color,color,transform] active:scale-[0.98] cb-neutral-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
