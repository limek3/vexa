import 'server-only';

import crypto from 'node:crypto';
import { domainToASCII } from 'node:url';
import type { Booking, MasterProfile } from '@/lib/types';
import { getMasterAddress, getMasterLocationMode, getMasterRouteUrl } from '@/lib/location-links';
import { bookingClientCardText, bookingCode, bookingMessageText, bookingServicesText, masterDisplayName } from '@/lib/server/booking-context';

const VK_API_VERSION = '5.199';

export type VkBotProfile = {
  vkId: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  screenName?: string | null;
  domain?: string | null;
  photoUrl?: string | null;
  rawProfile?: Record<string, unknown>;
};

const CLICKBOOK_APP_URL = 'https://xn--90anfbbc3d.xn--p1ai';

function normalizeAppUrl(value?: string | null) {
  const raw = value?.trim() || CLICKBOOK_APP_URL;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    const asciiHost = domainToASCII(url.hostname) || url.hostname;

    url.protocol = 'https:';
    url.hostname = asciiHost === 'www.xn--90anfbbc3d.xn--p1ai'
      ? 'xn--90anfbbc3d.xn--p1ai'
      : asciiHost;
    url.pathname = '';
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/$/, '');
  } catch {
    return CLICKBOOK_APP_URL;
  }
}

export function getAppUrl() {
  return normalizeAppUrl(
    process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      CLICKBOOK_APP_URL,
  );
}

export function getVkBotGroupId() {
  return (
    process.env.VK_BOT_GROUP_ID ||
    process.env.VK_GROUP_ID ||
    process.env.NEXT_PUBLIC_VK_BOT_GROUP_ID ||
    ''
  )
    .trim()
    .replace(/^club/i, '')
    .replace(/^-/, '');
}

export function getVkBotScreenName() {
  return (
    process.env.NEXT_PUBLIC_VK_BOT_SCREEN_NAME ||
    process.env.VK_BOT_SCREEN_NAME ||
    process.env.VK_GROUP_SCREEN_NAME ||
    ''
  )
    .replace(/^@/, '')
    .trim();
}

export function getVkBotAccessToken() {
  const value = process.env.VK_BOT_ACCESS_TOKEN || process.env.VK_GROUP_ACCESS_TOKEN || '';
  if (!value.trim()) throw new Error('Missing VK_BOT_ACCESS_TOKEN');
  return value.trim();
}

export function getVkBotDeepLink(payload?: string) {
  const ref = payload ? `?ref=${encodeURIComponent(payload)}` : '';
  const screenName = getVkBotScreenName();

  if (screenName) return `https://vk.me/${screenName}${ref}`;

  const groupId = getVkBotGroupId();
  if (!groupId) return null;

  // For communities without a custom screen name, vk.me/club<ID> is the
  // most reliable link for passing ref into the first incoming message.
  return `https://vk.me/club${groupId}${ref}`;
}

export function getVkBotDialogLink() {
  const screenName = getVkBotScreenName();

  if (screenName) return `https://vk.me/${screenName}`;

  const groupId = getVkBotGroupId();
  if (!groupId) return null;

  return `https://vk.com/write-${groupId}`;
}

export function getVkBotPrefillLink(text: string) {
  const groupId = getVkBotGroupId();
  if (!groupId) return getVkBotDeepLink();

  // VK Web does not guarantee prefilled text in all clients. `msg` works
  // in more desktop builds than `message`, but we still keep ref-based auth
  // as the main path and use this only as a fallback.
  return `https://vk.com/im?sel=-${groupId}&msg=${encodeURIComponent(text)}`;
}

async function readJsonSafe(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { _raw: text };
  }
}

