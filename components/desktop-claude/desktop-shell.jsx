'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon, Avatar, Badge, Check } from './ui';
import { MASTER, SERVICES, CLIENTS, NOTIFICATIONS } from './data';
import { DashboardPage } from './pages/dashboard';
import { CalendarPage } from './pages/calendar';
import { ChatsPage } from './pages/chats';
import { ClientsPage } from './pages/clients';
import { ServicesPage } from './pages/services';
import { AnalyticsPage } from './pages/analytics';
import { PublicPage } from './pages/public';
import { AppearancePage } from './pages/appearance';
import { SubscriptionPage } from './pages/subscription';
import { AccountPage } from './pages/account';

const NAV = [
  { section: 'Кабинет', items: [
    { id: 'dashboard',   label: 'Главная',      icon: 'home' },
    { id: 'schedule',    label: 'Записи',       icon: 'calendar', count: 5 },
    { id: 'chats',       label: 'Чаты',         icon: 'chat',     count: 3 },
    { id: 'clients',     label: 'Клиенты',      icon: 'users' },
    { id: 'services',    label: 'Услуги',       icon: 'services' },
    { id: 'analytics',   label: 'Статистика',   icon: 'chart' },
  ]},
  { section: 'Личная страница', items: [
    { id: 'public',      label: 'Страница записи', icon: 'page' },
    { id: 'appearance',  label: 'Внешний вид',   icon: 'palette' },
  ]},
  { section: 'Аккаунт', items: [
    { id: 'subscription',label: 'Подписка',     icon: 'crown' },
    { id: 'account',     label: 'Настройки',    icon: 'gear' },
  ]},
];

const CRUMBS = {
  dashboard: ['Кабинет', 'Главная'],
  schedule: ['Кабинет', 'Записи'],
  chats: ['Кабинет', 'Чаты'],
  clients: ['Кабинет', 'Клиенты'],
  services: ['Кабинет', 'Услуги'],
  analytics: ['Кабинет', 'Статистика'],
  public: ['Личная страница', 'Страница записи'],
  appearance: ['Личная страница', 'Внешний вид'],
  subscription: ['Аккаунт', 'Подписка'],
  account: ['Аккаунт', 'Настройки'],
};

