'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  Calendar,
  Check,
  ChevronRight,
  CircleHelp,
  Command,
  Languages,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from 'lucide-react';
import {
  appointmentStatuses,
  createInitialState,
  masterProfile,
  navSections,
  safeParseDesktopState,
  screenLabels,
  screenPaths,
} from './data';
import { renderDesktopPage } from './pages';
import { DesktopContext, useDesktop } from './store';
import type { Appointment, AppointmentStatus, DesktopState, Preferences, ScreenId, Service, ToastKind, ToastMessage } from './types';
import { Avatar, Badge, Button, Field, Input, cn, formatMoney } from './ui';

const STORAGE_KEY = 'pora-desktop-redesign-v1';

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function DesktopShell({ initialScreen }: { initialScreen: ScreenId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState<ScreenId>(initialScreen);
  const [state, setState] = useState<DesktopState>(() => {
    if (typeof window === 'undefined') return createInitialState();
    return safeParseDesktopState(window.localStorage.getItem(STORAGE_KEY)) ?? createInitialState();
  });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState<Partial<Appointment> | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  useEffect(() => {
    document.documentElement.dataset.desktopScreen = 'true';
    return () => {
      delete document.documentElement.dataset.desktopScreen;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.preferences.theme === 'dark');
  }, [state.preferences.theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persistable = {
      preferences: state.preferences,
      clients: state.clients,
      services: state.services,
      appointments: state.appointments,
      chats: state.chats,
      tasks: state.tasks,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [state]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === 'n' && document.activeElement instanceof HTMLElement) {
        const tag = document.activeElement.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          setCreatePreset({});
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const notify = useCallback((title: string, body?: string, kind: ToastKind = 'info') => {
    const toast: ToastMessage = { id: `toast-${Date.now()}-${Math.random()}`, title, body, kind };
    setToasts((current) => [...current, toast]);
  }, []);

  const go = useCallback(
    (nextScreen: ScreenId) => {
      setScreen(nextScreen);
      const query = searchParams.toString();
      router.push(`/desktop/${screenPaths[nextScreen]}${query ? `?${query}` : ''}`);
    },
    [router, searchParams],
  );

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setState((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
  }, []);

  const addAppointment = useCallback(
    (appointment: Appointment) => {
      setState((current) => ({
        ...current,
        appointments: [appointment, ...current.appointments],
      }));
      notify('Запись создана', `${appointment.start} · ${screenLabels.schedule}`, 'success');
    },
    [notify],
  );

  const updateAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus) => {
      setState((current) => ({
        ...current,
        appointments: current.appointments.map((appointment) =>
          appointment.id === id ? { ...appointment, status } : appointment,
        ),
      }));
      notify('Статус обновлен', appointmentStatuses[status].label, 'success');
    },
    [notify],
  );

  const updateService = useCallback(
    (service: Service) => {
      setState((current) => ({
        ...current,
        services: current.services.map((item) => (item.id === service.id ? service : item)),
      }));
      notify('Услуга обновлена', service.name, 'success');
    },
    [notify],
  );

  const sendMessage = useCallback(
    (chatId: string, text: string) => {
      setState((current) => ({
        ...current,
        chats: current.chats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                preview: text,
                time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                messages: [
                  ...chat.messages,
                  {
                    id: `m-${Date.now()}`,
                    from: 'me',
                    text,
                    time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                    read: false,
                  },
                ],
              }
            : chat,
        ),
      }));
    },
    [],
  );

  const markNotificationsRead = useCallback(() => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, unread: false })),
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      state,
      setState,
      screen,
      go,
      openCreate: (preset?: Partial<Appointment>) => setCreatePreset(preset ?? {}),
      notify,
      setPreference,
      toggleTask: (id: string) =>
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
        })),
      addAppointment,
      updateAppointmentStatus,
      updateService,
      sendMessage,
      markNotificationsRead,
    }),
    [
      addAppointment,
      go,
      markNotificationsRead,
      notify,
      screen,
      sendMessage,
      setPreference,
      state,
      updateAppointmentStatus,
      updateService,
    ],
  );

  const unreadNotifications = state.notifications.filter((notification) => notification.unread).length;

  return (
    <DesktopContext.Provider value={contextValue}>
      <div
        className="pora-app"
        data-theme={state.preferences.theme}
        data-accent={state.preferences.accent}
        data-density={state.preferences.density}
        data-radius={state.preferences.radius}
      >
        <Sidebar activeScreen={screen} onGo={go} />
        <div className="pora-main">
          <Topbar
            screen={screen}
            searchRef={searchRef}
            unreadNotifications={unreadNotifications}
            notificationOpen={notificationOpen}
            setNotificationOpen={setNotificationOpen}
          />
          <main className={cn('pora-content', screen === 'public' && 'is-public')}>{renderDesktopPage(screen)}</main>
        </div>
        <NotificationPanel open={notificationOpen} onClose={() => setNotificationOpen(false)} />
        {createPreset ? <CreateAppointmentModal preset={createPreset} onClose={() => setCreatePreset(null)} /> : null}
        <ToastStack toasts={toasts} dismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      </div>
    </DesktopContext.Provider>
  );
}

