import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from '@/lib/i18n';
import { intlLocaleMap } from '@/lib/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseServices(value: unknown) {
  return String(value ?? '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getIntlLocale(locale: Locale = 'ru') {
  return intlLocaleMap[locale];
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions, locale: Locale = 'ru') {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: 'numeric',
    month: 'long',
    ...options,
  }).format(new Date(`${date}T00:00:00`));
}

export function formatDateTime(date: string, time: string, locale: Locale = 'ru') {
  const value = new Date(`${date}T${time}`);
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export function formatCreatedAt(value: string, locale: Locale = 'ru') {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getInitials(value: unknown) {
  return String(value ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
