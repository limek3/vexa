'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Paperclip, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptAction {
  id: string;
  icon: LucideIcon;
  title: string;
}

interface PromptBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  hint: string;
  onlineLabel: string;
  actions: PromptAction[];
  activeActionId: string;
  onActionClick: (actionId: string) => void;
}

export function PromptBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  hint,
  onlineLabel,
  actions,
  activeActionId,
  onActionClick,
}: PromptBarProps) {
  return (
    <div className="workspace-card hero-mesh subtle-grid w-full rounded-[32px] p-3 sm:p-4">
      <div className="rounded-[28px] border border-border/70 bg-card/68 p-4 sm:p-5">
        <textarea
          className="h-36 w-full resize-none bg-transparent text-[15px] leading-7 text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/72">
              <Paperclip className="size-4" />
            </div>

            {actions.map((action) => {
              const Icon = action.icon;
              const isActive = activeActionId === action.id;

              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onActionClick(action.id)}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition',
                    isActive
                      ? 'border-primary/30 bg-primary/12 text-foreground'
                      : 'border-border/70 bg-card/60 hover:border-primary/20 hover:bg-card/82 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{action.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="workspace-pill">
              <Sparkles className="size-3.5" />
              {onlineLabel}
            </div>
            <Button type="button" size="icon" onClick={onSubmit} className="rounded-full">
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 px-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
