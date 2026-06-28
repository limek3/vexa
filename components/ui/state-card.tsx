import { AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

type StateCardAction = {
  label: string;
  onClick: () => void;
};

type StateCardTone = 'empty' | 'error';

interface StateCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  primaryAction: StateCardAction;
  secondaryAction?: StateCardAction;
  tone?: StateCardTone;
  className?: string;
}

export function StateCard({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tone = 'empty',
  className,
}: StateCardProps) {
  const ResolvedIcon = Icon ?? AlertTriangle;

  return (
    <Empty
      className={cn(
        'rounded-lg border border-border/70 bg-card px-4 py-8 shadow-premium-sm',
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn(
            'size-12 rounded-md',
            tone === 'error'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-surface-secondary text-muted-foreground',
          )}
        >
          <ResolvedIcon className="h-5 w-5" />
        </EmptyMedia>

        <EmptyTitle className="text-[16px] font-semibold text-foreground">{title}</EmptyTitle>

        <EmptyDescription className="max-w-xs text-[14px] leading-6 text-muted-foreground">
          {description}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent className="mt-1.5 w-auto max-w-none gap-2 sm:flex-row">
        <Button
          onClick={primaryAction.onClick}
          className="h-10 rounded-[15px] px-3.5 text-[13px] font-medium"
        >
          {primaryAction.label}
        </Button>

        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="h-10 rounded-[15px] px-3.5 text-[13px] font-medium"
          >
            {secondaryAction.label}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