export async function vkApi(method: string, params: Record<string, unknown>) {
  const body = new URLSearchParams();

  body.set('access_token', getVkBotAccessToken());
  body.set('v', VK_API_VERSION);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    body.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  const response = await fetch(`https://api.vk.com/method/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  const payload = await readJsonSafe(response);

  if (!response.ok || payload.error) {
    const error = payload.error && typeof payload.error === 'object'
      ? (payload.error as Record<string, unknown>)
      : payload;
    const message =
      typeof error.error_msg === 'string'
        ? error.error_msg
        : `vk_${method}_failed:${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export type VkBotButton = {
  label: string;
  action?: string;
  token?: string | null;
  url?: string | null;
  payload?: Record<string, unknown>;
  color?: 'primary' | 'secondary' | 'negative' | 'positive';
};

export function buildVkKeyboard(buttons: Array<Array<VkBotButton>>) {
  return {
    one_time: false,
    inline: true,
    buttons: buttons.map((row) =>
      row.map((button) => ({
        action: {
          type: 'callback',
          label: button.label,
          payload: JSON.stringify({
            action: button.action || 'noop',
            ...(button.token ? { token: button.token } : {}),
            ...(button.url ? { url: button.url } : {}),
            ...(button.payload ?? {}),
          }),
        },
        color: button.color ?? 'secondary',
      })),
    ),
  };
}

export function buildVkReplyKeyboard(buttons: Array<Array<VkBotButton>>) {
  return {
    one_time: false,
    inline: false,
    buttons: buttons.map((row) =>
      row.map((button) => ({
        action: {
          type: 'text',
          label: button.label,
          payload: JSON.stringify({
            action: button.action || 'noop',
            ...(button.token ? { token: button.token } : {}),
            ...(button.url ? { url: button.url } : {}),
            ...(button.payload ?? {}),
          }),
        },
        color: button.color ?? 'secondary',
      })),
    ),
  };
}

export function buildVkCallbackReplyKeyboard(buttons: Array<Array<VkBotButton>>) {
  return {
    one_time: false,
    inline: false,
    buttons: buttons.map((row) =>
      row.map((button) => ({
        action: {
          type: 'callback',
          label: button.label,
          payload: JSON.stringify({
            action: button.action || 'noop',
            ...(button.token ? { token: button.token } : {}),
            ...(button.url ? { url: button.url } : {}),
            ...(button.payload ?? {}),
          }),
        },
        color: button.color ?? 'secondary',
      })),
    ),
  };
}

export function buildVkClientMenuKeyboard(token?: string | null) {
  return buildVkCallbackReplyKeyboard([
    [
      { label: '📋 Мои записи', action: 'client_bookings', token: token ?? null, color: 'primary' },
      { label: '💬 Мастеру', action: 'client_write', token: token ?? null, color: 'secondary' },
    ],
    [
      { label: '🔁 Перенос/отмена', action: 'client_reschedule_cancel', token: token ?? null, color: 'secondary' },
      { label: '🆘 Помощь', action: 'support', token: token ?? null, color: 'secondary' },
    ],
  ]);
}

// Persistent client keyboard under the input field. No inline buttons in service cards.
export function buildVkClientPersistentKeyboard(token?: string | null) {
  return buildVkClientMenuKeyboard(token);
}

export function buildVkLoginKeyboard(token: string) {
  return buildVkKeyboard([
    [{ label: 'Открыть кабинет', action: 'open_dashboard', token, color: 'positive' }],
    [
      { label: 'Мои записи', action: 'bookings', token, color: 'primary' },
      { label: 'Уведомления', action: 'notifications', token, color: 'secondary' },
    ],
    [
      { label: 'FAQ', action: 'faq', token, color: 'secondary' },
      { label: 'Поддержка', action: 'support', token, color: 'secondary' },
    ],
  ]);
}

export function buildVkMainMenuKeyboard(token?: string | null) {
  return buildVkKeyboard([
    [{ label: 'Открыть кабинет', action: 'open_dashboard', token: token ?? null, color: 'positive' }],
    [
      { label: 'Мои записи', action: 'bookings', token: token ?? null, color: 'primary' },
      { label: 'Уведомления', action: 'notifications', token: token ?? null, color: 'secondary' },
    ],
    [
      { label: 'FAQ', action: 'faq', token: token ?? null, color: 'secondary' },
      { label: 'Поддержка', action: 'support', token: token ?? null, color: 'secondary' },
    ],
  ]);
}

export function buildVkFaqKeyboard(token?: string | null) {
  return buildVkKeyboard([
    [
      { label: 'Вход', action: 'faq_login', token: token ?? null, color: 'primary' },
      { label: 'Записи', action: 'faq_bookings', token: token ?? null, color: 'primary' },
    ],
    [
      { label: 'Уведомления', action: 'faq_notifications', token: token ?? null, color: 'secondary' },
      { label: 'Тарифы', action: 'faq_tariffs', token: token ?? null, color: 'secondary' },
    ],
    [{ label: 'Главное меню', action: 'back_main', token: token ?? null, color: 'secondary' }],
  ]);
}

export function buildVkNotificationsKeyboard(token?: string | null) {
  return buildVkKeyboard([
    [{ label: 'Уведомления включены', action: 'notifications_enabled', token: token ?? null, color: 'positive' }],
    [
      { label: 'Что будет приходить', action: 'faq_notifications', token: token ?? null, color: 'secondary' },
      { label: 'Главное меню', action: 'back_main', token: token ?? null, color: 'secondary' },
    ],
  ]);
}

export function buildVkSupportKeyboard(token?: string | null) {
  return buildVkKeyboard([
    [
      { label: 'FAQ', action: 'faq', token: token ?? null, color: 'primary' },
      { label: 'Главное меню', action: 'back_main', token: token ?? null, color: 'secondary' },
    ],
    [{ label: 'Связь с поддержкой', action: 'support_human', token: token ?? null, color: 'secondary' }],
  ]);
}

export async function sendVkMessage(params: {
  peerId: number | string;
  message: string;
  keyboard?: string | Record<string, unknown>;
}) {
  return vkApi('messages.send', {
    peer_id: String(params.peerId),
    random_id: crypto.randomInt(1, 2147483647),
    message: params.message,
    disable_mentions: 1,
    ...(params.keyboard
      ? { keyboard: typeof params.keyboard === 'string' ? params.keyboard : JSON.stringify(params.keyboard) }
      : {}),
  });
}


export function buildVkEmptyInlineKeyboard() {
  return {
    one_time: false,
    inline: true,
    buttons: [],
  };
}

function normalizeVkKeyboard(keyboard?: string | Record<string, unknown> | null) {
  if (keyboard === null) return JSON.stringify(buildVkEmptyInlineKeyboard());
  if (!keyboard) return JSON.stringify(buildVkEmptyInlineKeyboard());
  return typeof keyboard === 'string' ? keyboard : JSON.stringify(keyboard);
}

export async function editVkMessage(params: {
  peerId: number | string;
  conversationMessageId: number | string;
  message: string;
  keyboard?: string | Record<string, unknown> | null;
}) {
  const payload = {
    peer_id: String(params.peerId),
    message: params.message,
    disable_mentions: 1,
    keyboard: normalizeVkKeyboard(params.keyboard),
  };

  try {
    return await vkApi('messages.edit', {
      ...payload,
      conversation_message_id: String(params.conversationMessageId),
    });
  } catch (error) {
    // Some VK clients/API responses give us message_id instead of conversation_message_id.
    // Fallback to message_id keeps old stored cards editable instead of spawning duplicates.
    return vkApi('messages.edit', {
      ...payload,
      message_id: String(params.conversationMessageId),
    });
  }
}

export async function deleteVkMessage(params: {
  peerId: number | string;
  conversationMessageId: number | string;
}) {
  try {
    return await vkApi('messages.delete', {
      peer_id: String(params.peerId),
      cmids: String(params.conversationMessageId),
      delete_for_all: 1,
    });
  } catch (error) {
    return vkApi('messages.delete', {
      peer_id: String(params.peerId),
      message_ids: String(params.conversationMessageId),
      delete_for_all: 1,
    });
  }
}

export async function answerVkMessageEvent(params: {
  eventId: string;
  userId: number | string;
  peerId: number | string;
  text?: string;
  link?: string;
}) {
  return vkApi('messages.sendMessageEventAnswer', {
    event_id: params.eventId,
    user_id: String(params.userId),
    peer_id: String(params.peerId),
    event_data: JSON.stringify(
      params.link
        ? { type: 'open_link', link: params.link }
        : { type: 'show_snackbar', text: params.text || 'Готово' },
    ),
  });
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numericOrString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

export async function getVkBotUserProfile(vkUserId: number | string): Promise<VkBotProfile> {
  const payload = await vkApi('users.get', {
    user_ids: String(vkUserId),
    fields: 'screen_name,domain,photo_200,first_name,last_name',
  }).catch((error) => ({
    error: error instanceof Error ? error.message : String(error),
    response: [],
  }));

  const rows = Array.isArray(payload.response) ? payload.response : [];
  const profile = rows[0] && typeof rows[0] === 'object' ? (rows[0] as Record<string, unknown>) : null;
  const vkId = numericOrString(profile?.id) || String(vkUserId);
  const firstName = stringValue(profile?.first_name);
  const lastName = stringValue(profile?.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

  return {
    vkId,
    firstName,
    lastName,
    fullName,
    screenName: stringValue(profile?.screen_name),
    domain: stringValue(profile?.domain),
    photoUrl: stringValue(profile?.photo_200),
    rawProfile: profile ? { apiProfile: profile, apiResponse: payload } : { apiResponse: payload },
  };
}


export async function sendVkBotWelcomeMessage(params: {
  peerId: number | string;
  token?: string | null;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: [
      'КликБук на связи ✅',
      '',
      'Это ваш VK-бот для входа, уведомлений и быстрых действий по кабинету.',
      '',
      'Выберите действие ниже. Всё работает через кнопки — без ручных кодов и лишних ссылок в сообщениях.',
    ].join('\n'),
    keyboard: buildVkMainMenuKeyboard(params.token),
  });
}

export async function sendVkBotAuthFallbackMessage(params: {
  peerId: number | string;
  token?: string | null;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: [
      'Я на связи ✅',
      '',
      'Через этот диалог можно войти в кабинет, получить подсказку, проверить уведомления и открыть разделы КликБук.',
      '',
      'Выберите действие ниже.',
    ].join('\n'),
    keyboard: buildVkMainMenuKeyboard(params.token),
  });
}

export async function sendVkBotFaqMessage(params: {
  peerId: number | string;
  token?: string | null;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: [
      'FAQ КликБук',
      '',
      'Выберите тему — я отвечу прямо здесь, в диалоге VK.',
      '',
      '• Вход — как работает авторизация через VK и Telegram',
      '• Записи — где смотреть заявки и статусы клиентов',
      '• Уведомления — что будет приходить в VK',
      '• Тарифы — чем отличаются Start, Pro, Studio и Premium',
    ].join('\n'),
    keyboard: buildVkFaqKeyboard(params.token),
  });
}

export async function sendVkBotFaqAnswerMessage(params: {
  peerId: number | string;
  token?: string | null;
  topic: 'login' | 'bookings' | 'notifications' | 'tariffs';
}) {
  const answers = {
    login: [
      'Как работает вход',
      '',
      '1. На сайте нажмите «Войти через VK».',
      '2. Откроется этот диалог с ботом.',
      '3. Нажмите «Открыть кабинет» или отправьте /start.',
      '4. КликБук создаст безопасную сессию и откроет кабинет.',
      '',
      'Коды руками вводить не нужно.',
    ],
    bookings: [
      'Записи и заявки',
      '',
      'Все записи доступны в кабинете: «Сегодня», «Календарь», «Клиенты» и «Статистика».',
      '',
      'В VK будут приходить важные события: новая запись, перенос, отмена, no-show и напоминания.',
    ],
    notifications: [
      'Уведомления VK',
      '',
      'После первого сообщения боту сообщество может отправлять вам сервисные уведомления.',
      '',
      'Сюда будут приходить: новые записи, переносы, отмены, напоминания и важные события кабинета.',
    ],
    tariffs: [
      'Тарифы',
      '',
      'Start — базовый тариф для запуска.',
      'Pro — больше услуг, аналитика и рабочие инструменты.',
      'Studio — для команды и студии.',
      'Premium — расширенные лимиты и приоритетные возможности.',
    ],
  } as const;

  return sendVkMessage({
    peerId: params.peerId,
    message: answers[params.topic].join('\n'),
    keyboard: buildVkFaqKeyboard(params.token),
  });
}

export async function sendVkBotNotificationsMessage(params: {
  peerId: number | string;
  token?: string | null;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: [
      'Уведомления VK включены ✅',
      '',
      'Теперь этот диалог можно использовать как рабочий канал КликБук.',
      '',
      'Что будет приходить:',
      '• новая запись клиента',
      '• перенос или отмена записи',
      '• напоминания',
      '• важные события по кабинету и тарифу',
    ].join('\n'),
    keyboard: buildVkNotificationsKeyboard(params.token),
  });
}

export async function sendVkBotSupportMessage(params: {
  peerId: number | string;
  token?: string | null;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: [
      'Поддержка КликБук',
      '',
      'Опишите вопрос обычным сообщением в этом диалоге. Я сохраню обращение в канал поддержки, а быстрые ответы можно открыть через FAQ.',
      '',
      'Для срочных рабочих вопросов укажите: что случилось, где именно в кабинете и что вы уже пробовали сделать.',
    ].join('\n'),
    keyboard: buildVkSupportKeyboard(params.token),
  });
}

