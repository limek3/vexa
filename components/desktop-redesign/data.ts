import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  Crown,
  Eye,
  Globe2,
  Home,
  Link2,
  Megaphone,
  MessageCircle,
  Paintbrush,
  Plug,
  Receipt,
  Scissors,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRoundCog,
  Users,
  WalletCards,
} from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  Chat,
  Client,
  ClientStatus,
  Density,
  DesktopState,
  MasterProfile,
  NavSection,
  Preferences,
  Radius,
  ScreenId,
  Service,
  TaskItem,
  UtilityScreenId,
} from './types';

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
    'Работаю с цветом 9 лет. Теплые натуральные оттенки, аккуратные стрижки, бережный уход. Спокойная атмосфера, без спешки.',
  phone: '+7 (921) 884 12 02',
  email: 'a.korneeva@pora.app',
  username: 'alisa',
  publicUrl: 'pora.app/alisa',
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

export const routeToScreen: Record<string, ScreenId> = Object.fromEntries(
  Object.entries(screenPaths).map(([screen, path]) => [path, screen]),
) as Record<string, ScreenId>;

export const navSections: NavSection[] = [
  {
    label: 'Кабинет',
    items: [
      { id: 'dashboard', label: 'Главная', icon: Home },
      { id: 'schedule', label: 'Записи', icon: CalendarDays, count: 5 },
      { id: 'chats', label: 'Чаты', icon: MessageCircle, count: 3 },
      { id: 'clients', label: 'Клиенты', icon: Users },
      { id: 'services', label: 'Услуги', icon: Scissors },
      { id: 'analytics', label: 'Статистика', icon: BarChart3 },
    ],
  },
  {
    label: 'Личная страница',
    items: [
      { id: 'public', label: 'Страница записи', icon: Globe2 },
      { id: 'appearance', label: 'Внешний вид', icon: Paintbrush },
    ],
  },
  {
    label: 'Аккаунт',
    items: [
      { id: 'subscription', label: 'Подписка', icon: Crown },
      { id: 'account', label: 'Настройки', icon: Settings },
    ],
  },
];

export const utilityScreens: UtilityScreenId[] = [
  'profile',
  'availability',
  'templates',
  'notifications',
  'integrations',
  'reviews',
  'settings',
  'finance',
  'marketing',
  'payments',
  'limits',
  'sources',
  'help',
];

export const utilityMeta: Record<
  UtilityScreenId,
  {
    icon: typeof Home;
    eyebrow: string;
    title: string;
    text: string;
    cards: Array<{ title: string; value: string; text: string }>;
  }
