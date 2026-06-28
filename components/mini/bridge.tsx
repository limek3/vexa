'use client';

import { createContext, useContext } from 'react';
import { getTelegramWebApp } from '@/lib/telegram-webapp-safe';

// ─── Telegram WebApp helpers ───────────────────────
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function haptic(type: HapticType = 'light') {
  if (typeof window === 'undefined') return;
  const tg = getTelegramWebApp();
  const h = tg?.HapticFeedback;
  if (!h) return;
  try {
    if (type === 'success' || type === 'warning' || type === 'error') h.notificationOccurred(type);
    else h.impactOccurred(type);
  } catch {}
}

export function selectionHaptic() {
  if (typeof window === 'undefined') return;
  const tg = getTelegramWebApp();
  const h = tg?.HapticFeedback;
  try {
    if (h?.selectionChanged) h.selectionChanged();
    else haptic('light');
  } catch {}
}

export function feedback(type: 'success' | 'warning' | 'error' | 'light' = 'light') {
  haptic(type);
}

export function tgClose() {
  if (typeof window === 'undefined') return;
  const tg = getTelegramWebApp();
  try { tg?.close?.(); } catch {}
}

// ─── Mini Toast context ─────────────────────────────
export interface ToastItem { id: number; text: string; tone: 'info' | 'success' | 'error' }
export interface MiniToastCtxValue { show: (text: string, tone?: ToastItem['tone']) => void }

export const ToastCtx = createContext<MiniToastCtxValue | null>(null);

export function useMiniToast(): MiniToastCtxValue {
  return useContext(ToastCtx) ?? { show: () => {} };
}