export async function sendVkBotBookingsMessage(params: {
  peerId: number | string;
  token?: string | null;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: [
      'Мои записи',
      '',
      'Записи открываются в кабинете КликБук. В этом VK-диалоге бот будет присылать уведомления о новых заявках, переносах, отменах и напоминаниях.',
      '',
      'Нажмите «Открыть кабинет», чтобы перейти к рабочему экрану.',
    ].join('\n'),
    keyboard: buildVkMainMenuKeyboard(params.token),
  });
}

function bookingDateLabel(booking: Pick<Booking, 'date' | 'time'>) {
  return `${booking.date} · ${booking.time}`;
}

function bookingDateLines(booking: Pick<Booking, 'date' | 'time'>) {
  return [`Дата: ${booking.date}`, `Время: ${booking.time}`];
}

function buildVisitPlaceLines(profile?: MasterProfile | null) {
  if (!profile || getMasterLocationMode(profile) !== 'address') return ['Формат: онлайн'];

  const address = getMasterAddress(profile);
  const routeUrl = getMasterRouteUrl(profile);

  return [
    address ? `Адрес: ${address}` : null,
    routeUrl ? `Маршрут Яндекс.Карты: ${routeUrl}` : null,
  ].filter(Boolean) as string[];
}

export async function sendMasterVkBookingNotification(params: {
  peerId: number | string;
  booking: Booking;
  profile?: MasterProfile | null;
  workspaceSlug: string;
}) {
  const appUrl = getAppUrl();

  return sendVkMessage({
    peerId: params.peerId,
    message: bookingMessageText({
      title: 'Новая запись ✅',
      booking: params.booking,
      profile: params.profile,
      includeClient: true,
      includePhone: true,
      source: params.booking.source ?? null,
      channel: params.booking.channel ?? null,
    }),
    keyboard: buildVkKeyboard([
      [{ label: 'Открыть записи', action: 'open_url', url: `${appUrl}/dashboard/today`, color: 'primary' }],
      [{ label: 'Кабинет', action: 'open_url', url: `${appUrl}/dashboard`, color: 'secondary' }],
    ]),
  });
}


