/**
 * Demo data for КликБук Mini App.
 * Replace with API calls when wiring to real backend.
 */

export interface MasterInfo {
  name: string;
  firstName: string;
  username: string;
  city: string;
  rating: number;
  service: string;
  link: string;
  phone: string;
  bio: string;
  avatar?: string;
  socials: { tg: string; vk: string; ig: string };
}

export const MASTER: MasterInfo = {
  name: 'Алина Морозова',
  firstName: 'Алина',
  username: '@alina.nails',
  city: 'Москва',
  rating: 4.9,
  service: 'Ногтевой сервис',
  link: '/m/admin',
  phone: '+7 916 117 22 04',
  bio: 'Маникюр и педикюр. Стерильно, аккуратно, без спешки. 8 лет опыта.',
  avatar: '',
  socials: { tg: 'alina.nails', vk: 'alina.nails', ig: '@alina.nails' },
};

export interface Service {
  n: number;
  id?: string;
  name: string;
  price: number;
  duration: number;
  popularity: number;
  count: number;
  revenue?: number;
  category?: string;
  status?: 'active' | 'seasonal' | 'draft';
  visible?: boolean;
}

export const SERVICES: Service[] = [
  { n: 1, name: 'Маникюр + покрытие', price: 2500, duration: 90, popularity: 0.92, count: 24 },
  { n: 2, name: 'Дизайн ногтей',     price: 1500, duration: 60, popularity: 0.61, count: 14 },
  { n: 3, name: 'Снятие покрытия',   price: 800,  duration: 30, popularity: 0.34, count: 8 },
  { n: 4, name: 'Френч / ombre',     price: 2200, duration: 75, popularity: 0.45, count: 11 },
  { n: 5, name: 'Парафинотерапия',   price: 1200, duration: 40, popularity: 0.18, count: 4 },
];

export type ApptStatus = 'in-focus' | 'scheduled' | 'completed' | 'cancelled';

export interface Appointment {
  id?: string;
  date?: string;
  dateLabel?: string;
  time: string;
  name: string;
  service: string;
  status: ApptStatus;
  statusLabel?: string;
  rawStatus?: 'new' | 'confirmed' | 'completed' | 'no_show' | 'cancelled' | string;
  phone: string;
  dur: number;
  price?: number;
  source?: string;
}

export const APPOINTMENTS: Appointment[] = [
  { time: '10:00', name: 'Екатерина Соловьёва', service: 'Маникюр + покрытие', status: 'in-focus', phone: '+7 916 248 17 02', dur: 90 },
  { time: '11:45', name: 'Марина Лебедева',     service: 'Дизайн ногтей',      status: 'scheduled', phone: '+7 903 117 84 22', dur: 60 },
  { time: '13:30', name: 'Ольга Кузнецова',     service: 'Маникюр + покрытие', status: 'scheduled', phone: '+7 925 446 09 81', dur: 90 },
  { time: '15:00', name: 'Анна Петрова',        service: 'Снятие покрытия',    status: 'scheduled', phone: '+7 911 327 56 03', dur: 30 },
  { time: '16:30', name: 'Виктория Зайцева',    service: 'Френч / ombre',      status: 'scheduled', phone: '+7 962 504 12 47', dur: 75 },
  { time: '18:00', name: 'Дарья Волкова',       service: 'Маникюр + покрытие', status: 'scheduled', phone: '+7 985 660 22 14', dur: 90 },
];

export interface Client {
  name: string;
  phone: string;
  visits: number;
  total: number;
}

export const CLIENTS: Client[] = [
  { name: 'Екатерина Соловьёва', phone: '+7 916 248 17 02', visits: 12, total: 28400 },
  { name: 'Марина Лебедева',     phone: '+7 903 117 84 22', visits: 8,  total: 19200 },
  { name: 'Ольга Кузнецова',     phone: '+7 925 446 09 81', visits: 6,  total: 14600 },
  { name: 'Анна Петрова',        phone: '+7 911 327 56 03', visits: 5,  total: 11800 },
  { name: 'Виктория Зайцева',    phone: '+7 962 504 12 47', visits: 4,  total: 9400 },
  { name: 'Дарья Волкова',       phone: '+7 985 660 22 14', visits: 3,  total: 7100 },
  { name: 'Софья Морозова',      phone: '+7 919 833 47 56', visits: 2,  total: 4800 },
  { name: 'Полина Игнатова',     phone: '+7 977 215 09 38', visits: 1,  total: 2500 },
];