function Sidebar({ activeScreen, onGo }: { activeScreen: ScreenId; onGo: (screen: ScreenId) => void }) {
  return (
    <aside className="pora-sidebar">
      <button type="button" className="pora-brand" onClick={() => onGo('dashboard')} aria-label="Пора">
        <span>p</span>
      </button>
      <nav>
        {navSections.map((section) => (
          <div key={section.label} className="pora-nav-section">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={activeScreen === item.id ? 'is-active' : undefined}
                  onClick={() => onGo(item.id)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={17} />
                  {item.count ? <span>{item.count}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <button type="button" className="pora-sidebar-profile" onClick={() => onGo('account')} title={masterProfile.name}>
        <Avatar name={masterProfile.name} size="sm" />
      </button>
    </aside>
  );
}

function Topbar({
  screen,
  searchRef,
  unreadNotifications,
  notificationOpen,
  setNotificationOpen,
}: {
  screen: ScreenId;
  searchRef: RefObject<HTMLInputElement | null>;
  unreadNotifications: number;
  notificationOpen: boolean;
  setNotificationOpen: (value: boolean) => void;
}) {
  const { state, openCreate, setPreference, notify } = useDesktop();
  const crumbs = useMemo(() => {
    const section = navSections.find((item) => item.items.some((navItem) => navItem.id === screen));
    return [section?.label ?? 'Кабинет', screenLabels[screen]];
  }, [screen]);

  return (
    <header className="pora-topbar">
      <div className="pora-crumbs">
        {crumbs.map((crumb, index) => (
          <span key={crumb} className={index === crumbs.length - 1 ? 'is-current' : undefined}>
            {index > 0 ? <ChevronRight size={12} /> : null}
            {crumb}
          </span>
        ))}
      </div>
      <div className="pora-topbar-spacer" />
      <label className="pora-global-search">
        <Search size={15} />
        <input ref={searchRef} placeholder="Поиск клиентов, записей, услуг..." />
        <kbd><Command size={10} />K</kbd>
      </label>
      <Button icon={CircleHelp} iconOnly kind="ghost" aria-label="Помощь" onClick={() => notify('Помощь', 'Раздел поддержки доступен в меню.', 'info')} />
      <Button
        icon={Languages}
        kind="ghost"
        className="pora-lang-btn"
        onClick={() => setPreference('language', state.preferences.language === 'ru' ? 'en' : 'ru')}
      >
        {state.preferences.language.toUpperCase()}
      </Button>
      <Button
        icon={state.preferences.theme === 'dark' ? Sun : Moon}
        iconOnly
        kind="ghost"
        aria-label="Переключить тему"
        onClick={() => setPreference('theme', state.preferences.theme === 'dark' ? 'light' : 'dark')}
      />
      <button
        type="button"
        className={cn('pora-notify-button', notificationOpen && 'is-active')}
        onClick={() => setNotificationOpen(!notificationOpen)}
        aria-label="Уведомления"
      >
        <Bell size={15} />
        {unreadNotifications ? <span>{unreadNotifications}</span> : null}
      </button>
      <Button icon={Plus} kind="primary" onClick={() => openCreate({ day: 0 })}>Новая запись</Button>
    </header>
  );
}

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, markNotificationsRead } = useDesktop();
  if (!open) return null;

  return (
    <div className="pora-floating-layer" onMouseDown={onClose}>
      <section className="pora-notification-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h2>Уведомления</h2>
          <Button size="sm" kind="ghost" onClick={markNotificationsRead}>Отметить прочитанными</Button>
        </header>
        <div>
          {state.notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <article key={notification.id} className={notification.unread ? 'is-unread' : undefined}>
                <span><Icon size={14} /></span>
                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.body}</p>
                  <em>{notification.time}</em>
                </div>
                {notification.unread ? <i /> : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CreateAppointmentModal({ preset, onClose }: { preset: Partial<Appointment>; onClose: () => void }) {
  const { state, addAppointment } = useDesktop();
  const [step, setStep] = useState(0);
  const [clientId, setClientId] = useState(preset.clientId ?? state.clients[0]?.id ?? '');
  const [serviceId, setServiceId] = useState(preset.serviceId ?? state.services.find((service) => service.active)?.id ?? '');
  const [day, setDay] = useState(String(preset.day ?? 0));
  const [start, setStart] = useState(preset.start ?? '14:00');
  const [notes, setNotes] = useState(preset.notes ?? '');
  const service = state.services.find((item) => item.id === serviceId);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!service) return;
    addAppointment({
      id: `a-${Date.now()}`,
      day: Number(day),
      start,
      end: addMinutes(start, service.dur),
      clientId,
      serviceId,
      status: 'confirmed',
      notes,
    });
    onClose();
  };

  return (
    <div className="pora-modal-backdrop" onMouseDown={onClose}>
      <form className="pora-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>Новая запись</span>
            <h2>Шаг {step + 1} из 3</h2>
          </div>
          <Button icon={X} iconOnly kind="ghost" aria-label="Закрыть" onClick={onClose} />
        </header>
        <div className="pora-modal-steps">
          {[0, 1, 2].map((item) => <span key={item} className={item <= step ? 'is-active' : undefined} />)}
        </div>
        {step === 0 ? (
          <div className="pora-list">
            {state.clients.slice(0, 6).map((client) => (
              <button
                key={client.id}
                type="button"
                className={cn('pora-list-row', client.id === clientId && 'is-active')}
                onClick={() => {
                  setClientId(client.id);
                  setStep(1);
                }}
              >
                <Avatar name={client.name} />
                <span className="pora-grow"><strong>{client.name}</strong><em>{client.phone}</em></span>
                <Badge>{client.visits} виз.</Badge>
              </button>
            ))}
          </div>
        ) : null}
        {step === 1 ? (
          <div className="pora-list">
            {state.services.filter((item) => item.active).map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn('pora-list-row', item.id === serviceId && 'is-active')}
                onClick={() => {
                  setServiceId(item.id);
                  setStep(2);
                }}
              >
                <span className="pora-grow"><strong>{item.name}</strong><em>{item.cat} · {item.dur} мин</em></span>
                <strong>{formatMoney(item.price)}</strong>
              </button>
            ))}
          </div>
        ) : null}
        {step === 2 ? (
          <div className="pora-form-grid">
            <Field label="День">
              <select value={day} onChange={(event) => setDay(event.target.value)}>
                <option value="0">Сегодня, 25 мая</option>
                <option value="1">Вторник, 26 мая</option>
                <option value="2">Среда, 27 мая</option>
                <option value="3">Четверг, 28 мая</option>
              </select>
            </Field>
            <Field label="Начало">
              <select value={start} onChange={(event) => setStart(event.target.value)}>
                {['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>
            <label className="pora-field is-wide">
              <span>Заметка</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Комментарий к записи" />
            </label>
          </div>
        ) : null}
        <footer>
          <Button type="button" onClick={step === 0 ? onClose : () => setStep((value) => value - 1)}>
            {step === 0 ? 'Отмена' : 'Назад'}
          </Button>
          {step < 2 ? (
            <Button type="button" kind="primary" onClick={() => setStep((value) => Math.min(2, value + 1))}>Дальше</Button>
          ) : (
            <Button type="submit" icon={Check} kind="primary">Создать</Button>
          )}
        </footer>
      </form>
    </div>
  );
}

function ToastStack({ toasts, dismiss }: { toasts: ToastMessage[]; dismiss: (id: string) => void }) {
  return (
    <div className="pora-toast-stack">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, dismiss }: { toast: ToastMessage; dismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), 3200);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id]);

  return (
    <button type="button" className={cn('pora-toast', `is-${toast.kind}`)} onClick={() => dismiss(toast.id)}>
      <strong>{toast.title}</strong>
      {toast.body ? <span>{toast.body}</span> : null}
    </button>
  );
}

export function DesktopBootScreen() {
  return (
    <div className="pora-app" data-theme="light" data-accent="clay" data-density="default" data-radius="default">
      <div className="pora-boot">
        <span>p</span>
        <div>
          <strong>Пора</strong>
          <em>Открываем рабочий кабинет...</em>
        </div>
      </div>
    </div>
  );
}