export async function sendMasterVkRescheduleRequestNotification(params: {
  peerId: number | string;
  booking: Booking;
  profile?: MasterProfile | null;
  workspaceSlug: string;
  source?: string;
}) {
  const appUrl = getAppUrl();

  return sendVkMessage({
    peerId: params.peerId,
    message: bookingMessageText({
      title: 'Клиент хочет перенос ⚠️',
      booking: params.booking,
      profile: params.profile,
      includeClient: true,
      includePhone: true,
      source: params.source || 'VK',
      footer: 'Слот освобождён. В чатах КликБук появилась жёлтая плашка-предупреждение.',
    }),
    keyboard: buildVkKeyboard([
      [{ label: 'Открыть чаты', action: 'open_url', url: `${appUrl}/dashboard/chats`, color: 'primary' }],
      [{ label: 'Кабинет', action: 'open_url', url: `${appUrl}/dashboard`, color: 'secondary' }],
    ]),
  });
}

export async function sendMasterVkBookingConfirmedNotice(params: {
  peerId: number | string;
  booking: Booking;
  profile?: MasterProfile | null;
  workspaceSlug: string;
  source?: string;
}) {
  const appUrl = getAppUrl();

  return sendVkMessage({
    peerId: params.peerId,
    message: bookingMessageText({
      title: 'Клиент подтвердил запись ✅',
      booking: params.booking,
      profile: params.profile,
      includeClient: true,
      source: params.source || 'VK',
    }),
    keyboard: buildVkKeyboard([
      [{ label: 'Открыть записи', action: 'open_url', url: `${appUrl}/dashboard/today`, color: 'primary' }],
    ]),
  });
}

