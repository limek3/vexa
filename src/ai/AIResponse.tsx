'use client';

import Link from 'next/link';
import { Bot, Sparkles } from 'lucide-react';
import type { AIHistoryItem, AIScenario } from '@/src/ai/useAI';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIResponseProps {
  titleFallback: string;
  descriptionFallback: string;
  promptLabel: string;
  currentPrompt: string;
  displayedText: string;
  currentScenario: AIScenario | null;
  isLoading: boolean;
  isTyping: boolean;
  runLabel: string;
  onRunAgain: () => void;
  historyTitle: string;
  history: AIHistoryItem[];
  scenarioLabel: string;
}

export function AIResponse({
  titleFallback,
  descriptionFallback,
  promptLabel,
  currentPrompt,
  displayedText,
  currentScenario,
  isLoading,
  isTyping,
  runLabel,
  onRunAgain,
  historyTitle,
  history,
  scenarioLabel,
}: AIResponseProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
      <div className="workspace-card rounded-[30px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="workspace-pill">{scenarioLabel}</div>
            <div className="text-[22px] font-semibold tracking-tight text-foreground">
              {currentScenario?.title || titleFallback}
            </div>
            <p
              className={cn(
                'max-w-3xl text-sm leading-7 text-muted-foreground',
                isTyping && 'typing-caret',
              )}
            >
              {displayedText || descriptionFallback}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-border/70 bg-card/72 text-primary">
            <Bot className="size-5" />
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-border/70 bg-card/62 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {promptLabel}
          </div>
          <div className="mt-2 text-sm leading-7 text-foreground">{currentPrompt}</div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(currentScenario?.bullets || []).map((bullet) => (
            <div key={bullet} className="rounded-[20px] border border-border/70 bg-card/56 p-4 text-sm leading-6 text-muted-foreground">
              {bullet}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={currentScenario?.href || '/'}>{currentScenario?.cta || runLabel}</Link>
          </Button>
          <Button variant="outline" onClick={onRunAgain}>
            <Sparkles className="size-4" />
            {runLabel}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="workspace-card rounded-[30px] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            {historyTitle}
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <>
                <div className="skeleton-shimmer h-20 rounded-[20px] border border-border/70 bg-card/56" />
                <div className="skeleton-shimmer h-20 rounded-[20px] border border-border/70 bg-card/56" />
              </>
            ) : history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-border/70 bg-card/56 p-4">
                  <div className="text-sm font-semibold text-foreground">{item.scenario.title}</div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.prompt}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-border/70 bg-card/40 p-4 text-sm leading-6 text-muted-foreground">
                {descriptionFallback}
              </div>
            )}
          </div>
        </div>

        <div className="workspace-card rounded-[30px] p-5 sm:p-6">
          <div className="text-sm font-semibold text-foreground">{currentScenario?.cta}</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {currentScenario?.description || descriptionFallback}
          </p>
          {currentScenario?.href ? (
            <Button asChild variant="outline" className="mt-4">
              <Link href={currentScenario.href}>{currentScenario.cta}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