function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">к</div>
        <div>
          <div className="brand-name">КликБук</div>
          <div className="brand-meta">Desktop workspace</div>
        </div>
      </div>

      {NAV.map((sec, i) => (
        <div className="nav-section" key={sec.section} style={{ marginTop: i === 0 ? 0 : 14 }}>
          <div className="nav-section-label">{sec.section}</div>
          {sec.items.map(item => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
              data-screen-label={`Nav: ${item.label}`}
            >
              <Icon name={item.icon} size={15} className="icon" />
              <span>{item.label}</span>
              {item.count != null && <span className="count">{item.count}</span>}
            </div>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="profile-pill">
          <Avatar name={MASTER.name} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="profile-name">{MASTER.name}</div>
            <div className="profile-sub">{MASTER.publicUrl}</div>
          </div>
          <Icon name="chevron-up" size={13} style={{ color: 'var(--text-3)' }} />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ page, setPage, search, setSearch, searchRef, onNotif, onCreate }) {
  const crumbs = CRUMBS[page] || ['КликБук'];
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron-right" size={12} className="crumb-sep" />}
            <span className={i === crumbs.length - 1 ? 'crumb-cur' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="spacer" />
      <div className="input-with-icon" style={{ width: 340, maxWidth: '34vw' }}>
        <Icon name="search" />
        <input ref={searchRef} className="input" placeholder="Поиск клиентов, записей, услуг…" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="kbd">⌘K</span>
      </div>
      <button className="btn btn-ghost icon" data-tip="Помощь · ?"><Icon name="help" size={15} /></button>
      <button className="btn btn-ghost icon" onClick={onNotif} style={{ position: 'relative' }} data-tip="Уведомления">
        <Icon name="bell" size={15} />
        <span className="notif-dot" />
      </button>
      <div style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 2px' }} />
      <button className="btn btn-primary" onClick={onCreate}>
        <Icon name="plus" size={14} /> Новая запись
      </button>
    </header>
  );
}

/* ================== Notification Panel ================== */
function NotifPanel({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', justifyContent: 'flex-end', padding: '70px 24px 24px', background: 'transparent', backdropFilter: 'none' }}>
        <div className="card" onClick={e => e.stopPropagation()} style={{ width: 380, padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title">Уведомления</div>
            <button className="btn btn-ghost sm">Отметить прочитанным</button>
          </div>
          <div>
            {NOTIFICATIONS.map(n => (
              <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, background: n.unread ? 'var(--surface-2)' : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-2)' }}>
                  <Icon name={n.icon} size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{n.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
                </div>
                {n.unread && <div className="dot accent" style={{ marginTop: 6 }} />}
              </div>
            ))}
          </div>
          <div style={{ padding: 12, textAlign: 'center' }}>
            <button className="btn btn-ghost sm">Открыть все уведомления</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================== Quick-Create Modal ================== */
function CreateModal({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [client, setClient] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('26 мая');
  const [time, setTime] = useState('14:00');

  useEffect(() => { if (open) setStep(0); }, [open]);
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="section-title">Новая запись</div>
            <div className="section-sub" style={{ marginTop: 2 }}>Шаг {step + 1} из 3</div>
          </div>
          <button className="btn btn-ghost icon" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 0 && (
            <>
              <div className="field">
                <div className="field-label">Клиент</div>
                <div className="input-with-icon">
                  <Icon name="search" />
                  <input className="input" placeholder="Имя или телефон" value={client} onChange={e => setClient(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>Недавние</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {CLIENTS.slice(0, 4).map(c => (
                    <div key={c.id} className="li-row" onClick={() => { setClient(c.name); setStep(1); }}>
                      <Avatar name={c.name} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.phone}</div>
                      </div>
                      <span className="mono muted">{c.visits} визит.</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-soft" style={{ flex: 1 }}><Icon name="plus" size={13} /> Создать нового клиента</button>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="field">
                <div className="field-label">Услуга</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {SERVICES.filter(s => s.active).slice(0, 6).map(s => (
                    <div key={s.id} className={`li-row ${service === s.id ? 'active' : ''}`} onClick={() => { setService(s.id); setStep(2); }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.dur} мин · {s.price ? `${s.price.toLocaleString('ru-RU')} ₽` : 'бесплатно'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid-2">
                <div className="field">
                  <div className="field-label">Дата</div>
                  <input className="input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="field">
                  <div className="field-label">Время</div>
                  <input className="input" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <div className="field-label">Заметки</div>
                <textarea className="textarea" placeholder="Например: первое посещение, чувствительная кожа головы." />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check on={true} />
                <span style={{ fontSize: 13 }}>Отправить клиенту подтверждение в чат</span>
              </div>
              <div className="card" style={{ background: 'var(--surface-2)', padding: 14 }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Запись</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{client || 'Клиент'} · {SERVICES.find(s => s.id === service)?.name || 'Услуга'}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{date}, {time}</div>
              </div>
            </>
          )}
        </div>
        <div className="modal-foot">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Назад</button>}
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          {step < 2
            ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Далее</button>
            : <button className="btn btn-primary" onClick={onClose}>Записать</button>}
        </div>
      </div>
    </div>
  );
}


/* ================== App root ================== */
const DEFAULT_TWEAKS = {
  theme: 'light',
  accent: 'clay',
  density: 'default',
  radius: 'default',
  showSubscriptionBanner: false,
};

const STORAGE_KEY = 'clickbook-desktop-claude-preferences-v1';

const SCREEN_PATHS = {
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
};

function normalizeScreen(screen) {
  return screen === 'calendar' ? 'schedule' : (SCREEN_PATHS[screen] ? screen : 'dashboard');
}

export function DesktopBootScreen() {
  return (
    <div className="ck-desktop" data-theme="light" data-accent="clay" data-density="default" data-radius="default">
      <div className="app" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div className="brand" style={{ borderBottom: 0, marginBottom: 0 }}>
          <div className="brand-mark">к</div>
          <div>
            <div className="brand-name">КликБук</div>
            <div className="brand-meta">Открываем рабочий кабинет...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DesktopShell({ initialScreen = 'dashboard' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPageState] = useState(() => normalizeScreen(initialScreen));
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tweaks, setTweaks] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_TWEAKS;
    try {
      return { ...DEFAULT_TWEAKS, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch {
      return DEFAULT_TWEAKS;
    }
  });

  const searchInputRef = useRef(null);

  useEffect(() => {
    setPageState(normalizeScreen(initialScreen));
  }, [initialScreen]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tweaks.theme === 'dark');
    document.documentElement.dataset.desktopScreen = 'true';
    return () => {
      document.documentElement.classList.remove('dark');
      delete document.documentElement.dataset.desktopScreen;
    };
  }, [tweaks.theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    }
  }, [tweaks]);

  const setTweak = useCallback((key, value) => {
    setTweaks((current) => ({ ...current, [key]: value }));
  }, []);

  const go = useCallback((nextPage) => {
    const normalized = normalizeScreen(nextPage);
    setPageState(normalized);
    const query = searchParams?.toString?.() || '';
    router.push(`/desktop/${SCREEN_PATHS[normalized]}${query ? `?${query}` : ''}`);
  }, [router, searchParams]);

  // ⌘K opens search; n creates new
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key.toLowerCase() === 'n' && document.activeElement instanceof HTMLElement) {
        const tag = document.activeElement.tagName;
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) setCreateOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage setPage={go} onCreate={() => setCreateOpen(true)} />;
      case 'schedule':  return <CalendarPage onCreate={() => setCreateOpen(true)} />;
      case 'chats':     return <ChatsPage />;
      case 'clients':   return <ClientsPage onCreate={() => setCreateOpen(true)} />;
      case 'services':  return <ServicesPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'public':    return <PublicPage tweaks={tweaks} />;
      case 'appearance':return <AppearancePage tweaks={tweaks} setTweak={setTweak} />;
      case 'subscription': return <SubscriptionPage />;
      case 'account':   return <AccountPage />;
      default: return <DashboardPage setPage={go} onCreate={() => setCreateOpen(true)} />;
    }
  };

  const flush = page === 'public';

  return (
    <div
      className="ck-desktop"
      data-theme={tweaks.theme}
      data-accent={tweaks.accent}
      data-density={tweaks.density}
      data-radius={tweaks.radius}
    >
      <div className="app" data-screen-label={`Page: ${page}`}>
        <Sidebar page={page} setPage={go} />
        <div className="main">
          <Topbar page={page} setPage={go} search={search} setSearch={setSearch}
            searchRef={searchInputRef}
            onNotif={() => setNotifOpen(true)} onCreate={() => setCreateOpen(true)} />
          <main className={`content ${flush ? 'flush wide' : ''}`} key={page}>
            {renderPage()}
          </main>
        </div>
        <NotifPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </div>
  );
}
