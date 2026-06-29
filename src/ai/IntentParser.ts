export type AIIntent = 'profile' | 'link' | 'dashboard' | 'system';

type IntentRule = {
  intent: AIIntent;
  keywords: string[];
};

const intentRules: IntentRule[] = [
  {
    intent: 'profile',
    keywords: ['profile', 'проф', 'мастер', 'bio', 'опис', 'service', 'услуг', 'специал'],
  },
  {
    intent: 'link',
    keywords: ['link', 'ссыл', 'slug', 'public', 'share', '/m/', 'страниц'],
  },
  {
    intent: 'dashboard',
    keywords: ['dashboard', 'кабин', 'booking', 'bookings', 'заяв', 'статус', 'распис'],
  },
  {
    intent: 'system',
    keywords: ['theme', 'language', 'систем', 'тем', 'язык', 'settings'],
  },
];

export function parseIntent(value: string): AIIntent {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return 'profile';

  for (const rule of intentRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.intent;
    }
  }

  return 'profile';
}
