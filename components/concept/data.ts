export type Status = 'confirmed' | 'pending' | 'paid' | 'cancelled' | 'completed';
export type Channel = 'Telegram' | 'VK' | 'Сайт' | 'Звонок';

export type Booking = {
  id: string;
  clientId: string;
  clientName: string;
  clientMeta: string;
  service: string;
  master: string;
  date: string;
  time: string;
  duration: string;
  amount: number;
  status: Status;
  channel: Channel;
  initials: string;
};

export const bookings: Booking[] = [
  { id: 'b1', clientId: 'c1', clientName: 'Виктория Новикова', clientMeta: 'VIP · 14 визитов', service: 'AirTouch окрашивание', master: 'Дина С.', date: '11 мая', time: '11:00', duration: '3 ч', amount: 12500, status: 'pending', channel: 'VK', initials: 'ВН' },
  { id: 'b2', clientId: 'c4', clientName: 'Ольга Романова', clientMeta: '5 визитов', service: 'Маникюр + покрытие', master: 'Мария К.', date: '11 мая', time: '09:30', duration: '90 мин', amount: 3200, status: 'confirmed', channel: 'Telegram', initials: 'ОР' },
  { id: 'b3', clientId: 'c7', clientName: 'Анастасия Лебедева', clientMeta: 'Новый клиент', service: 'Брови · форма + краска', master: 'Лера М.', date: '11 мая', time: '14:30', duration: '60 мин', amount: 1800, status: 'paid', channel: 'Сайт', initials: 'АЛ' },
  { id: 'b4', clientId: 'c2', clientName: 'Елена Беляева', clientMeta: '22 визита', service: 'Стрижка + укладка', master: 'Дина С.', date: '11 мая', time: '17:00', duration: '75 мин', amount: 2800, status: 'confirmed', channel: 'Telegram', initials: 'ЕБ' },
  { id: 'b5', clientId: 'c6', clientName: 'Марина Родина', clientMeta: '3 пропуска', service: 'Педикюр', master: 'Мария К.', date: '12 мая', time: '10:00', duration: '90 мин', amount: 2600, status: 'pending', channel: 'Звонок', initials: 'МР' },
  { id: 'b6', clientId: 'c3', clientName: 'Катя Лебедева', clientMeta: '8 визитов · ДР завтра', service: 'Окрашивание корней', master: 'Дина С.', date: '12 мая', time: '13:00', duration: '2 ч', amount: 5600, status: 'confirmed', channel: 'Telegram', initials: 'КЛ' },
  { id: 'b7', clientId: 'c5', clientName: 'Ирина Петрова', clientMeta: '12 визитов', service: 'Ламинирование ресниц', master: 'Лера М.', date: '13 мая', time: '11:30', duration: '90 мин', amount: 3400, status: 'paid', channel: 'VK', initials: 'ИП' },
  { id: 'b8', clientId: 'c8', clientName: 'Светлана Глазова', clientMeta: '1 визит', service: 'Консультация', master: 'Анна (вы)', date: '13 мая', time: '16:00', duration: '30 мин', amount: 0, status: 'cancelled', channel: 'Сайт', initials: 'СГ' },
];

export type Client = {
  id: string;
  name: string;
  age: number;
  phone: string;
  channel: Channel;
  visits: number;
  ltv: number;
  ltvDelta?: number;
  lastVisit: string;
  nextVisit?: string;
  favMaster: string;
  score: number;
  segment: 'vip' | 'regular' | 'new' | 'sleeping' | 'birthday';
  tags: string[];
  initials: string;
  meta?: string;
  note?: string;
};

