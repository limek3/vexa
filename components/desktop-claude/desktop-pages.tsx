'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Appointment, AppointmentStatus, Client, ClientStatus, DesktopState, Preferences, ScreenId, Service } from './desktop-types';
import {
  accentOptions,
  appointmentStatuses,
  clientStatuses,
  durationLabel,
  formatMoney,
  masterProfile,
  messageTemplates,
  monthDays,
  monthLabel,
  pluralize,
  quickReplies,
  screenLabels,
  timeToMinutes,
  weekLabels,
} from './desktop-data';
import { Avatar, Badge, Button, Card, EmptyState, Field, Icon, Input, Metric, PageHeader, Progress, Segmented, Spark, Switch, Tabs, Textarea, cn } from './desktop-ui';

export type PageProps = {
  state: DesktopState;
  setState: Dispatch<SetStateAction<DesktopState>>;
  go: (screen: ScreenId) => void;
  openCreate: (preset?: Partial<Appointment>) => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

function getClient(clients: Client[], id: string) {
  return clients.find((client) => client.id === id) ?? clients[0];
}

function getService(services: Service[], id: string) {
  return services.find((service) => service.id === id) ?? services[0];
}

function appointmentDuration(appt: Appointment) {
  return timeToMinutes(appt.end) - timeToMinutes(appt.start);
}

function addMinutes(time: string, minutes: number) {
  const total = timeToMinutes(time) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function DashboardPage({ state, setState, go, openCreate }: PageProps) {
  const today = state.appointments.filter((appt) => appt.day === 0);
  const revenue = today.reduce((sum, appt) => sum + getService(state.services, appt.serviceId).price, 0);
  const bookedMinutes = today.reduce((sum, appt) => sum + appointmentDuration(appt), 0);
  const occupancy = Math.round((bookedMinutes / (9 * 60)) * 100);
  const doneTasks = state.tasks.filter((task) => task.done).length;

  const toggleTask = (id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  };

  return (
    <div className="ckd-stack">
      <PageHeader
        title={<>Добрый день, {masterProfile.name.split(' ')[0]} <span className="ckd-serif">· понедельник</span></>}
        subtitle="25 мая · сегодня плотная запись, но есть окна для консультаций и быстрых услуг."
        actions={<><Button variant="secondary" onClick={() => go('analytics')}><Icon name="chart" /> Аналитика</Button><Button variant="primary" onClick={() => openCreate()}><Icon name="plus" /> Новая запись</Button></>}
      />

      <div className="ckd-grid ckd-grid-4">
        <Metric label="Выручка сегодня" value={formatMoney(revenue)} delta="12% к прошлому пн" up />
        <Metric label="Записей" value={today.length} delta="2 новых запроса" up />
        <Metric label="Загрузка дня" value={`${occupancy}%`} delta="6 ч 45 мин занято" up />
        <Metric label="Задачи" value={`${doneTasks}/${state.tasks.length}`} delta="план на неделю" />
      </div>

      <div className="ckd-dashboard-grid">
        <Card className="ckd-hero-card">
          <div className="ckd-hero-copy">
            <Badge kind="accent">Личная страница активна</Badge>
            <h2>Записи, клиенты и сообщения в одном спокойном рабочем месте.</h2>
            <p>Desktop-версия собрана как CRM для одного мастера: быстрые действия, календарь, диалоги, клиенты, услуги и публичная страница записи.</p>
            <div className="ckd-row">
              <Button variant="primary" onClick={() => go('public')}><Icon name="eye" /> Посмотреть страницу</Button>
              <Button variant="secondary" onClick={() => go('appearance')}><Icon name="palette" /> Настроить внешний вид</Button>
            </div>
          </div>
          <div className="ckd-hero-panel">
            <div className="ckd-hero-panel-top"><span>Сегодня</span><b>{monthLabel}</b></div>
            {today.slice(0, 4).map((appt) => {
              const client = getClient(state.clients, appt.clientId);
              const service = getService(state.services, appt.serviceId);
              return (
                <button className="ckd-mini-appt" key={appt.id} onClick={() => go('schedule')}>
                  <span className="ckd-mono">{appt.start}</span>
                  <span><b>{client.name}</b><small>{service.name}</small></span>
                  <Badge kind={appointmentStatuses[appt.status].kind}>{appointmentStatuses[appt.status].label}</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="ckd-card-head"><div><h3 className="ckd-section-title">Быстрые действия</h3><p className="ckd-section-sub">Самое частое — рядом</p></div></div>
          <div className="ckd-actions-grid">
            <button onClick={() => openCreate()}><Icon name="plus" /><span>Создать запись</span></button>
            <button onClick={() => go('clients')}><Icon name="users" /><span>Найти клиента</span></button>
            <button onClick={() => go('chats')}><Icon name="chat" /><span>Ответить в чатах</span></button>
            <button onClick={() => go('services')}><Icon name="services" /><span>Изменить услуги</span></button>
          </div>
          <div className="ckd-divider" />
          <div className="ckd-task-list">
            {state.tasks.map((task) => (
              <button key={task.id} className={cn('ckd-task', task.done && 'done')} onClick={() => toggleTask(task.id)}>
                <span><Icon name={task.done ? 'check' : 'clock'} /></span>
                <b>{task.title}</b>
                <small>{task.due}</small>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="ckd-grid ckd-grid-3">
        <Card><div className="ckd-card-head"><h3 className="ckd-section-title">Конверсия записи</h3><Badge kind="success">+8%</Badge></div><Spark values={[18, 22, 30, 25, 44, 52, 58, 61]} /><p className="ckd-section-sub">Посетители страницы чаще выбирают бесплатную консультацию и затем сложное окрашивание.</p></Card>
        <Card><div className="ckd-card-head"><h3 className="ckd-section-title">Новые клиенты</h3><Badge kind="info">4 за неделю</Badge></div><div className="ckd-avatar-row">{state.clients.slice(3, 9).map((client) => <Avatar key={client.id} name={client.name} />)}</div><p className="ckd-section-sub">Основной источник — рекомендации и публичная страница.</p></Card>
        <Card><div className="ckd-card-head"><h3 className="ckd-section-title">Подписка</h3><Badge kind="accent">Studio</Badge></div><Progress value={68} /><p className="ckd-section-sub">Использовано 68% лимита сообщений и автоматических напоминаний.</p></Card>
      </div>
    </div>
  );
}

export function SchedulePage({ state, openCreate }: PageProps) {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState(state.appointments[0]?.id ?? '');
  const filtered = state.appointments.filter((appt) => status === 'all' || appt.status === status);
  const selected = state.appointments.find((appt) => appt.id === selectedId) ?? state.appointments[0];
  const hours = Array.from({ length: 13 }, (_, index) => index + 8);

  return (
    <div className="ckd-stack">
      <PageHeader
        title="Записи"
        subtitle="Неделя 25–31 мая · календарь, быстрый просмотр и создание записи."
        actions={<><Segmented value={view} items={[{ value: 'week', label: 'Неделя' }, { value: 'day', label: 'День' }]} onChange={setView} /><Button variant="primary" onClick={() => openCreate()}><Icon name="plus" /> Новая запись</Button></>}
      />
      <div className="ckd-calendar-layout">
        <Card className="ckd-calendar-card" flush>
          <div className="ckd-calendar-toolbar">
            <div className="ckd-row"><Button size="icon" variant="ghost"><Icon name="chevron-left" /></Button><b>{monthLabel}</b><Button size="icon" variant="ghost"><Icon name="chevron-right" /></Button></div>
            <Tabs value={status} items={[{ value: 'all', label: 'Все' }, { value: 'new', label: 'Новые' }, { value: 'confirmed', label: 'Подтверждены' }, { value: 'done', label: 'Готово' }]} onChange={setStatus} />
          </div>
          <div className={cn('ckd-calendar', view === 'day' && 'day-view')}>
            <div className="ckd-calendar-head-spacer" />
            {weekLabels.slice(0, view === 'day' ? 1 : 7).map((day, index) => <div key={day} className="ckd-calendar-day-head"><b>{day}</b><span>{monthDays[index]}</span></div>)}
            <div className="ckd-hours">
              {hours.map((hour) => <div key={hour} className="ckd-hour-label">{String(hour).padStart(2, '0')}:00</div>)}
            </div>
            <div className="ckd-calendar-gridlines">{hours.map((hour) => <i key={hour} />)}</div>
            {filtered.filter((appt) => view === 'week' || appt.day === 0).map((appt) => {
              const top = ((timeToMinutes(appt.start) - 8 * 60) / 60) * 56;
              const height = Math.max(34, (appointmentDuration(appt) / 60) * 56 - 6);
              const column = view === 'day' ? 1 : appt.day + 1;
              const client = getClient(state.clients, appt.clientId);
              const service = getService(state.services, appt.serviceId);
              return (
                <button
                  key={appt.id}
                  className={cn('ckd-appt-block', appt.status, selectedId === appt.id && 'selected')}
                  style={{ gridColumn: column + 1, top, height }}
                  onClick={() => setSelectedId(appt.id)}
                >
                  <b>{appt.start} · {client.name}</b>
                  <span>{service.name}</span>
                </button>
              );
            })}
          </div>
        </Card>
        <AppointmentPanel appointment={selected} clients={state.clients} services={state.services} onCreate={openCreate} />
      </div>
    </div>
  );
}

function AppointmentPanel({ appointment, clients, services, onCreate }: { appointment?: Appointment; clients: Client[]; services: Service[]; onCreate: (preset?: Partial<Appointment>) => void }) {
  if (!appointment) return <EmptyState title="Нет записей" text="Создайте первую запись на сегодня." action={<Button variant="primary" onClick={() => onCreate()}><Icon name="plus" /> Создать</Button>} />;
  const client = getClient(clients, appointment.clientId);
  const service = getService(services, appointment.serviceId);
  return (
    <Card className="ckd-side-panel">
      <div className="ckd-card-head"><div><h3 className="ckd-section-title">Детали записи</h3><p className="ckd-section-sub">{weekLabels[appointment.day]}, {appointment.start}–{appointment.end}</p></div><Badge kind={appointmentStatuses[appointment.status].kind}>{appointmentStatuses[appointment.status].label}</Badge></div>
      <div className="ckd-person-row"><Avatar name={client.name} size="lg" /><div><b>{client.name}</b><span>{client.phone}</span></div></div>
      <div className="ckd-detail-list">
        <p><Icon name="services" /> <span>{service.name}</span></p>
        <p><Icon name="clock" /> <span>{durationLabel(appointmentDuration(appointment))}</span></p>
        <p><Icon name="card" /> <span>{formatMoney(service.price)}</span></p>
        <p><Icon name="info" /> <span>{appointment.notes || 'Без заметок'}</span></p>
      </div>
      <div className="ckd-row"><Button variant="secondary"><Icon name="chat" /> Написать</Button><Button variant="soft" onClick={() => onCreate({ clientId: client.id, serviceId: service.id })}><Icon name="copy" /> Повторить</Button></div>
    </Card>
  );
}

export function ChatsPage({ state, setState }: PageProps) {
  const [activeId, setActiveId] = useState(state.chats[0]?.id ?? '');
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const active = state.chats.find((chat) => chat.id === activeId) ?? state.chats[0];
  const activeClient = active ? getClient(state.clients, active.clientId) : state.clients[0];
  const visible = state.chats.filter((chat) => filter === 'all' || (filter === 'unread' && chat.unread > 0) || (filter === 'pinned' && chat.pinned));

  const send = () => {
    const text = draft.trim();
    if (!active || !text) return;
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) => chat.id === active.id ? { ...chat, preview: text, unread: 0, time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), messages: [...chat.messages, { id: `m-${Date.now()}`, from: 'me', text, time: 'сейчас', read: false }] } : chat),
    }));
    setDraft('');
  };

  return (
    <div className="ckd-stack ckd-full-height">
      <PageHeader title="Чаты" subtitle="Сообщения клиентов, быстрые шаблоны и контекст записи." actions={<Tabs value={filter} items={[{ value: 'all', label: 'Все' }, { value: 'unread', label: 'Новые' }, { value: 'pinned', label: 'Важные' }]} onChange={setFilter} />} />
      <div className="ckd-chats">
        <Card className="ckd-chat-list" flush>
          <div className="ckd-searchbox"><Icon name="search" /><Input placeholder="Поиск по клиентам" /></div>
          {visible.map((chat) => {
            const client = getClient(state.clients, chat.clientId);
            return (
              <button key={chat.id} className={cn('ckd-chat-row', activeId === chat.id && 'active')} onClick={() => setActiveId(chat.id)}>
                <Avatar name={client.name} />
                <span><b>{client.name}</b><small>{chat.preview}</small></span>
                <em>{chat.unread ? chat.unread : chat.time}</em>
              </button>
            );
          })}
        </Card>
        <Card className="ckd-chat-main" flush>
          {active ? <>
            <div className="ckd-chat-head"><div className="ckd-person-row"><Avatar name={activeClient.name} /><div><b>{activeClient.name}</b><span>{active.online ? 'онлайн' : active.lastSeen ?? 'не в сети'}</span></div></div><div className="ckd-row"><Button size="icon" variant="ghost"><Icon name="phone" /></Button><Button size="icon" variant="ghost"><Icon name="more" /></Button></div></div>
            <div className="ckd-messages">
              <div className="ckd-date-chip">Сегодня</div>
              {active.messages.map((message) => (
                <div key={message.id} className={cn('ckd-message', message.from)}>
                  {message.type === 'booking' && message.booking ? <div className="ckd-booking-message"><b>Предложение записи</b><span>{message.booking.date} · {message.booking.time}</span><small>{formatMoney(message.booking.price)}</small></div> : message.type === 'voice' ? <div><Icon name="play" /> Голосовое сообщение · {message.dur}</div> : message.type === 'file' ? <div><Icon name="paperclip" /> {message.fileName}</div> : <p>{message.text}</p>}
                  <small>{message.time}</small>
                </div>
              ))}
            </div>
            <div className="ckd-quick-replies">{quickReplies.map((reply) => <button key={reply} onClick={() => setDraft(reply)}>{reply}</button>)}</div>
            <div className="ckd-composer"><Button size="icon" variant="ghost"><Icon name="paperclip" /></Button><Input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') send(); }} placeholder="Сообщение клиенту…" /><Button size="icon" variant="ghost"><Icon name="smile" /></Button><Button variant="primary" onClick={send}><Icon name="send" /></Button></div>
          </> : <EmptyState title="Выберите чат" />}
        </Card>
        <Card className="ckd-client-aside">
          <div className="ckd-person-column"><Avatar name={activeClient.name} size="xl" /><h3>{activeClient.name}</h3><p>{activeClient.phone}</p><Badge kind={clientStatuses[activeClient.status].kind}>{clientStatuses[activeClient.status].label}</Badge></div>
          <div className="ckd-divider" />
          <div className="ckd-detail-list"><p><Icon name="calendar" /> <span>Визитов: {activeClient.visits}</span></p><p><Icon name="clock" /> <span>Последний: {activeClient.last}</span></p><p><Icon name="star" /> <span>Следующий: {activeClient.next}</span></p></div>
          <div className="ckd-template-list">{messageTemplates.slice(0, 3).map((template) => <button key={template.key} onClick={() => setDraft(template.text)}><b>{template.title}</b><small>{template.key}</small></button>)}</div>
        </Card>
      </div>
    </div>
  );
}

export function ClientsPage({ state }: PageProps) {
  const [tab, setTab] = useState<ClientStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(state.clients[0]?.id ?? '');
  const selected = state.clients.find((client) => client.id === selectedId) ?? state.clients[0];
  const visible = state.clients.filter((client) => (tab === 'all' || client.status === tab) && client.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="ckd-stack">
      <PageHeader title="Клиенты" subtitle="База клиентов, заметки, история визитов и быстрые действия." actions={<Button variant="primary"><Icon name="plus" /> Новый клиент</Button>} />
      <div className="ckd-grid ckd-grid-4"><Metric label="Всего клиентов" value={state.clients.length} /><Metric label="VIP" value={state.clients.filter((c) => c.status === 'vip').length} /><Metric label="Новых" value={state.clients.filter((c) => c.status === 'new').length} /><Metric label="Средний чек" value="6 850 ₽" /></div>
      <div className="ckd-clients-layout">
        <Card flush>
          <div className="ckd-list-toolbar"><div className="ckd-searchbox"><Icon name="search" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Имя или телефон" /></div><Tabs value={tab} items={[{ value: 'all', label: 'Все' }, { value: 'vip', label: 'VIP' }, { value: 'regular', label: 'Постоянные' }, { value: 'new', label: 'Новые' }]} onChange={setTab} /></div>
          <table className="ckd-table"><thead><tr><th>Клиент</th><th>Статус</th><th>Визиты</th><th>Последний</th><th>Следующий</th></tr></thead><tbody>{visible.map((client) => <tr key={client.id} className={selectedId === client.id ? 'active' : ''} onClick={() => setSelectedId(client.id)}><td><div className="ckd-person-row"><Avatar name={client.name} /><div><b>{client.name}</b><span>{client.phone}</span></div></div></td><td><Badge kind={clientStatuses[client.status].kind}>{clientStatuses[client.status].label}</Badge></td><td>{client.visits}</td><td>{client.last}</td><td>{client.next}</td></tr>)}</tbody></table>
        </Card>
        <Card className="ckd-side-panel"><div className="ckd-person-column"><Avatar name={selected.name} size="xl" /><h3>{selected.name}</h3><p>{selected.phone}</p><Badge kind={clientStatuses[selected.status].kind}>{clientStatuses[selected.status].label}</Badge></div><div className="ckd-divider" /><div className="ckd-grid ckd-grid-2 compact"><Metric label="Визиты" value={selected.visits} /><Metric label="Следующий" value={selected.next} /></div><Field label="Заметки"><Textarea defaultValue={selected.notes || 'Пока нет заметок'} /></Field><div className="ckd-row"><Button variant="secondary"><Icon name="chat" /> Написать</Button><Button variant="soft"><Icon name="calendar" /> Записать</Button></div></Card>
      </div>
    </div>
  );
}

export function ServicesPage({ state, setState }: PageProps) {
  const [cat, setCat] = useState('Все');
  const [editing, setEditing] = useState<Service | null>(null);
  const cats = ['Все', ...Array.from(new Set(state.services.map((s) => s.cat)))];
  const visible = state.services.filter((service) => cat === 'Все' || service.cat === cat);
  const toggle = (id: string, key: 'active' | 'public') => setState((current) => ({ ...current, services: current.services.map((service) => service.id === id ? { ...service, [key]: !service[key] } : service) }));
  return (
    <div className="ckd-stack">
      <PageHeader title="Услуги" subtitle="Каталог услуг для внутренней CRM и публичной страницы записи." actions={<Button variant="primary"><Icon name="plus" /> Добавить услугу</Button>} />
      <Tabs value={cat} items={cats.map((value) => ({ value, label: value }))} onChange={setCat} />
      <div className="ckd-services-grid">
        {visible.map((service) => <Card key={service.id} hoverable><div className="ckd-card-head"><div><Badge kind="plain">{service.cat}</Badge><h3 className="ckd-service-title">{service.name}</h3></div><Button size="icon" variant="ghost" onClick={() => setEditing(service)}><Icon name="edit" /></Button></div><p className="ckd-section-sub">{service.short || 'Описание можно добавить позже.'}</p><div className="ckd-service-meta"><b>{formatMoney(service.price)}</b><span>{durationLabel(service.dur)}</span></div><div className="ckd-switch-row"><span>Активна</span><Switch checked={service.active} onChange={() => toggle(service.id, 'active')} /></div><div className="ckd-switch-row"><span>На странице записи</span><Switch checked={service.public} onChange={() => toggle(service.id, 'public')} /></div></Card>)}
      </div>
      {editing ? <ServiceEditor service={editing} onClose={() => setEditing(null)} onSave={(next) => { setState((current) => ({ ...current, services: current.services.map((service) => service.id === next.id ? next : service) })); setEditing(null); }} /> : null}
    </div>
  );
}

function ServiceEditor({ service, onClose, onSave }: { service: Service; onClose: () => void; onSave: (service: Service) => void }) {
  const [form, setForm] = useState(service);
  return <div className="ckd-modal-backdrop" onClick={onClose}><div className="ckd-modal" onClick={(e) => e.stopPropagation()}><div className="ckd-modal-head"><h3>Редактировать услугу</h3><Button size="icon" variant="ghost" onClick={onClose}><Icon name="x" /></Button></div><div className="ckd-modal-body"><Field label="Название"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Цена"><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field><Field label="Длительность"><Input type="number" value={form.dur} onChange={(e) => setForm({ ...form, dur: Number(e.target.value) })} /></Field><Field label="Описание"><Textarea value={form.short} onChange={(e) => setForm({ ...form, short: e.target.value })} /></Field></div><div className="ckd-modal-foot"><Button variant="secondary" onClick={onClose}>Отмена</Button><Button variant="primary" onClick={() => onSave(form)}>Сохранить</Button></div></div></div>;
}

export function AnalyticsPage({ state }: PageProps) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const revenue = state.appointments.reduce((sum, appt) => sum + getService(state.services, appt.serviceId).price, 0);
  return (
    <div className="ckd-stack">
      <PageHeader title="Статистика" subtitle="Понятная картина по записям, клиентам, услугам и странице записи." actions={<Segmented value={range} items={[{ value: '7d', label: '7 дней' }, { value: '30d', label: '30 дней' }, { value: '90d', label: '90 дней' }]} onChange={setRange} />} />
      <div className="ckd-grid ckd-grid-4"><Metric label="Выручка" value={formatMoney(revenue)} delta="18%" up /><Metric label="Конверсия" value="14.8%" delta="3.2%" up /><Metric label="Повторные клиенты" value="62%" delta="стабильно" /><Metric label="Средний чек" value="6 850 ₽" delta="9%" up /></div>
      <div className="ckd-analytics-grid"><Card className="ckd-chart-card"><div className="ckd-card-head"><h3 className="ckd-section-title">Динамика записей</h3><Badge kind="accent">{range}</Badge></div><Spark values={[32, 44, 38, 62, 54, 70, 66, 82, 78, 94]} /><div className="ckd-bars">{[42, 58, 50, 74, 68, 86, 76, 92].map((v, i) => <i key={i} style={{ height: `${v}%` }} />)}</div></Card><Card><div className="ckd-card-head"><h3 className="ckd-section-title">Воронка записи</h3></div>{[['Просмотры', 1240], ['Выбор услуги', 486], ['Выбор времени', 318], ['Заявки', 184]].map(([label, value], index) => <div className="ckd-funnel-row" key={label}><span>{label}</span><b>{value}</b><Progress value={100 - index * 22} /></div>)}</Card></div>
      <div className="ckd-grid ckd-grid-3">{state.services.slice(0, 3).map((service, index) => <Card key={service.id}><div className="ckd-card-head"><h3 className="ckd-section-title">{service.name}</h3><Badge kind={index === 0 ? 'accent' : 'plain'}>{formatMoney(service.price)}</Badge></div><Progress value={[86, 64, 52][index]} /><p className="ckd-section-sub">Популярность услуги за выбранный период.</p></Card>)}</div>
    </div>
  );
}

export function PublicPage({ state }: PageProps) {
  const [serviceId, setServiceId] = useState('s1');
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select');
  const service = getService(state.services, serviceId);
  const publicServices = state.services.filter((item) => item.public && item.active);
  return (
    <div className="ckd-public-wrap">
      <PageHeader title="Страница записи" subtitle="Так клиент видит мастера, услуги, свободные слоты и форму записи." actions={<Button variant="secondary"><Icon name="copy" /> Скопировать ссылку</Button>} />
      <div className="ckd-public-page">
        <div className="ckd-public-hero"><div><Badge kind="accent">{masterProfile.rating} · {masterProfile.reviews} отзывов</Badge><h2>{masterProfile.name}</h2><p>{masterProfile.profession}</p><p>{masterProfile.about}</p></div><Avatar name={masterProfile.name} size="xl" /></div>
        <div className="ckd-public-grid"><Card><h3 className="ckd-section-title">Выберите услугу</h3><div className="ckd-public-services">{publicServices.map((item) => <button key={item.id} className={serviceId === item.id ? 'active' : ''} onClick={() => setServiceId(item.id)}><b>{item.name}</b><span>{durationLabel(item.dur)} · {formatMoney(item.price)}</span></button>)}</div></Card><Card><h3 className="ckd-section-title">Время</h3><div className="ckd-slot-grid">{['10:00', '12:30', '15:00', '17:30'].map((time) => <button key={time} className={slot === time ? 'active' : ''} onClick={() => setSlot(time)}>{time}</button>)}</div><div className="ckd-divider" />{step === 'select' ? <Button variant="primary" disabled={!slot} onClick={() => setStep('form')}>Продолжить</Button> : step === 'form' ? <div className="ckd-stack tight"><Field label="Имя"><Input placeholder="Ваше имя" /></Field><Field label="Телефон"><Input placeholder="+7" /></Field><Button variant="primary" onClick={() => setStep('success')}>Записаться</Button></div> : <EmptyState icon="check" title="Заявка отправлена" text={`Услуга: ${service.name}, время: ${slot}`} />}</Card></div>
      </div>
    </div>
  );
}

export function AppearancePage({ state, setPreference }: PageProps) {
  const prefs = state.preferences;
  return (
    <div className="ckd-stack">
      <PageHeader title="Внешний вид" subtitle="Настройки применяются сразу ко всему desktop-интерфейсу и публичной странице." />
      <div className="ckd-settings-grid"><Card><div className="ckd-card-head"><h3 className="ckd-section-title">Тема</h3></div><div className="ckd-option-grid"><button className={prefs.theme === 'light' ? 'active' : ''} onClick={() => setPreference('theme', 'light')}><Icon name="sun" /><b>Светлая</b><span>Мягкая тёплая палитра</span></button><button className={prefs.theme === 'dark' ? 'active' : ''} onClick={() => setPreference('theme', 'dark')}><Icon name="moon" /><b>Тёмная</b><span>Глубокий спокойный режим</span></button></div></Card><Card><div className="ckd-card-head"><h3 className="ckd-section-title">Акцент</h3></div><div className="ckd-accent-grid">{accentOptions.map((accent) => <button key={accent.id} className={prefs.accent === accent.id ? 'active' : ''} data-accent={accent.id} onClick={() => setPreference('accent', accent.id)}><i /><b>{accent.label}</b><span>{accent.description}</span></button>)}</div></Card><Card><div className="ckd-card-head"><h3 className="ckd-section-title">Плотность</h3></div><Segmented value={prefs.density} items={[{ value: 'compact', label: 'Компактно' }, { value: 'default', label: 'Нормально' }, { value: 'cozy', label: 'Свободно' }]} onChange={(value) => setPreference('density', value)} /><div className="ckd-divider" /><div className="ckd-card-head"><h3 className="ckd-section-title">Скругления</h3></div><Segmented value={prefs.radius} items={[{ value: 'sharp', label: 'Строго' }, { value: 'default', label: 'Баланс' }, { value: 'round', label: 'Мягко' }]} onChange={(value) => setPreference('radius', value)} /></Card><PreviewCard /></div>
    </div>
  );
}

function PreviewCard() {
  return <Card className="ckd-preview-card"><div className="ckd-card-head"><h3 className="ckd-section-title">Превью</h3><Badge kind="accent">live</Badge></div><div className="ckd-preview-window"><div><span /><span /><span /></div><Card><h4>Запись клиента</h4><p>Анна Соловьёва · Тонирование</p><Progress value={68} /></Card></div></Card>;
}

export function SubscriptionPage() {
  const [yearly, setYearly] = useState(true);
  return (
    <div className="ckd-stack">
      <PageHeader title="Подписка" subtitle="Тарифы для мастера: запись, чаты, автоматические напоминания и публичная страница." actions={<Segmented value={yearly ? 'year' : 'month'} items={[{ value: 'month', label: 'Месяц' }, { value: 'year', label: 'Год -20%' }]} onChange={(value) => setYearly(value === 'year')} />} />
      <div className="ckd-plans">{[{ name: 'Start', price: yearly ? 790 : 990, current: false, features: ['Публичная страница', 'До 50 записей', 'База клиентов'] }, { name: 'Studio', price: yearly ? 1590 : 1990, current: true, features: ['Безлимитные записи', 'Чаты и шаблоны', 'Аналитика', 'Напоминания'] }, { name: 'Pro', price: yearly ? 3190 : 3990, current: false, features: ['Команда', 'Расширенная аналитика', 'Приоритетная поддержка'] }].map((plan) => <Card key={plan.name} className={cn('ckd-plan', plan.current && 'featured')}><div className="ckd-card-head"><h3>{plan.name}</h3>{plan.current ? <Badge kind="accent">текущий</Badge> : null}</div><div className="ckd-price">{plan.price} ₽<span>/мес</span></div>{plan.features.map((f) => <p key={f}><Icon name="check" /> {f}</p>)}<Button variant={plan.current ? 'secondary' : 'primary'}>{plan.current ? 'Текущий тариф' : 'Выбрать'}</Button></Card>)}</div>
    </div>
  );
}

export function AccountPage() {
  const [tab, setTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  return (
    <div className="ckd-stack">
      <PageHeader title="Настройки аккаунта" subtitle="Профиль мастера, безопасность, уведомления и приватность." />
      <div className="ckd-account-layout"><Card><Tabs value={tab} items={[{ value: 'profile', label: 'Профиль' }, { value: 'security', label: 'Безопасность' }, { value: 'notifications', label: 'Уведомления' }]} onChange={setTab} />{tab === 'profile' ? <div className="ckd-form-grid"><Field label="Имя"><Input defaultValue={masterProfile.name} /></Field><Field label="Профессия"><Input defaultValue={masterProfile.profession} /></Field><Field label="Телефон"><Input defaultValue={masterProfile.phone} /></Field><Field label="Email"><Input defaultValue={masterProfile.email} /></Field><Field label="О себе"><Textarea defaultValue={masterProfile.about} /></Field></div> : tab === 'security' ? <div className="ckd-stack tight"><div className="ckd-switch-row"><span>Двухфакторная защита</span><Switch checked onChange={() => undefined} /></div><div className="ckd-switch-row"><span>Уведомления о входе</span><Switch checked onChange={() => undefined} /></div><Button variant="danger"><Icon name="logout" /> Выйти на всех устройствах</Button></div> : <div className="ckd-stack tight"><div className="ckd-switch-row"><span>Новые записи</span><Switch checked onChange={() => undefined} /></div><div className="ckd-switch-row"><span>Сообщения клиентов</span><Switch checked onChange={() => undefined} /></div><div className="ckd-switch-row"><span>Еженедельный отчёт</span><Switch checked={false} onChange={() => undefined} /></div></div>}<div className="ckd-modal-foot static"><Button variant="secondary">Отменить</Button><Button variant="primary">Сохранить</Button></div></Card><Card className="ckd-side-panel"><Avatar name={masterProfile.name} size="xl" /><h3>{masterProfile.name}</h3><p className="ckd-section-sub">{masterProfile.publicUrl}</p><Badge kind="success">Профиль заполнен на 92%</Badge><Progress value={92} /><Button variant="secondary"><Icon name="eye" /> Открыть страницу</Button></Card></div>
    </div>
  );
}

export function UtilityPage({ screen }: { screen: ScreenId }) {
  return <div className="ckd-stack"><PageHeader title={screenLabels[screen]} subtitle="Раздел сохранён в навигации desktop-приложения. Базовая заглушка не ломает маршрут, пока основной функционал переносится." /><EmptyState icon="sparkle" title="Раздел готов к наполнению" text="Маршрут работает, оболочка и навигация сохранены. Можно перенести сюда логику из сайта или старого desktop-слоя." /></div>;
}

export function renderPage(screen: ScreenId, props: PageProps) {
  switch (screen) {
    case 'dashboard': return <DashboardPage {...props} />;
    case 'schedule': return <SchedulePage {...props} />;
    case 'chats': return <ChatsPage {...props} />;
    case 'clients': return <ClientsPage {...props} />;
    case 'services': return <ServicesPage {...props} />;
    case 'analytics': return <AnalyticsPage {...props} />;
    case 'public': return <PublicPage {...props} />;
    case 'appearance': return <AppearancePage {...props} />;
    case 'subscription': return <SubscriptionPage {...props} />;
    case 'account': return <AccountPage {...props} />;
    default: return <UtilityPage screen={screen} />;
  }
}
