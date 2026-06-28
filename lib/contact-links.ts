export function getPhoneHref(value?: string) {
  if (!value) return undefined;
  return `tel:${value.replace(/[^\d+]/g, '')}`;
}

export function getTelegramHref(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/^@/, '');
  return normalized ? `https://t.me/${normalized}` : undefined;
}

export function getMaxHref(value?: string, fallbackText?: string) {
  if (!value && !fallbackText) return undefined;

  const raw = (value ?? '').trim();

  if (/^https?:\/\//i.test(raw)) return raw;

  const handle = raw.replace(/^@/, '').replace(/\s+/g, '');

  if (handle && /[a-zA-Zа-яА-Я0-9_.-]+/.test(handle) && !/^\+?\d+$/.test(handle)) {
    return `https://vk.com/${encodeURIComponent(handle)}`;
  }

  const text = fallbackText || raw;

  if (!text) return undefined;

  return `https://vk.com/:share?text=${encodeURIComponent(text)}`;
}