export interface Thread {
  id: string | number;
  name: string;
  last: string;
  time: string;
  lastMessageAtMs?: number;
  channel: 'TG' | 'ВК' | 'Web' | 'IG';
  unread: number;
  online?: boolean;
  messages?: Message[];
  // extended fields for full functionality
  phone?: string;
  nextVisit?: string | null;
  bookingId?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  bookingService?: string | null;
  segment?: string;
  isPriority?: boolean;
  botConnected?: boolean;
}

export const THREADS: Thread[] = [
  { id: 1, name: 'Екатерина Соловьёва', last: 'Хорошо, до встречи в понедельник', time: '14:42', channel: 'TG',  unread: 2, online: true },
  { id: 2, name: 'Марина Лебедева',     last: 'А можно перенести на час позже?',  time: '13:18', channel: 'TG',  unread: 1 },
  { id: 3, name: 'Ольга Кузнецова',     last: 'Спасибо! Всё понравилось',          time: 'вчера', channel: 'ВК',  unread: 0 },
  { id: 4, name: 'Анна Петрова',        last: 'Отправляю фото референса',          time: 'вчера', channel: 'TG',  unread: 0 },
  { id: 5, name: 'Виктория Зайцева',    last: 'Записалась через сайт',             time: '2 дн',  channel: 'Web', unread: 0 },
  { id: 6, name: 'Дарья Волкова',       last: 'Ок, увидимся в субботу',            time: '3 дн',  channel: 'TG',  unread: 0 },
  { id: 7, name: 'Софья Морозова',      last: 'Подскажите, есть ли свободное окно',time: '5 дн',  channel: 'ВК',  unread: 0 },
];

export interface Message {
  from: 'me' | 'them';
  text: string;
  t: string;
}

export const MESSAGES: Message[] = [
  { from: 'them', text: 'Здравствуйте! Хотела записаться на маникюр', t: '14:20' },
  { from: 'me',   text: 'Здравствуйте, Екатерина! Конечно. На какой день удобно?', t: '14:21' },
  { from: 'them', text: 'В понедельник в первой половине дня?', t: '14:25' },
  { from: 'me',   text: 'Есть слот в 10:00. Маникюр с покрытием — 2 500 ₽, около 90 минут.', t: '14:26' },
  { from: 'them', text: 'Отлично, записываюсь', t: '14:40' },
  { from: 'me',   text: 'Записала. Адрес и напоминание пришлю утром.', t: '14:41' },
  { from: 'them', text: 'Хорошо, до встречи в понедельник', t: '14:42' },
];

export interface Template {
  id: string;
  name: string;
  body: string;
}

export const TEMPLATES: Template[] = [
  { id: 'confirm', name: 'Подтверждение записи', body: 'Здравствуйте, {имя}. Подтверждаю запись на {дата} в {время}, {услуга}. Адрес и детали в закреплённом сообщении.' },
  { id: 'remind',  name: 'Напоминание за день',  body: 'Напоминаю про завтрашний визит — {дата}, {время}. Если планы поменялись, напишите, переназначим.' },
  { id: 'thanks',  name: 'Благодарность после визита', body: 'Спасибо, что были у меня сегодня! Если всё понравилось, можно оставить отзыв по ссылке: {ссылка}' },
  { id: 'review',  name: 'Запрос отзыва', body: 'Поделитесь впечатлением от визита — это помогает другим клиентам выбрать мастера.' },
  { id: 'promo',   name: 'Анонс акции',   body: 'На этой неделе действует -15% на {услуга}. Чтобы записаться, ответьте на это сообщение.' },
];

export interface Review {
  name: string;
  stars: number;
  text: string;
  date: string;
}

export const REVIEWS: Review[] = [
  { name: 'Екатерина Соловьёва', stars: 5, text: 'Алина — мастер с большой буквы. Стерильно, аккуратно, никакой суеты.', date: '2 мая' },
  { name: 'Марина Лебедева',     stars: 5, text: 'Хожу больше года. Покрытие держится 3+ недели стабильно.', date: '28 апр' },
  { name: 'Ольга Кузнецова',     stars: 4, text: 'Качество отличное, но кабинет на 5-м этаже без лифта — это минус.', date: '24 апр' },
  { name: 'Анна Петрова',        stars: 5, text: 'Дизайн получился лучше, чем на референсе. Спасибо!', date: '21 апр' },
  { name: 'Виктория Зайцева',    stars: 5, text: 'Очень внимательный мастер. Записалась снова на месяц вперёд.', date: '17 апр' },
];

