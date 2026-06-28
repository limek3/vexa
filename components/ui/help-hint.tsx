'use client';

import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpHintProps {
  label?: string;
  content: string;
  className?: string;
  iconClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function HelpHint({
  label = 'Подробнее',
  content,
  className,
  iconClassName,
  side = 'top',
}: HelpHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card/78 text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40',
            className,
          )}
        >
          <CircleHelp className={cn('size-3.5', iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        className="max-w-[260px] rounded-2xl border border-border/70 bg-popover/96 px-3.5 py-2.5 text-[12px] leading-5 text-popover-foreground shadow-[var(--shadow-card)] backdrop-blur-xl"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
