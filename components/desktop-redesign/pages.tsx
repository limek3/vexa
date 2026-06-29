'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Filter,
  Link2,
  Mail,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  Star,
  UserPlus,
  X,
} from 'lucide-react';
import {
  appointmentStatuses,
  clientStatuses,
  densityOptions,
  masterProfile,
  messageTemplates,
  monthDays,
  monthLabel,
  quickReplies,
  radiusOptions,
  utilityMeta,
  weekLabels,
} from './data';
import { useDesktop } from './store';
import type { Appointment, AppointmentStatus, Chat, ChatMessage, Client, ClientStatus, ScreenId, Service, UtilityScreenId } from './types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Check as CheckBox,
  EmptyState,
  Field,
  Input,
  Metric,
  PageHeader,
  Progress,
  Segmented,
  Spark,
  Switch,
  Tabs,
  cn,
  durationLabel,
  formatMoney,
  pluralize,
  timeToMinutes,
} from './ui';

const statusFilterItems: Array<{ value: AppointmentStatus | 'all'; label: string; count?: number }> = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'confirmed', label: 'Подтверждены' },
  { value: 'done', label: 'Завершены' },
  { value: 'cancelled', label: 'Отменены' },
];

const emojiPicker = ['❤️', '👍', '🌿', '🙏', '🔥', '👏', '😊', '✨'];
const publicDays = ['Сегодня, 25 мая', 'Вт, 26 мая', 'Ср, 27 мая', 'Чт, 28 мая'];
const publicSlots = ['10:00', '12:30', '15:00', '17:30'];

function getClient(clients: Client[], id: string) {
  return clients.find((client) => client.id === id);
}

function getService(services: Service[], id: string) {
  return services.find((service) => service.id === id);
}

function apptDuration(appointment: Appointment) {
  return timeToMinutes(appointment.end) - timeToMinutes(appointment.start);
}

