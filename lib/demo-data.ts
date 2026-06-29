import { defaultAppearanceSettings, type AppearanceSettings } from '@/lib/appearance';
import type { ChatThreadRecord } from '@/lib/chat-types';
import type { WorkspaceSections } from '@/lib/workspace-store';
import type { Booking, MasterProfile } from '@/lib/types';

export const SLOTY_DEMO_SLUG = 'demo';
export const DEMO_PROFILE_STORAGE_KEY = 'sloty-demo:profile';
export const DEMO_PROFILE_UPDATED_EVENT = 'sloty-demo:profile-updated';

function daysFromToday(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function buildArtworkDataUri(title: string, subtitle: string, start: string, end: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
        <radialGradient id="glow" cx="30%" cy="20%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.28)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)" />
      <rect width="1200" height="900" fill="url(#glow)" />
      <g fill="none" stroke="rgba(255,255,255,0.22)">
        <circle cx="980" cy="170" r="140" />
        <circle cx="1040" cy="720" r="180" />
        <path d="M90 700c140-180 320-260 540-240" />
      </g>
      <g fill="#ffffff">
        <text x="92" y="150" font-size="78" font-family="Golos UI, Golos Text, Arial, sans-serif" font-weight="700">${title}</text>
        <text x="96" y="214" font-size="30" font-family="Golos UI, Golos Text, Arial, sans-serif" opacity="0.86">${subtitle}</text>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const demoProfile: MasterProfile = {
  id: 'demo-profile-sloty',
  slug: SLOTY_DEMO_SLUG,
  name: 'Алина Морозова',
  profession: 'Ногтевой сервис',
  city: 'Москва',
  bio: 'Маникюр, педикюр и укрепление. Чистая работа, спокойный сервис и запись без долгой переписки.',
  services: [
    'Маникюр + покрытие',
    'Укрепление гелем',
    'Смарт-педикюр',
    'Снятие + новый дизайн',
    'Экспресс-маникюр',
    'Коррекция геля',
    'Наращивание + дизайн',
    'Педикюр + покрытие',
    'Брови + окрашивание',
    'Ламинирование ресниц',
  ],
  phone: '+7 999 444-22-11',
  telegram: 'demo',
  whatsapp: '+79994442211',
  avatar: '',
  rating: 4.9,
  reviewCount: 128,
  responseTime: 'Отвечаю в течение 10 минут',
  experienceLabel: 'Опыт 7 лет',
  priceHint: 'от 2 300 ₽',
  reviews: [
    {
      id: 'demo-review-1',
      author: 'Мария',
      rating: 5,
      text: 'Очень аккуратно, спокойно и без суеты. Понравилось, как организована запись и напоминания.',
      dateLabel: '2 недели назад',
      service: 'Маникюр + покрытие',
    },
    {
      id: 'demo-review-2',
      author: 'Светлана',
      rating: 5,
      text: 'Удобно записаться, всё понятно по услугам и времени. Профиль выглядит аккуратно.',
      dateLabel: 'месяц назад',
      service: 'Смарт-педикюр',
    },
    {
      id: 'demo-review-3',
      author: 'Елена',
      rating: 5,
      text: 'Страница аккуратная, по услугам и записи всё понятно сразу.',
      dateLabel: '6 дней назад',
      service: 'Укрепление гелем',
    },
  ],
  workGallery: [
    {
      id: 'demo-work-1',
      title: 'Молочный розовый',
      image: buildArtworkDataUri('Молочный розовый', 'Чистая форма и мягкий блеск', '#f9bcc7', '#a855f7'),
      note: 'Нежный повседневный дизайн',
    },
    {
      id: 'demo-work-2',
      title: 'Глянцевый нюд',
      image: buildArtworkDataUri('Глянцевый нюд', 'Минималистичный салонный сет', '#f3d0b6', '#fb7185'),
      note: 'Самый частый выбор новых клиентов',
    },
    {
      id: 'demo-work-3',
      title: 'Глубокий эспрессо',
      image: buildArtworkDataUri('Глубокий эспрессо', 'Контрастный тон с мягким светом', '#7c3f29', '#111827'),
      note: 'Осенний тёплый акцент',
    },
    {
      id: 'demo-work-4',
      title: 'Мягкий хром',
      image: buildArtworkDataUri('Мягкий хром', 'Светлая хромированная фактура', '#dbeafe', '#6366f1'),
      note: 'Для вечерних записей',
    },
  ],
  createdAt: new Date('2025-01-15T09:30:00.000Z').toISOString(),
};

const demoProfileEn: MasterProfile = {
  ...demoProfile,
  name: 'Alina Morozova',
  profession: 'Nail care specialist',
  city: 'Amsterdam',
  bio: 'Manicure, pedicure, and nail strengthening with a calm service flow. Services, reviews, contacts, and booking are clear before the client writes.',
  services: [
    'Gel polish manicure',
    'Gel strengthening',
    'Smart pedicure',
    'Removal + new design',
    'Express care',
  ],
  phone: '+31 6 4444 2211',
  whatsapp: '+31644442211',
  responseTime: 'Replies within 10 minutes',
  experienceLabel: '7 years of experience',
  priceHint: 'from €45',
  reviews: [
    {
      id: 'demo-review-1',
      author: 'Maria',
      rating: 5,
      text: 'Very neat, calm, and organized. I liked that booking and reminders were clear from the start.',
      dateLabel: '2 weeks ago',
      service: 'Gel polish manicure',
    },
    {
      id: 'demo-review-2',
      author: 'Svetlana',
      rating: 5,
      text: 'It was easy to book, and the services and available time were clear right away.',
      dateLabel: '1 month ago',
      service: 'Smart pedicure',
    },
    {
      id: 'demo-review-3',
      author: 'Elena',
      rating: 5,
      text: 'The page feels clean and professional. Services, reviews, and booking are easy to understand.',
      dateLabel: '6 days ago',
      service: 'Gel strengthening',
    },
  ],
  workGallery: [
    {
      id: 'demo-work-1',
      title: 'Milky rose',
      image: buildArtworkDataUri('Milky rose', 'Clean shape and soft shine', '#f9bcc7', '#a855f7'),
      note: 'Soft everyday design',
    },
    {
      id: 'demo-work-2',
      title: 'Glossy nude',
      image: buildArtworkDataUri('Glossy nude', 'Minimal salon set', '#f3d0b6', '#fb7185'),
      note: 'Most popular first-visit choice',
    },
    {
      id: 'demo-work-3',
      title: 'Deep espresso',
      image: buildArtworkDataUri('Deep espresso', 'Warm contrast tone', '#7c3f29', '#111827'),
      note: 'Warm seasonal accent',
    },
    {
      id: 'demo-work-4',
      title: 'Soft chrome',
      image: buildArtworkDataUri('Soft chrome', 'Light chrome texture', '#dbeafe', '#6366f1'),
      note: 'For evening appointments',
    },
  ],
};

const demoBookingEn: Record<string, Pick<Booking, 'clientName' | 'service' | 'comment'>> = {
  'demo-booking-1': {
    clientName: 'Maria',
    service: 'Gel polish manicure',
    comment: 'First visit, prefers a calm shade and short square shape.',
  },
  'demo-booking-2': {
    clientName: 'Olga',
    service: 'Removal + strengthening',
    comment: 'Asked to move 15 minutes later if a slot opens.',
  },
  'demo-booking-3': {
    clientName: 'Elena',
    service: 'Extensions + design',
    comment: 'Usually brings a design reference and arrives early.',
  },
  'demo-booking-4': {
    clientName: 'Ksenia',
    service: 'Smart pedicure',
    comment: 'Needs a receipt and a short reminder one hour before the visit.',
  },
  'demo-booking-5': {
    clientName: 'Alina',
    service: 'Gel correction',
    comment: 'Regular client; suggest the next slot right after the visit.',
  },
  'demo-booking-6': {
    clientName: 'Svetlana',
    service: 'Express manicure',
    comment: 'If an earlier slot opens, Telegram is convenient.',
  },
  'demo-booking-7': {
    clientName: 'Natalia',
    service: 'Gel strengthening',
    comment: 'Evening visit; send a soft reminder in advance.',
  },
  'demo-booking-8': {
    clientName: 'Marina',
    service: 'Gel polish manicure',
    comment: 'Ready to confirm in chat after the morning reminder.',
  },
  'demo-booking-9': {
    clientName: 'Irina',
    service: 'Smart pedicure',
    comment: 'After the visit, send a short message with the next available slot.',
  },
  'demo-booking-10': {
    clientName: 'Daria',
    service: 'Gel strengthening',
    comment: 'Completed visit from history for analytics.',
  },
};

function localizeDemoProfile(locale: 'ru' | 'en') {
  return locale === 'ru' ? demoProfile : demoProfileEn;
}

function localizeDemoBookings(locale: 'ru' | 'en') {
  if (locale === 'ru') return demoBookings;

  return demoBookings.map((booking) => ({
    ...booking,
    ...(demoBookingEn[booking.id] ?? {}),
  }));
}



function demoCreatedAt(dayOffset: number, hour = 10) {
  const createdOffset = Math.min(dayOffset - 2, -1);
  return new Date(`${daysFromToday(createdOffset)}T${String(hour).padStart(2, '0')}:15:00.000`).toISOString();
}

function demoBooking({
  id,
  clientName,
  clientPhone,
  service,
  dayOffset,
  time,
  status,
  priceAmount,
  durationMinutes,
  source = 'Web',
  channel = 'web',
  comment = '',
}: {
  id: number;
  clientName: string;
  clientPhone: string;
  service: string;
  dayOffset: number;
  time: string;
  status: Booking['status'];
  priceAmount: number;
  durationMinutes: number;
  source?: string;
  channel?: string;
  comment?: string;
}): Booking {
  const date = daysFromToday(dayOffset);
  return {
    id: `demo-booking-${id}`,
    masterSlug: SLOTY_DEMO_SLUG,
    clientName,
    clientPhone,
    service,
    date,
    time,
    comment,
    status,
    priceAmount,
    durationMinutes,
    source,
    channel,
    createdAt: demoCreatedAt(dayOffset, 9 + (id % 8)),
    confirmedAt: status === 'confirmed' || status === 'completed' ? demoCreatedAt(dayOffset, 11) : undefined,
    completedAt: status === 'completed' ? new Date(`${date}T${time}:00.000`).toISOString() : undefined,
    noShowAt: status === 'no_show' ? new Date(`${date}T${time}:00.000`).toISOString() : undefined,
    cancelledAt: status === 'cancelled' ? demoCreatedAt(dayOffset, 12) : undefined,
    cancelReason: status === 'cancelled' ? 'client_reschedule_requested' : undefined,
    metadata: {
      demo: true,
      sourceLabel: source,
    },
  };
}

export const demoBookings: Booking[] = [
  demoBooking({ id: 1, clientName: 'Мария', clientPhone: '+7 999 100-00-11', service: 'Маникюр + покрытие', dayOffset: 0, time: '09:30', status: 'confirmed', priceAmount: 4250, durationMinutes: 45, source: 'Telegram', channel: 'telegram', comment: 'Первый визит, любит спокойный тон и короткий квадрат.' }),
  demoBooking({ id: 2, clientName: 'Ольга', clientPhone: '+7 999 120-00-19', service: 'Снятие + укрепление', dayOffset: 0, time: '11:00', status: 'new', priceAmount: 2100, durationMinutes: 60, source: 'Web', channel: 'web', comment: 'Просила сдвинуться на 15 минут, если окно освободится.' }),
  demoBooking({ id: 3, clientName: 'Елена', clientPhone: '+7 999 300-00-33', service: 'Наращивание + дизайн', dayOffset: 0, time: '12:30', status: 'confirmed', priceAmount: 6500, durationMinutes: 60, source: 'Инстаграм', channel: 'instagram', comment: 'Берёт дизайн по референсу, обычно приходит заранее.' }),
  demoBooking({ id: 4, clientName: 'Ксения', clientPhone: '+7 999 410-00-48', service: 'Смарт-педикюр', dayOffset: 0, time: '14:30', status: 'confirmed', priceAmount: 3700, durationMinutes: 60, source: 'ВК', channel: 'vk', comment: 'Нужен чек и короткое напоминание за час.' }),
  demoBooking({ id: 5, clientName: 'Алина', clientPhone: '+7 999 520-00-57', service: 'Коррекция геля', dayOffset: 0, time: '16:00', status: 'completed', priceAmount: 3200, durationMinutes: 60, source: 'Telegram', channel: 'telegram', comment: 'Постоянный клиент, можно предложить следующий слот сразу после визита.' }),
  demoBooking({ id: 6, clientName: 'Светлана', clientPhone: '+7 999 200-00-22', service: 'Экспресс-маникюр', dayOffset: 0, time: '17:30', status: 'confirmed', priceAmount: 2500, durationMinutes: 60, source: 'Telegram', channel: 'telegram', comment: 'Если освободится окно раньше, удобно написать в Телеграм.' }),
  demoBooking({ id: 7, clientName: 'Наталья', clientPhone: '+7 999 620-00-63', service: 'Укрепление гелем', dayOffset: 0, time: '19:00', status: 'new', priceAmount: 3700, durationMinutes: 75, source: 'Web', channel: 'web', comment: 'Вечерний визит, лучше заранее отправить мягкое напоминание.' }),
  demoBooking({ id: 8, clientName: 'Виктория', clientPhone: '+7 999 640-00-68', service: 'Педикюр + покрытие', dayOffset: 0, time: '21:00', status: 'confirmed', priceAmount: 4800, durationMinutes: 90, source: 'Инстаграм', channel: 'instagram', comment: 'Поздний слот, попросила без дизайна.' }),

  demoBooking({ id: 9, clientName: 'Дарья', clientPhone: '+7 999 930-00-94', service: 'Укрепление гелем', dayOffset: -4, time: '10:00', status: 'completed', priceAmount: 3700, durationMinutes: 90, source: 'Telegram', channel: 'telegram', comment: 'Завершённый визит из истории для аналитики.' }),
  demoBooking({ id: 10, clientName: 'Марина', clientPhone: '+7 999 710-00-71', service: 'Маникюр + покрытие', dayOffset: 1, time: '11:00', status: 'confirmed', priceAmount: 4250, durationMinutes: 45, source: 'Web', channel: 'web', comment: 'Готова подтвердить в чате, если придёт напоминание утром.' }),
  demoBooking({ id: 11, clientName: 'Ирина', clientPhone: '+7 999 820-00-82', service: 'Смарт-педикюр', dayOffset: 2, time: '14:30', status: 'new', priceAmount: 3700, durationMinutes: 75, source: 'ВК', channel: 'vk', comment: 'После визита отправить короткое сообщение с предложением следующего окна.' }),
  demoBooking({ id: 12, clientName: 'Анна', clientPhone: '+7 999 230-11-81', service: 'Брови + окрашивание', dayOffset: -1, time: '09:00', status: 'confirmed', priceAmount: 2300, durationMinutes: 45, source: 'Инстаграм', channel: 'instagram', comment: 'Нужна коррекция формы без яркого окрашивания.' }),
  demoBooking({ id: 13, clientName: 'Юлия', clientPhone: '+7 999 777-12-00', service: 'Маникюр + покрытие', dayOffset: -1, time: '10:30', status: 'completed', priceAmount: 4250, durationMinutes: 75, source: 'Telegram', channel: 'telegram', comment: 'Постоянный нюд, записать через три недели.' }),
  demoBooking({ id: 14, clientName: 'Полина', clientPhone: '+7 999 314-55-90', service: 'Ламинирование ресниц', dayOffset: -1, time: '13:00', status: 'completed', priceAmount: 3500, durationMinutes: 75, source: 'Web', channel: 'web', comment: 'Первый раз, уточнить противопоказания.' }),
  demoBooking({ id: 15, clientName: 'Екатерина', clientPhone: '+7 999 501-12-32', service: 'Снятие + новый дизайн', dayOffset: -2, time: '12:00', status: 'completed', priceAmount: 5250, durationMinutes: 90, source: 'ВК', channel: 'vk', comment: 'Любит минимализм, без страз.' }),
  demoBooking({ id: 16, clientName: 'Валерия', clientPhone: '+7 999 541-00-77', service: 'Педикюр + покрытие', dayOffset: -2, time: '16:30', status: 'no_show', priceAmount: 4800, durationMinutes: 90, source: 'Инстаграм', channel: 'instagram', comment: 'Не вышла на связь после напоминания.' }),
  demoBooking({ id: 17, clientName: 'София', clientPhone: '+7 999 601-35-20', service: 'Коррекция геля', dayOffset: -3, time: '15:00', status: 'completed', priceAmount: 3200, durationMinutes: 60, source: 'Telegram', channel: 'telegram', comment: 'Попросила отправить ссылку на оплату.' }),
  demoBooking({ id: 18, clientName: 'Кристина', clientPhone: '+7 999 510-14-55', service: 'Укрепление гелем', dayOffset: -3, time: '18:00', status: 'cancelled', priceAmount: 3700, durationMinutes: 90, source: 'ВК', channel: 'vk', comment: 'Попросила перенос на следующую неделю.' }),

  demoBooking({ id: 19, clientName: 'Мила', clientPhone: '+7 999 711-40-21', service: 'Маникюр + покрытие', dayOffset: 3, time: '09:30', status: 'confirmed', priceAmount: 4250, durationMinutes: 75, source: 'Web', channel: 'web', comment: 'Просит молочную базу.' }),
  demoBooking({ id: 20, clientName: 'Олеся', clientPhone: '+7 999 820-14-72', service: 'Брови + окрашивание', dayOffset: 3, time: '12:00', status: 'new', priceAmount: 2300, durationMinutes: 45, source: 'Telegram', channel: 'telegram', comment: 'Новый клиент из рекомендаций.' }),
  demoBooking({ id: 21, clientName: 'Татьяна', clientPhone: '+7 999 921-88-40', service: 'Снятие + новый дизайн', dayOffset: 4, time: '10:00', status: 'confirmed', priceAmount: 5250, durationMinutes: 90, source: 'Инстаграм', channel: 'instagram', comment: 'Хочет повторить дизайн из портфолио.' }),
  demoBooking({ id: 22, clientName: 'Анастасия', clientPhone: '+7 999 342-77-10', service: 'Ламинирование ресниц', dayOffset: 5, time: '15:30', status: 'new', priceAmount: 3500, durationMinutes: 75, source: 'ВК', channel: 'vk', comment: 'Уточнить аллергию на составы.' }),
  demoBooking({ id: 23, clientName: 'Лидия', clientPhone: '+7 999 490-12-18', service: 'Экспресс-маникюр', dayOffset: 6, time: '18:00', status: 'confirmed', priceAmount: 2500, durationMinutes: 45, source: 'Telegram', channel: 'telegram', comment: 'Нужен быстрый вечерний визит.' }),

  demoBooking({ id: 24, clientName: 'Дарья', clientPhone: '+7 999 930-00-94', service: 'Маникюр + покрытие', dayOffset: -11, time: '11:30', status: 'completed', priceAmount: 4250, durationMinutes: 75, source: 'Telegram', channel: 'telegram', comment: 'Повторный визит, довольна укреплением.' }),
  demoBooking({ id: 25, clientName: 'Мария', clientPhone: '+7 999 100-00-11', service: 'Снятие + новый дизайн', dayOffset: -18, time: '14:00', status: 'completed', priceAmount: 5250, durationMinutes: 90, source: 'Telegram', channel: 'telegram', comment: 'Сделали дизайн по референсу.' }),
  demoBooking({ id: 26, clientName: 'Ольга', clientPhone: '+7 999 120-00-19', service: 'Педикюр + покрытие', dayOffset: -23, time: '16:00', status: 'completed', priceAmount: 4800, durationMinutes: 90, source: 'Web', channel: 'web', comment: 'Постоянный клиент, любит тёмные оттенки.' }),
  demoBooking({ id: 27, clientName: 'Елена', clientPhone: '+7 999 300-00-33', service: 'Маникюр + покрытие', dayOffset: -29, time: '10:00', status: 'completed', priceAmount: 4250, durationMinutes: 75, source: 'Инстаграм', channel: 'instagram', comment: 'Пришла из портфолио.' }),
  demoBooking({ id: 28, clientName: 'Алина', clientPhone: '+7 999 520-00-57', service: 'Укрепление гелем', dayOffset: -33, time: '17:00', status: 'completed', priceAmount: 3700, durationMinutes: 90, source: 'Telegram', channel: 'telegram', comment: 'Регулярный уход.' }),
  demoBooking({ id: 29, clientName: 'Ксения', clientPhone: '+7 999 410-00-48', service: 'Смарт-педикюр', dayOffset: -39, time: '12:30', status: 'completed', priceAmount: 3700, durationMinutes: 75, source: 'ВК', channel: 'vk', comment: 'Записалась после напоминания.' }),
  demoBooking({ id: 30, clientName: 'Светлана', clientPhone: '+7 999 200-00-22', service: 'Маникюр + покрытие', dayOffset: -44, time: '18:30', status: 'completed', priceAmount: 4250, durationMinutes: 75, source: 'Telegram', channel: 'telegram', comment: 'Нужна была запись после работы.' }),
  demoBooking({ id: 31, clientName: 'Наталья', clientPhone: '+7 999 620-00-63', service: 'Брови + окрашивание', dayOffset: -50, time: '13:30', status: 'completed', priceAmount: 2300, durationMinutes: 45, source: 'Web', channel: 'web', comment: 'После визита оставила отзыв.' }),
  demoBooking({ id: 32, clientName: 'Ирина', clientPhone: '+7 999 820-00-82', service: 'Смарт-педикюр', dayOffset: -57, time: '15:00', status: 'completed', priceAmount: 3700, durationMinutes: 75, source: 'ВК', channel: 'vk', comment: 'Вернулась после месяца перерыва.' }),
];

function normalizeDemoProfile(value: Partial<MasterProfile> | null | undefined): MasterProfile | null {
  if (!value) return null;

  return {
    ...demoProfile,
    ...value,
    id: value.id || demoProfile.id,
    slug: SLOTY_DEMO_SLUG,
    name: value.name || demoProfile.name,
    profession: value.profession || demoProfile.profession,
    city: value.city || demoProfile.city,
    bio: value.bio || demoProfile.bio,
    services: Array.isArray(value.services) && value.services.length > 0 ? value.services : demoProfile.services,
    workGallery: Array.isArray(value.workGallery) ? value.workGallery : demoProfile.workGallery,
    reviews: Array.isArray(value.reviews) ? value.reviews : demoProfile.reviews,
    rating: typeof value.rating === 'number' ? value.rating : demoProfile.rating,
    reviewCount: typeof value.reviewCount === 'number' ? value.reviewCount : value.reviews?.length ?? demoProfile.reviewCount,
    createdAt: value.createdAt || demoProfile.createdAt,
  };
}

export function readStoredDemoProfile() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
    return raw ? normalizeDemoProfile(JSON.parse(raw) as Partial<MasterProfile>) : null;
  } catch {
    return null;
  }
}