> = {
  profile: {
    icon: UserRoundCog,
    eyebrow: 'Профиль мастера',
    title: 'Карточка мастера',
    text: 'Профиль объединен с публичной страницей записи: контакты, описание, услуги и предпросмотр доступны в одном стиле.',
    cards: [
      { title: 'Публичная ссылка', value: masterProfile.publicUrl, text: 'Используется в сообщениях и виджетах.' },
      { title: 'Рейтинг', value: String(masterProfile.rating), text: `${masterProfile.reviews} отзывов клиентов.` },
      { title: 'Статус', value: 'Опубликован', text: 'Страница доступна клиентам.' },
    ],
  },
  availability: {
    icon: CalendarDays,
    eyebrow: 'График',
    title: 'Окна записи',
    text: 'Неделя сверстана в новой системе. Свободные окна и занятые дни можно быстро проверить перед отправкой клиенту.',
    cards: [
      { title: 'Рабочие дни', value: '6/7', text: 'Воскресенье закрыто.' },
      { title: 'Свободные окна', value: '14', text: 'Ближайшее сегодня в 19:00.' },
      { title: 'Загрузка', value: '62%', text: 'Нормальный ритм недели.' },
    ],
  },
  templates: {
    icon: Sparkles,
    eyebrow: 'Автоматизация',
    title: 'Шаблоны сообщений',
    text: 'Готовые ответы используются в чатах: подтверждение, перенос, адрес, уход после процедуры.',
    cards: [
      { title: 'Активные шаблоны', value: '7', text: 'Доступны через / в чате.' },
      { title: 'Частый ответ', value: 'Адрес', text: 'Отправлялся 18 раз за неделю.' },
      { title: 'Экономия', value: '2 ч', text: 'По оценке быстрых ответов.' },
    ],
  },
  notifications: {
    icon: Bell,
    eyebrow: 'События',
    title: 'Уведомления',
    text: 'Новые записи, сообщения, отмены и активность личной страницы собраны в единый inbox.',
    cards: [
      { title: 'Новые', value: '2', text: 'Требуют внимания сегодня.' },
      { title: 'Всего за день', value: '11', text: 'Записи, чаты, просмотры.' },
      { title: 'Среднее время реакции', value: '8 мин', text: 'Быстрее, чем на прошлой неделе.' },
    ],
  },
  integrations: {
    icon: Plug,
    eyebrow: 'Каналы',
    title: 'Интеграции',
    text: 'Сайт, Telegram, WhatsApp и VK показаны как рабочие каналы записи и общения.',
    cards: [
      { title: 'Подключено', value: '4', text: 'Все каналы активны.' },
      { title: 'Основной канал', value: 'Сайт', text: '42% новых записей.' },
      { title: 'Синхронизация', value: 'ОК', text: 'Последняя проверка 2 минуты назад.' },
    ],
  },
  reviews: {
    icon: Star,
    eyebrow: 'Репутация',
    title: 'Отзывы',
    text: 'Отзывы и рейтинг вынесены в новый спокойный layout, совместимый с публичной страницей.',
    cards: [
      { title: 'Рейтинг', value: '4.94', text: 'На основе 247 отзывов.' },
      { title: 'Новые отзывы', value: '6', text: 'За последние 30 дней.' },
      { title: 'NPS', value: '72', text: 'Высокая лояльность.' },
    ],
  },
  settings: {
    icon: Settings,
    eyebrow: 'Система',
    title: 'Настройки приложения',
    text: 'Базовые настройки теперь открываются в аккаунте, а служебные группы остаются доступными из роутинга.',
    cards: [
      { title: 'Язык', value: 'RU', text: 'Переключатель есть в верхней панели.' },
      { title: 'Тема', value: 'Синхронизирована', text: 'Светлая и темная темы работают в shell.' },
      { title: 'Состояние', value: 'Сохранено', text: 'Данные остаются в localStorage.' },
    ],
  },
  finance: {
    icon: WalletCards,
    eyebrow: 'Финансы',
    title: 'Деньги',
    text: 'Финансовые показатели подключены к общей mock-модели и повторяют новый карточный стиль.',
    cards: [
      { title: 'Доход сегодня', value: '38 400 ₽', text: '+12% к прошлому понедельнику.' },
      { title: 'Средний чек', value: '5 486 ₽', text: 'Растет за счет окрашиваний.' },
      { title: 'Оплачено онлайн', value: '64%', text: 'Через ссылки оплаты.' },
    ],
  },
  marketing: {
    icon: Megaphone,
    eyebrow: 'Маркетинг',
    title: 'Возврат клиентов',
    text: 'Маркетинговые подсказки выглядят в одном стиле с задачами и аналитикой.',
    cards: [
      { title: 'Кампании', value: '3', text: 'День рождения, уход, возврат.' },
      { title: 'Отклик', value: '18%', text: '+4 п.п. к прошлому месяцу.' },
      { title: 'Клиенты риска', value: '7', text: 'Нужен мягкий follow-up.' },
    ],
  },
  payments: {
    icon: CreditCard,
    eyebrow: 'Оплаты',
    title: 'Платежи',
    text: 'Ссылки оплаты, предоплаты и чеки показываются без старых визуальных паттернов.',
    cards: [
      { title: 'Ожидают оплаты', value: '4', text: 'На сумму 18 200 ₽.' },
      { title: 'Предоплаты', value: '9', text: 'За текущую неделю.' },
      { title: 'Чеки', value: '100%', text: 'Отправляются автоматически.' },
    ],
  },
  limits: {
    icon: SlidersHorizontal,
    eyebrow: 'Лимиты',
    title: 'Использование тарифа',
    text: 'Лимиты связаны с подпиской и показываются в новом лаконичном виде.',
    cards: [
      { title: 'Сообщения', value: '74%', text: '3 720 из 5 000.' },
      { title: 'AI-ответы', value: '41%', text: 'Осталось 590.' },
      { title: 'Хранилище', value: '18%', text: 'Фото и вложения.' },
    ],
  },
  sources: {
    icon: Link2,
    eyebrow: 'Источники',
    title: 'Каналы записей',
    text: 'Источники записи совпадают с аналитикой: сайт, Telegram, VK, личные рекомендации.',
    cards: [
      { title: 'Сайт', value: '42%', text: 'Основной источник новых записей.' },
      { title: 'Telegram', value: '27%', text: 'Быстрые подтверждения.' },
      { title: 'Рекомендации', value: '19%', text: 'Лучший LTV.' },
    ],
  },
  help: {
    icon: CircleHelp,
    eyebrow: 'Поддержка',
    title: 'Помощь',
    text: 'Раздел поддержки обновлен в общем desktop-стиле: быстрые действия, статус системы и база знаний.',
    cards: [
      { title: 'Статус', value: 'Все работает', text: 'Сбоев не обнаружено.' },
      { title: 'Ответ поддержки', value: '12 мин', text: 'Среднее время сегодня.' },
      { title: 'База знаний', value: '38 статей', text: 'По записи, чатам и оплатам.' },
    ],
  },
};