function addMinutes(time: string, minutes: number) {
  const total = timeToMinutes(time) + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function DashboardPage() {
  const { state, go, openCreate, toggleTask } = useDesktop();
  const todayAppts = state.appointments.filter((appointment) => appointment.day === 0);
  const next = todayAppts[0];
  const minutesBooked = todayAppts.reduce((sum, appointment) => sum + apptDuration(appointment), 0);
  const occupancy = Math.min(100, Math.round((minutesBooked / (9 * 60)) * 100));
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="pora-stack" data-screen-label="01 Dashboard">
      <PageHeader
        title={
          <>
            {greeting}, {masterProfile.name.split(' ')[0]}
            <span className="pora-serif"> · понедельник</span>
          </>
        }
        subtitle={
          <>
            Сегодня <strong>{todayAppts.length} {pluralize(todayAppts.length, 'запись', 'записи', 'записей')}</strong>,
            ближайшая в <strong>{next?.start ?? '—'}</strong>. День загружен на {occupancy}%.
          </>
        }
        actions={
          <>
            <Button icon={Link2} onClick={() => go('public')}>Скопировать ссылку</Button>
            <Button icon={Plus} kind="primary" onClick={() => openCreate({ day: 0 })}>Запись</Button>
          </>
        }
      />

      <div className="pora-grid-4">
        <Metric label="Записей сегодня" value={todayAppts.length} delta="+1 ко вчерашнему" deltaKind="up" />
        <Metric
          label="Доход за день"
          value="38 400"
          unit="₽"
          delta="+12%"
          deltaKind="up"
          sparkline={<Spark values={[22, 28, 24, 32, 30, 38, 34, 40, 38]} />}
        />
        <Metric
          label="Просмотры страницы"
          value="142"
          delta="+34 за день"
          deltaKind="up"
          sparkline={<Spark values={[8, 12, 9, 14, 18, 11, 21, 17, 24]} />}
        />
        <Metric label="Новые клиенты" value="2" delta="на этой неделе" />
      </div>

      <div className="pora-dashboard-grid">
        <div className="pora-stack">
          <Card
            title={`Сегодня · ${todayAppts.length} ${pluralize(todayAppts.length, 'запись', 'записи', 'записей')}`}
            subtitle={`с 09:00 до 19:00 · ${durationLabel(minutesBooked)} клиентов`}
            actions={<Button size="sm" kind="ghost" onClick={() => go('schedule')}>Открыть календарь <ArrowRight size={12} /></Button>}
          >
            <DayTimeline appts={todayAppts} />
          </Card>

          <div className="pora-grid-2">
            <Card title="Задачи · напоминания" actions={<Button size="sm" kind="ghost" icon={Plus}>Добавить</Button>}>
              <div className="pora-list">
                {state.tasks.map((task) => (
                  <div key={task.id} className="pora-list-row">
                    <CheckBox checked={task.done} onChange={() => toggleTask(task.id)} />
                    <button type="button" className="pora-task-button" onClick={() => toggleTask(task.id)}>
                      <span className={cn('pora-task-title', task.done && 'is-done')}>{task.title}</span>
                    </button>
                    <Badge>{task.due}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Новые клиенты" actions={<Button size="sm" kind="ghost" onClick={() => go('clients')}>Все клиенты <ArrowRight size={12} /></Button>}>
              <div className="pora-list">
                {state.clients
                  .filter((client) => client.status === 'new')
                  .slice(0, 3)
                  .map((client) => (
                    <div key={client.id} className="pora-list-row">
                      <Avatar name={client.name} />
                      <span className="pora-grow">
                        <strong>{client.name}</strong>
                        <em>{client.next !== '—' ? `Запись ${client.next}` : 'Без записи'}</em>
                      </span>
                      <Badge tone="info">Новый</Badge>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <Card
            title="Эффективность"
            subtitle="Эта неделя по сравнению с прошлой"
            actions={<Button size="sm" kind="ghost" onClick={() => go('analytics')}>Подробнее <ArrowRight size={12} /></Button>}
          >
            <div className="pora-grid-4">
              <PerfStat label="Записей" value="34" delta="+4" spark={[14, 18, 22, 19, 28, 26, 34]} />
              <PerfStat label="Конверсия" value="38%" delta="+3 п.п." spark={[28, 30, 32, 29, 34, 36, 38]} tone="success" />
              <PerfStat label="Загрузка" value="78%" delta="+8 п.п." spark={[55, 62, 60, 65, 72, 70, 78]} tone="info" />
              <PerfStat label="Отмены" value="2" delta="-1" spark={[4, 5, 3, 4, 3, 3, 2]} tone="warning" />
            </div>
          </Card>
        </div>

        <div className="pora-stack">
          <Card>
            <div className="pora-public-mini">
              <span><GlobeIcon /></span>
              <div>
                <strong>Личная страница</strong>
                <em>{masterProfile.publicUrl}</em>
              </div>
            </div>
            <div className="pora-grid-2 is-tight">
              <MiniStat label="Сегодня" value="34 посетителя" />
              <MiniStat label="Конверсия" value="38%" />
            </div>
            <div className="pora-inline-actions">
              <Button size="sm" icon={Eye} onClick={() => go('public')}>Открыть</Button>
              <Button size="sm" icon={Copy} iconOnly aria-label="Скопировать ссылку" />
            </div>
          </Card>

          <Card title="Уведомления" actions={<Badge tone="accent">2 новых</Badge>}>
            <div className="pora-list">
              {state.notifications.slice(0, 4).map((notification) => {
                const Icon = notification.icon;
                return (
                  <div key={notification.id} className="pora-list-row is-compact">
                    <span className="pora-list-icon"><Icon size={12} /></span>
                    <span className="pora-grow">
                      <strong>{notification.title}</strong>
                      <em>{notification.body}</em>
                    </span>
                    <small>{notification.time}</small>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Быстрые действия">
            <div className="pora-actions-grid">
              <QuickAction icon={Plus} label="Новая запись" onClick={() => openCreate({ day: 0 })} />
              <QuickAction icon={MessageCircle} label="Написать клиенту" onClick={() => go('chats')} />
              <QuickAction icon={UserPlus} label="Добавить клиента" onClick={() => go('clients')} />
              <QuickAction icon={Sparkles} label="Шаблоны" onClick={() => go('templates')} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PerfStat({
  label,
  value,
  delta,
  spark,
  tone = 'accent',
}: {
  label: string;
  value: string;
  delta: string;
  spark: number[];
  tone?: 'accent' | 'success' | 'warning' | 'info';
}) {
  const color = tone === 'success' ? 'var(--p-success)' : tone === 'warning' ? 'var(--p-warn)' : tone === 'info' ? 'var(--p-info)' : 'var(--p-accent)';
  return (
    <div className="pora-perf">
      <span>{label}</span>
      <strong>{value}</strong>
      <em><ArrowUp size={11} /> {delta}</em>
      <Spark values={spark} height={24} color={color} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="pora-mini-stat">
      <em>{label}</em>
      <strong>{value}</strong>
    </span>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button type="button" className="pora-quick-action" onClick={onClick}>
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

function DayTimeline({ appts }: { appts: Appointment[] }) {
  const { state } = useDesktop();
  const startHour = 9;
  const endHour = 19;
  const hourHeight = 52;
  const totalHeight = (endHour - startHour) * hourHeight;

  return (
    <div className="pora-timeline" style={{ '--p-timeline-height': `${totalHeight}px` } as CSSProperties}>
      {Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index).map((hour) => (
        <div key={hour} className="pora-timeline-hour" style={{ top: `${(hour - startHour) * hourHeight}px` }}>
          <time>{String(hour).padStart(2, '0')}:00</time>
        </div>
      ))}
      <div className="pora-now-line" style={{ top: `${((13.2 - startHour) * hourHeight).toFixed(1)}px` }} />
      {appts.map((appointment) => {
        const start = timeToMinutes(appointment.start);
        const end = timeToMinutes(appointment.end);
        const top = ((start - startHour * 60) / 60) * hourHeight;
        const height = ((end - start) / 60) * hourHeight;
        const client = getClient(state.clients, appointment.clientId);
        const service = getService(state.services, appointment.serviceId);
        return (
          <div
            key={appointment.id}
            className={cn('pora-timeline-event', `is-${appointment.status}`)}
            style={{ top: `${top}px`, height: `${height}px` }}
          >
            <time>{appointment.start} – {appointment.end}</time>
            <strong>{client?.name}</strong>
            <span>{service?.name} · {formatMoney(service?.price ?? 0)}</span>
            <Badge tone={appointmentStatuses[appointment.status].tone}>{appointmentStatuses[appointment.status].label}</Badge>
          </div>
        );
      })}
    </div>
  );
}

export function SchedulePage() {
  const { state, openCreate, updateAppointmentStatus } = useDesktop();
  const [view, setView] = useState<'week' | 'day'>('week');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(state.appointments[0]?.id ?? null);
  const filteredAppts = state.appointments.filter((appointment) => statusFilter === 'all' || appointment.status === statusFilter);
  const selectedAppt = filteredAppts.find((appointment) => appointment.id === selectedId) ?? filteredAppts[0];

  const filterItems = statusFilterItems.map((item) => ({
    ...item,
    count: item.value === 'all' ? state.appointments.length : state.appointments.filter((appointment) => appointment.status === item.value).length,
  }));

  return (
    <div className="pora-stack" data-screen-label="02 Calendar">
      <PageHeader
        title="Записи"
        subtitle={`Неделя 25-31 мая · ${filteredAppts.length} записей, загрузка 62%`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              items={[
                { value: 'day', label: 'День' },
                { value: 'week', label: 'Неделя' },
              ]}
            />
            <Button icon={Plus} kind="primary" onClick={() => openCreate({ day: 0 })}>Запись</Button>
          </>
        }
      />

      <div className="pora-toolbar">
        <div className="pora-inline-actions">
          <Button icon={ChevronLeft} iconOnly aria-label="Предыдущая неделя" />
          <Button size="sm">Сегодня</Button>
          <Button icon={ChevronRight} iconOnly aria-label="Следующая неделя" />
          <strong className="pora-serif">{monthLabel}</strong>
        </div>
        <Tabs value={statusFilter} onChange={setStatusFilter} items={filterItems} />
        <Button size="sm" kind="ghost" icon={Filter}>Фильтры</Button>
      </div>

      <div className={cn('pora-schedule-layout', selectedAppt && 'has-panel')}>
        <Card flush>
          {view === 'week' ? (
            <WeekView appts={filteredAppts} selectedId={selectedAppt?.id} onSelect={setSelectedId} />
          ) : (
            <DaySchedule appts={filteredAppts.filter((appointment) => appointment.day === 0)} onSelect={setSelectedId} />
          )}
        </Card>

        {selectedAppt ? (
          <AppointmentPanel
            appointment={selectedAppt}
            onClose={() => setSelectedId(null)}
            onStatus={(status) => updateAppointmentStatus(selectedAppt.id, status)}
          />
        ) : null}
      </div>
    </div>
  );
}

function WeekView({ appts, selectedId, onSelect }: { appts: Appointment[]; selectedId?: string; onSelect: (id: string) => void }) {
  const hours = Array.from({ length: 14 }, (_, index) => 8 + index);
  return (
    <div className="pora-week">
      <div className="pora-week-head">
        <span />
        {weekLabels.map((label, index) => (
          <div key={label} className={index === 0 ? 'is-today' : undefined}>
            <span>{label}</span>
            <strong>{monthDays[index]}</strong>
          </div>
        ))}
      </div>
      <div className="pora-week-grid">
        <div className="pora-hours">
          {hours.map((hour) => <time key={hour}>{hour === 8 ? '' : `${String(hour).padStart(2, '0')}:00`}</time>)}
        </div>
        {weekLabels.map((label, dayIndex) => (
          <div key={label} className={cn('pora-week-day', dayIndex === 6 && 'is-off')}>
            {hours.map((hour) => <span key={hour} />)}
            {dayIndex !== 6 ? <div className="pora-lunch" /> : null}
            {appts
              .filter((appointment) => appointment.day === dayIndex)
              .map((appointment) => (
                <ApptBlock key={appointment.id} appointment={appointment} selected={selectedId === appointment.id} onSelect={() => onSelect(appointment.id)} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DaySchedule({ appts, onSelect }: { appts: Appointment[]; onSelect: (id: string) => void }) {
  return (
    <div className="pora-day-schedule">
      <DayTimeline appts={appts} />
      <div className="pora-day-side">
        {appts.map((appointment) => (
          <button key={appointment.id} type="button" onClick={() => onSelect(appointment.id)}>
            <time>{appointment.start}</time>
            <AppointmentSummary appointment={appointment} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ApptBlock({ appointment, selected, onSelect }: { appointment: Appointment; selected: boolean; onSelect: () => void }) {
  const { state } = useDesktop();
  const top = ((timeToMinutes(appointment.start) - 8 * 60) / 60) * 56;
  const height = Math.max(32, (apptDuration(appointment) / 60) * 56);
  const client = getClient(state.clients, appointment.clientId);
  const service = getService(state.services, appointment.serviceId);

  return (
    <button
      type="button"
      className={cn('pora-appt-block', `is-${appointment.status}`, selected && 'is-selected')}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={onSelect}
    >
      <time>{appointment.start} – {appointment.end}</time>
      <strong>{client?.name}</strong>
      <span>{service?.name}</span>
    </button>
  );
}

function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  const { state } = useDesktop();
  const client = getClient(state.clients, appointment.clientId);
  const service = getService(state.services, appointment.serviceId);
  return (
    <span className="pora-appointment-summary">
      <strong>{client?.name ?? 'Клиент'}</strong>
      <em>{service?.name ?? 'Услуга'} · {durationLabel(apptDuration(appointment))}</em>
    </span>
  );
}

function AppointmentPanel({
  appointment,
  onClose,
  onStatus,
}: {
  appointment: Appointment;
  onClose: () => void;
  onStatus: (status: AppointmentStatus) => void;
}) {
  const { state } = useDesktop();
  const client = getClient(state.clients, appointment.clientId);
  const service = getService(state.services, appointment.serviceId);
  return (
    <Card className="pora-appt-panel">
      <div className="pora-panel-head">
        <div>
          <span>Детали записи</span>
          <strong>{appointment.start} – {appointment.end}</strong>
        </div>
        <Button icon={X} iconOnly kind="ghost" aria-label="Закрыть" onClick={onClose} />
      </div>
      <div className="pora-appt-hero">
        <Avatar name={client?.name ?? 'Клиент'} size="lg" />
        <div>
          <strong>{client?.name}</strong>
          <em>{client?.phone}</em>
        </div>
        <Badge tone={appointmentStatuses[appointment.status].tone}>{appointmentStatuses[appointment.status].label}</Badge>
      </div>
      <dl className="pora-details">
        <div><dt>Услуга</dt><dd>{service?.name}</dd></div>
        <div><dt>Цена</dt><dd>{formatMoney(service?.price ?? 0)}</dd></div>
        <div><dt>Длительность</dt><dd>{durationLabel(service?.dur ?? apptDuration(appointment))}</dd></div>
        <div><dt>Заметка</dt><dd>{appointment.notes || 'Без заметок'}</dd></div>
      </dl>
      <div className="pora-inline-actions">
        <Button size="sm" icon={Check} kind="soft" onClick={() => onStatus('confirmed')}>Подтвердить</Button>
        <Button size="sm" icon={Check} onClick={() => onStatus('done')}>Завершить</Button>
        <Button size="sm" kind="danger" onClick={() => onStatus('cancelled')}>Отменить</Button>
      </div>
    </Card>
  );
}

export function ChatsPage() {
  const { state, setState, sendMessage } = useDesktop();
  const [activeId, setActiveId] = useState(state.chats[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'booking' | 'pinned'>('all');
  const [draft, setDraft] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = state.chats.find((chat) => chat.id === activeId) ?? state.chats[0];
  const activeClient = active ? getClient(state.clients, active.clientId) : null;

  useEffect(() => {
    if (!active) return;
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) => (chat.id === active.id ? { ...chat, unread: 0 } : chat)),
    }));
  }, [active?.id, setState]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.id, active?.messages.length]);

  const filtered = state.chats.filter((chat) => {
    const client = getClient(state.clients, chat.clientId);
    if (!client) return false;
    if (filter === 'unread' && chat.unread === 0) return false;
    if (filter === 'booking' && client.next === '—') return false;
    if (filter === 'pinned' && !chat.pinned) return false;
    if (search && !client.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const submitMessage = (text = draft) => {
    if (!active) return;
    const next = text.trim();
    if (!next) return;
    sendMessage(active.id, next);
    setDraft('');
    setTemplateOpen(false);
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
    if (event.key === '/' && !draft) {
      setTemplateOpen(true);
    }
    if (event.key === 'Escape') {
      setTemplateOpen(false);
      setAttachOpen(false);
      setEmojiOpen(false);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!active) return;
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) => {
        if (chat.id !== active.id) return chat;
        return {
          ...chat,
          messages: chat.messages.map((message) => {
            if (message.id !== messageId) return message;
            const mine = message.reactions?.find((reaction) => reaction.mine && reaction.e === emoji);
            const reactions = (message.reactions ?? []).filter((reaction) => !reaction.mine);
            return { ...message, reactions: mine ? reactions : [...reactions, { e: emoji, mine: true }] };
          }),
        };
      }),
    }));
  };

  const togglePinned = (chatId: string) => {
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) => (chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat)),
    }));
  };

  const totalUnread = state.chats.filter((chat) => chat.unread > 0).length;

  return (
    <div className="pora-chat-page" data-screen-label="04 Chats">
      <section className="pora-chat-list">
        <PageHeader
          title="Чаты"
          subtitle={
            <>
              {state.chats.length} {pluralize(state.chats.length, 'диалог', 'диалога', 'диалогов')}
              {totalUnread ? <> · <strong>{totalUnread} непрочитанных</strong></> : null}
            </>
          }
          actions={<Button size="sm" icon={Sparkles}>Шаблоны</Button>}
        />
        <label className="pora-search">
          <Search size={14} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по диалогам" />
        </label>
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'Все', count: filtered.length },
            { value: 'unread', label: 'Новые', count: state.chats.filter((chat) => chat.unread).length },
            { value: 'pinned', label: 'Закреп.', count: state.chats.filter((chat) => chat.pinned).length },
            { value: 'booking', label: 'С записью' },
          ]}
        />
        <div className="pora-chat-rows">
          {filtered.length ? (
            filtered.map((chat) => (
              <ChatRow
                key={chat.id}
                chat={chat}
                active={chat.id === active?.id}
                onClick={() => setActiveId(chat.id)}
                onPin={() => togglePinned(chat.id)}
              />
            ))
          ) : (
            <EmptyState title="Диалогов нет" text="Попробуйте другой фильтр или поисковый запрос." />
          )}
        </div>
      </section>

      <section className="pora-chat-main">
        {active && activeClient ? (
          <>
            <header className="pora-chat-head">
              <Avatar name={activeClient.name} />
              <div>
                <strong>{activeClient.name}</strong>
                <em>{active.online ? 'онлайн' : active.lastSeen ?? 'не в сети'}</em>
              </div>
              <div className="pora-chat-head-actions">
                <Button icon={Phone} iconOnly kind="ghost" aria-label="Позвонить" />
                <Button icon={Search} iconOnly kind="ghost" aria-label="Поиск" />
                <Button icon={MoreHorizontal} iconOnly kind="ghost" aria-label="Еще" />
              </div>
            </header>
            <div className="pora-pinned-note">
              <Sparkles size={14} />
              <span>Закреплено: запись "{getService(state.services, 's4')?.name}", Чт, 28 мая, 16:00</span>
              <X size={14} />
            </div>
            <div className="pora-chat-tools">
              <Button size="sm" kind="soft" icon={Plus}>Отправить запись</Button>
              <Button size="sm" icon={Calendar}>Предложить время</Button>
              <Button size="sm" icon={FileText}>Прислать услугу</Button>
            </div>
            <div className="pora-message-list" ref={scrollRef}>
              <DateSeparator label="Сегодня · 25 мая" />
              {active.messages.map((message, index) => (
                <MessageBlock
                  key={message.id}
                  message={message}
                  previous={active.messages[index - 1]}
                  onReact={(emoji) => addReaction(message.id, emoji)}
                />
              ))}
            </div>
            <footer className="pora-composer">
              <div className="pora-quick-replies">
                {quickReplies.map((reply) => (
                  <button key={reply} type="button" onClick={() => submitMessage(reply)}>{reply}</button>
                ))}
              </div>
              <div className="pora-composer-box">
                {attachOpen ? (
                  <div className="pora-popover is-attach">
                    <button type="button"><Paperclip size={14} /> Фото или файл</button>
                    <button type="button"><Calendar size={14} /> Запись</button>
                    <button type="button"><CreditCard size={14} /> Ссылка оплаты</button>
                  </div>
                ) : null}
                {emojiOpen ? (
                  <div className="pora-popover is-emoji">
                    {emojiPicker.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setDraft((value) => `${value}${emoji}`)}>{emoji}</button>
                    ))}
                  </div>
                ) : null}
                {templateOpen ? (
                  <div className="pora-popover is-templates">
                    {messageTemplates.map((template) => (
                      <button key={template.key} type="button" onClick={() => setDraft(template.text)}>
                        <strong>{template.title}</strong>
                        <em>{template.key}</em>
                        <span>{template.text}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <Button icon={Paperclip} iconOnly kind="ghost" aria-label="Вложение" onClick={() => setAttachOpen((value) => !value)} />
                <textarea
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setTemplateOpen(event.target.value.startsWith('/'));
                  }}
                  onKeyDown={onComposerKeyDown}
                  placeholder="Напишите сообщение · / для шаблонов"
                />
                <Button icon={Smile} iconOnly kind="ghost" aria-label="Emoji" onClick={() => setEmojiOpen((value) => !value)} />
                <Button icon={Mic} iconOnly kind="ghost" aria-label="Голосовое" />
                <Button icon={Send} iconOnly kind="primary" aria-label="Отправить" onClick={() => submitMessage()} />
              </div>
            </footer>
          </>
        ) : (
          <EmptyState title="Выберите диалог" text="Слева появятся все обращения из подключенных каналов." />
        )}
      </section>

      {activeClient && active ? <ClientAside client={activeClient} chat={active} /> : null}
    </div>
  );
}

function ChatRow({ chat, active, onClick, onPin }: { chat: Chat; active: boolean; onClick: () => void; onPin: () => void }) {
  const { state } = useDesktop();
  const client = getClient(state.clients, chat.clientId);
  if (!client) return null;
  return (
    <div className={cn('pora-chat-row', active && 'is-active')}>
      <button type="button" className="pora-chat-open" onClick={onClick}>
      <Avatar name={client.name} />
      <span className="pora-grow">
        <strong>{client.name}</strong>
        <em>{chat.preview}</em>
      </span>
      <span className="pora-chat-row-meta">
        <small>{chat.time}</small>
        {chat.unread ? <b>{chat.unread}</b> : null}
      </span>
      </button>
      <button
        type="button"
        className={cn('pora-pin', chat.pinned && 'is-active')}
        onClick={onPin}
        aria-label="Закрепить"
      >
        <Star size={12} />
      </button>
    </div>
  );
}

function MessageBlock({
  message,
  previous,
  onReact,
}: {
  message: ChatMessage;
  previous?: ChatMessage;
  onReact: (emoji: string) => void;
}) {
  const { state } = useDesktop();
  const grouped = previous?.from === message.from;
  const service = message.booking ? getService(state.services, message.booking.serviceId) : null;
  return (
    <div className={cn('pora-message', `is-${message.from}`, grouped && 'is-grouped')}>
      <div className="pora-message-bubble">
        {message.type === 'booking' && message.booking ? (
          <div className="pora-booking-message">
            <Calendar size={15} />
            <strong>{service?.name}</strong>
            <span>{message.booking.date}, {message.booking.time} · {durationLabel(message.booking.dur)}</span>
            <em>{formatMoney(message.booking.price)}</em>
          </div>
        ) : message.type === 'voice' ? (
          <div className="pora-voice-message"><Mic size={15} /><span /><strong>{message.dur}</strong></div>
        ) : message.type === 'file' ? (
          <div className="pora-file-message"><FileText size={15} /><strong>{message.fileName}</strong><span>{message.fileSize}</span></div>
        ) : (
          <p>{message.text}</p>
        )}
        <footer>
          <span>{message.time}</span>
          {message.from === 'me' ? <Check size={12} /> : null}
        </footer>
        {message.reactions?.length ? (
          <div className="pora-reactions">
            {message.reactions.map((reaction) => <span key={`${message.id}-${reaction.e}`}>{reaction.e}</span>)}
          </div>
        ) : null}
      </div>
      <div className="pora-message-actions">
        {emojiPicker.slice(0, 4).map((emoji) => (
          <button key={emoji} type="button" onClick={() => onReact(emoji)}>{emoji}</button>
        ))}
      </div>
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="pora-date-sep">
      <span>{label}</span>
    </div>
  );
}

function ClientAside({ client, chat }: { client: Client; chat: Chat }) {
  return (
    <aside className="pora-chat-aside">
      <div className="pora-aside-profile">
        <Avatar name={client.name} size="xl" />
        <strong>{client.name}</strong>
        <em>{client.phone}</em>
        <div className="pora-inline-actions">
          <Badge tone={clientStatuses[client.status].tone}>{clientStatuses[client.status].label}</Badge>
          <Badge>{client.visits} визит</Badge>
        </div>
      </div>
      <div className="pora-grid-4 is-actions">
        <button type="button"><Phone size={15} />Звонок</button>
        <button type="button"><Plus size={15} />Запись</button>
        <button type="button"><CreditCard size={15} />Оплата</button>
        <button type="button"><MoreHorizontal size={15} />Еще</button>
      </div>
      <Card title="Ближайшая запись" className="is-soft">
        <strong>{client.next !== '—' ? client.next : 'Нет записи'}</strong>
        <p>Стрижка · 1 ч 15 мин · 3 800 ₽</p>
        <div className="pora-inline-actions">
          <Button size="sm">Перенести</Button>
          <Button size="sm" kind="ghost">Отменить</Button>
        </div>
      </Card>
      <Card title="Заметки" actions={<Button size="sm" kind="ghost">Добавить</Button>}>
        <p>{client.notes || 'Заметок пока нет. После визита можно сохранить формулу, предпочтения и важные детали.'}</p>
      </Card>
      <Card title="История">
        <div className="pora-list">
          {chat.messages.slice(-3).map((message) => (
            <div key={message.id} className="pora-list-row is-compact">
              <span className="pora-dot" />
              <span className="pora-grow">
                <strong>{message.from === 'me' ? 'Вы' : client.name}</strong>
                <em>{message.text ?? message.type ?? 'Событие'}</em>
              </span>
              <small>{message.time}</small>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}

export function ClientsPage() {
  const { state, openCreate } = useDesktop();
  const [filter, setFilter] = useState<ClientStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(state.clients[0]?.id ?? '');
  const filteredClients = state.clients.filter((client) => {
    if (filter !== 'all' && client.status !== filter) return false;
    if (query && !`${client.name} ${client.phone}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const selected = state.clients.find((client) => client.id === selectedId) ?? filteredClients[0];

  return (
    <div className="pora-stack" data-screen-label="05 Clients">
      <PageHeader
        title="Клиенты"
        subtitle={`${state.clients.length} клиентов · ${state.clients.filter((client) => client.status === 'vip').length} VIP · 7 требуют внимания`}
        actions={<Button icon={UserPlus} kind="primary" onClick={() => openCreate({ day: 0 })}>Добавить клиента</Button>}
      />
      <div className="pora-grid-4">
        <Metric label="Всего клиентов" value={state.clients.length} delta="+12 за месяц" deltaKind="up" />
        <Metric label="Повторные визиты" value="68%" delta="+5 п.п." deltaKind="up" />
        <Metric label="Средний LTV" value="32 600" unit="₽" delta="+8%" deltaKind="up" />
        <Metric label="Клиенты риска" value="7" delta="нужен follow-up" deltaKind="neutral" />
      </div>
      <div className="pora-clients-layout">
        <Card
          title="CRM база"
          subtitle="Фильтры, поиск, статусы и карточка клиента"
          actions={<Button size="sm" icon={Filter}>Фильтры</Button>}
        >
          <div className="pora-table-toolbar">
            <label className="pora-search">
              <Search size={14} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя или телефон" />
            </label>
            <Tabs
              value={filter}
              onChange={setFilter}
              items={[
                { value: 'all', label: 'Все', count: state.clients.length },
                { value: 'vip', label: 'VIP', count: state.clients.filter((client) => client.status === 'vip').length },
                { value: 'regular', label: 'Постоянные' },
                { value: 'new', label: 'Новые' },
                { value: 'inactive', label: 'Остывают' },
              ]}
            />
          </div>
          <div className="pora-client-table">
            <div className="pora-client-table-head">
              <span>Клиент</span>
              <span>Статус</span>
              <span>Визиты</span>
              <span>Последний</span>
              <span>Следующий</span>
            </div>
            {filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                className={client.id === selected?.id ? 'is-active' : undefined}
                onClick={() => setSelectedId(client.id)}
              >
                <span className="pora-client-cell">
                  <Avatar name={client.name} />
                  <span>
                    <strong>{client.name}</strong>
                    <em>{client.phone}</em>
                  </span>
                </span>
                <Badge tone={clientStatuses[client.status].tone}>{clientStatuses[client.status].label}</Badge>
                <span>{client.visits}</span>
                <span>{client.last}</span>
                <span>{client.next}</span>
              </button>
            ))}
          </div>
        </Card>
        {selected ? <ClientPanel client={selected} /> : null}
      </div>
    </div>
  );
}

function ClientPanel({ client }: { client: Client }) {
  return (
    <Card className="pora-client-panel">
      <div className="pora-client-profile">
        <Avatar name={client.name} size="lg" />
        <div>
          <strong>{client.name}</strong>
          <em>{client.phone}</em>
        </div>
        <Badge tone={clientStatuses[client.status].tone}>{clientStatuses[client.status].label}</Badge>
      </div>
      <div className="pora-grid-2 is-tight">
        <MiniStat label="Визитов" value={String(client.visits)} />
        <MiniStat label="Следующий" value={client.next} />
        <MiniStat label="Последний" value={client.last} />
        <MiniStat label="LTV" value={`${(client.visits * 3200).toLocaleString('ru-RU')} ₽`} />
      </div>
      <div className="pora-inline-actions">
        <Button size="sm" icon={MessageCircle}>Написать</Button>
        <Button size="sm" icon={Calendar}>Записать</Button>
      </div>
      <section className="pora-subpanel">
        <header>Заметка</header>
        <p>{client.notes || 'Пока нет заметок: добавьте формулу, аллергию или предпочтения клиента.'}</p>
      </section>
      <section className="pora-subpanel is-soft">
        <header>Следующие шаги</header>
        <ul className="pora-small-list">
          <li>Отправить напоминание за день до визита</li>
          <li>Предложить уход после окрашивания</li>
          <li>Обновить заметку после процедуры</li>
        </ul>
      </section>
    </Card>
  );
}

export function ServicesPage() {
  const { state, updateService } = useDesktop();
  const [filter, setFilter] = useState<'all' | 'active' | 'public'>('all');
  const [editor, setEditor] = useState<Service | null>(null);
  const filtered = state.services.filter((service) => {
    if (filter === 'active') return service.active;
    if (filter === 'public') return service.public;
    return true;
  });

  const toggleField = (service: Service, field: 'active' | 'public') => {
    updateService({ ...service, [field]: !service[field] });
  };

  return (
    <div className="pora-stack" data-screen-label="06 Services">
      <PageHeader
        title="Услуги"
        subtitle="Каталог процедур, цены, длительность и публикация на личной странице"
        actions={<Button icon={Plus} kind="primary" onClick={() => setEditor(state.services[0])}>Новая услуга</Button>}
      />
      <div className="pora-toolbar">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'Все', count: state.services.length },
            { value: 'active', label: 'Активные', count: state.services.filter((service) => service.active).length },
            { value: 'public', label: 'На странице', count: state.services.filter((service) => service.public).length },
          ]}
        />
      </div>
      <div className="pora-service-grid">
        {filtered.map((service) => (
          <ServiceCard key={service.id} service={service} onEdit={() => setEditor(service)} onToggle={toggleField} />
        ))}
      </div>
      {editor ? <ServiceEditor service={editor} onClose={() => setEditor(null)} onSave={updateService} /> : null}
    </div>
  );
}

function ServiceCard({
  service,
  onEdit,
  onToggle,
}: {
  service: Service;
  onEdit: () => void;
  onToggle: (service: Service, field: 'active' | 'public') => void;
}) {
  return (
    <Card className={cn('pora-service-card', !service.active && 'is-muted')}>
      <div className="pora-service-card-head">
        <Badge>{service.cat}</Badge>
        <Button size="sm" kind="ghost" onClick={onEdit}>Изменить</Button>
      </div>
      <strong>{service.name}</strong>
      <p>{service.short || 'Описание пока не заполнено.'}</p>
      <div className="pora-service-meta">
        <span>{durationLabel(service.dur)}</span>
        <span>{formatMoney(service.price)}</span>
      </div>
      <div className="pora-service-switches">
        <label><span>Активна</span><Switch checked={service.active} onChange={() => onToggle(service, 'active')} /></label>
        <label><span>На странице</span><Switch checked={service.public} onChange={() => onToggle(service, 'public')} /></label>
      </div>
    </Card>
  );
}

function ServiceEditor({
  service,
  onClose,
  onSave,
}: {
  service: Service;
  onClose: () => void;
  onSave: (service: Service) => void;
}) {
  const [draft, setDraft] = useState(service);
  return (
    <div className="pora-modal-backdrop" onMouseDown={onClose}>
      <div className="pora-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>Редактор услуги</span>
            <h2>{service.name}</h2>
          </div>
          <Button icon={X} iconOnly kind="ghost" aria-label="Закрыть" onClick={onClose} />
        </header>
        <div className="pora-form-grid">
          <Field label="Название"><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field>
          <Field label="Категория"><Input value={draft.cat} onChange={(event) => setDraft({ ...draft, cat: event.target.value })} /></Field>
          <Field label="Цена"><Input type="number" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} /></Field>
          <Field label="Длительность"><Input type="number" value={draft.dur} onChange={(event) => setDraft({ ...draft, dur: Number(event.target.value) })} /></Field>
          <label className="pora-field is-wide">
            <span>Описание</span>
            <textarea value={draft.short} onChange={(event) => setDraft({ ...draft, short: event.target.value })} />
          </label>
        </div>
        <footer>
          <Button onClick={onClose}>Отмена</Button>
          <Button kind="primary" onClick={() => { onSave(draft); onClose(); }}>Сохранить</Button>
        </footer>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  return (
    <div className="pora-stack" data-screen-label="07 Analytics">
      <PageHeader
        title="Статистика"
        subtitle="Записи, доход, конверсия личной страницы и загрузка недели"
        actions={<Button icon={ArrowDown}>Экспорт</Button>}
      />
      <div className="pora-grid-4">
        <Metric label="Выручка месяца" value="486 200" unit="₽" delta="+18%" deltaKind="up" />
        <Metric label="Записи" value="126" delta="+24 к апрелю" deltaKind="up" />
        <Metric label="Конверсия" value="38%" delta="+3 п.п." deltaKind="up" />
        <Metric label="Средний чек" value="5 486" unit="₽" delta="+8%" deltaKind="up" />
      </div>
      <div className="pora-analytics-grid">
        <Card title="Записи и выручка" subtitle="Последние 14 дней">
          <DualLineChart />
        </Card>
        <Card title="Воронка личной страницы" subtitle="Просмотры → записи">
          <FunnelChart />
        </Card>
        <Card title="Популярные услуги" subtitle="Выручка и спрос">
          <PopularServices />
        </Card>
        <Card title="Тепловая карта" subtitle="Когда клиенты записываются чаще">
          <Heatmap />
        </Card>
      </div>
    </div>
  );
}

function DualLineChart() {
  const visits = [42, 51, 47, 66, 58, 74, 82, 69, 88, 92, 84, 99, 104, 112];
  const bookings = [9, 11, 8, 14, 12, 16, 18, 15, 22, 19, 21, 24, 25, 28];
  const width = 720;
  const height = 250;
  const padding = { left: 36, right: 18, top: 18, bottom: 28 };
  const max = Math.max(...visits);
  const x = (index: number) => padding.left + index * ((width - padding.left - padding.right) / (visits.length - 1));
  const y = (value: number) => height - padding.bottom - (value / max) * (height - padding.top - padding.bottom);
  const path = (values: number[]) => values.map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(' ');
  return (
    <div className="pora-chart">
      <svg viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: 5 }, (_, index) => (
          <line key={index} x1={padding.left} x2={width - padding.right} y1={padding.top + index * 46} y2={padding.top + index * 46} />
        ))}
        <path d={path(visits)} className="is-accent" />
        <path d={path(bookings.map((value) => value * 3.2))} className="is-success" />
      </svg>
      <div className="pora-legend">
        <span><i className="is-accent" /> Просмотры</span>
        <span><i className="is-success" /> Записи</span>
      </div>
    </div>
  );
}

function FunnelChart() {
  const rows = [
    ['Просмотры страницы', 142, 100],
    ['Выбрали услугу', 86, 61],
    ['Выбрали время', 64, 45],
    ['Оставили контакт', 54, 38],
  ] as const;
  return (
    <div className="pora-funnel">
      {rows.map(([label, value, pct]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <Progress value={pct} />
          <em>{pct}%</em>
        </div>
      ))}
    </div>
  );
}

function PopularServices() {
  const { state } = useDesktop();
  return (
    <div className="pora-list">
      {state.services.slice(0, 6).map((service, index) => (
        <div key={service.id} className="pora-list-row">
          <Badge tone={index < 2 ? 'accent' : 'neutral'}>{index + 1}</Badge>
          <span className="pora-grow">
            <strong>{service.name}</strong>
            <em>{service.cat} · {durationLabel(service.dur)}</em>
          </span>
          <strong>{formatMoney(service.price)}</strong>
        </div>
      ))}
    </div>
  );
}

function Heatmap() {
  const values = [24, 30, 34, 40, 36, 20, 8, 30, 38, 45, 52, 47, 28, 10, 18, 24, 34, 42, 44, 22, 6, 14, 18, 28, 36, 30, 16, 5];
  return (
    <div className="pora-heatmap">
      {values.map((value, index) => (
        <span key={index} style={{ '--p-heat': `${value}%` } as CSSProperties}>
          <em>{value}</em>
        </span>
      ))}
    </div>
  );
}

export function PublicPage() {
  const { state, addAppointment, notify } = useDesktop();
  const visibleServices = state.services.filter((service) => service.public && service.active);
  const [serviceId, setServiceId] = useState(visibleServices[0]?.id ?? '');
  const [day, setDay] = useState(publicDays[1]);
  const [slot, setSlot] = useState(publicSlots[2]);
  const [name, setName] = useState('');
  const service = visibleServices.find((item) => item.id === serviceId) ?? visibleServices[0];

  const book = () => {
    if (!service) return;
    addAppointment({
      id: `pub-${Date.now()}`,
      day: Math.max(0, publicDays.indexOf(day)),
      start: slot,
      end: addMinutes(slot, service.dur),
      clientId: 'c12',
      serviceId: service.id,
      status: 'new',
      notes: name ? `Заявка с публичной страницы: ${name}` : 'Заявка с публичной страницы.',
    });
    notify('Заявка добавлена', `${service.name}, ${day}, ${slot}`, 'success');
  };

  return (
    <div className="pora-public-page" data-screen-label="08 Public page">
      <section className="pora-public-hero">
        <div>
          <Avatar name={masterProfile.name} size="xl" />
          <Badge tone="accent">{masterProfile.rating} · {masterProfile.reviews} отзывов</Badge>
        </div>
        <h1>{masterProfile.name}</h1>
        <p>{masterProfile.profession}</p>
        <span>{masterProfile.city} · {masterProfile.studio}</span>
      </section>
      <div className="pora-public-layout">
        <div className="pora-stack">
          <Card title="О мастере">
            <p>{masterProfile.about}</p>
          </Card>
          <Card title="Услуги">
            <div className="pora-public-services">
              {visibleServices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === service?.id ? 'is-active' : undefined}
                  onClick={() => setServiceId(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>{durationLabel(item.dur)} · {formatMoney(item.price)}</span>
                  <em>{item.short}</em>
                </button>
              ))}
            </div>
          </Card>
          <Card title="Отзывы">
            <div className="pora-review-grid">
              {['Очень спокойно и профессионально.', 'Цвет получился ровно как хотела.', 'Записалась через страницу за минуту.'].map((review) => (
                <blockquote key={review}><Star size={14} /> {review}</blockquote>
              ))}
            </div>
          </Card>
        </div>
        <Card title="Записаться" subtitle="Выберите услугу, день и время" className="pora-booking-widget">
          <Field label="Услуга">
            <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {visibleServices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="День">
            <Segmented value={day} onChange={setDay} items={publicDays.map((item) => ({ value: item, label: item.replace(', ', '\n') }))} />
          </Field>
          <Field label="Время">
            <div className="pora-slot-grid">
              {publicSlots.map((item) => (
                <button key={item} type="button" className={item === slot ? 'is-active' : undefined} onClick={() => setSlot(item)}>{item}</button>
              ))}
            </div>
          </Field>
          <Field label="Имя клиента">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, Софья" />
          </Field>
          <div className="pora-booking-summary">
            <span><strong>{service?.name}</strong><em>{day}, {slot}</em></span>
            <strong>{formatMoney(service?.price ?? 0)}</strong>
          </div>
          <Button kind="primary" icon={Calendar} onClick={book}>Отправить заявку</Button>
        </Card>
      </div>
    </div>
  );
}

export function AppearancePage() {
  const { state, setPreference } = useDesktop();
  const { preferences } = state;
  const themes: Array<{ value: 'light' | 'dark'; label: string; text: string }> = [
    { value: 'light', label: 'Светлая', text: 'Теплый бумажный фон и мягкие карточки.' },
    { value: 'dark', label: 'Темная', text: 'Контрастный режим для вечерней работы.' },
  ];
  const accents: Array<{ value: typeof preferences.accent; label: string }> = [
    { value: 'clay', label: 'Глина' },
    { value: 'sage', label: 'Шалфей' },
    { value: 'indigo', label: 'Индиго' },
    { value: 'plum', label: 'Слива' },
    { value: 'amber', label: 'Янтарь' },
  ];

  return (
    <div className="pora-stack" data-screen-label="09 Appearance">
      <PageHeader title="Внешний вид" subtitle="Тема, акцент, плотность и скругления применяются ко всему desktop-приложению." />
      <div className="pora-settings-layout">
        <div className="pora-stack">
          <Card title="Тема">
            <div className="pora-choice-grid">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  className={preferences.theme === theme.value ? 'is-active' : undefined}
                  onClick={() => setPreference('theme', theme.value)}
                >
                  <strong>{theme.label}</strong>
                  <span>{theme.text}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card title="Акцент">
            <div className="pora-swatch-grid">
              {accents.map((accent) => (
                <button
                  key={accent.value}
                  type="button"
                  className={cn(`is-${accent.value}`, preferences.accent === accent.value && 'is-active')}
                  onClick={() => setPreference('accent', accent.value)}
                >
                  <span />
                  <strong>{accent.label}</strong>
                </button>
              ))}
            </div>
          </Card>
          <Card title="Плотность и радиусы">
            <div className="pora-grid-2">
              <Field label="Плотность">
                <Segmented value={preferences.density} onChange={(value) => setPreference('density', value)} items={densityOptions} />
              </Field>
              <Field label="Скругления">
                <Segmented value={preferences.radius} onChange={(value) => setPreference('radius', value)} items={radiusOptions} />
              </Field>
            </div>
          </Card>
          <Card title="Дополнительно">
            <ToggleRow label="Показывать компактные подсказки" sub="Всплывающие подсказки на icon-only кнопках" defaultOn />
            <ToggleRow label="Подчеркивать новые события" sub="Акцентные точки в уведомлениях и чатах" defaultOn />
            <ToggleRow label="Уменьшить анимации" sub="Для более строгого desktop-ритма" />
          </Card>
        </div>
        <Card title="Предпросмотр" className="pora-preview-card">
          <PreviewMini />
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, defaultOn = false }: { label: string; sub: string; defaultOn?: boolean }) {
  const [checked, setChecked] = useState(defaultOn);
  return (
    <div className="pora-toggle-row">
      <span>
        <strong>{label}</strong>
        <em>{sub}</em>
      </span>
      <Switch checked={checked} onChange={setChecked} />
    </div>
  );
}

function PreviewMini() {
  return (
    <div className="pora-preview-mini">
      <div className="pora-preview-side">
        <span />
        <i />
        <i />
        <i />
      </div>
      <div className="pora-preview-main">
        <header><span /><button /></header>
        <div className="pora-preview-kpis"><span /><span /><span /></div>
        <section><strong /><em /><em /></section>
      </div>
    </div>
  );
}

export function SubscriptionPage() {
  return (
    <div className="pora-stack" data-screen-label="10 Subscription">
      <PageHeader
        title="Подписка"
        subtitle="Текущий тариф Pro активен до 25 июня 2026."
        actions={<Button icon={CreditCard} kind="primary">Управлять оплатой</Button>}
      />
      <div className="pora-subscription-hero">
        <div>
          <Badge tone="accent">Pro</Badge>
          <h2>Все каналы и автоматизация включены</h2>
          <p>Чаты, личная страница, онлайн-запись, платежи, аналитика и AI-подсказки в одном рабочем месте.</p>
        </div>
        <strong>2 990 ₽<span>/мес</span></strong>
      </div>
      <div className="pora-plan-grid">
        {[
          ['Start', '0 ₽', 'Для проверки личной страницы и базовой записи.'],
          ['Pro', '2 990 ₽', 'Рабочий тариф для мастера: чаты, аналитика, шаблоны.', 'active'],
          ['Studio', '7 990 ₽', 'Команда, роли, несколько мастеров и расширенные лимиты.'],
        ].map(([title, price, text, active]) => (
          <Card key={title} className={active ? 'is-selected' : undefined}>
            <Badge tone={active ? 'accent' : 'neutral'}>{title}</Badge>
            <h3 className="pora-plan-price">{price}</h3>
            <p>{text}</p>
            <Button kind={active ? 'primary' : 'secondary'}>{active ? 'Текущий тариф' : 'Выбрать'}</Button>
          </Card>
        ))}
      </div>
      <Card title="Использование">
        <div className="pora-usage-grid">
          <Usage label="Сообщения" value={74} text="3 720 из 5 000" />
          <Usage label="AI-ответы" value={41} text="410 из 1 000" />
          <Usage label="Публичная страница" value={18} text="142 просмотра сегодня" />
          <Usage label="Хранилище" value={28} text="1.4 ГБ из 5 ГБ" />
        </div>
      </Card>
    </div>
  );
}

function Usage({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="pora-usage">
      <span><strong>{label}</strong><em>{text}</em></span>
      <Progress value={value} />
      <b>{value}%</b>
    </div>
  );
}

export function AccountPage() {
  const { state, setPreference } = useDesktop();
  const [profile, setProfile] = useState({
    name: masterProfile.name,
    phone: masterProfile.phone,
    email: masterProfile.email,
    studio: masterProfile.studio,
    about: masterProfile.about,
  });

  return (
    <div className="pora-stack" data-screen-label="11 Account">
      <PageHeader title="Настройки аккаунта" subtitle="Профиль мастера, безопасность, язык и уведомления." actions={<Button kind="primary">Сохранить</Button>} />
      <div className="pora-settings-layout">
        <div className="pora-stack">
          <Card title="Профиль">
            <div className="pora-account-hero">
              <Avatar name={profile.name} size="lg" />
              <div>
                <strong>{profile.name}</strong>
                <em>{masterProfile.publicUrl}</em>
              </div>
              <Button size="sm">Обновить фото</Button>
            </div>
            <div className="pora-form-grid">
              <Field label="Имя"><Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></Field>
              <Field label="Телефон"><Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></Field>
              <Field label="Email"><Input value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></Field>
              <Field label="Студия"><Input value={profile.studio} onChange={(event) => setProfile({ ...profile, studio: event.target.value })} /></Field>
              <label className="pora-field is-wide">
                <span>Описание</span>
                <textarea value={profile.about} onChange={(event) => setProfile({ ...profile, about: event.target.value })} />
              </label>
            </div>
          </Card>
          <Card title="Безопасность">
            <ToggleRow label="Двухфакторная защита" sub="Код при входе с нового устройства" />
            <ToggleRow label="Показывать активные сессии" sub="Видно браузеры и desktop-клиенты" defaultOn />
          </Card>
        </div>
        <div className="pora-stack">
          <Card title="Язык">
            <Segmented
              value={state.preferences.language}
              onChange={(value) => setPreference('language', value)}
              items={[
                { value: 'ru', label: 'RU' },
                { value: 'en', label: 'EN' },
              ]}
            />
          </Card>
          <Card title="Уведомления">
            <ToggleRow label="Новые записи" sub="Push и email" defaultOn />
            <ToggleRow label="Сообщения клиентов" sub="Сигнал, если нет ответа 10 минут" defaultOn />
            <ToggleRow label="Платежи" sub="Оплаты, возвраты и чеки" defaultOn />
          </Card>
          <Card title="Контакты">
            <div className="pora-list">
              <div className="pora-list-row"><Phone size={15} /> <span>{profile.phone}</span></div>
              <div className="pora-list-row"><Mail size={15} /> <span>{profile.email}</span></div>
              <div className="pora-list-row"><Link2 size={15} /> <span>{masterProfile.publicUrl}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function UtilityPage({ screen }: { screen: UtilityScreenId }) {
  const meta = utilityMeta[screen];
  const Icon = meta.icon;
  return (
    <div className="pora-stack">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.text}
        actions={<Button icon={Icon} kind="primary">Открыть действие</Button>}
      />
      <div className="pora-grid-3">
        {meta.cards.map((card) => (
          <Card key={card.title}>
            <div className="pora-utility-card">
              <Icon size={18} />
              <span>
                <strong>{card.value}</strong>
                <em>{card.title}</em>
              </span>
              <p>{card.text}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Рабочее состояние" subtitle="Раздел подключен к новому desktop shell и не использует старый интерфейс">
        <div className="pora-empty-row">
          <Sparkles size={18} />
          <span>Полная бизнес-логика для этого раздела может быть подключена поверх новой дизайн-системы без визуального конфликта.</span>
        </div>
      </Card>
    </div>
  );
}

export function renderDesktopPage(screen: ScreenId) {
  switch (screen) {
    case 'dashboard':
      return <DashboardPage />;
    case 'schedule':
      return <SchedulePage />;
    case 'chats':
      return <ChatsPage />;
    case 'clients':
      return <ClientsPage />;
    case 'services':
      return <ServicesPage />;
    case 'analytics':
      return <AnalyticsPage />;
    case 'public':
      return <PublicPage />;
    case 'appearance':
      return <AppearancePage />;
    case 'subscription':
      return <SubscriptionPage />;
    case 'account':
      return <AccountPage />;
    default:
      return <UtilityPage screen={screen as UtilityScreenId} />;
  }
}

function GlobeIcon() {
  return <span className="pora-globe-icon">p</span>;
}