export function saveStoredDemoProfile(profile: MasterProfile) {
  if (typeof window === 'undefined') return;

  try {
    const normalized = normalizeDemoProfile(profile) ?? demoProfile;
    window.localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(DEMO_PROFILE_UPDATED_EVENT, { detail: normalized }));
  } catch {}
}

export function resetStoredDemoProfile() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(DEMO_PROFILE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(DEMO_PROFILE_UPDATED_EVENT, { detail: demoProfile }));
  } catch {}
}

export function getDemoProfile(slug: string, locale: 'ru' | 'en' = 'ru') {
  if (slug !== SLOTY_DEMO_SLUG) return null;
  return readStoredDemoProfile() ?? localizeDemoProfile(locale);
}

export function getDemoBookings(slug: string, locale: 'ru' | 'en' = 'ru') {
  return slug === SLOTY_DEMO_SLUG ? localizeDemoBookings(locale) : [];
}



const DEMO_SERVICE_BLUEPRINTS = [
  { name: 'Маникюр + покрытие', duration: 75, price: 4250, color: '#8B5CF6', category: 'Популярное' },
  { name: 'Укрепление гелем', duration: 90, price: 3700, color: '#22A06B', category: 'Поддержка' },
  { name: 'Смарт-педикюр', duration: 75, price: 3700, color: '#0EA5E9', category: 'Популярное' },
  { name: 'Снятие + новый дизайн', duration: 90, price: 5250, color: '#F97316', category: 'Дизайн' },
  { name: 'Экспресс-маникюр', duration: 45, price: 2500, color: '#EC4899', category: 'Базовый уход' },
  { name: 'Коррекция геля', duration: 60, price: 3200, color: '#14B8A6', category: 'Поддержка' },
  { name: 'Наращивание + дизайн', duration: 120, price: 6500, color: '#A855F7', category: 'Дизайн' },
  { name: 'Педикюр + покрытие', duration: 90, price: 4800, color: '#06B6D4', category: 'Популярное' },
  { name: 'Брови + окрашивание', duration: 45, price: 2300, color: '#F59E0B', category: 'Дополнительно' },
  { name: 'Ламинирование ресниц', duration: 75, price: 3500, color: '#64748B', category: 'Дополнительно' },
];

