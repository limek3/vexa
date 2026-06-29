'use client';

import { useEffect, useMemo, useState } from 'react';

const LOADING_MESSAGES = [
  'Настраиваем интерфейс...',
  'Синхронизируем данные...',
  'Загружаем клиентов...',
  'Готовим рабочее место...',
  'Почти готово...',
];

const HOLD_MS = 2200;
const CHAR_STEP = 18;
const OUT_MS = 300;

const SPLASH_STYLES = `
@property --ai-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.clickbook-ai-splash {
  --bg: #f3f4f7;
  --card: #ffffff;
  --brand: #1f2540;
  --muted: #8b94a8;
  --track: #e8eaef;
  --c1: 91, 124, 255;
  --c2: 140, 91, 255;
  --c3: 255, 91, 158;

  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 28px;
  background: var(--bg);
  color: var(--brand);
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

.clickbook-ai-splash,
.clickbook-ai-splash * {
  box-sizing: border-box;
}

.clickbook-ai-splash__card {
  width: min(520px, 90vw);
  padding: 56px 48px 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  border: 1px solid rgba(230, 232, 238, 0.78);
  border-radius: 24px;
  background:
    radial-gradient(circle at 50% 0%, rgba(var(--c1), 0.055), transparent 46%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
  box-shadow:
    0 1px 2px rgba(20, 30, 60, 0.04),
    0 18px 40px -12px rgba(20, 30, 60, 0.08);
  backdrop-filter: blur(18px) saturate(145%);
  -webkit-backdrop-filter: blur(18px) saturate(145%);
}

.clickbook-ai-splash__logoWrap {
  --size: 128px;
  --radius: 28px;
  --border: 3px;
  --speed: 2.6s;

  position: relative;
  width: var(--size);
  height: var(--size);
  padding: var(--border);
  isolation: isolate;
  border-radius: var(--radius);
  background:
    conic-gradient(
      from var(--ai-angle),
      rgba(var(--c1), 0) 0deg,
      rgba(var(--c1), 0) 220deg,
      rgba(var(--c1), 0.35) 250deg,
      rgba(var(--c1), 0.90) 285deg,
      rgba(var(--c2), 1) 315deg,
      rgba(var(--c3), 1) 345deg,
      rgba(var(--c3), 0) 360deg
    );
  animation: clickbookAiFlow var(--speed) linear infinite;
}

.clickbook-ai-splash__logoWrap::before {
  content: '';
  position: absolute;
  inset: -4px;
  z-index: -1;
  border-radius: calc(var(--radius) + 4px);
  background: inherit;
  filter: blur(10px);
  opacity: 0.45;
  pointer-events: none;
}

.clickbook-ai-splash__logo {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: calc(var(--radius) - var(--border));
  background: #1f2540;
}

.clickbook-ai-splash__logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.clickbook-ai-splash__brand {
  margin: 0;
  color: var(--brand);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.clickbook-ai-splash__status {
  min-height: 20px;
  display: inline-flex;
  margin-top: -12px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  white-space: pre;
}

.clickbook-ai-splash__statusChar {
  display: inline-block;
  will-change: transform, opacity, filter;
}

.clickbook-ai-splash__statusChar.in {
  animation: clickbookAiCharIn 450ms cubic-bezier(0.34, 1.45, 0.64, 1) both;
}

.clickbook-ai-splash__statusChar.out {
  animation: clickbookAiCharOut 300ms cubic-bezier(0.4, 0, 0.6, 1) both;
}

.clickbook-ai-splash__progress {
  position: relative;
  width: 240px;
  height: 3px;
  margin-top: 4px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--track);
}

.clickbook-ai-splash__progress::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -40%;
  width: 40%;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(var(--c1), 1),
      rgba(var(--c2), 1),
      rgba(var(--c3), 1),
      transparent
    );
  animation: clickbookAiProgressRun 1.8s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
}

@keyframes clickbookAiFlow {
  to { --ai-angle: 360deg; }
}

@keyframes clickbookAiCharIn {
  0% { transform: translateY(6px); opacity: 0; filter: blur(2px); }
  100% { transform: translateY(0); opacity: 1; filter: blur(0); }
}

@keyframes clickbookAiCharOut {
  0% { transform: translateY(0); opacity: 1; filter: blur(0); }
  100% { transform: translateY(-6px); opacity: 0; filter: blur(2px); }
}

@keyframes clickbookAiProgressRun {
  0% { left: -40%; }
  100% { left: 100%; }
}

@media (max-width: 620px) {
  .clickbook-ai-splash { padding: 18px; }
  .clickbook-ai-splash__card {
    width: min(100%, 460px);
    padding: 46px 30px 38px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .clickbook-ai-splash__logoWrap,
  .clickbook-ai-splash__statusChar,
  .clickbook-ai-splash__progress::before {
    animation: none !important;
  }
}
`;

export function ClickBookSplashScreen({ logoSrc = '/brand/clickbook-desktop-icon.png' }: { logoSrc?: string }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  const chars = useMemo(() => [...LOADING_MESSAGES[index]], [index]);

  useEffect(() => {
    let cancelled = false;
    let outTimer = 0;
    let nextTimer = 0;

    const run = () => {
      if (cancelled) return;

      const text = LOADING_MESSAGES[index];
      setPhase('in');

      outTimer = window.setTimeout(() => {
        if (!cancelled) setPhase('out');
      }, HOLD_MS);

      nextTimer = window.setTimeout(() => {
        if (!cancelled) {
          setIndex((current) => (current + 1) % LOADING_MESSAGES.length);
        }
      }, HOLD_MS + OUT_MS + text.length * (CHAR_STEP * 0.6));
    };

    run();

    return () => {
      cancelled = true;
      window.clearTimeout(outTimer);
      window.clearTimeout(nextTimer);
    };
  }, [index]);

  return (
    <main className="clickbook-ai-splash" aria-label="КликБук загружается">
      <style>{SPLASH_STYLES}</style>

      <section className="clickbook-ai-splash__card">
        <div className="clickbook-ai-splash__logoWrap" aria-hidden="true">
          <div className="clickbook-ai-splash__logo">
            <img src={logoSrc} alt="" />
          </div>
        </div>

        <h1 className="clickbook-ai-splash__brand">КликБук</h1>

        <span className="clickbook-ai-splash__status" aria-live="polite">
          {chars.map((char, charIndex) => (
            <span
              key={`${index}-${charIndex}-${char}`}
              className={`clickbook-ai-splash__statusChar ${phase}`}
              style={{
                animationDelay: `${charIndex * (phase === 'in' ? CHAR_STEP : CHAR_STEP * 0.6)}ms`,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>

        <div className="clickbook-ai-splash__progress" aria-hidden="true" />
      </section>
    </main>
  );
}
