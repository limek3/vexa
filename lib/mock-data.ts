
import type { Booking, MasterProfile } from '@/lib/types';

const createWorkImage = (accentA: string, accentB: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accentA}" />
          <stop offset="100%" stop-color="${accentB}" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.72)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.18)" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#bg)" />
      <rect x="44" y="36" width="552" height="408" rx="38" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.26)" />
      <rect x="116" y="84" width="408" height="312" rx="146" fill="rgba(255,248,244,0.92)" />
      <rect x="170" y="112" width="300" height="256" rx="120" fill="rgba(255,255,255,0.56)" />
      <rect x="198" y="136" width="44" height="168" rx="22" fill="${accentA}" />
      <rect x="256" y="128" width="44" height="186" rx="22" fill="${accentB}" />
      <rect x="314" y="120" width="44" height="178" rx="22" fill="${accentA}" />
      <rect x="372" y="132" width="44" height="164" rx="22" fill="${accentB}" />
      <rect x="430" y="144" width="44" height="150" rx="22" fill="${accentA}" />
      <rect x="92" y="360" width="180" height="36" rx="18" fill="rgba(255,255,255,0.24)" />
      <text x="112" y="384" font-family="Golos UI, Golos Text, Arial, sans-serif" font-size="24" fill="white">${label}</text>
    </svg>`,
  )}`;

export const demoMasterProfile: MasterProfile = {
  id: 'demo-anna',
  slug: 'anna-nails',
  name: 'Анна Петрова',
  profession: 'Мастер маникюра',
  city: 'Амстердам',
  bio: 'Аккуратный маникюр, стойкое покрытие и спокойный сервис без длинной переписки. Услуги, отзывы и запись собраны в одном месте.',
  services: [
    'Маникюр без покрытия',
    'Маникюр + гель-лак',
    'Укрепление ногтей',
    'Деликатный nail-дизайн',
    'Снятие + уход',
  ],
  phone: '+31 6 1234 5678',
  telegram: '@anna_nails',
  whatsapp: 'vk.com/anna',
  hideWhatsapp: true,
  avatar: '',
  rating: 4.9,
  reviewCount: 127,
  responseTime: 'Отвечает в течение 15 минут',
  experienceLabel: '6 лет опыта',
  priceHint: 'от 2 500 ₽',

  workGallery: [
    { id: 'work-1', title: 'Signature blue gloss', image: createWorkImage('#127dfe', '#0d1016', 'Blue gloss') },
    { id: 'work-2', title: 'Mono nude set', image: createWorkImage('#f6f7f9', '#cfd6e0', 'Mono nude') },
    { id: 'work-3', title: 'Clean french line', image: createWorkImage('#ffffff', '#127dfe', 'French line') },
    { id: 'work-4', title: 'Deep contrast detail', image: createWorkImage('#0d1016', '#127dfe', 'Contrast') },
    { id: 'work-5', title: 'Soft silver finish', image: createWorkImage('#e5e8ed', '#8b94a3', 'Silver set') },
    { id: 'work-6', title: 'Blue accent set', image: createWorkImage('#127dfe', '#7fb8ff', 'Blue accent') },
  ],
  reviews: [
    {
      id: 'review-1',
      author: 'Мария',
      rating: 5,
      text: 'Очень аккуратная работа и приятная атмосфера. Удобно, что запись заняла буквально пару минут и не пришлось уточнять детали в переписке.',
      dateLabel: '2 недели назад',
      service: 'Маникюр + гель-лак',
    },
    {
      id: 'review-2',
      author: 'Екатерина',
      rating: 5,
      text: 'На странице сразу видны услуги, даты и контакты. Всё спокойно и понятно.',
      dateLabel: '1 месяц назад',
      service: 'Укрепление ногтей',
    },
    {
      id: 'review-3',
      author: 'София',
      rating: 4,
      text: 'Чисто, спокойно и понятно по сервису. Подтверждение пришло быстро.',
      dateLabel: '6 недель назад',
      service: 'Снятие + уход',
    },
    {
      id: 'review-4',
      author: 'Алина',
      rating: 5,
      text: 'Очень понятная страница: выбрала услугу, дату и время без вопросов. Это редкость — обычно приходится всё писать в мессенджере.',
      dateLabel: '2 месяца назад',
      service: 'Маникюр без покрытия',
    },
  ],
  createdAt: '2026-04-04T09:00:00.000Z',
};

export const demoProfiles: MasterProfile[] = [demoMasterProfile];

export const demoBookings: Booking[] = [
  {
    id: 'demo-booking-1',
    masterSlug: 'anna-nails',
    clientName: 'Мария',
    clientPhone: '+31 6 5555 0101',
    service: 'Маникюр + гель-лак',
    date: '2026-04-07',
    time: '13:30',
    comment: 'Хочу нюдовый оттенок.',
    status: 'confirmed',
    createdAt: '2026-04-04T10:15:00.000Z',
  },
  {
    id: 'demo-booking-2',
    masterSlug: 'anna-nails',
    clientName: 'Екатерина',
    clientPhone: '+31 6 5555 0102',
    service: 'Укрепление ногтей',
    date: '2026-04-08',
    time: '11:00',
    comment: '',
    status: 'new',
    createdAt: '2026-04-04T11:45:00.000Z',
  },
  {
    id: 'demo-booking-3',
    masterSlug: 'anna-nails',
    clientName: 'София',
    clientPhone: '+31 6 5555 0103',
    service: 'Снятие + уход',
    date: '2026-04-09',
    time: '16:00',
    comment: 'Нужен вечерний слот после работы.',
    status: 'new',
    createdAt: '2026-04-05T08:20:00.000Z',
  },
  {
    id: 'demo-booking-4',
    masterSlug: 'anna-nails',
    clientName: 'Елена',
    clientPhone: '+31 6 5555 0104',
    service: 'Маникюр без покрытия',
    date: '2026-04-06',
    time: '10:00',
    comment: 'Важно закончить до 11:00.',
    status: 'completed',
    createdAt: '2026-04-05T14:05:00.000Z',
  },
];