function getDashboardDemoServices(locale: 'ru' | 'en'): NonNullable<WorkspaceSections['services']> {
  const totalBookings = Math.max(1, demoBookings.length);

  return DEMO_SERVICE_BLUEPRINTS.map((service, index) => {
    const related = demoBookings.filter((booking) => booking.service === service.name);
    const revenue = related
      .filter((booking) => booking.status === 'completed')
      .reduce((sum, booking) => sum + (booking.priceAmount ?? service.price), 0);

    return {
      id: `demo-service-${index + 1}`,
      name: locale === 'en' ? (demoBookingEn[`demo-booking-${index + 1}`]?.service ?? service.name) : service.name,
      duration: service.duration,
      price: service.price,
      status: index === 9 ? 'seasonal' : 'active',
      visible: index !== 9,
      bookings: related.length,
      revenue,
      popularity: Math.round((related.length / totalBookings) * 100),
      category: locale === 'ru' ? service.category : 'Service',
      color: service.color,
      calendarColor: service.color,
    } as NonNullable<WorkspaceSections['services']>[number] & Record<string, unknown>;
  });
}

function hourlySlots(startHour: number, endHour: number) {
  return Array.from({ length: endHour - startHour }, (_, index) => {
    const start = startHour + index;
    const end = start + 1;
    return `${String(start).padStart(2, '0')}:00–${end === 24 ? '24:00' : `${String(end).padStart(2, '0')}:00`}`;
  });
}

