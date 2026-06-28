'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseIntent, type AIIntent } from '@/src/ai/IntentParser';

export interface AIScenario {
  id: AIIntent;
  title: string;
  description: string;
  prompt: string;
  href: string;
  cta: string;
  bullets: readonly string[];
}

export interface AIHistoryItem {
  id: string;
  prompt: string;
  scenario: AIScenario;
}

export function useAI(scenarios: AIScenario[], locale: 'ru' | 'en') {
  const [prompt, setPrompt] = useState('');
  const [activeScenarioId, setActiveScenarioId] = useState<AIIntent>('profile');
  const [selectedScenario, setSelectedScenario] = useState<AIScenario | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const textRef = useRef('');

  const scenarioMap = useMemo(
    () => Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario])) as Record<AIIntent, AIScenario>,
    [scenarios],
  );

  useEffect(() => {
    const fallback = scenarios[0];
    setActiveScenarioId(fallback.id);
    setSelectedScenario(fallback);
    setPrompt(fallback.prompt);
    setDisplayedText(fallback.description);
    textRef.current = fallback.description;
    setHistory([]);
  }, [locale, scenarios]);

  useEffect(() => {
    if (!isTyping) return;
    let frame = 0;
    const source = textRef.current;
    const interval = window.setInterval(() => {
      frame += 1;
      const next = source.slice(0, Math.min(source.length, frame * 3));
      setDisplayedText(next);

      if (next.length >= source.length) {
        window.clearInterval(interval);
        setIsTyping(false);
      }
    }, 16);

    return () => window.clearInterval(interval);
  }, [isTyping]);

  const applyScenario = (scenario: AIScenario) => {
    setActiveScenarioId(scenario.id);
    setSelectedScenario(scenario);
    setPrompt(scenario.prompt);
    setDisplayedText(scenario.description);
    textRef.current = scenario.description;
    setIsLoading(false);
    setIsTyping(false);
  };

  const run = (value?: string) => {
    const input = (value ?? prompt).trim();
    const intent = parseIntent(input);
    const scenario = scenarioMap[intent] ?? scenarios[0];

    setPrompt(input || scenario.prompt);
    setActiveScenarioId(scenario.id);
    setSelectedScenario(scenario);
    setIsLoading(true);
    setDisplayedText('');
    setIsTyping(false);

    window.setTimeout(() => {
      const responseText =
        input.length > 0
          ? `${scenario.description} ${locale === 'ru' ? 'Под это уже готовы следующие шаги в интерфейсе:' : 'The next steps are already prepared in the interface:'}`
          : scenario.description;

      textRef.current = responseText;
      setDisplayedText('');
      setIsLoading(false);
      setIsTyping(true);
      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          prompt: input || scenario.prompt,
          scenario,
        },
        ...current,
      ].slice(0, 6));
    }, 520);
  };

  return {
    prompt,
    setPrompt,
    activeScenarioId,
    selectedScenario,
    displayedText,
    isLoading,
    isTyping,
    history,
    applyScenario,
    run,
  };
}