export const appointmentStatuses: Record<AppointmentStatus, { label: string; tone: string }> = {
  new: { label: 'Новая', tone: 'info' },
  confirmed: { label: 'Подтверждена', tone: 'success' },
  done: { label: 'Завершена', tone: 'neutral' },
  cancelled: { label: 'Отменена', tone: 'danger' },
  noshow: { label: 'Не пришел', tone: 'warn' },
};

export const clientStatuses: Record<ClientStatus, { label: string; tone: string }> = {
  vip: { label: 'VIP', tone: 'accent' },
  regular: { label: 'Постоянный', tone: 'success' },
  new: { label: 'Новый', tone: 'info' },
  inactive: { label: 'Остывает', tone: 'warn' },
};

export const servicesSeed: Service[] = [
  {
    id: 's1',
    cat: 'Окрашивание',
    name: 'Окрашивание AirTouch',
    dur: 240,
    price: 12500,
    active: true,
    public: true,
    short: 'Сложное окрашивание с эффектом воздушной растяжки. До 4 часов.',
  },
  {
    id: 's2',
    cat: 'Окрашивание',
    name: 'Тонирование',
    dur: 90,
    price: 4500,
    active: true,
    public: true,
    short: 'Освежение цвета или мягкое затемнение корня.',
  },
  {
    id: 's3',
    cat: 'Окрашивание',
    name: 'Однотонное окрашивание',
    dur: 120,
    price: 5800,
    active: true,
    public: true,
    short: 'Корни или полное окрашивание в один тон.',
  },
  {
    id: 's4',
    cat: 'Стрижка',
    name: 'Женская стрижка',
    dur: 75,
    price: 3800,
    active: true,
    public: true,
    short: 'С консультацией и укладкой.',
  },
  {
    id: 's5',
    cat: 'Стрижка',
    name: 'Стрижка челки',
    dur: 30,
    price: 1200,
    active: true,
    public: true,
    short: 'Быстрая коррекция формы.',
  },
  {
    id: 's6',
    cat: 'Уход',
    name: 'Глубокий уход K18',
    dur: 45,
    price: 3200,
    active: true,
    public: true,
    short: 'Профессиональный уход для восстановления связей в волосе.',
  },
  {
    id: 's7',
    cat: 'Уход',
    name: 'Ботокс для волос',
    dur: 90,
    price: 4900,
    active: false,
    public: false,
    short: 'Пауза до обновления состава.',
  },
  {
    id: 's8',
    cat: 'Укладка',
    name: 'Праздничная укладка',
    dur: 60,
    price: 3500,
    active: true,
    public: true,
    short: 'На свадьбу, выпускной, фотосессию или любой важный вечер.',
  },
  {
    id: 's9',
    cat: 'Консультация',
    name: 'Консультация по цвету',
    dur: 30,
    price: 0,
    active: true,
    public: true,
    short: 'Бесплатно при первой записи на окрашивание.',
  },
];

