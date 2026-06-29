import type {
  Accent,
  Appointment,
  AppointmentStatus,
  Chat,
  Client,
  ClientStatus,
  DesktopState,
  MasterProfile,
  NavSection,
  Preferences,
  ScreenId,
  Service,
  TaskItem,
} from './desktop-types';

export const defaultPreferences: Preferences = {
  theme: 'light',
  accent: 'clay',
  density: 'default',
  radius: 'default',
  language: 'ru',
};

export const masterProfile: MasterProfile = {
  name: 'Алиса Корнеева',
  profession: 'Колорист, парикмахер-стилист',
  initials: 'АК',
  city: 'Санкт-Петербург',
  studio: 'Студия Lumen, ул. Рубинштейна 5',
  about:
    'Работаю с цветом 9 лет. Тёплые натуральные оттенки, аккуратные стрижки, бережный уход. Спокойная атмосфера, без спешки.',
  phone: '+7 (921) 884 12 02',
  email: 'hello@clickbook.ru',
  username: 'alisa',
  publicUrl: 'кликбук.рф/alisa',
  reviews: 247,
  rating: 4.94,
};

export const screenLabels: Record<ScreenId, string> = {
  dashboard: 'Главная',
  schedule: 'Записи',
  chats: 'Чаты',
  clients: 'Клиенты',
  services: 'Услуги',
  analytics: 'Статистика',
  public: 'Страница записи',
  appearance: 'Внешний вид',
  subscription: 'Подписка',
  account: 'Настройки',
  profile: 'Профиль',
  availability: 'График',
  templates: 'Шаблоны',
  notifications: 'Уведомления',
  integrations: 'Интеграции',
  reviews: 'Отзывы',
  settings: 'Настройки',
  finance: 'Финансы',
  marketing: 'Маркетинг',
  payments: 'Платежи',
  limits: 'Лимиты',
  sources: 'Источники',
  help: 'Помощь',
};

export const screenPaths: Record<ScreenId, string> = {
  dashboard: 'dashboard',
  schedule: 'schedule',
  chats: 'chats',
  clients: 'clients',
  services: 'services',
  analytics: 'analytics',
  public: 'public',
  appearance: 'appearance',
  subscription: 'subscription',
  account: 'account',
  profile: 'profile',
  availability: 'availability',
  templates: 'templates',
  notifications: 'notifications',
  integrations: 'integrations',
  reviews: 'reviews',
  settings: 'settings',
  finance: 'finance',
  marketing: 'marketing',
  payments: 'payments',
  limits: 'limits',
  sources: 'sources',
  help: 'help',
};

export const navSections: NavSection[] = [
  {
    section: 'Кабинет',
    items: [
      { id: 'dashboard', label: 'Главная', icon: 'home' },
      { id: 'schedule', label: 'Записи', icon: 'calendar', count: 5 },
      { id: 'chats', label: 'Чаты', icon: 'chat', count: 3 },
      { id: 'clients', label: 'Клиенты', icon: 'users' },
      { id: 'services', label: 'Услуги', icon: 'services' },
      { id: 'analytics', label: 'Статистика', icon: 'chart' },
    ],
  },
  {
    section: 'Личная страница',
    items: [
      { id: 'public', label: 'Страница записи', icon: 'page' },
      { id: 'appearance', label: 'Внешний вид', icon: 'palette' },
    ],
  },
  {
    section: 'Аккаунт',
    items: [
      { id: 'subscription', label: 'Подписка', icon: 'crown' },
      { id: 'account', label: 'Настройки', icon: 'gear' },
    ],
  },
];

export const appointmentStatuses: Record<AppointmentStatus, { label: string; kind: 'info' | 'success' | 'warn' | 'danger' | 'plain' }> = {
  new: { label: 'Новая', kind: 'info' },
  confirmed: { label: 'Подтверждена', kind: 'success' },
  done: { label: 'Завершена', kind: 'plain' },
  cancelled: { label: 'Отменена', kind: 'danger' },
  noshow: { label: 'Не пришёл', kind: 'warn' },
};

export const clientStatuses: Record<ClientStatus, { label: string; kind: 'accent' | 'success' | 'info' | 'plain' }> = {
  vip: { label: 'VIP', kind: 'accent' },
  regular: { label: 'Постоянный', kind: 'success' },
  new: { label: 'Новый', kind: 'info' },
  inactive: { label: 'Спящий', kind: 'plain' },
};

