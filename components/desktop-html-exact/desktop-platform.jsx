'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { buildWorkspaceDatasetFromStored } from '@/lib/workspace-store';
import {
  APPTS,
  CHATS,
  CLIENTS,
  MASTER,
  NOTIFICATIONS,
  SERVICES,
  TASKS,
  TEMPLATES,
} from './desktop-html-data';

const STORAGE_KEY = 'vexa.desktop.platform.v1';

const DEFAULT_PREFERENCES = {
  theme: 'light',
  accent: 'clay',
  density: 'default',
  radius: 'default',
  showSubscriptionBanner: false,
};

const RU_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function addMinutes(time, minutes) {
  const [hours, mins] = String(time || '10:00').split(':').map(Number);
  const total = (hours || 10) * 60 + (mins || 0) + Number(minutes || 60);
  const nextHours = Math.floor(total / 60) % 24;
  const nextMins = total % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMins).padStart(2, '0')}`;
}

function shortDate(value) {
  if (!value) return '—';
  const parsed = parseDate(value);
  if (!parsed) return String(value);
  return `${parsed.getDate()} ${RU_MONTHS[parsed.getMonth()]}`;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const day = raw.match(/\d+/)?.[0];
  if (!day) return null;
  const lower = raw.toLowerCase();
  const monthIndex = [
    ['янв', 'january'],
    ['фев', 'february'],
    ['мар', 'march'],
    ['апр', 'april'],
    ['мая', 'май', 'may'],
    ['июн', 'june'],
    ['июл', 'july'],
    ['авг', 'august'],
    ['сен', 'september'],
    ['окт', 'october'],
    ['ноя', 'november'],
    ['дек', 'december'],
  ].findIndex((tokens) => tokens.some((token) => lower.includes(token)));
  const today = new Date();
  return new Date(today.getFullYear(), monthIndex >= 0 ? monthIndex : today.getMonth(), Number(day));
}

function dayFromDateLabel(dateLabel) {
  const parsed = parseDate(dateLabel);
  if (!parsed) return 0;
  const monday = new Date(parsed);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  const diff = Math.round((parsed.getTime() - monday.getTime()) / 86400000);
  return Math.max(0, Math.min(6, diff));
}

function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';
}

function mapDesktopStatusToBooking(status) {
  if (status === 'done') return 'completed';
  if (status === 'noshow') return 'no_show';
  return status || 'new';
}

function mapBookingStatusToDesktop(status) {
  if (status === 'completed') return 'done';
  if (status === 'no_show') return 'noshow';
  return status || 'new';
}

function buildInitialState(preferences = DEFAULT_PREFERENCES) {
  return {
    master: clone(MASTER),
    services: clone(SERVICES),
    clients: clone(CLIENTS),
    appointments: clone(APPTS),
    chats: clone(CHATS),
    notifications: clone(NOTIFICATIONS),
    tasks: clone(TASKS),
    templates: clone(TEMPLATES),
    preferences: { ...DEFAULT_PREFERENCES, ...preferences },
    moduleState: {},
    desktopClients: [],
  };
}

function mergeState(stored, fallback) {
  if (!stored || typeof stored !== 'object') return fallback;
  return {
    ...fallback,
    ...stored,
    master: { ...fallback.master, ...(stored.master || {}) },
    services: Array.isArray(stored.services) ? stored.services : fallback.services,
    clients: Array.isArray(stored.clients) ? stored.clients : fallback.clients,
    appointments: Array.isArray(stored.appointments) ? stored.appointments : fallback.appointments,
    chats: Array.isArray(stored.chats) ? stored.chats : fallback.chats,
    notifications: Array.isArray(stored.notifications) ? stored.notifications : fallback.notifications,
    tasks: Array.isArray(stored.tasks) ? stored.tasks : fallback.tasks,
    templates: Array.isArray(stored.templates) ? stored.templates : fallback.templates,
    preferences: { ...fallback.preferences, ...(stored.preferences || {}) },
    moduleState: stored.moduleState && typeof stored.moduleState === 'object' ? stored.moduleState : fallback.moduleState,
    desktopClients: Array.isArray(stored.desktopClients) ? stored.desktopClients : [],
  };
}

function isNoisyActionNotification(item) {
  if (!item?.local && item?.kind !== 'platform') return false;
  const title = String(item?.title || '').toLowerCase();
  const body = String(item?.body || '').toLowerCase();
  return (
    body.includes('действие зафиксировано') ||
    title.includes('переключить на') ||
    title.includes('фильтры') ||
    title.includes('помощь')
  );
}

function meaningfulNotifications(notifications) {
  return (Array.isArray(notifications) ? notifications : []).filter((item) => !isNoisyActionNotification(item));
}

function adaptMaster(profile) {
  if (!profile) return clone(MASTER);
  const slug = profile.slug || profile.username || 'profile';
  return {
    name: profile.name || MASTER.name,
    profession: profile.profession || MASTER.profession,
    initials: initials(profile.name),
    city: profile.city || MASTER.city,
    studio: profile.address || profile.studio || MASTER.studio,
    about: profile.bio || profile.about || MASTER.about,
    phone: profile.phone || MASTER.phone,
    email: profile.email || MASTER.email,
    username: slug,
    publicUrl: `кликбук.рф/${slug}`,
    reviews: profile.reviewCount ?? profile.reviews?.length ?? MASTER.reviews,
    rating: profile.rating ?? MASTER.rating,
  };
}

function adaptService(service) {
  if (!service) return null;
  return {
    id: String(service.id || makeId('s')),
    cat: service.category || service.cat || 'Другое',
    name: service.name || 'Новая услуга',
    dur: Number(service.duration ?? service.dur ?? 60),
    price: Number(service.price ?? 0),
    active: service.active ?? service.status !== 'draft',
    public: service.public ?? service.visible !== false,
    short: service.description || service.short || '',
    bookings: service.bookings,
    revenue: service.revenue,
    popularity: service.popularity,
  };
}

function toWorkspaceService(service) {
  return {
    id: service.id,
    name: service.name,
    duration: Number(service.dur || service.duration || 60),
    price: Number(service.price || 0),
    status: service.active === false ? 'draft' : 'active',
    visible: service.public !== false,
    bookings: Number(service.bookings || 0),
    revenue: Number(service.revenue || 0),
    popularity: Number(service.popularity || 0),
    category: service.cat || service.category || 'Другое',
    description: service.short || service.description || '',
  };
}

function adaptClient(client) {
  if (!client) return null;
  const status = client.status || (client.favorite ? 'vip' : client.visits > 1 ? 'regular' : 'new');
  return {
    id: String(client.id || makeId('c')),
    name: client.name || 'Клиент',
    phone: client.phone || '+7 000 000 00 00',
    tag: status,
    visits: Number(client.visits || 0),
    last: client.last || shortDate(client.lastVisit),
    next: client.next || shortDate(client.nextVisit),
    notes: client.notes || client.note || '',
    status,
  };
}

function mergeClients(primary, extra) {
  const map = new Map();
  [...primary, ...extra].filter(Boolean).forEach((client) => {
    const key = String(client.phone || client.name || client.id).replace(/\D/g, '') || client.id;
    if (!map.has(key)) map.set(key, client);
  });
  return Array.from(map.values());
}

function findClient(clients, booking) {
  const phone = String(booking.clientPhone || '').replace(/\D/g, '');
  return clients.find((client) => (
    (phone && String(client.phone || '').replace(/\D/g, '') === phone) ||
    client.name === booking.clientName
  ));
}

function adaptBooking(booking, clients, services) {
  if (!booking) return null;
  const service = services.find((item) => item.name === booking.service) || services[0];
  const client = findClient(clients, booking) || clients[0];
  const start = booking.time || '10:00';
  return {
    id: booking.id,
    day: dayFromDateLabel(booking.date),
    date: booking.date,
    start,
    end: booking.end || addMinutes(start, booking.durationMinutes || service?.dur || 60),
    clientId: client?.id,
    serviceId: service?.id,
    status: mapBookingStatusToDesktop(booking.status),
    notes: booking.comment || booking.notes || '',
    sourceBooking: booking,
  };
}

function adaptTemplate(template) {
  if (!template) return null;
  return {
    key: template.key || `/${String(template.title || 'шаблон').toLowerCase().replace(/\s+/g, '-')}`,
    title: template.title || 'Шаблон',
    text: template.text || template.content || '',
  };
}

function toWorkspaceTemplate(template) {
  return {
    id: template.id || template.key || makeId('tpl'),
    title: template.title || 'Шаблон',
    channel: template.channel || 'telegram',
    conversion: template.conversion || '—',
    variables: Array.isArray(template.variables) ? template.variables : [],
    content: template.text || template.content || '',
  };
}

function adaptNotification(notification) {
  if (!notification) return null;
  return {
    id: String(notification.id || makeId('n')),
    kind: notification.kind || notification.channel || 'info',
    icon: notification.icon || (notification.critical ? 'bell' : 'info'),
    title: notification.title || 'Уведомление',
    body: notification.body || notification.description || '',
    time: notification.time || 'сейчас',
    unread: notification.unread ?? notification.enabled ?? false,
  };
}

function adaptThread(thread) {
  const clientId = `thread-client-${thread.id}`;
  const messages = Array.isArray(thread.messages) ? thread.messages.map((message) => ({
    id: message.id,
    from: message.author === 'master' || message.author === 'system' ? 'me' : 'them',
    text: message.body,
    time: message.createdAt ? nowTimeFromIso(message.createdAt) : nowTime(),
    read: message.deliveryState === 'read',
  })) : [];
  const last = messages[messages.length - 1];
  return {
    client: adaptClient({
      id: clientId,
      name: thread.clientName,
      phone: thread.clientPhone,
      status: thread.segment === 'vip' ? 'vip' : thread.segment === 'inactive' ? 'inactive' : 'regular',
      visits: 1,
      next: thread.nextVisit ? shortDate(thread.nextVisit) : '—',
    }),
    chat: {
      id: thread.id,
      clientId,
      unread: Number(thread.unreadCount || 0),
      time: thread.lastMessageAt ? nowTimeFromIso(thread.lastMessageAt) : last?.time || 'сейчас',
      pinned: Boolean(thread.isPriority),
      online: thread.botConnected !== false,
      preview: thread.lastMessagePreview || last?.text || '',
      messages,
      sourceThread: thread,
    },
  };
}

function nowTimeFromIso(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || 'сейчас');
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function buildLiveState({ app, localState, preferenceDefaults, remoteThreads }) {
  if (!app.workspaceId || !app.ownedProfile) return null;

  const bookings = Array.isArray(app.bookings) ? app.bookings : [];
  const sections = app.workspaceData || {};
  const dataset = buildWorkspaceDatasetFromStored(app.ownedProfile, bookings, 'ru', sections);
  const services = (Array.isArray(sections.services) && sections.services.length > 0 ? sections.services : dataset.services)
    .map(adaptService)
    .filter(Boolean);
  const storedDesktopClients = Array.isArray(sections.desktopClients) ? sections.desktopClients.map(adaptClient).filter(Boolean) : [];
  const threadPairs = (remoteThreads || []).map(adaptThread);
  const clients = mergeClients(
    (dataset.clients || []).map(adaptClient).filter(Boolean),
    [...storedDesktopClients, ...threadPairs.map((item) => item.client)],
  );
  const appointments = bookings.map((booking) => adaptBooking(booking, clients, services)).filter(Boolean);
  const templates = (Array.isArray(sections.templates) && sections.templates.length > 0 ? sections.templates : dataset.templates)
    .map(adaptTemplate)
    .filter(Boolean);
  const localPlatformNotifications = (localState.notifications || []).filter((item) => item.kind === 'platform' || item.local);

  return {
    master: adaptMaster(app.ownedProfile),
    services,
    clients,
    appointments,
    chats: threadPairs.map((item) => item.chat),
    notifications: [
      ...localPlatformNotifications,
      ...((dataset.notifications || []).map(adaptNotification).filter(Boolean)),
    ].slice(0, 30),
    tasks: localState.tasks || clone(TASKS),
    templates,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...preferenceDefaults,
      ...(sections.appearance || {}),
      ...(localState.preferences || {}),
    },
    moduleState: localState.moduleState || {},
    desktopClients: storedDesktopClients,
  };
}


function buildEmptyLiveState({ app, localState, preferenceDefaults }) {
  return {
    master: app?.ownedProfile ? adaptMaster(app.ownedProfile) : null,
    services: [],
    clients: [],
    appointments: [],
    chats: [],
    notifications: meaningfulNotifications((localState.notifications || []).filter((item) => item.kind === 'platform' || item.local)).slice(0, 12),
    tasks: [],
    templates: [],
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...preferenceDefaults,
      ...(app?.workspaceData?.appearance || {}),
      ...(localState.preferences || {}),
    },
    moduleState: localState.moduleState || {},
    desktopClients: [],
  };
}

function desktopClientPayload(clients) {
  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    phone: client.phone,
    status: client.status,
    visits: client.visits,
    last: client.last,
    next: client.next,
    notes: client.notes,
  }));
}

function bookingValuesFromDraft(draft, service, fallbackDate = '25 мая') {
  return {
    clientName: String(draft.clientName || draft.client || '').trim() || 'Новый клиент',
    clientPhone: String(draft.clientPhone || draft.phone || '').trim() || '+7 000 000 00 00',
    service: service?.name || draft.serviceName || 'Услуга',
    date: draft.date || fallbackDate,
    time: draft.time || '10:00',
    comment: draft.notes || '',
  };
}

export function useDesktopPlatform(preferenceDefaults, options = {}) {
  const app = useApp();
  const demoMode = options.demoMode === true;
  const initial = useMemo(() => buildInitialState(preferenceDefaults), [preferenceDefaults]);
  const [remoteThreads, setRemoteThreads] = useState([]);
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return mergeState(raw ? JSON.parse(raw) : null, initial);
    } catch {
      return initial;
    }
  });
  const [ready, setReady] = useState(typeof window !== 'undefined');

  useEffect(() => {
    if (ready) return;
    const id = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        setState(mergeState(raw ? JSON.parse(raw) : null, initial));
      } catch {
        setState(initial);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [initial, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable in privacy mode; the app still works in memory.
    }
  }, [ready, state]);

  useEffect(() => {
    if (demoMode || !app.workspaceId) {
      return;
    }
    let active = true;
    fetch('/api/chats', { credentials: 'include', cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (active) setRemoteThreads(Array.isArray(payload?.threads) ? payload.threads : []);
      })
      .catch(() => {
        if (active) setRemoteThreads([]);
      });
    return () => {
      active = false;
    };
  }, [app.workspaceId, demoMode]);

  const liveState = useMemo(
    () => demoMode ? null : buildLiveState({ app, localState: state, preferenceDefaults, remoteThreads }),
    [app, demoMode, preferenceDefaults, remoteThreads, state],
  );
  const emptyLiveState = useMemo(
    () => buildEmptyLiveState({ app, localState: state, preferenceDefaults }),
    [app, preferenceDefaults, state],
  );
  const current = demoMode ? state : (liveState || emptyLiveState);
  const visibleNotifications = useMemo(() => meaningfulNotifications(current.notifications), [current.notifications]);
  const isLive = Boolean(liveState);

  const patch = useCallback((updater) => {
    setState((local) => (typeof updater === 'function' ? updater(local) : { ...local, ...updater }));
  }, []);

  const notify = useCallback((title, body, icon = 'info') => {
    patch((local) => ({
      ...local,
      notifications: [
        { id: makeId('n'), title, body, icon, time: 'сейчас', unread: true, kind: 'platform', local: true },
        ...(local.notifications || []),
      ].slice(0, 30),
    }));
  }, [patch]);

  const persistServices = useCallback((services) => {
    if (!isLive) return;
    void app.updateWorkspaceSection('services', services.map(toWorkspaceService));
  }, [app, isLive]);

  const persistDesktopClients = useCallback((clients) => {
    if (!isLive) return;
    void app.updateWorkspaceSection('desktopClients', desktopClientPayload(clients));
  }, [app, isLive]);

  const setPreference = useCallback((keyOrObject, value) => {
    let nextPreferences;
    patch((local) => {
      nextPreferences = {
        ...local.preferences,
        ...(typeof keyOrObject === 'object' ? keyOrObject : { [keyOrObject]: value }),
      };
      return { ...local, preferences: nextPreferences };
    });
    if (isLive) {
      const nextAppearance = {
        ...(app.workspaceData?.appearance || {}),
        ...(typeof keyOrObject === 'object' ? keyOrObject : { [keyOrObject]: value }),
      };
      void app.updateWorkspaceSection('appearance', nextAppearance);
    }
  }, [app, isLive, patch]);

  const saveService = useCallback((draft) => {
    const normalized = {
      id: draft.id || makeId('s'),
      cat: draft.cat || draft.category || 'Другое',
      name: String(draft.name || '').trim() || 'Новая услуга',
      dur: Number(draft.dur || draft.duration || 60),
      price: Number(draft.price || 0),
      active: draft.active ?? true,
      public: draft.public ?? true,
      short: draft.short || draft.description || '',
      bookings: draft.bookings,
      revenue: draft.revenue,
      popularity: draft.popularity,
    };
    const exists = current.services.some((service) => service.id === normalized.id);
    const nextServices = exists
      ? current.services.map((service) => (service.id === normalized.id ? { ...service, ...normalized } : service))
      : [normalized, ...current.services];

    patch((local) => ({ ...local, services: nextServices }));
    persistServices(nextServices);
    notify(exists ? 'Услуга сохранена' : 'Услуга создана', normalized.name, 'services');
    return normalized;
  }, [current.services, notify, patch, persistServices]);

  const toggleServiceField = useCallback((id, field) => {
    const nextServices = current.services.map((service) => (
      service.id === id ? { ...service, [field]: !service[field] } : service
    ));
    patch((local) => ({ ...local, services: nextServices }));
    persistServices(nextServices);
  }, [current.services, patch, persistServices]);

  const createClient = useCallback((draft = {}) => {
    const client = {
      id: makeId('c'),
      name: String(draft.name || '').trim() || 'Новый клиент',
      phone: String(draft.phone || '').trim() || '+7 000 000 00 00',
      tag: draft.tag || 'new',
      status: draft.status || 'new',
      visits: Number(draft.visits || 0),
      last: draft.last || '—',
      next: draft.next || '—',
      notes: draft.notes || '',
    };
    const nextClients = [client, ...current.clients];
    patch((local) => ({ ...local, clients: nextClients, desktopClients: [client, ...(local.desktopClients || [])] }));
    persistDesktopClients(nextClients);
    notify('Клиент добавлен', `${client.name} теперь в базе`, 'users');
    return client;
  }, [current.clients, notify, patch, persistDesktopClients]);

  const updateClient = useCallback((id, draft) => {
    const nextClients = current.clients.map((client) => (client.id === id ? { ...client, ...draft } : client));
    patch((local) => ({ ...local, clients: nextClients }));
    persistDesktopClients(nextClients);
  }, [current.clients, patch, persistDesktopClients]);

  const findOrCreateClient = useCallback((local, nameOrPhone, phone) => {
    const input = String(nameOrPhone || '').trim();
    const phoneInput = String(phone || '').trim();
    const existing = local.clients.find((client) => (
      (input || phoneInput) && (
        client.id === input ||
        client.name.toLowerCase() === input.toLowerCase() ||
        client.phone.replace(/\D/g, '') === input.replace(/\D/g, '') ||
        (phoneInput && client.phone.replace(/\D/g, '') === phoneInput.replace(/\D/g, ''))
      )
    ));
    if (existing) return { client: existing, clients: local.clients };
    const client = {
      id: makeId('c'),
      name: input || 'Новый клиент',
      phone: phoneInput || '+7 000 000 00 00',
      tag: 'new',
      status: 'new',
      visits: 0,
      last: '—',
      next: '—',
      notes: '',
    };
    return { client, clients: [client, ...local.clients] };
  }, []);

  const createBooking = useCallback(async (draft = {}) => {
    const service = current.services.find((item) => item.id === draft.serviceId) || current.services[0];

    if (isLive && app.ownedProfile?.slug) {
      const values = bookingValuesFromDraft(draft, service);
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            masterSlug: app.ownedProfile.slug,
            values,
            source: 'desktop',
            sourceChannel: 'desktop',
            clientContext: { surface: 'desktop' },
          }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          notify(
            response.status === 409 ? 'Слот уже занят' : 'Не удалось создать запись',
            payload?.error || 'Проверьте дату, время и услугу',
            response.status === 409 ? 'clock' : 'x',
          );
          return null;
        }
        const payload = await response.json();
        await app.refreshWorkspace();
        notify('Запись создана', `${values.clientName} · ${values.service}`, 'calendar');
        return payload.booking;
      } catch {
        notify('Не удалось создать запись', 'Сеть или авторизация недоступны', 'x');
        return null;
      }
    }

    let created;
    patch((local) => {
      const selectedService = local.services.find((item) => item.id === draft.serviceId) || local.services[0];
      const { client, clients } = findOrCreateClient(local, draft.clientId || draft.clientName || draft.client, draft.clientPhone);
      const start = draft.time || '10:00';
      const appointment = {
        id: makeId('a'),
        day: draft.day ?? dayFromDateLabel(draft.date),
        date: draft.date,
        start,
        end: draft.end || addMinutes(start, selectedService?.dur || 60),
        clientId: client.id,
        serviceId: selectedService?.id,
        status: draft.status || 'new',
        notes: draft.notes || '',
      };
      created = appointment;
      return {
        ...local,
        clients: clients.map((item) => (
          item.id === client.id ? { ...item, next: draft.date || '25 мая', status: item.status || 'new' } : item
        )),
        appointments: [appointment, ...local.appointments],
        notifications: [
          {
            id: makeId('n'),
            kind: 'new',
            icon: 'plus',
            title: 'Новая запись',
            body: `${client.name} — ${selectedService?.name || 'услуга'}, ${draft.date || '25 мая'} ${start}`,
            time: 'сейчас',
            unread: true,
          },
          ...local.notifications,
        ],
      };
    });
    return created;
  }, [app, current.services, findOrCreateClient, isLive, notify, patch]);

  const updateBookingStatus = useCallback((id, status) => {
    patch((local) => ({
      ...local,
      appointments: local.appointments.map((appointment) => (
        appointment.id === id ? { ...appointment, status } : appointment
      )),
    }));
    if (isLive) {
      void app.updateBookingStatus(id, mapDesktopStatusToBooking(status));
    }
    notify('Запись обновлена', `Статус изменен на ${status}`, status === 'cancelled' ? 'x' : 'check');
  }, [app, isLive, notify, patch]);

  const sendChatMessage = useCallback((chatId, message) => {
    const text = typeof message === 'string'
      ? message
      : message?.text || message?.body || message?.payment?.note || message?.service?.name || 'Вложение';
    const msg = {
      id: makeId('m'),
      from: 'me',
      time: nowTime(),
      read: false,
      ...(typeof message === 'string' ? { text: message } : message),
    };
    patch((local) => ({
      ...local,
      chats: local.chats.map((chat) => (
        chat.id === chatId
          ? { ...chat, time: msg.time, preview: msg.text || text || chat.preview, messages: [...(chat.messages || []), msg] }
          : chat
      )),
    }));
    if (isLive && text) {
      void fetch('/api/chats', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', threadId: chatId, body: text, author: 'master', deliveryState: 'sent' }),
      }).then((response) => {
        if (response.ok) return response.json();
        return null;
      }).then((payload) => {
        if (payload?.message) {
          setRemoteThreads((threads) => threads.map((thread) => (
            thread.id === chatId
              ? { ...thread, messages: [...(thread.messages || []), payload.message], lastMessagePreview: text, lastMessageAt: payload.message.createdAt }
              : thread
          )));
        }
      }).catch(() => undefined);
    }
    return msg;
  }, [isLive, patch]);

  const markChatRead = useCallback((chatId) => {
    patch((local) => ({
      ...local,
      chats: local.chats.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat)),
    }));
    if (isLive) {
      void fetch('/api/chats', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: chatId, patch: { unreadCount: 0 } }),
      });
    }
  }, [isLive, patch]);

  const markNotificationsRead = useCallback(() => {
    patch((local) => ({
      ...local,
      notifications: local.notifications.map((item) => ({ ...item, unread: false })),
    }));
  }, [patch]);

  const toggleTask = useCallback((id) => {
    patch((local) => ({
      ...local,
      tasks: local.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  }, [patch]);

  const setModuleValue = useCallback((moduleId, key, value) => {
    patch((local) => ({
      ...local,
      moduleState: {
        ...local.moduleState,
        [moduleId]: {
          ...(local.moduleState[moduleId] || {}),
          [key]: value,
        },
      },
    }));
  }, [patch]);

  const recordAction = useCallback((label, body, options = {}) => {
    if (!options.notify && !body) return;
    notify(label || 'Готово', body || 'Действие выполнено', options.icon || 'check');
  }, [notify]);

  const resetDemoData = useCallback(() => {
    const next = buildInitialState(preferenceDefaults);
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, [preferenceDefaults]);

  const saveTemplates = useCallback((templates) => {
    patch((local) => ({ ...local, templates }));
    if (isLive) void app.updateWorkspaceSection('templates', templates.map(toWorkspaceTemplate));
  }, [app, isLive, patch]);

  return {
    ...current,
    notifications: visibleNotifications,
    ready,
    isLive,
    demoMode,
    workspaceId: app.workspaceId,
    workspaceReady: app.hasHydrated,
    hasWorkspace: Boolean(app.workspaceId && app.ownedProfile),
    setPreference,
    saveService,
    toggleServiceField,
    createClient,
    updateClient,
    createBooking,
    updateBookingStatus,
    sendChatMessage,
    markChatRead,
    markNotificationsRead,
    toggleTask,
    setModuleValue,
    recordAction,
    resetDemoData,
    saveTemplates,
  };
}