function getDashboardDemoAvailability(locale: 'ru' | 'en') {
  const labels = locale === 'ru'
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return labels.map((label, index) => ({
    id: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][index],
    label,
    status: index === 6 ? 'day-off' : index === 5 ? 'short' : 'workday',
    slots: index === 6 ? [] : index === 5 ? hourlySlots(10, 20) : hourlySlots(8, 24),
    breaks: index === 6 ? [] : index === 5 ? ['13:00–13:30'] : ['13:00–14:00', '19:30–20:00'],
    blockedSlots: index === 2 ? ['11:00–14:00'] : index === 6 ? ['08:00–24:00'] : [],
  }));
}

function getDashboardDemoTemplates(locale: 'ru' | 'en'): NonNullable<WorkspaceSections['templates']> {
  return locale === 'ru'
    ? [
        { id: 'demo-template-1', title: 'Напоминание за день', channel: 'Telegram', conversion: '91%', variables: ['{имя}', '{дата}', '{время}'], content: 'Здравствуйте, {имя}! Напоминаю о записи {дата} в {время}. Если планы изменились — напишите сюда.' },
        { id: 'demo-template-2', title: 'После визита', channel: 'Telegram', conversion: '38%', variables: ['{имя}', '{ссылка}'], content: '{имя}, спасибо за визит! Буду рада отзыву и следующей записи: {ссылка}' },
        { id: 'demo-template-3', title: 'Свободное окно', channel: 'ВК', conversion: '24%', variables: ['{имя}', '{окно}'], content: '{имя}, освободилось окно {окно}. Хотите занять?' },
      ]
    : [
        { id: 'demo-template-1', title: 'Day-before reminder', channel: 'Telegram', conversion: '91%', variables: ['{name}', '{date}', '{time}'], content: 'Hi {name}! A reminder about your visit on {date} at {time}.' },
        { id: 'demo-template-2', title: 'After visit', channel: 'Telegram', conversion: '38%', variables: ['{name}', '{link}'], content: '{name}, thanks for visiting! Here is the booking link: {link}' },
        { id: 'demo-template-3', title: 'Free slot', channel: 'VK', conversion: '24%', variables: ['{name}', '{slot}'], content: '{name}, a slot opened at {slot}. Want to take it?' },
      ];
}

