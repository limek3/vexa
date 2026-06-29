'use client';

import { useEffect, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';

type ModeSwitchOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type ModeSwitchProps<T extends string> = {
  value: T;
  onChange?: (value: T) => void;
  options: ModeSwitchOption<T>[];
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

const MODE_SWITCH_CSS = `
@property --ai-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.ms-root {
  display: inline-flex;
  background: var(--switch-bg, #fff);
  border: 1px solid var(--switch-border, #e6e8ee);
  border-radius: 999px;
  padding: 4px;
  position: relative;
}

.ms-btn {
  appearance: none;
  border: none;
  background: transparent;
  font: inherit;
  font-weight: 600;
  font-size: 14px;
  color: var(--switch-text-muted, #8a8f99);
  padding: 8px 22px;
  border-radius: 999px;
  cursor: pointer;
  position: relative;
  transition: color 200ms ease;
  z-index: 1;
}

.ms-btn:hover:not(.is-active):not(:disabled) {
  color: var(--switch-text-hover, #4a4f5a);
}

.ms-btn:focus-visible {
  outline: 2px solid var(--accent, #ff9a3d);
  outline-offset: 2px;
}

.ms-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ms-btn.is-active {
  --ms-border: 2px;
  --ms-speed: 2.4s;
  color: #fff;
  isolation: isolate;
  box-shadow:
    0 4px 14px -4px color-mix(in srgb, var(--accent, #ff9a3d) 55%, transparent);
}

.ms-btn.is-active::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: var(--ms-border);
  background: conic-gradient(
    from var(--ai-angle),
    transparent 0deg,
    transparent 220deg,
    color-mix(in srgb, var(--accent, #ff9a3d) 40%, transparent) 250deg,
    var(--accent, #ff9a3d) 285deg,
    color-mix(in srgb, var(--accent, #ff9a3d) 70%, white) 320deg,
    var(--accent, #ff9a3d) 345deg,
    transparent 360deg
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
          mask-composite: exclude;
  animation: ms-flow var(--ms-speed) linear infinite;
  z-index: 2;
  pointer-events: none;
}

.ms-btn.is-active::after {
  content: '';
  position: absolute;
  inset: var(--ms-border);
  border-radius: inherit;
  background: var(--accent, #ff9a3d);
  z-index: -1;
}

@keyframes ms-flow { to { --ai-angle: 360deg; } }

@supports not (background: conic-gradient(from 0deg, red, red)) {
  .ms-btn.is-active::before { animation: ms-rotate var(--ms-speed) linear infinite; }
}

@keyframes ms-rotate { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .ms-btn.is-active::before { animation: none; }
}
`;

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mode-switch-styles')) return;

  const el = document.createElement('style');
  el.id = 'mode-switch-styles';
  el.textContent = MODE_SWITCH_CSS;
  document.head.appendChild(el);
}

export function ModeSwitch<T extends string>({
  value,
  onChange,
  options,
  className,
  style,
  ariaLabel = 'Mode switch',
}: ModeSwitchProps<T>) {
  useEffect(ensureStyles, []);

  return (
    <div className={cn('ms-root', className)} style={style} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={option.disabled}
            className={cn('ms-btn', isActive && 'is-active')}
            onClick={() => {
              if (!option.disabled && !isActive) onChange?.(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ModeSwitch;