export function buildVkClientBookingKeyboard(bookingId: string) {
  return buildVkKeyboard([
    [
      {
        label: '✅ Подтвердить',
        action: 'client_booking_confirm',
        color: 'positive',
        payload: { booking_id: bookingId },
      },
    ],
    [
      {
        label: '❌ Нужен перенос',
        action: 'client_booking_reschedule',
        color: 'negative',
        payload: { booking_id: bookingId },
      },
    ],
  ]);
}

export async function sendClientVkBookingConfirmation(params: {
  peerId: number | string;
  booking: Booking;
  profile?: MasterProfile | null;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: bookingClientCardText({
      title: 'Запись создана ✅',
      booking: params.booking,
      profile: params.profile,
      footer: 'Для действий используйте меню ниже.'
    }),
    keyboard: buildVkClientMenuKeyboard(),
  });
}

export async function sendClientVkBookingReminder(params: {
  peerId: number | string;
  booking: Booking;
  profile?: MasterProfile | null;
  hoursBefore: number;
}) {
  const masterName = params.profile?.name || 'мастеру';
  const when = params.hoursBefore >= 24 ? 'завтра' : `через ${params.hoursBefore} часа`;
  const placeLines = buildVisitPlaceLines(params.profile);

  return sendVkMessage({
    peerId: params.peerId,
    message: [
      'Напоминание ⏰',
      '',
      `У вас ${when} запись к ${masterName}.`,
      '',
      'Услуги:',
      bookingServicesText(params.booking),
      '',
      `Дата: ${params.booking.date}`,
      `Время: ${params.booking.time}`,
      ...placeLines,
      '',
      params.hoursBefore >= 24
        ? 'Для подтверждения, переноса или сообщения мастеру используйте меню ниже.'
        : 'Скоро визит.\nНиже адрес и маршрут, если приём проходит по адресу. Хорошего визита!',
    ]
      .filter(Boolean)
      .join('\n'),
    keyboard: buildVkClientMenuKeyboard(),
  });
}

export async function sendVkLoginConfirmedMessage(params: {
  peerId: number | string;
  token: string;
}) {
  return sendVkMessage({
    peerId: params.peerId,
    message: ['VK подключён к КликБук ✅', '', 'Откройте кабинет или выберите действие ниже.'].join('\n'),
    keyboard: buildVkLoginKeyboard(params.token),
  });
}