function getDashboardDemoNotifications(locale: 'ru' | 'en') {
  return locale === 'ru'
    ? [
        { id: 'demo-notification-1', title: 'Новая запись', description: 'Мгновенно показывать новую заявку и источник.', channel: 'telegram', enabled: true, critical: true },
        { id: 'demo-notification-2', title: 'Клиент подтвердил визит', description: 'Автоматически обновлять статус записи.', channel: 'push', enabled: true, critical: true },
        { id: 'demo-notification-3', title: 'Окно освободилось', description: 'Предложить слот постоянным клиентам.', channel: 'vk', enabled: true },
        { id: 'demo-notification-4', title: 'Отзыв после визита', description: 'Через 2 часа после завершения услуги.', channel: 'telegram', enabled: true },
      ]
    : [
        { id: 'demo-notification-1', title: 'New booking', description: 'Show new requests and source instantly.', channel: 'telegram', enabled: true, critical: true },
        { id: 'demo-notification-2', title: 'Client confirmed', description: 'Update booking status automatically.', channel: 'push', enabled: true, critical: true },
        { id: 'demo-notification-3', title: 'Slot opened', description: 'Offer the slot to regular clients.', channel: 'vk', enabled: true },
        { id: 'demo-notification-4', title: 'Review after visit', description: 'Two hours after the service is completed.', channel: 'telegram', enabled: true },
      ];
}