export const clients: Client[] = [
  { id: 'c1', name: 'Виктория Новикова', age: 28, phone: '+7 905 ••• 42 18', channel: 'VK', visits: 14, ltv: 142800, ltvDelta: 18000, lastVisit: '17 апр', nextVisit: 'сегодня · 11:00', favMaster: 'Дина С.', score: 94, segment: 'vip', tags: ['VIP', 'Аллергия'], initials: 'ВН', meta: 'клиент 2 года 4 мес', note: 'Аллергия на аммиак. Безаммиачная серия. Любит длинные локоны, не любит ждать. Кофе американо без сахара.' },
  { id: 'c2', name: 'Елена Беляева', age: 34, phone: '+7 916 ••• 11 02', channel: 'Telegram', visits: 22, ltv: 118400, ltvDelta: 6000, lastVisit: '27 апр', nextVisit: 'сегодня · 17:00', favMaster: 'Дина С.', score: 88, segment: 'vip', tags: ['VIP', 'Стабильная'], initials: 'ЕБ', meta: 'клиент 3 года', note: 'Стабильный график. Любит классику.' },
  { id: 'c3', name: 'Катя Лебедева', age: 31, phone: '+7 962 ••• 88 47', channel: 'Telegram', visits: 8, ltv: 98600, lastVisit: '05 мая', nextVisit: '12 мая · 13:00', favMaster: 'Дина С.', score: 82, segment: 'birthday', tags: ['VIP', 'ДР'], initials: 'КЛ', meta: 'день рождения завтра', note: 'Любит сюрпризы.' },
  { id: 'c4', name: 'Ольга Романова', age: 29, phone: '+7 903 ••• 56 80', channel: 'Telegram', visits: 5, ltv: 58200, lastVisit: '02 мая', nextVisit: 'сегодня · 09:30', favMaster: 'Мария К.', score: 76, segment: 'regular', tags: ['VIP'], initials: 'ОР', meta: 'клиент 1 год', note: '' },
  { id: 'c5', name: 'Ирина Петрова', age: 26, phone: '+7 910 ••• 33 21', channel: 'VK', visits: 12, ltv: 54800, lastVisit: '28 апр', nextVisit: '13 мая · 11:30', favMaster: 'Лера М.', score: 72, segment: 'regular', tags: ['VIP'], initials: 'ИП' },
  { id: 'c6', name: 'Марина Родина', age: 42, phone: '+7 925 ••• 70 04', channel: 'Звонок', visits: 11, ltv: 52100, ltvDelta: -8000, lastVisit: '14 фев', favMaster: 'Мария К.', score: 38, segment: 'sleeping', tags: ['Риск'], initials: 'МР', meta: '3 пропуска · риск ухода', note: 'Несколько раз не пришла. Позвонить лично.' },
  { id: 'c7', name: 'Анастасия Лебедева', age: 24, phone: '+7 919 ••• 12 03', channel: 'Сайт', visits: 1, ltv: 1800, lastVisit: 'сегодня', favMaster: 'Лера М.', score: 50, segment: 'new', tags: ['Новый'], initials: 'АЛ', meta: 'первый визит сегодня' },
  { id: 'c8', name: 'Светлана Глазова', age: 38, phone: '+7 902 ••• 44 88', channel: 'Сайт', visits: 1, ltv: 0, lastVisit: '02 апр', favMaster: 'Анна (вы)', score: 42, segment: 'sleeping', tags: [], initials: 'СГ' },
];

export type ChatMessage = {
  id: string;
  text: string;
  side: 'in' | 'out' | 'bot';
  time: string;
  card?: {
    title: string;
    rows: { label: string; value: string; strike?: boolean; good?: boolean }[];
  };
};

export type Chat = {
  id: string;
  clientId: string;
  channel: 'VK' | 'TG';
  unread: number;
  lastTime: string;
  preview: string;
  isBot?: boolean;
  online?: boolean;
  messages: ChatMessage[];
};

