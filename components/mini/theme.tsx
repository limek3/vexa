'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { accentPalette, accentToneValues, type AccentTone } from '@/lib/appearance-palette';
import type { RadiusMode } from '@/lib/appearance';
import { applyTelegramMiniAppChrome } from '@/lib/telegram-webapp-safe';

export interface ThemeTokens {
  bg: string;
  bgSoft: string;
  card: string;
  cardElev: string;
  cardHover: string;
  border: string;
  borderStrong: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accentSoft: string;
  danger: string;
  success: string;
  warn: string;
  inputBg: string;
  cardShadow: string;
  overlayBg: string;
  sheetBg: string;
  msgIn: string;
  skeleton: string;
}

export type ThemeMode = 'dark' | 'light';

export const TOKENS: Record<ThemeMode, ThemeTokens> = {
  dark: {
    bg: '#0a0a0a',
    bgSoft: '#0f0f0f',
    card: '#111111',
    cardElev: '#141414',
    cardHover: '#181818',
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.10)',
    text: '#fafafa',
    text2: 'rgba(250,250,250,0.5)',
    text3: 'rgba(250,250,250,0.3)',
    accent: '#2dd4bf',
    accentSoft: 'rgba(45,212,191,0.12)',
    danger: '#ef4444',
    success: '#22c55e',
    warn: '#f59e0b',
    inputBg: '#0d0d0d',
    cardShadow: 'none',
    overlayBg: 'rgba(0,0,0,0.7)',
    sheetBg: '#111111',
    msgIn: '#1a1a1a',
    skeleton: 'rgba(255,255,255,0.04)',
  },
  light: {
    bg: '#fafaf9',
    bgSoft: '#f7f6f2',
    card: '#ffffff',
    cardElev: '#ffffff',
    cardHover: '#f8f8f6',
    border: 'rgba(10,10,10,0.06)',
    borderStrong: 'rgba(10,10,10,0.10)',
    text: '#0a0a0a',
    text2: 'rgba(10,10,10,0.5)',
    text3: 'rgba(10,10,10,0.3)',
    accent: '#0f766e',
    accentSoft: 'rgba(15,118,110,0.10)',
    danger: '#dc2626',
    success: '#16a34a',
    warn: '#d97706',
    inputBg: '#f3f2ef',
    cardShadow: '0 1px 2px rgba(0,0,0,0.04)',
    overlayBg: 'rgba(10,10,10,0.4)',
    sheetBg: '#ffffff',
    msgIn: '#f0efed',
    skeleton: 'rgba(0,0,0,0.04)',
  },
};

interface StoredMiniAppearance {
  mode?: ThemeMode;
  accentTone?: AccentTone;
  radius?: RadiusMode;
}

const MINI_APPEARANCE_KEY = 'clickbook-miniapp-appearance';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function isAccentTone(value: unknown): value is AccentTone {
  return typeof value === 'string' && (accentToneValues as readonly string[]).includes(value);
}

function isRadiusMode(value: unknown): value is RadiusMode {
  return value === 'tight' || value === 'medium' || value === 'soft';
}

function readStoredAppearance(): StoredMiniAppearance {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(MINI_APPEARANCE_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    return {
      mode: isThemeMode(parsed.mode) ? parsed.mode : undefined,
      accentTone: isAccentTone(parsed.accentTone) ? parsed.accentTone : undefined,
      radius: isRadiusMode(parsed.radius) ? parsed.radius : undefined,
    };
  } catch {
    return {};
  }
}

function writeStoredAppearance(value: StoredMiniAppearance) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MINI_APPEARANCE_KEY, JSON.stringify(value));
  } catch {}
}

function upsertMiniThemeColor(color: string) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

function syncMiniChrome(mode: ThemeMode, bg: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.tgMiniapp = 'true';
  root.style.backgroundColor = bg;
  root.style.colorScheme = mode;
  document.body.style.backgroundColor = bg;
  document.body.style.colorScheme = mode;
  upsertMiniThemeColor(bg);

  applyTelegramMiniAppChrome(bg);
}

interface ThemeCtxValue {
  T: ThemeTokens;
  mode: ThemeMode;
  accentTone: AccentTone;
  radius: RadiusMode;
  toggle: () => void;
  set: (m: ThemeMode) => void;
  setAccentTone: (tone: AccentTone) => void;
  setRadius: (radius: RadiusMode) => void;
  setMiniAppearance: (value: Partial<StoredMiniAppearance>) => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  T: TOKENS.dark,
  mode: 'dark',
  accentTone: 'teal',
  radius: 'medium',
  toggle: () => {},
  set: () => {},
  setAccentTone: () => {},
  setRadius: () => {},
  setMiniAppearance: () => {},
});

export function ThemeProvider({ initialMode = 'dark', children }: { initialMode?: ThemeMode; children: ReactNode }) {
  const stored = readStoredAppearance();
  const [mode, setMode] = useState<ThemeMode>(stored.mode ?? initialMode);
  const [accentTone, setAccentToneState] = useState<AccentTone>(stored.accentTone ?? 'teal');
  const [radius, setRadiusState] = useState<RadiusMode>(stored.radius ?? 'medium');

  const T = useMemo(() => {
    const accent = accentPalette[accentTone] ?? accentPalette.teal;
    return {
      ...TOKENS[mode],
      accent: accent.solid,
      accentSoft: accent.soft,
    };
  }, [accentTone, mode]);

  useEffect(() => {
    writeStoredAppearance({ mode, accentTone, radius });
    syncMiniChrome(mode, T.bg);
  }, [mode, accentTone, radius, T.bg]);

  const transitionTheme = useCallback((update: () => void) => {
    // Telegram WebView can crash on the experimental View Transition API.
    // Keep the transition purely CSS-driven and synchronous for stability.
    update();
  }, []);

  const setModeSmooth = useCallback((next: ThemeMode) => {
    transitionTheme(() => setMode(next));
  }, [transitionTheme]);

  const toggleSmooth = useCallback(() => {
    transitionTheme(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')));
  }, [transitionTheme]);

  const setAccentToneSmooth = useCallback((tone: AccentTone) => {
    transitionTheme(() => setAccentToneState(tone));
  }, [transitionTheme]);

  const setRadiusSmooth = useCallback((nextRadius: RadiusMode) => {
    transitionTheme(() => setRadiusState(nextRadius));
  }, [transitionTheme]);

  const setMiniAppearance = useCallback((value: Partial<StoredMiniAppearance>) => {
    transitionTheme(() => {
      if (value.mode) setMode(value.mode);
      if (value.accentTone) setAccentToneState(value.accentTone);
      if (value.radius) setRadiusState(value.radius);
    });
  }, [transitionTheme]);

  const value = useMemo<ThemeCtxValue>(() => ({
    T,
    mode,
    accentTone,
    radius,
    toggle: toggleSmooth,
    set: setModeSmooth,
    setAccentTone: setAccentToneSmooth,
    setRadius: setRadiusSmooth,
    setMiniAppearance,
  }), [mode, T, accentTone, radius, toggleSmooth, setModeSmooth, setAccentToneSmooth, setRadiusSmooth, setMiniAppearance]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