function getDashboardDemoClientNotes() {
  return {
    '+7 999 100-00-11': 'Мария любит молочные оттенки и короткий квадрат. Всегда подтверждает запись в Telegram.',
    '+7 999 120-00-19': 'Ольга часто берёт педикюр и укрепление. Лучше предлагать вечерние окна.',
    '+7 999 300-00-33': 'Елена приходит с референсом дизайна. Нужен запас 15 минут.',
    '+7 999 410-00-48': 'Ксения просит чек после визита и напоминание за час.',
    '+7 999 520-00-57': 'Алина постоянный клиент. Записывать сразу на следующий визит.',
  };
}

function getDashboardDemoClientFavorites() {
  return {
    '+7 999 100-00-11': true,
    '+7 999 300-00-33': true,
    '+7 999 520-00-57': true,
    '+7 999 930-00-94': true,
  };
}

export function getDashboardDemoAppearance(): AppearanceSettings {
  return {
    ...defaultAppearanceSettings,
    accentTone: 'violet',
    neutralTone: 'pearl',
    density: 'compact',
    radius: 'medium',
    motion: 'smooth',
    cardStyle: 'soft',
    publicAccent: 'lime',
    publicSurface: 'soft',
    publicHeroLayout: 'split',
    publicCardStyle: 'soft',
    publicServicesStyle: 'grid',
    publicBookingStyle: 'panel',
    platformWidth: 'focused',
    sidebarDensity: 'tight',
    topbarDensity: 'tight',
  };
}

