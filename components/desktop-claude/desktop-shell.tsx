'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEventHandler, ReactNode, RefObject } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { appointmentStatuses, createInitialState, durationLabel, formatMoney, masterProfile, navSections, safeParseDesktopState, screenLabels, screenPaths } from './data';
import { renderPage } from './pages';
import type { Appointment, AppointmentStatus, DesktopState, Preferences, ScreenId } from './types';
import { Avatar, Badge, Button, Field, Icon, Input, cn } from './ui';

const STORAGE_KEY = 'clickbook-desktop-claude-v2';

function getSearchTarget(screen: ScreenId) {
  const labels: Partial<Record<ScreenId, string>> = {
    dashboard: 'Главная', schedule: 'Записи', clients: 'Клиенты', chats: 'Чаты', services: 'Услуги', analytics: 'Статистика', public: 'Страница записи', appearance: 'Внешний вид', subscription: 'Подписка', account: 'Настройки',
  };
  return labels[screen] ?? screenLabels[screen];
}

export function DesktopBootScreen() {
  return (
    <div className="ckd-boot">
      <div className="ckd-brand-mark">к</div>
      <div>
        <b>КликБук</b>
        <span>Desktop workspace</span>
      </div>
    </div>
  );
}

export function DesktopShell({ initialScreen }: { initialScreen: ScreenId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<ScreenId>(initialScreen);
  const [state, setState] = useState<DesktopState>(() => {
    if (typeof window === 'undefined') return createInitialState();
    return safeParseDesktopState(window.localStorage.getItem(STORAGE_KEY)) ?? createInitialState();
  });
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState<Partial<Appointment> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setScreen(initialScreen), [initialScreen]);

  useEffect(() => {
    document.documentElement.dataset.desktopScreen = 'true';
    return () => { delete document.documentElement.dataset.desktopScreen; };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.preferences.theme === 'dark');
  }, [state.preferences.theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === 'n' && document.activeElement instanceof HTMLElement) {
        const tag = document.activeElement.tagName;
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) setCreatePreset({});
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const go = useCallback((nextScreen: ScreenId) => {
    setScreen(nextScreen);
    const query = searchParams.toString();
    router.push(`/desktop/${screenPaths[nextScreen]}${query ? `?${query}` : ''}`);
  }, [router, searchParams]);

  const setPreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setState((current) => ({ ...current, preferences: { ...current.preferences, [key]: value } }));
  }, []);

  const addAppointment = useCallback((appointment: Appointment) => {
    setState((current) => ({ ...current, appointments: [appointment, ...current.appointments] }));
    setToast('Запись создана');
  }, []);

  const page = useMemo(() => renderPage(screen, {
    state,
    setState,
    go,
    openCreate: (preset?: Partial<Appointment>) => setCreatePreset(preset ?? {}),
    setPreference,
  }), [go, screen, setPreference, state]);

  return (
    <div className="ckd-app" data-theme={state.preferences.theme} data-accent={state.preferences.accent} data-density={state.preferences.density} data-radius={state.preferences.radius}>
      <Sidebar screen={screen} go={go} />
      <main className="ckd-main">
        <Topbar screen={screen} search={search} setSearch={setSearch} searchRef={searchRef} onNotif={() => setNotifOpen(true)} onCreate={() => setCreatePreset({})} />
        <div className="ckd-content">{page}</div>
      </main>
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} state={state} />
      <CreateModal open={createPreset !== null} preset={createPreset ?? undefined} state={state} onClose={() => setCreatePreset(null)} onCreate={addAppointment} />
      {toast ? <div className="ckd-toast"><Icon name="check" /> {toast}</div> : null}
    </div>
  );
}

