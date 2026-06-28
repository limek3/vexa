/* Mock data for Vexa Desktop */

export const MASTER = {
  name: 'Иван Петров',
  profession: 'Vexa workspace',
  initials: 'IP',
  city: 'Москва',
  studio: 'Telegram monitoring workspace',
  about: 'Vexa отслеживает Telegram-источники по ключевым словам и присылает только полезные совпадения.',
  phone: '',
  email: 'ivan@vexa.app',
  username: 'ivan_vexa',
  publicUrl: 'vexa.app/desktop',
  reviews: 0,
  rating: 5,
};

export const STATUSES = {
  new:       { label: 'Новая',        kind: 'info' },
  confirmed: { label: 'Подтверждена', kind: 'success' },
  done:      { label: 'Завершена',    kind: '' },
  cancelled: { label: 'Отменена',     kind: 'danger' },
  noshow:    { label: 'Не пришёл',    kind: 'warn' },
};

export const SERVICES = [
  { id: 's1', cat: 'Окрашивание', name: 'Окрашивание AirTouch',           dur: 240, price: 12500, active: true,  public: true,  short: 'Сложное окрашивание с эффектом воздушной растяжки. До 4х часов.' },
  { id: 's2', cat: 'Окрашивание', name: 'Тонирование',                    dur: 90,  price: 4500,  active: true,  public: true,  short: 'Освежение цвета или мягкое затемнение корня.' },
  { id: 's3', cat: 'Окрашивание', name: 'Однотонное окрашивание',         dur: 120, price: 5800,  active: true,  public: true,  short: 'Корни или полное окрашивание в один тон.' },
  { id: 's4', cat: 'Стрижка',     name: 'Женская стрижка',                dur: 75,  price: 3800,  active: true,  public: true,  short: 'С консультацией и укладкой.' },
  { id: 's5', cat: 'Стрижка',     name: 'Стрижка чёлки',                  dur: 30,  price: 1200,  active: true,  public: true,  short: '' },
  { id: 's6', cat: 'Уход',        name: 'Глубокий уход K18',              dur: 45,  price: 3200,  active: true,  public: true,  short: 'Профессиональный уход для восстановления связей в волосе.' },
  { id: 's7', cat: 'Уход',        name: 'Ботокс для волос',               dur: 90,  price: 4900,  active: false, public: false, short: '' },
  { id: 's8', cat: 'Укладка',     name: 'Праздничная укладка',            dur: 60,  price: 3500,  active: true,  public: true,  short: 'На любой случай — свадьба, выпускной, фотосессия.' },
  { id: 's9', cat: 'Консультация', name: 'Консультация по цвету',         dur: 30,  price: 0,     active: true,  public: true,  short: 'Бесплатно при первой записи на окрашивание.' },
];