export const services: Service[] = [
  { id: 's1', cat: 'Окрашивание', name: 'Окрашивание AirTouch', dur: 240, price: 12500, active: true, public: true, short: 'Сложное окрашивание с мягкой воздушной растяжкой.' },
  { id: 's2', cat: 'Окрашивание', name: 'Тонирование', dur: 90, price: 4500, active: true, public: true, short: 'Освежение цвета или мягкое затемнение корня.' },
  { id: 's3', cat: 'Окрашивание', name: 'Однотонное окрашивание', dur: 120, price: 5800, active: true, public: true, short: 'Корни или полное окрашивание в один тон.' },
  { id: 's4', cat: 'Стрижка', name: 'Женская стрижка', dur: 75, price: 3800, active: true, public: true, short: 'С консультацией и укладкой.' },
  { id: 's5', cat: 'Стрижка', name: 'Стрижка чёлки', dur: 30, price: 1200, active: true, public: true, short: 'Быстрая коррекция формы.' },
  { id: 's6', cat: 'Уход', name: 'Глубокий уход K18', dur: 45, price: 3200, active: true, public: true, short: 'Восстановление связей в волосе.' },
  { id: 's7', cat: 'Уход', name: 'Ботокс для волос', dur: 90, price: 4900, active: false, public: false, short: 'Временно скрыто из публичной записи.' },
  { id: 's8', cat: 'Укладка', name: 'Праздничная укладка', dur: 60, price: 3500, active: true, public: true, short: 'Для выпускного, фотосессии или события.' },
  { id: 's9', cat: 'Консультация', name: 'Консультация по цвету', dur: 30, price: 0, active: true, public: true, short: 'Бесплатно при первой записи на окрашивание.' },
];

export const clients: Client[] = [
  { id: 'c1', name: 'Елена Михайлова', phone: '+7 911 234 88 91', tag: 'vip', visits: 18, last: '15 мая', next: '04 июн', notes: 'Аллергия на ammonia base. Любит травяной чай.', status: 'vip' },
  { id: 'c2', name: 'Анна Соловьёва', phone: '+7 921 008 71 04', tag: 'regular', visits: 12, last: '02 мая', next: '28 мая', notes: 'Базовый тон 7N, ботокс раз в 2 месяца.', status: 'regular' },
  { id: 'c3', name: 'Мария Денисова', phone: '+7 921 552 19 33', tag: 'regular', visits: 7, last: '18 апр', next: '—', notes: '', status: 'regular' },
  { id: 'c4', name: 'Софья Журавлёва', phone: '+7 999 117 60 22', tag: 'new', visits: 1, last: '—', next: '26 мая', notes: 'Пришла по рекомендации Анны Соловьёвой.', status: 'new' },
  { id: 'c5', name: 'Дарья Полякова', phone: '+7 921 445 90 11', tag: 'regular', visits: 9, last: '07 мая', next: '04 июн', notes: '', status: 'regular' },
  { id: 'c6', name: 'Ольга Ермакова', phone: '+7 911 332 47 50', tag: 'vip', visits: 22, last: '20 мая', next: '03 июн', notes: 'Платиновый блонд, очень тщательно ухаживает.', status: 'vip' },
  { id: 'c7', name: 'Виктория Лесная', phone: '+7 911 778 02 13', tag: 'inactive', visits: 3, last: '11 фев', next: '—', notes: 'Переехала, возможно вернётся осенью.', status: 'inactive' },
  { id: 'c8', name: 'Полина Гусева', phone: '+7 921 219 86 25', tag: 'new', visits: 1, last: '21 мая', next: '—', notes: '', status: 'new' },
  { id: 'c9', name: 'Ксения Алексеева', phone: '+7 921 644 31 09', tag: 'regular', visits: 6, last: '14 мая', next: '02 июн', notes: '', status: 'regular' },
  { id: 'c10', name: 'Татьяна Романова', phone: '+7 911 008 12 78', tag: 'regular', visits: 11, last: '09 мая', next: '06 июн', notes: 'Любит длинные стрижки, не короче ключиц.', status: 'regular' },
  { id: 'c11', name: 'Лиза Бровко', phone: '+7 921 110 56 41', tag: 'vip', visits: 31, last: '23 мая', next: '30 мая', notes: 'Подруга со студии йоги.', status: 'vip' },
  { id: 'c12', name: 'Юлия Шилова', phone: '+7 921 388 71 22', tag: 'new', visits: 0, last: '—', next: '29 мая', notes: 'Первый визит — консультация.', status: 'new' },
];