function Sidebar({ screen, go }: { screen: ScreenId; go: (screen: ScreenId) => void }) {
  return (
    <aside className="ckd-sidebar">
      <button className="ckd-brand" onClick={() => go('dashboard')} type="button" aria-label="КликБук">
        <div className="ckd-brand-mark">к</div>
        <div><b>КликБук</b><span>Desktop</span></div>
      </button>
      <nav>
        {navSections.map((section) => (
          <div className="ckd-nav-section" key={section.section}>
            <div className="ckd-nav-label">{section.section}</div>
            {section.items.map((item) => (
              <button key={item.id} className={cn('ckd-nav-item', screen === item.id && 'active')} onClick={() => go(item.id)} type="button">
                <Icon name={item.icon} className="ckd-nav-icon" />
                <span>{item.label}</span>
                {item.count != null ? <em>{item.count}</em> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <button className="ckd-profile-pill" onClick={() => go('account')} type="button">
        <Avatar name={masterProfile.name} />
        <span><b>{masterProfile.name}</b><small>{masterProfile.publicUrl}</small></span>
        <Icon name="chevron-up" />
      </button>
    </aside>
  );
}

function Topbar({ screen, search, setSearch, searchRef, onNotif, onCreate }: { screen: ScreenId; search: string; setSearch: (value: string) => void; searchRef: RefObject<HTMLInputElement | null>; onNotif: () => void; onCreate: () => void }) {
  return (
    <header className="ckd-topbar">
      <div className="ckd-crumbs"><span>Кабинет</span><Icon name="chevron-right" size={12} /><b>{getSearchTarget(screen)}</b></div>
      <div className="ckd-spacer" />
      <div className="ckd-top-search"><Icon name="search" /><Input ref={searchRef} placeholder="Поиск клиентов, записей, услуг…" value={search} onChange={(event) => setSearch(event.target.value)} /><span>⌘K</span></div>
      <Button variant="ghost" size="icon" title="Помощь"><Icon name="help" /></Button>
      <button className="ckd-notify-button" onClick={onNotif} type="button" aria-label="Уведомления"><Icon name="bell" /><i /></button>
      <div className="ckd-top-divider" />
      <Button variant="primary" onClick={onCreate}><Icon name="plus" /> Новая запись</Button>
    </header>
  );
}

function NotificationPanel({ open, onClose, state }: { open: boolean; onClose: () => void; state: DesktopState }) {
  if (!open) return null;
  return (
    <div className="ckd-popover-layer" onClick={onClose}>
      <CardPanel className="ckd-notification-panel" onClick={(event) => event.stopPropagation()}>
        <div className="ckd-popover-head"><b>Уведомления</b><Button variant="ghost" size="sm">Отметить прочитанным</Button></div>
        {state.notifications.map((item) => (
          <div className={cn('ckd-notification-row', item.unread && 'unread')} key={item.id}>
            <span><Icon name={item.icon} /></span>
            <div><b>{item.title}</b><p>{item.body}</p><small>{item.time}</small></div>
            {item.unread ? <i /> : null}
          </div>
        ))}
      </CardPanel>
    </div>
  );
}

function CardPanel({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: MouseEventHandler<HTMLDivElement> }) {
  return <div className={cn('ckd-card', className)} onClick={onClick}>{children}</div>;
}

function CreateModal({ open, preset, state, onClose, onCreate }: { open: boolean; preset?: Partial<Appointment>; state: DesktopState; onClose: () => void; onCreate: (appointment: Appointment) => void }) {
  const [clientId, setClientId] = useState(preset?.clientId ?? state.clients[0]?.id ?? '');
  const [serviceId, setServiceId] = useState(preset?.serviceId ?? state.services[0]?.id ?? '');
  const [date, setDate] = useState('26 мая');
  const [time, setTime] = useState(preset?.start ?? '14:00');
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');

  useEffect(() => {
    if (!open) return;
    setClientId(preset?.clientId ?? state.clients[0]?.id ?? '');
    setServiceId(preset?.serviceId ?? state.services[0]?.id ?? '');
    setTime(preset?.start ?? '14:00');
  }, [open, preset?.clientId, preset?.serviceId, preset?.start, state.clients, state.services]);

  if (!open) return null;
  const service = state.services.find((item) => item.id === serviceId) ?? state.services[0];
  const submit = () => {
    onCreate({
      id: `appt-${Date.now()}`,
      day: date.includes('26') ? 1 : 0,
      start: time,
      end: service ? addMinutes(time, service.dur) : '15:00',
      clientId,
      serviceId,
      status,
      notes: 'Создано из desktop-интерфейса',
    });
    onClose();
  };
  return (
    <div className="ckd-modal-backdrop" onClick={onClose}>
      <div className="ckd-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ckd-modal-head"><div><h3>Новая запись</h3><p>Клиент, услуга и свободное время</p></div><Button variant="ghost" size="icon" onClick={onClose}><Icon name="x" /></Button></div>
        <div className="ckd-modal-body">
          <Field label="Клиент"><select className="ckd-input" value={clientId} onChange={(event) => setClientId(event.target.value)}>{state.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field>
          <Field label="Услуга"><select className="ckd-input" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>{state.services.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} · {durationLabel(item.dur)} · {formatMoney(item.price)}</option>)}</select></Field>
          <div className="ckd-form-row"><Field label="Дата"><select className="ckd-input" value={date} onChange={(event) => setDate(event.target.value)}><option>25 мая</option><option>26 мая</option><option>27 мая</option></select></Field><Field label="Время"><Input value={time} onChange={(event) => setTime(event.target.value)} /></Field></div>
          <Field label="Статус"><select className="ckd-input" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus)}>{Object.entries(appointmentStatuses).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></Field>
        </div>
        <div className="ckd-modal-foot"><Button variant="secondary" onClick={onClose}>Отмена</Button><Button variant="primary" onClick={submit}><Icon name="check" /> Создать запись</Button></div>
      </div>
    </div>
  );
}

function addMinutes(time: string, minutes: number) {
  const [hours = 0, mins = 0] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
