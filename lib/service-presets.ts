import type { Locale } from '@/lib/i18n';

interface ServicePresetGroup {
  keywords: string[];
  categories: {
    ru: string;
    en: string;
  };
  ru: string[];
  en: string[];
}

const servicePresetGroups: ServicePresetGroup[] = [
  {
    keywords: ['маник', 'nail', 'ногт', 'pedicure', 'педик'],
    categories: { ru: 'Ногтевой сервис', en: 'Nail care' },
    ru: ['Маникюр без покрытия', 'Маникюр + гель-лак', 'Укрепление ногтей', 'Снятие + уход', 'Педикюр', 'Дизайн ногтей'],
    en: ['Classic manicure', 'Gel polish manicure', 'Nail strengthening', 'Removal + care', 'Pedicure', 'Nail art'],
  },
  {
    keywords: ['бров', 'brow'],
    categories: { ru: 'Брови', en: 'Brows' },
    ru: ['Коррекция бровей', 'Окрашивание бровей', 'Ламинирование бровей', 'Комплекс brow care'],
    en: ['Brow shaping', 'Brow tint', 'Brow lamination', 'Brow care package'],
  },
  {
    keywords: ['ресниц', 'lash'],
    categories: { ru: 'Ресницы', en: 'Lashes' },
    ru: ['Ламинирование ресниц', 'Окрашивание ресниц', 'Наращивание ресниц', 'Снятие ресниц'],
    en: ['Lash lift', 'Lash tint', 'Lash extensions', 'Lash removal'],
  },
  {
    keywords: ['парик', 'hair', 'стриж', 'окраш', 'barber'],
    categories: { ru: 'Волосы', en: 'Hair' },
    ru: ['Женская стрижка', 'Укладка', 'Окрашивание', 'Тонирование', 'Уход для волос', 'Barber cut'],
    en: ['Haircut', 'Styling', 'Coloring', 'Toning', 'Hair treatment', 'Barber cut'],
  },
  {
    keywords: ['массаж', 'massage', 'spa'],
    categories: { ru: 'Массаж и SPA', en: 'Massage & spa' },
    ru: ['Классический массаж', 'Relax massage', 'Lymphatic massage', 'SPA-ритуал'],
    en: ['Classic massage', 'Relax massage', 'Lymphatic massage', 'SPA ritual'],
  },
  {
    keywords: ['визаж', 'makeup', 'макияж'],
    categories: { ru: 'Макияж', en: 'Makeup' },
    ru: ['Дневной макияж', 'Вечерний макияж', 'Свадебный образ', 'Репетиция образа'],
    en: ['Day makeup', 'Evening makeup', 'Bridal look', 'Trial session'],
  },
];

const fallbackCategories: Record<Locale, string[]> = {
  ru: ['Популярное', 'Комплексный уход', 'Дополнительно'],
  en: ['Popular', 'Care package', 'Add-on'],
};

function uniqueServices(items: string[]) {
  return Array.from(
    new Map(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item] as const),
    ).values(),
  );
}

export function getServiceSuggestions(profession: string, locale: Locale) {
  const normalized = profession.trim().toLowerCase();
  const matchedGroups = servicePresetGroups.filter((group) => group.keywords.some((keyword) => normalized.includes(keyword)));
  const source = (matchedGroups.length > 0 ? matchedGroups : servicePresetGroups.slice(0, 2))
    .flatMap((group) => (locale === 'ru' ? group.ru : group.en));

  const fallback = locale === 'ru'
    ? ['Консультация', 'Экспресс-услуга', 'Комплексный уход']
    : ['Consultation', 'Express service', 'Care package'];

  return uniqueServices([...source, ...fallback]).slice(0, 14);
}

export function getServiceCategoryOptions(locale: Locale) {
  const fromPresets = servicePresetGroups.map((group) => locale === 'ru' ? group.categories.ru : group.categories.en);
  return uniqueServices([...fromPresets, ...fallbackCategories[locale]]);
}

export function getSuggestedCategory(serviceName: string, profession: string, locale: Locale) {
  const serviceNormalized = serviceName.trim().toLowerCase();
  const professionNormalized = profession.trim().toLowerCase();

  const group = servicePresetGroups.find((item) =>
    item.keywords.some((keyword) => serviceNormalized.includes(keyword) || professionNormalized.includes(keyword)),
  );

  if (group) {
    return locale === 'ru' ? group.categories.ru : group.categories.en;
  }

  return locale === 'ru' ? 'Дополнительно' : 'Add-on';
}