export const chats: Chat[] = [
  {
    id: 'ch1',
    clientId: 'c1',
    channel: 'VK',
    unread: 2,
    lastTime: '2 мин',
    preview: 'Можно перенести на 12:00? Пробки',
    online: true,
    messages: [
      { id: 'm1', side: 'bot', time: '10:14', text: 'Здравствуйте, Виктория. Напоминаем: сегодня в 11:00 у вас AirTouch окрашивание у Дины. Подтвердите запись.' },
      { id: 'm2', side: 'in', time: '10:42', text: 'Доброе утро' },
      { id: 'm3', side: 'in', time: '10:42', text: 'Подтверждаю, но можно сдвинуть на 12:00? Пробки сегодня жуткие.' },
      { id: 'm4', side: 'out', time: '10:43', text: 'Минуту, проверю расписание Дины.' },
      {
        id: 'm5', side: 'out', time: '10:44', text: '',
        card: {
          title: 'Перенос записи',
          rows: [
            { label: 'Услуга', value: 'AirTouch окрашивание' },
            { label: 'Было', value: '11:00', strike: true },
            { label: 'Стало', value: '12:00 · слот свободен', good: true },
            { label: 'Мастер', value: 'Дина Соколова' },
          ],
        },
      },
      { id: 'm6', side: 'in', time: '11:01', text: 'Можно перенести на 12:00? Пробки' },
    ],
  },
  { id: 'ch2', clientId: 'c4', channel: 'TG', unread: 0, lastTime: '14 мин', preview: 'Бот · Подтвердила запись на 09:30', isBot: true, messages: [] },
  { id: 'ch3', clientId: 'c7', channel: 'TG', unread: 1, lastTime: '38 мин', preview: 'Спасибо большое, до встречи', messages: [] },
  { id: 'ch4', clientId: 'c2', channel: 'TG', unread: 0, lastTime: '1 ч', preview: 'Хочу как в прошлый раз, длина та же', messages: [] },
  { id: 'ch5', clientId: 'c6', channel: 'VK', unread: 0, lastTime: '2 ч', preview: 'Бот · Напоминание отправлено', isBot: true, messages: [] },
  { id: 'ch6', clientId: 'c3', channel: 'TG', unread: 0, lastTime: 'вчера', preview: 'Промокод BIRTHDAY15 отправлен', isBot: true, messages: [] },
  { id: 'ch7', clientId: 'c5', channel: 'VK', unread: 0, lastTime: 'вчера', preview: 'Сколько стоит ламинирование?', messages: [] },
];

export type ScheduleEvent = {
  id: string;
  masterId: string;
  startMin: number;
  durationMin: number;
  title: string;
  client: string;
  amount?: number;
  status: Status;
  kind?: 'lunch';
};

export const masters = [
  { id: 'm1', name: 'Дина Соколова', role: 'Колорист', initials: 'ДС', busy: 4, free: 1 },
  { id: 'm2', name: 'Мария Касьян', role: 'Мастер ногтевого', initials: 'МК', busy: 3, free: 3 },
  { id: 'm3', name: 'Лера Морозова', role: 'Бровист, лэшмейкер', initials: 'ЛМ', busy: 2, free: 4 },
  { id: 'm4', name: 'Анна Кузнецова', role: 'Стилист‑имиджмейкер', initials: 'АК', busy: 1, free: 5 },
];

export const dayStartHour = 9;
const m = (h: number, mm = 0) => (h - dayStartHour) * 60 + mm;

export const events: ScheduleEvent[] = [
  { id: 'e1', masterId: 'm1', startMin: m(11), durationMin: 180, title: 'AirTouch окрашивание', client: 'Виктория Новикова · VIP', amount: 12500, status: 'pending' },
  { id: 'e2', masterId: 'm1', startMin: m(15), durationMin: 115, title: 'Окраш. корней', client: 'Катя Лебедева', amount: 5600, status: 'confirmed' },
  { id: 'e3', masterId: 'm1', startMin: m(17), durationMin: 75, title: 'Стрижка + укладка', client: 'Елена Беляева · VIP', amount: 2800, status: 'confirmed' },
  { id: 'e4', masterId: 'm2', startMin: m(9, 30), durationMin: 90, title: 'Маникюр + покрытие', client: 'Ольга Романова', amount: 3200, status: 'confirmed' },
  { id: 'e5', masterId: 'm2', startMin: m(13), durationMin: 60, title: 'Обед', client: '', status: 'completed', kind: 'lunch' },
  { id: 'e6', masterId: 'm2', startMin: m(14), durationMin: 90, title: 'Педикюр', client: 'Марина Родина', amount: 2600, status: 'pending' },
  { id: 'e7', masterId: 'm3', startMin: m(14, 30), durationMin: 60, title: 'Брови форма + краска', client: 'Анастасия Лебедева', amount: 1800, status: 'paid' },
  { id: 'e8', masterId: 'm3', startMin: m(16, 30), durationMin: 90, title: 'Ламинирование ресниц', client: 'Дарья Кравцова', amount: 3400, status: 'confirmed' },
  { id: 'e9', masterId: 'm4', startMin: m(10), durationMin: 45, title: 'Консультация', client: 'Светлана Глазова', status: 'confirmed' },
];

export const statusLabel: Record<Status, string> = {
  confirmed: 'Подтв.',
  pending: 'Ожидает',
  paid: 'Оплачено',
  cancelled: 'Отмена',
  completed: 'Завершена',
};