export const clientsSeed: Client[] = [
  {
    id: 'c1',
    name: 'Елена Михайлова',
    phone: '+7 911 234 88 91',
    tag: 'vip',
    visits: 18,
    last: '15 мая',
    next: '04 июн',
    notes: 'Аллергия на ammonia base. Любит травяной чай.',
    status: 'vip',
  },
  {
    id: 'c2',
    name: 'Анна Соловьева',
    phone: '+7 921 008 71 04',
    tag: 'regular',
    visits: 12,
    last: '02 мая',
    next: '28 мая',
    notes: 'Базовый тон 7N, ботокс раз в 2 месяца.',
    status: 'regular',
  },
  {
    id: 'c3',
    name: 'Мария Денисова',
    phone: '+7 921 552 19 33',
    tag: 'regular',
    visits: 7,
    last: '18 апр',
    next: '—',
    notes: '',
    status: 'regular',
  },
  {
    id: 'c4',
    name: 'Софья Журавлева',
    phone: '+7 999 117 60 22',
    tag: 'new',
    visits: 1,
    last: '—',
    next: '26 мая',
    notes: 'Пришла по рекомендации Анны Соловьевой.',
    status: 'new',
  },
  {
    id: 'c5',
    name: 'Дарья Полякова',
    phone: '+7 921 445 90 11',
    tag: 'regular',
    visits: 9,
    last: '07 мая',
    next: '04 июн',
    notes: '',
    status: 'regular',
  },
  {
    id: 'c6',
    name: 'Ольга Ермакова',
    phone: '+7 911 332 47 50',
    tag: 'vip',
    visits: 22,
    last: '20 мая',
    next: '03 июн',
    notes: 'Платиновый блонд, очень тщательно ухаживает.',
    status: 'vip',
  },
  {
    id: 'c7',
    name: 'Виктория Лесная',
    phone: '+7 911 778 02 13',
    tag: 'inactive',
    visits: 3,
    last: '11 фев',
    next: '—',
    notes: 'Переехала, возможно вернется осенью.',
    status: 'inactive',
  },
  {
    id: 'c8',
    name: 'Полина Гусева',
    phone: '+7 921 219 86 25',
    tag: 'new',
    visits: 1,
    last: '21 мая',
    next: '—',
    notes: '',
    status: 'new',
  },
  {
    id: 'c9',
    name: 'Ксения Алексеева',
    phone: '+7 921 644 31 09',
    tag: 'regular',
    visits: 6,
    last: '14 мая',
    next: '02 июн',
    notes: '',
    status: 'regular',
  },
  {
    id: 'c10',
    name: 'Татьяна Романова',
    phone: '+7 911 008 12 78',
    tag: 'regular',
    visits: 11,
    last: '09 мая',
    next: '06 июн',
    notes: 'Любит длинные стрижки, не короче ключиц.',
    status: 'regular',
  },
  {
    id: 'c11',
    name: 'Лиза Бровко',
    phone: '+7 921 110 56 41',
    tag: 'vip',
    visits: 31,
    last: '23 мая',
    next: '30 мая',
    notes: 'Подруга со студии йоги.',
    status: 'vip',
  },
  {
    id: 'c12',
    name: 'Юлия Шилова',
    phone: '+7 921 388 71 22',
    tag: 'new',
    visits: 0,
    last: '—',
    next: '29 мая',
    notes: 'Первый визит, консультация.',
    status: 'new',
  },
];