export const CLIENTS = [
  { id: 'c1', name: 'Елена Михайлова',   phone: '+7 911 234 88 91', tag: 'vip',     visits: 18, last: '15 мая',  next: '04 июн',  notes: 'Аллергия на ammonia base. Любит травяной чай.', status: 'vip' },
  { id: 'c2', name: 'Анна Соловьёва',    phone: '+7 921 008 71 04', tag: 'regular', visits: 12, last: '02 мая',  next: '28 мая',  notes: 'Базовый тон 7N, ботокс раз в 2 месяца.', status: 'regular' },
  { id: 'c3', name: 'Мария Денисова',    phone: '+7 921 552 19 33', tag: 'regular', visits: 7,  last: '18 апр',  next: '—',       notes: '', status: 'regular' },
  { id: 'c4', name: 'Софья Журавлёва',   phone: '+7 999 117 60 22', tag: 'new',     visits: 1,  last: '—',       next: '26 мая',  notes: 'Пришла по рекомендации Анны Соловьёвой.', status: 'new' },
  { id: 'c5', name: 'Дарья Полякова',    phone: '+7 921 445 90 11', tag: 'regular', visits: 9,  last: '07 мая',  next: '04 июн',  notes: '', status: 'regular' },
  { id: 'c6', name: 'Ольга Ермакова',    phone: '+7 911 332 47 50', tag: 'vip',     visits: 22, last: '20 мая',  next: '03 июн',  notes: 'Платиновый блонд, очень тщательно ухаживает.', status: 'vip' },
  { id: 'c7', name: 'Виктория Лесная',   phone: '+7 911 778 02 13', tag: 'inactive',visits: 3,  last: '11 фев',  next: '—',       notes: 'Переехала, возможно вернётся осенью.', status: 'inactive' },
  { id: 'c8', name: 'Полина Гусева',     phone: '+7 921 219 86 25', tag: 'new',     visits: 1,  last: '21 мая',  next: '—',       notes: '', status: 'new' },
  { id: 'c9', name: 'Ксения Алексеева',  phone: '+7 921 644 31 09', tag: 'regular', visits: 6,  last: '14 мая',  next: '02 июн',  notes: '', status: 'regular' },
  { id: 'c10',name: 'Татьяна Романова',  phone: '+7 911 008 12 78', tag: 'regular', visits: 11, last: '09 мая',  next: '06 июн',  notes: 'Любит длинные стрижки, не короче ключиц.', status: 'regular' },
  { id: 'c11',name: 'Лиза Бровко',       phone: '+7 921 110 56 41', tag: 'vip',     visits: 31, last: '23 мая',  next: '30 мая',  notes: 'Подруга со студии йоги.', status: 'vip' },
  { id: 'c12',name: 'Юлия Шилова',       phone: '+7 921 388 71 22', tag: 'new',     visits: 0,  last: '—',       next: '29 мая',  notes: 'Первый визит — консультация.', status: 'new' },
];

export const today = new Date(2026, 4, 25); // monday, 25 may 2026
export const fmtMonth = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