export const appointments: Appointment[] = [
  { id: 'a01', day: 0, start: '09:00', end: '10:15', clientId: 'c2', serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a02', day: 0, start: '10:30', end: '14:30', clientId: 'c1', serviceId: 's1', status: 'confirmed', notes: 'AirTouch + тонирование.' },
  { id: 'a03', day: 0, start: '15:00', end: '15:45', clientId: 'c5', serviceId: 's6', status: 'new', notes: 'Первое посещение после окрашивания.' },
  { id: 'a04', day: 0, start: '16:00', end: '17:00', clientId: 'c8', serviceId: 's8', status: 'confirmed', notes: 'На день рождения подруги.' },
  { id: 'a05', day: 0, start: '17:30', end: '19:00', clientId: 'c9', serviceId: 's3', status: 'confirmed', notes: '' },
  { id: 'a06', day: 1, start: '10:00', end: '11:15', clientId: 'c3', serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a07', day: 1, start: '12:00', end: '13:30', clientId: 'c10', serviceId: 's2', status: 'confirmed', notes: '' },
  { id: 'a08', day: 1, start: '14:30', end: '15:00', clientId: 'c12', serviceId: 's9', status: 'new', notes: 'Консультация по сложному окрашиванию.' },
  { id: 'a09', day: 1, start: '16:00', end: '17:15', clientId: 'c4', serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a10', day: 2, start: '11:00', end: '15:00', clientId: 'c6', serviceId: 's1', status: 'confirmed', notes: '' },
  { id: 'a11', day: 2, start: '16:00', end: '17:30', clientId: 'c11', serviceId: 's2', status: 'confirmed', notes: '' },
  { id: 'a12', day: 3, start: '10:00', end: '11:00', clientId: 'c5', serviceId: 's8', status: 'confirmed', notes: '' },
  { id: 'a13', day: 3, start: '13:00', end: '14:15', clientId: 'c2', serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a14', day: 3, start: '15:00', end: '15:30', clientId: 'c8', serviceId: 's5', status: 'confirmed', notes: '' },
  { id: 'a15', day: 4, start: '11:00', end: '12:15', clientId: 'c3', serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a16', day: 4, start: '14:00', end: '15:30', clientId: 'c9', serviceId: 's2', status: 'new', notes: '' },
  { id: 'a17', day: 5, start: '11:00', end: '13:00', clientId: 'c1', serviceId: 's3', status: 'confirmed', notes: '' },
  { id: 'a18', day: 5, start: '14:00', end: '14:45', clientId: 'c6', serviceId: 's6', status: 'confirmed', notes: '' },
];

export const chats: Chat[] = [
  { id: 'ch1', clientId: 'c4', unread: 2, time: '14:24', pinned: true, online: true, preview: 'Спасибо! А можно ещё уточнить про длительность?', messages: [
    { id: 'm1', from: 'them', text: 'Здравствуйте! Хочу записаться на стрижку. У вас есть слот на четверг утром?', time: '14:08' },
    { id: 'm2', from: 'me', text: 'Здравствуйте, Софья! Есть свободно в 16:00 в четверг — подойдёт?', time: '14:12', read: true },
    { id: 'm3', from: 'me', type: 'booking', booking: { serviceId: 's4', date: 'Чт, 28 мая', time: '16:00', dur: 75, price: 3800 }, time: '14:12', read: true },
    { id: 'm4', from: 'them', text: 'Подойдёт, спасибо 🌿', time: '14:18', reactions: [{ e: '👍', mine: true }] },
    { id: 'm5', from: 'me', text: 'Отлично! Подтвердила запись. Адрес студии: Рубинштейна 5, второй этаж. Если что-то поменяется — напишите.', time: '14:14', read: true },
    { id: 'm6', from: 'them', text: 'Спасибо! А можно ещё уточнить про длительность?', time: '14:24', replyTo: 'm5' },
  ] },
  { id: 'ch2', clientId: 'c1', unread: 0, time: '11:45', pinned: true, online: false, lastSeen: '2 ч назад', preview: 'Подтверждаю запись на 04 июня. Спасибо!', messages: [
    { id: 'm1', from: 'me', text: 'Елена, напоминаю — запись 04.06 в 12:00, AirTouch + тонирование.', time: '11:30', read: true },
    { id: 'm2', from: 'them', text: 'Подтверждаю запись на 04 июня. Спасибо!', time: '11:45', reactions: [{ e: '❤️', mine: true }] },
  ] },
  { id: 'ch3', clientId: 'c11', unread: 0, time: 'Вчера', online: true, preview: 'До встречи 🌿', messages: [
    { id: 'm1', from: 'me', text: 'Лиза, не забудьте — наша запись завтра в 15:00.', time: 'Вчера, 18:10', read: true },
    { id: 'm2', from: 'them', text: 'До встречи 🌿', time: 'Вчера, 18:14' },
  ] },
  { id: 'ch4', clientId: 'c12', unread: 1, time: '08:02', online: true, preview: 'Доброе утро! Какие документы взять?', messages: [{ id: 'm1', from: 'them', text: 'Доброе утро! Какие документы взять?', time: '08:02' }] },
  { id: 'ch5', clientId: 'c9', unread: 0, time: 'Пн', online: false, lastSeen: 'вчера', preview: 'Хорошо, до встречи', messages: [
    { id: 'm1', from: 'me', type: 'voice', dur: '0:24', time: 'Пн, 19:02', read: true },
    { id: 'm2', from: 'them', text: 'Хорошо, до встречи', time: 'Пн, 19:08' },
  ] },
];

export const quickReplies = ['Спасибо за запись!', 'Подтверждаю', 'Можем перенести?', 'Жду вас', 'Адрес: Рубинштейна 5, 2 этаж'];
export const messageTemplates = [
  { key: '/привет', title: 'Приветствие', text: 'Здравствуйте! Спасибо за запись 🌿 Если возникнут вопросы — пишите.' },
  { key: '/подтв', title: 'Подтверждение', text: 'Подтверждаю вашу запись. До встречи!' },
  { key: '/перенос', title: 'Предложить перенос', text: 'Можем перенести запись на другое удобное время. Когда вам подходит?' },
  { key: '/адрес', title: 'Адрес студии', text: 'Адрес: ул. Рубинштейна 5, второй этаж. Домофон 12. Жду вас!' },
];

export const notifications = [
  { id: 'n1', icon: 'plus', title: 'Новая запись', body: 'Софья Журавлёва — стрижка, 26 мая 16:00', time: '14 мин назад', unread: true },
  { id: 'n2', icon: 'chat', title: 'Сообщение от Софьи', body: '«Спасибо! А можно ещё уточнить про длительность?»', time: '20 мин назад', unread: true },
  { id: 'n3', icon: 'x', title: 'Отмена записи', body: 'Татьяна Романова отменила запись 28 мая.', time: '2 ч назад', unread: false },
  { id: 'n4', icon: 'eye', title: 'Личная страница', body: 'Сегодня страницу посмотрели 34 человека.', time: 'утром', unread: false },
];

export const tasks: TaskItem[] = [
  { id: 't1', title: 'Заказать оттенок 8.13 у поставщика', done: false, due: 'Сегодня' },
  { id: 't2', title: 'Записать видео ухода за окрашиванием', done: false, due: 'Эта неделя' },
  { id: 't3', title: 'Поздравить Елену с днём рождения', done: false, due: '02 июн' },
  { id: 't4', title: 'Обновить фото на личной странице', done: true, due: '—' },
];

export const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const monthDays = ['25', '26', '27', '28', '29', '30', '31'];
export const monthLabel = 'май 2026';

export const accentOptions: Array<{ id: Accent; label: string; description: string }> = [
  { id: 'clay', label: 'Глина', description: 'тёплый премиальный акцент' },
  { id: 'sage', label: 'Шалфей', description: 'спокойный натуральный тон' },
  { id: 'indigo', label: 'Индиго', description: 'технологичный холодный акцент' },
  { id: 'plum', label: 'Слива', description: 'мягкая beauty-палитра' },
  { id: 'amber', label: 'Янтарь', description: 'солнечный тёплый акцент' },
];

export function createInitialState(): DesktopState {
  return {
    preferences: defaultPreferences,
    clients,
    services,
    appointments,
    chats,
    notifications,
    tasks,
  };
}

export function safeParseDesktopState(value: string | null): DesktopState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<DesktopState>;
    return {
      preferences: { ...defaultPreferences, ...(parsed.preferences ?? {}) },
      clients: parsed.clients?.length ? parsed.clients : clients,
      services: parsed.services?.length ? parsed.services : services,
      appointments: parsed.appointments?.length ? parsed.appointments : appointments,
      chats: parsed.chats?.length ? parsed.chats : chats,
      notifications: parsed.notifications?.length ? parsed.notifications : notifications,
      tasks: parsed.tasks?.length ? parsed.tasks : tasks,
    };
  } catch {
    return null;
  }
}

export function formatMoney(value: number) {
  return value === 0 ? 'Бесплатно' : new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

export function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function timeToMinutes(time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