export const appointmentsSeed: Appointment[] = [
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

export const chatsSeed: Chat[] = [
  {
    id: 'ch1',
    clientId: 'c4',
    unread: 2,
    time: '14:24',
    pinned: true,
    online: true,
    preview: 'Спасибо! А можно еще уточнить про длительность?',
    messages: [
      { id: 'm1', from: 'them', text: 'Здравствуйте! Хочу записаться на стрижку. У вас есть слот на четверг утром?', time: '14:08' },
      { id: 'm2', from: 'me', text: 'Здравствуйте, Софья! Есть свободно в 16:00 в четверг. Подойдет?', time: '14:12', read: true },
      { id: 'm3', from: 'me', type: 'booking', booking: { serviceId: 's4', date: 'Чт, 28 мая', time: '16:00', dur: 75, price: 3800 }, time: '14:12', read: true },
      { id: 'm4', from: 'them', text: 'Подойдет, спасибо', time: '14:18', reactions: [{ e: '👍', mine: true }] },
      { id: 'm5', from: 'me', text: 'Отлично! Подтвердила запись. Адрес студии: Рубинштейна 5, второй этаж.', time: '14:14', read: true },
      { id: 'm6', from: 'them', text: 'Спасибо! А можно еще уточнить про длительность?', time: '14:24', replyTo: 'm5' },
    ],
  },
  {
    id: 'ch2',
    clientId: 'c1',
    unread: 0,
    time: '11:45',
    pinned: true,
    online: false,
    lastSeen: '2 ч назад',
    preview: 'Подтверждаю запись на 04 июня. Спасибо!',
    messages: [
      { id: 'm1', from: 'me', text: 'Елена, напоминаю: запись 04.06 в 12:00, AirTouch + тонирование.', time: '11:30', read: true },
      { id: 'm2', from: 'them', text: 'Подтверждаю запись на 04 июня. Спасибо!', time: '11:45', reactions: [{ e: '❤️', mine: true }] },
    ],
  },
  {
    id: 'ch3',
    clientId: 'c11',
    unread: 0,
    time: 'Вчера',
    online: true,
    preview: 'До встречи',
    messages: [
      { id: 'm1', from: 'me', text: 'Лиза, не забудьте: наша запись завтра в 15:00.', time: 'Вчера, 18:10', read: true },
      { id: 'm2', from: 'them', text: 'До встречи', time: 'Вчера, 18:14' },
    ],
  },
  {
    id: 'ch4',
    clientId: 'c12',
    unread: 1,
    time: '08:02',
    online: true,
    preview: 'Доброе утро! Какие документы взять?',
    messages: [{ id: 'm1', from: 'them', text: 'Доброе утро! Какие документы взять?', time: '08:02' }],
  },
  {
    id: 'ch5',
    clientId: 'c9',
    unread: 0,
    time: 'Пн',
    online: false,
    lastSeen: 'вчера',
    preview: 'Хорошо, до встречи',
    messages: [
      { id: 'm1', from: 'me', type: 'voice', dur: '0:24', time: 'Пн, 19:02', read: true },
      { id: 'm2', from: 'them', text: 'Хорошо, до встречи', time: 'Пн, 19:08' },
    ],
  },
  {
    id: 'ch6',
    clientId: 'c10',
    unread: 0,
    time: '21 мая',
    online: false,
    lastSeen: '3 дн назад',
    preview: 'Можно перенести на час позже?',
    messages: [
      { id: 'm1', from: 'them', text: 'Можно перенести на час позже?', time: '21 мая, 10:14' },
      { id: 'm2', from: 'me', text: 'Конечно, переписала на 11:00.', time: '21 мая, 10:20', read: true },
    ],
  },
  {
    id: 'ch7',
    clientId: 'c6',
    unread: 0,
    time: '19 мая',
    online: false,
    lastSeen: '5 дн назад',
    preview: 'Спасибо, все было прекрасно',
    messages: [
      { id: 'm1', from: 'them', type: 'file', fileName: 'фото-после.heic', fileSize: '3.4 МБ', time: '19 мая, 14:20' },
      { id: 'm2', from: 'them', text: 'Спасибо, все было прекрасно', time: '19 мая, 14:21', reactions: [{ e: '❤️', mine: true }] },
    ],
  },
];

export const taskSeed: TaskItem[] = [
  { id: 't1', title: 'Заказать оттенок 8.13 у поставщика', done: false, due: 'Сегодня' },
  { id: 't2', title: 'Записать видео ухода за окрашиванием', done: false, due: 'Эта неделя' },
  { id: 't3', title: 'Поздравить Елену с днем рождения', done: false, due: '02 июн' },
  { id: 't4', title: 'Обновить фото на личной странице', done: true, due: '—' },
];

export const quickReplies = [
  'Спасибо за запись!',
  'Подтверждаю',
  'Можем перенести?',
  'Жду вас',
  'Адрес: Рубинштейна 5, 2 этаж',
];

export const messageTemplates = [
  { key: '/привет', title: 'Приветствие', text: 'Здравствуйте! Спасибо за запись. Если возникнут вопросы, пишите.' },
  { key: '/подтв', title: 'Подтверждение', text: 'Подтверждаю вашу запись. До встречи!' },
  { key: '/перенос', title: 'Предложить перенос', text: 'Можем перенести запись на другое удобное время. Когда вам подходит?' },
  { key: '/отмена', title: 'Отмена записи', text: 'Запись отменена. Будем рады видеть вас снова в любое время.' },
  { key: '/адрес', title: 'Адрес студии', text: 'Адрес: ул. Рубинштейна 5, второй этаж. Домофон 12. Жду вас!' },
];

export const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const monthDays = [25, 26, 27, 28, 29, 30, 31];
export const monthLabel = 'Май 2026';

export const densityOptions: Array<{ value: Density; label: string }> = [
  { value: 'compact', label: 'Плотно' },
  { value: 'default', label: 'Норма' },
  { value: 'cozy', label: 'Свободно' },
];

export const radiusOptions: Array<{ value: Radius; label: string }> = [
  { value: 'sharp', label: 'Острые' },
  { value: 'default', label: 'Норма' },
  { value: 'round', label: 'Круглые' },
];

export const createInitialState = (): DesktopState => ({
  preferences: { ...defaultPreferences },
  clients: clientsSeed.map((client) => ({ ...client })),
  services: servicesSeed.map((service) => ({ ...service })),
  appointments: appointmentsSeed.map((appointment) => ({ ...appointment })),
  chats: chatsSeed.map((chat) => ({
    ...chat,
    messages: chat.messages.map((message) => ({
      ...message,
      reactions: message.reactions?.map((reaction) => ({ ...reaction })),
      booking: message.booking ? { ...message.booking } : undefined,
    })),
  })),
  notifications: [
    {
      id: 'n1',
      icon: CheckCircle2,
      title: 'Новая запись',
      body: 'Софья Журавлева: стрижка, 26 мая 16:00',
      time: '14 мин назад',
      unread: true,
    },
    {
      id: 'n2',
      icon: MessageCircle,
      title: 'Сообщение от Софьи',
      body: 'Можно уточнить длительность?',
      time: '20 мин назад',
      unread: true,
    },
    {
      id: 'n3',
      icon: Receipt,
      title: 'Отмена записи',
      body: 'Татьяна Романова отменила запись 28 мая.',
      time: '2 ч назад',
      unread: false,
    },
    {
      id: 'n4',
      icon: Eye,
      title: 'Личная страница',
      body: 'Сегодня страницу посмотрели 34 человека.',
      time: 'утром',
      unread: false,
    },
    {
      id: 'n5',
      icon: ShieldCheck,
      title: 'Тариф активен',
      body: 'Pro продлен до 25 июня 2026.',
      time: 'вчера',
      unread: false,
    },
  ],
  tasks: taskSeed.map((task) => ({ ...task })),
});

export const safeParseDesktopState = (raw: string | null): DesktopState | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DesktopState>;
    const fallback = createInitialState();

    return {
      preferences: { ...fallback.preferences, ...parsed.preferences },
      clients: parsed.clients ?? fallback.clients,
      services: parsed.services ?? fallback.services,
      appointments: parsed.appointments ?? fallback.appointments,
      chats: parsed.chats ?? fallback.chats,
      notifications: fallback.notifications,
      tasks: parsed.tasks ?? fallback.tasks,
    };
  } catch {
    return null;
  }
};