export const APPTS = [
  // Today
  { id: 'a01', day: 0, start: '09:00', end: '10:15', clientId: 'c2',  serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a02', day: 0, start: '10:30', end: '14:30', clientId: 'c1',  serviceId: 's1', status: 'confirmed', notes: 'AirTouch + тонирование.' },
  { id: 'a03', day: 0, start: '15:00', end: '15:45', clientId: 'c5',  serviceId: 's6', status: 'new',       notes: 'Первое посещение после окрашивания.' },
  { id: 'a04', day: 0, start: '16:00', end: '17:00', clientId: 'c8',  serviceId: 's8', status: 'confirmed', notes: 'На день рождения подруги.' },
  { id: 'a05', day: 0, start: '17:30', end: '19:00', clientId: 'c9',  serviceId: 's3', status: 'confirmed', notes: '' },
  // Tomorrow
  { id: 'a06', day: 1, start: '10:00', end: '11:15', clientId: 'c3',  serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a07', day: 1, start: '12:00', end: '13:30', clientId: 'c10', serviceId: 's2', status: 'confirmed', notes: '' },
  { id: 'a08', day: 1, start: '14:30', end: '15:00', clientId: 'c12', serviceId: 's9', status: 'new',       notes: 'Консультация по сложному окрашиванию.' },
  { id: 'a09', day: 1, start: '16:00', end: '17:15', clientId: 'c4',  serviceId: 's4', status: 'confirmed', notes: '' },
  // Wed
  { id: 'a10', day: 2, start: '11:00', end: '15:00', clientId: 'c6',  serviceId: 's1', status: 'confirmed', notes: '' },
  { id: 'a11', day: 2, start: '16:00', end: '17:30', clientId: 'c11', serviceId: 's2', status: 'confirmed', notes: '' },
  // Thu
  { id: 'a12', day: 3, start: '10:00', end: '11:00', clientId: 'c5',  serviceId: 's8', status: 'confirmed', notes: '' },
  { id: 'a13', day: 3, start: '13:00', end: '14:15', clientId: 'c2',  serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a14', day: 3, start: '15:00', end: '15:30', clientId: 'c8',  serviceId: 's5', status: 'confirmed', notes: '' },
  // Fri (light day)
  { id: 'a15', day: 4, start: '11:00', end: '12:15', clientId: 'c3',  serviceId: 's4', status: 'confirmed', notes: '' },
  { id: 'a16', day: 4, start: '14:00', end: '15:30', clientId: 'c9',  serviceId: 's2', status: 'new',       notes: '' },
  // Sat
  { id: 'a17', day: 5, start: '11:00', end: '13:00', clientId: 'c1',  serviceId: 's3', status: 'confirmed', notes: '' },
  { id: 'a18', day: 5, start: '14:00', end: '14:45', clientId: 'c6',  serviceId: 's6', status: 'confirmed', notes: '' },
];

export const CHATS = [
  { id: 'ch1', clientId: 'c4', unread: 2, time: '14:24', pinned: true, online: true, preview: 'Спасибо! А можно ещё уточнить про длительность?',
    messages: [
      { id: 'm1', from: 'them', text: 'Здравствуйте! Хочу записаться на стрижку. У вас есть слот на четверг утром?', time: '14:08' },
      { id: 'm2', from: 'me', text: 'Здравствуйте, Софья! Есть свободно в 16:00 в четверг — подойдёт?', time: '14:12', read: true },
      { id: 'm3', from: 'me', type: 'booking', booking: { serviceId: 's4', date: 'Чт, 28 мая', time: '16:00', dur: 75, price: 3800 }, time: '14:12', read: true },
      { id: 'm4', from: 'them', text: 'Подойдёт, спасибо 🌿', time: '14:18', reactions: [{ e: '👍', mine: true }] },
      { id: 'm5', from: 'me', text: 'Отлично! Подтвердила запись. Адрес студии: Рубинштейна 5, второй этаж. Если что-то поменяется — напишите.', time: '14:14', read: true },
      { id: 'm6', from: 'them', text: 'Спасибо! А можно ещё уточнить про длительность?', time: '14:24', replyTo: 'm5' },
    ]
  },
  { id: 'ch2', clientId: 'c1', unread: 0, time: '11:45', pinned: true, online: false, lastSeen: '2 ч назад', preview: 'Подтверждаю запись на 04 июня. Спасибо!',
    messages: [
      { id: 'm1', from: 'me', text: 'Елена, напоминаю — запись 04.06 в 12:00, AirTouch + тонирование.', time: '11:30', read: true },
      { id: 'm2', from: 'them', text: 'Подтверждаю запись на 04 июня. Спасибо!', time: '11:45', reactions: [{ e: '❤️', mine: true }] },
    ]
  },
  { id: 'ch3', clientId: 'c11', unread: 0, time: 'Вчера', online: true, preview: 'До встречи 🌿',
    messages: [
      { id: 'm1', from: 'me', text: 'Лиза, не забудьте — наша запись завтра в 15:00.', time: 'Вчера, 18:10', read: true },
      { id: 'm2', from: 'them', text: 'До встречи 🌿', time: 'Вчера, 18:14' },
    ]
  },
  { id: 'ch4', clientId: 'c12', unread: 1, time: '08:02', online: true, preview: 'Доброе утро! Какие документы взять?',
    messages: [
      { id: 'm1', from: 'them', text: 'Доброе утро! Какие документы взять?', time: '08:02' },
    ]
  },
  { id: 'ch5', clientId: 'c9', unread: 0, time: 'Пн', online: false, lastSeen: 'вчера', preview: 'Хорошо, до встречи',
    messages: [
      { id: 'm1', from: 'me', type: 'voice', dur: '0:24', time: 'Пн, 19:02', read: true },
      { id: 'm2', from: 'them', text: 'Хорошо, до встречи', time: 'Пн, 19:08' }
    ] },
  { id: 'ch6', clientId: 'c10', unread: 0, time: '21 мая', online: false, lastSeen: '3 дн назад', preview: 'Можно перенести на час позже?',
    messages: [
      { id: 'm1', from: 'them', text: 'Можно перенести на час позже?', time: '21 мая, 10:14' },
      { id: 'm2', from: 'me', text: 'Конечно, переписала на 11:00.', time: '21 мая, 10:20', read: true }
    ] },
  { id: 'ch7', clientId: 'c6', unread: 0, time: '19 мая', online: false, lastSeen: '5 дн назад', preview: 'Спасибо, всё было прекрасно',
    messages: [
      { id: 'm1', from: 'them', type: 'file', fileName: 'фото-после.heic', fileSize: '3.4 МБ', time: '19 мая, 14:20' },
      { id: 'm2', from: 'them', text: 'Спасибо, всё было прекрасно', time: '19 мая, 14:21', reactions: [{ e: '🤍', mine: true }] }
    ] },
];

export const TEMPLATES = [
  { key: '/привет',   title: 'Приветствие',            text: 'Здравствуйте! Спасибо за запись 🌿 Если возникнут вопросы — пишите.' },
  { key: '/подтв',    title: 'Подтверждение',          text: 'Подтверждаю вашу запись. До встречи!' },
  { key: '/перенос',  title: 'Предложить перенос',     text: 'Можем перенести запись на другое удобное время. Когда вам подходит?' },
  { key: '/отмена',   title: 'Отмена записи',          text: 'Запись отменена. Будем рады видеть вас снова в любое время.' },
  { key: '/напом',    title: 'Напоминание',            text: 'Напоминаю о записи завтра. Если планы поменялись — дайте знать.' },
  { key: '/адрес',    title: 'Адрес студии',           text: 'Адрес: ул. Рубинштейна 5, второй этаж. Домофон 12. Жду вас!' },
  { key: '/уход',     title: 'Уход после окрашивания', text: 'После окрашивания первые двое суток лучше не мыть голову. Шампунь без сульфатов — обязательно.' },
];

export const QUICK_REPLIES = [
  'Спасибо за запись!',
  'Подтверждаю',
  'Можем перенести?',
  'Жду вас',
  'Адрес: Рубинштейна 5, 2 этаж',
];

export const NOTIFICATIONS = [
  { id: 'n1', kind: 'new',   icon: 'inbox',    title: 'Новое совпадение',     body: 'Аренда Москва · 92% · @novostroy_msk', time: '4 мин назад', unread: true },
  { id: 'n2', kind: 'chat',  icon: 'search',   title: 'Поиск обновлен',       body: 'Ремонт квартир получил 31 совпадение сегодня.', time: '20 мин назад', unread: true },
  { id: 'n3', kind: 'cancel',icon: 'filter',   title: 'Источник требует доступа', body: 'Закрытый чат недоступен сервисному аккаунту.', time: '2 ч назад',  unread: false },
  { id: 'n4', kind: 'info',  icon: 'crown',    title: 'Лимит тарифа',         body: 'Использовано 214 из 1500 сообщений на сегодня.', time: 'утром', unread: false },
];

export const TASKS = [
  { id: 't1', title: 'Заказать оттенок 8.13 у поставщика', done: false, due: 'Сегодня' },
  { id: 't2', title: 'Записать видео ухода за окрашиванием', done: false, due: 'Эта неделя' },
  { id: 't3', title: 'Поздравить Елену с днём рождения', done: false, due: '02 июн' },
  { id: 't4', title: 'Обновить фото на личной странице', done: true,  due: '—' },
];

export const WEEK_LABELS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

/* Russian pluralization helper: pluralize(2, 'визит','визита','визитов') -> 'визита' */
export function pluralize(n, one, few, many) {
  const m = n % 10, t = n % 100;
  if (m === 1 && t !== 11) return one;
  if (m >= 2 && m <= 4 && (t < 10 || t >= 20)) return few;
  return many;
}