export function getDashboardDemoChatThreads(locale: 'ru' | 'en'): ChatThreadRecord[] {
  const firstVisit = daysFromToday(1);
  const secondVisit = daysFromToday(3);
  const thirdVisit = daysFromToday(7);
  const fourthVisit = daysFromToday(10);
  const today = daysFromToday(0);

  return [
    {
      id: 'demo-thread-1',
      workspaceId: 'demo-workspace',
      clientName: locale === 'ru' ? 'Мария' : 'Maria',
      clientPhone: '+7 999 100-00-11',
      channel: 'Telegram',
      segment: 'new',
      source: locale === 'ru' ? 'Публичная страница' : 'Public page',
      nextVisit: firstVisit,
      isPriority: true,
      botConnected: true,
      lastMessagePreview: locale === 'ru'
        ? 'Добрый день! Можно ли немного сдвинуть запись на завтра?'
        : 'Hello! Can we move tomorrow’s booking a little later?',
      lastMessageAt: new Date(`${firstVisit}T09:18:00.000Z`).toISOString(),
      unreadCount: 2,
      createdAt: new Date(`${firstVisit}T08:45:00.000Z`).toISOString(),
      updatedAt: new Date(`${firstVisit}T09:18:00.000Z`).toISOString(),
      messages: [
        {
          id: 'demo-thread-1-message-1',
          threadId: 'demo-thread-1',
          author: 'client',
          body: locale === 'ru'
            ? 'Здравствуйте! Я записана на маникюр завтра.'
            : 'Hello! I am booked for a manicure tomorrow.',
          viaBot: false,
          deliveryState: null,
          createdAt: new Date(`${firstVisit}T08:45:00.000Z`).toISOString(),
        },
        {
          id: 'demo-thread-1-message-2',
          threadId: 'demo-thread-1',
          author: 'system',
          body: locale === 'ru'
            ? 'КликБук бот подготовил мягкий перенос на 12:30.'
            : 'ClickBook bot prepared a soft reschedule for 12:30.',
          viaBot: true,
          deliveryState: 'queued',
          createdAt: new Date(`${firstVisit}T09:02:00.000Z`).toISOString(),
        },
        {
          id: 'demo-thread-1-message-3',
          threadId: 'demo-thread-1',
          author: 'client',
          body: locale === 'ru'
            ? 'Добрый день! Можно ли немного сдвинуть запись на завтра?'
            : 'Hello! Can we move tomorrow’s booking a little later?',
          viaBot: false,
          deliveryState: null,
          createdAt: new Date(`${firstVisit}T09:18:00.000Z`).toISOString(),
        },
      ],
    },
    {
      id: 'demo-thread-2',
      workspaceId: 'demo-workspace',
      clientName: locale === 'ru' ? 'Светлана' : 'Svetlana',
      clientPhone: '+7 999 200-00-22',
      channel: 'ВК',
      segment: 'active',
      source: 'ВК',
      nextVisit: secondVisit,
      isPriority: false,
      botConnected: true,
      lastMessagePreview: locale === 'ru'
        ? 'Подтверждаю, 14:30 мне подходит.'
        : 'Confirmed, 2:30 PM works for me.',
      lastMessageAt: new Date(`${secondVisit}T10:44:00.000Z`).toISOString(),
      unreadCount: 0,
      createdAt: new Date(`${secondVisit}T09:56:00.000Z`).toISOString(),
      updatedAt: new Date(`${secondVisit}T10:44:00.000Z`).toISOString(),
      messages: [
        {
          id: 'demo-thread-2-message-1',
          threadId: 'demo-thread-2',
          author: 'system',
          body: locale === 'ru'
            ? 'Здравствуйте, Светлана! Напоминаю о записи на педикюр.'
            : 'Hi Svetlana! A reminder about your pedicure booking.',
          viaBot: true,
          deliveryState: 'read',
          createdAt: new Date(`${secondVisit}T09:56:00.000Z`).toISOString(),
        },
        {
          id: 'demo-thread-2-message-2',
          threadId: 'demo-thread-2',
          author: 'client',
          body: locale === 'ru'
            ? 'Подтверждаю, 14:30 мне подходит.'
            : 'Confirmed, 2:30 PM works for me.',
          viaBot: false,
          deliveryState: null,
          createdAt: new Date(`${secondVisit}T10:44:00.000Z`).toISOString(),
        },
      ],
    },
    {
      id: 'demo-thread-3',
      workspaceId: 'demo-workspace',
      clientName: locale === 'ru' ? 'Елена' : 'Elena',
      clientPhone: '+7 999 300-00-33',
      channel: 'Telegram',
      segment: 'followup',
      source: locale === 'ru' ? 'Повторный визит' : 'Repeat visit',
      nextVisit: thirdVisit,
      isPriority: false,
      botConnected: true,
      lastMessagePreview: locale === 'ru'
        ? 'Спасибо! Скиньте, пожалуйста, ближайшие слоты на следующую неделю.'
        : 'Thanks! Please send the nearest slots for next week.',
      lastMessageAt: new Date(`${thirdVisit}T13:28:00.000Z`).toISOString(),
      unreadCount: 1,
      createdAt: new Date(`${thirdVisit}T12:10:00.000Z`).toISOString(),
      updatedAt: new Date(`${thirdVisit}T13:28:00.000Z`).toISOString(),
      messages: [
        {
          id: 'demo-thread-3-message-1',
          threadId: 'demo-thread-3',
          author: 'system',
          body: locale === 'ru'
            ? 'Спасибо за визит! Когда будет удобно, отправлю ближайшие окна сюда.'
            : 'Thanks for visiting! I can send the nearest slots here.',
          viaBot: true,
          deliveryState: 'delivered',
          createdAt: new Date(`${thirdVisit}T12:10:00.000Z`).toISOString(),
        },
        {
          id: 'demo-thread-3-message-2',
          threadId: 'demo-thread-3',
          author: 'client',
          body: locale === 'ru'
            ? 'Спасибо! Скиньте, пожалуйста, ближайшие слоты на следующую неделю.'
            : 'Thanks! Please send the nearest slots for next week.',
          viaBot: false,
          deliveryState: null,
          createdAt: new Date(`${thirdVisit}T13:28:00.000Z`).toISOString(),
        },
      ],
    },
    {
      id: 'demo-thread-4',
      workspaceId: 'demo-workspace',
      clientName: locale === 'ru' ? 'Анна' : 'Anna',
      clientPhone: '+7 999 410-10-44',
      channel: 'Telegram',
      segment: 'active',
      source: locale === 'ru' ? 'Ссылка в Инстаграм' : 'Instagram bio',
      nextVisit: secondVisit,
      isPriority: false,
      botConnected: true,
      lastMessagePreview: locale === 'ru'
        ? 'Супер, тогда оставляем запись на 18:00. До встречи!'
        : 'Perfect, then we keep the 6:00 PM slot. See you!',
      lastMessageAt: new Date(`${secondVisit}T15:12:00.000Z`).toISOString(),
      unreadCount: 0,
      createdAt: new Date(`${secondVisit}T14:22:00.000Z`).toISOString(),
      updatedAt: new Date(`${secondVisit}T15:12:00.000Z`).toISOString(),
      messages: [
        {
          id: 'demo-thread-4-message-1',
          threadId: 'demo-thread-4',
          author: 'client',
          body: locale === 'ru'
            ? 'Добрый день! Есть ли вечерние слоты на педикюр?'
            : 'Hi! Do you have any evening pedicure slots?',
          viaBot: false,
          deliveryState: null,
          createdAt: new Date(`${secondVisit}T14:22:00.000Z`).toISOString(),
        },
        {
          id: 'demo-thread-4-message-2',
          threadId: 'demo-thread-4',
          author: 'system',
          body: locale === 'ru'
            ? 'КликБук бот нашёл удобное окно на 18:00 и отправил быстрое подтверждение.'
            : 'ClickBook bot found a convenient 6:00 PM slot and sent a quick confirmation.',
          viaBot: true,
          deliveryState: 'delivered',
          createdAt: new Date(`${secondVisit}T14:39:00.000Z`).toISOString(),
        },
        {
          id: 'demo-thread-4-message-3',
          threadId: 'demo-thread-4',
          author: 'client',
          body: locale === 'ru'
            ? 'Супер, тогда оставляем запись на 18:00. До встречи!'
            : 'Perfect, then we keep the 6:00 PM slot. See you!',
          viaBot: false,
          deliveryState: null,
          createdAt: new Date(`${secondVisit}T15:12:00.000Z`).toISOString(),
        },
      ],
    },
    {
      id: 'demo-thread-5',
      workspaceId: 'demo-workspace',
      clientName: locale === 'ru' ? 'Кристина' : 'Kristina',
      clientPhone: '+7 999 510-14-55',
      channel: 'ВК',
      segment: 'new',
      source: locale === 'ru' ? 'ВК мини-приложение' : 'ВК mini app',
      nextVisit: firstVisit,
      isPriority: true,
      botConnected: true,
      lastMessagePreview: locale === 'ru'
        ? 'Добрый вечер! Я впервые, подскажите, сколько длится укрепление?'
        : 'Good evening! I am a new client — how long does strengthening take?',
      lastMessageAt: new Date(`${firstVisit}T18:14:00.000Z`).toISOString(),
      unreadCount: 1,
      createdAt: new Date(`${firstVisit}T17:52:00.000Z`).toISOString(),
      updatedAt: new Date(`${firstVisit}T18:14:00.000Z`).toISOString(),
      messages: [
        {
          id: 'demo-thread-5-message-1',
          threadId: 'demo-thread-5',
          author: 'system',
          body: locale === 'ru'
            ? 'Привет! Я помогу быстро записаться и отвечу на частые вопросы.'
            : 'Hi! I can help with a quick booking and answer common questions.',
          viaBot: true,
          deliveryState: 'read',
          createdAt: new Date(`${firstVisit}T17:52:00.000Z`).toISOString(),
        },
        {
          id: 'demo-thread-5-message-2',
          threadId: 'demo-thread-5',
          author: 'client',
          body: locale === 'ru'
            ? 'Добрый вечер! Я впервые, подскажите, сколько длится укрепление?'
            : 'Good evening! I am a new client — how long does strengthening take?',
          viaBot: false,
          deliveryState: null,
          createdAt: new Date(`${firstVisit}T18:14:00.000Z`).toISOString(),
        },
      ],
    },
    {
      id: 'demo-thread-6',
      workspaceId: 'demo-workspace',
      clientName: locale === 'ru' ? 'Наталья' : 'Natalia',
      clientPhone: '+7 999 620-00-63',
      channel: 'Telegram',
      segment: 'active',
      source: locale === 'ru' ? 'Повторный визит' : 'Repeat visit',
      nextVisit: today,
      isPriority: true,
      botConnected: true,
      lastMessagePreview: locale === 'ru' ? 'Я уже в пути, буду через 10 минут.' : 'I am on my way, will be there in 10 minutes.',
      lastMessageAt: new Date(`${today}T18:44:00.000Z`).toISOString(),
      unreadCount: 1,
      createdAt: new Date(`${today}T18:20:00.000Z`).toISOString(),
      updatedAt: new Date(`${today}T18:44:00.000Z`).toISOString(),
      messages: [
        { id: 'demo-thread-6-message-1', threadId: 'demo-thread-6', author: 'system', body: locale === 'ru' ? 'Напоминаю о записи сегодня в 19:00. Если вы уже в пути — нажмите кнопку в сообщении.' : 'Reminder about your 7:00 PM booking today.', viaBot: true, deliveryState: 'delivered', createdAt: new Date(`${today}T18:00:00.000Z`).toISOString() },
        { id: 'demo-thread-6-message-2', threadId: 'demo-thread-6', author: 'client', body: locale === 'ru' ? 'Я уже в пути, буду через 10 минут.' : 'I am on my way, will be there in 10 minutes.', viaBot: false, deliveryState: null, createdAt: new Date(`${today}T18:44:00.000Z`).toISOString() },
      ],
    },
    {
      id: 'demo-thread-7',
      workspaceId: 'demo-workspace',
      clientName: locale === 'ru' ? 'Олеся' : 'Olesya',
      clientPhone: '+7 999 820-14-72',
      channel: 'ВК',
      segment: 'new',
      source: locale === 'ru' ? 'Рекомендация' : 'Referral',
      nextVisit: fourthVisit,
      isPriority: false,
      botConnected: true,
      lastMessagePreview: locale === 'ru' ? 'Можно ли записаться на брови после 18:00?' : 'Can I book brows after 6 PM?',
      lastMessageAt: new Date(`${fourthVisit}T11:05:00.000Z`).toISOString(),
      unreadCount: 0,
      createdAt: new Date(`${fourthVisit}T10:48:00.000Z`).toISOString(),
      updatedAt: new Date(`${fourthVisit}T11:05:00.000Z`).toISOString(),
      messages: [
        { id: 'demo-thread-7-message-1', threadId: 'demo-thread-7', author: 'client', body: locale === 'ru' ? 'Можно ли записаться на брови после 18:00?' : 'Can I book brows after 6 PM?', viaBot: false, deliveryState: null, createdAt: new Date(`${fourthVisit}T10:48:00.000Z`).toISOString() },
        { id: 'demo-thread-7-message-2', threadId: 'demo-thread-7', author: 'system', body: locale === 'ru' ? 'Бот предложил ближайшие вечерние окна и ссылку на витрину.' : 'The bot offered evening slots and the booking page link.', viaBot: true, deliveryState: 'read', createdAt: new Date(`${fourthVisit}T11:05:00.000Z`).toISOString() },
      ],
    }
  ];
}