export const REVENUE_WEEK = [
  { d: 'Пн', v: 8400,  active: false },
  { d: 'Вт', v: 12200, active: false },
  { d: 'Ср', v: 6800,  active: false },
  { d: 'Чт', v: 14600, active: false },
  { d: 'Пт', v: 11200, active: false },
  { d: 'Сб', v: 18400, active: true },
  { d: 'Вс', v: 9200,  active: false },
];

export interface ScheduleDay {
  d: string;
  from: string;
  to: string;
  on: boolean;
}

export const SCHEDULE_DEFAULT: ScheduleDay[] = [
  { d: 'Пн', from: '10:00', to: '20:00', on: true },
  { d: 'Вт', from: '10:00', to: '20:00', on: true },
  { d: 'Ср', from: '10:00', to: '20:00', on: true },
  { d: 'Чт', from: '10:00', to: '20:00', on: true },
  { d: 'Пт', from: '10:00', to: '18:00', on: true },
  { d: 'Сб', from: '11:00', to: '17:00', on: true },
  { d: 'Вс', from: '—',     to: '—',     on: false },
];

export interface Integration {
  id: string;
  name: string;
  sub: string;
  icon: string;
  on: boolean;
}

export const INTEGRATIONS: Integration[] = [
  { id: 'tg',   name: 'Telegram-бот',     sub: 'Принимает записи и пишет напоминания', icon: 'send', on: true },
  { id: 'vk',   name: 'ВКонтакте',         sub: 'Кнопка записи в группе',                icon: 'message-square', on: true },
  { id: 'ig',   name: 'Instagram',         sub: 'DM и stories',                          icon: 'instagram', on: false },
  { id: 'web',  name: 'Сайт-виджет',       sub: 'Iframe с расписанием',                  icon: 'code', on: true },
  { id: 'gcal', name: 'Google Calendar',   sub: 'Двусторонняя синхронизация',            icon: 'calendar-days', on: false },
  { id: 'ymap', name: 'Яндекс.Карты',      sub: 'Карточка организации',                  icon: 'map-pin', on: true },
];

export interface Source {
  name: string;
  records: number;
  conv: number;
  key: string;
}

export const SOURCES: Source[] = [
  { name: 'Прямая ссылка', records: 24, conv: 0.62, key: 'direct' },
  { name: 'Telegram',      records: 18, conv: 0.58, key: 'tg' },
  { name: 'Сайт',          records: 9,  conv: 0.41, key: 'site' },
  { name: 'ВКонтакте',     records: 6,  conv: 0.34, key: 'vk' },
  { name: 'Instagram',     records: 4,  conv: 0.22, key: 'ig' },
];

export interface FinanceOp {
  date: string;
  desc: string;
  amount: number;
}

export const FINANCE_OPS: FinanceOp[] = [
  { date: '4 мая', desc: 'Маникюр — Екатерина С.',     amount: 2500 },
  { date: '4 мая', desc: 'Дизайн — Марина Л.',         amount: 1500 },
  { date: '3 мая', desc: 'Вывод на карту •• 4421',     amount: -18000 },
  { date: '3 мая', desc: 'Маникюр — Ольга К.',         amount: 2500 },
  { date: '3 мая', desc: 'Снятие — Анна П.',           amount: 800 },
  { date: '2 мая', desc: 'Френч — Виктория З.',        amount: 2200 },
  { date: '2 мая', desc: 'Комиссия эквайринга',        amount: -132 },
  { date: '1 мая', desc: 'Маникюр — Дарья В.',         amount: 2500 },
];

export interface Campaign {
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  status: 'active' | 'finished';
}

export const CAMPAIGNS: Campaign[] = [
  { name: 'Майские праздники −15%',  sent: 142, opened: 88,  clicked: 23, status: 'active' },
  { name: 'Возврат давних клиентов', sent: 31,  opened: 19,  clicked: 6,  status: 'active' },
  { name: 'Анонс новых услуг',       sent: 198, opened: 120, clicked: 41, status: 'finished' },
];