export function getDashboardDemoAnalyticsHighlights(locale: 'ru' | 'en') {
  return locale === 'ru'
    ? [
        {
          id: 'demo-analytics-1',
          label: 'Лучшее окно недели',
          value: 'Вт · 12:30–16:00',
          detail: 'Самый плотный поток записей и лучшая конверсия из Телеграм.',
        },
        {
          id: 'demo-analytics-2',
          label: 'Точка роста',
          value: '+18%',
          detail: 'Повторные визиты растут после шаблона «Спасибо после визита».',
        },
        {
          id: 'demo-analytics-3',
          label: 'Что показать клиенту',
          value: 'Чаты + шаблоны',
          detail: 'Лучше всего работают каналы, где клиент сразу видит страницу записи и отзывы.',
        },
      ]
    : [
        {
          id: 'demo-analytics-1',
          label: 'Best window this week',
          value: 'Tue · 12:30–4:00 PM',
          detail: 'The densest booking flow and the strongest Telegram conversion.',
        },
        {
          id: 'demo-analytics-2',
          label: 'Growth point',
          value: '+18%',
          detail: 'Repeat visits grow after the “Thank you after visit” template.',
        },
        {
          id: 'demo-analytics-3',
          label: 'What to show first',
          value: 'Chats + templates',
          detail: 'Demos convert best when messages, analytics, and the public page are shown together.',
        },
      ];
}

export function getDashboardDemoAnalyticsFeed(locale: 'ru' | 'en') {
  return locale === 'ru'
    ? [
        'За последние 7 дней Телеграм дал больше всего подтверждённых записей.',
        'Во вторник и четверг окно после обеда заполняется быстрее всего.',
        'Повторные визиты чаще приходят после сообщения с благодарностью и ссылкой на запись.',
        'Напоминание за день до визита заметно снижает количество переносов.',
      ]
    : [
        'Telegram delivered the largest number of confirmed bookings in the last 7 days.',
        'Tuesday and Thursday afternoons fill up the fastest.',
        'Repeat visits grow after a thank-you message with a booking link.',
        'A reminder one day before the visit noticeably reduces reschedules.',
      ];
}

export function getDashboardDemoSections(locale: 'ru' | 'en'): WorkspaceSections {
  return {
    appearance: getDashboardDemoAppearance(),
    bookings: getDemoBookings(SLOTY_DEMO_SLUG, locale),
    services: getDashboardDemoServices(locale),
    availability: getDashboardDemoAvailability(locale) as WorkspaceSections['availability'],
    templates: getDashboardDemoTemplates(locale),
    notifications: getDashboardDemoNotifications(locale),
    chats: getDashboardDemoChatThreads(locale),
    quietHours: true,
    fallbackEmail: true,
    clientNotes: getDashboardDemoClientNotes(),
    clientFavorites: getDashboardDemoClientFavorites(),
    subscription: {
      planId: 'pro',
      status: 'active',
      billingCycle: 'monthly',
      provider: 'demo',
    },
  };
}
