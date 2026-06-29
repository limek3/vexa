import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../desktop-html-data';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../desktop-html-ui';

/* Dashboard — главная страница мастера */

export function DashboardPage({ setPage, onCreate, platform }) {
  const master = platform?.master || MASTER;
  const appointments = platform?.appointments || APPTS;
  const clients = platform?.clients || CLIENTS;
  const services = platform?.services || SERVICES;
  const notifications = platform?.notifications || NOTIFICATIONS;
  const [selectedClient, setSelectedClient] = useState(null);
  const todayAppts = appointments.filter(a => a.day === 0);
  const next = todayAppts[0];
  const occupancy = Math.min(100, Math.round(todayAppts.reduce((s, a) => {
    const [h1, m1] = a.start.split(':').map(Number);
    const [h2, m2] = a.end.split(':').map(Number);
    return s + (h2 * 60 + m2 - h1 * 60 - m1);
  }, 0) / (9 * 60) * 100));

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  const [localTasks, setLocalTasks] = useState(TASKS);
  const tasks = platform?.tasks || localTasks;
  const toggle = (id) => platform?.toggleTask ? platform.toggleTask(id) : setLocalTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const openClientChat = (clientId) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem('clickbook-active-chat-client', clientId);
    }
    setPage('chats');
  };

  return (
    <div data-screen-label="01 Dashboard">
      {/* Greeting head */}
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {greeting}, {master.name.split(' ')[0]}
            <span className="serif" style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 8 }}>·</span>
            <span className="serif" style={{ color: 'var(--text-3)', fontWeight: 400, fontStyle: 'italic', marginLeft: 4 }}>понедельник</span>
          </h1>
          <p className="page-subtitle">
            Сегодня <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{todayAppts.length} {pluralize(todayAppts.length, 'запись', 'записи', 'записей')}</strong>,
            ближайшая — <strong style={{ color: 'var(--text)', fontWeight: 600 }}>в {next.start}</strong>.
            День загружен на {occupancy}%.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="link" kind="secondary" onClick={() => setPage('public')}>Скопировать ссылку</Btn>
          <Btn icon="plus" kind="primary" onClick={onCreate}>Запись</Btn>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <Metric label="Записей сегодня" value={todayAppts.length} delta="+1 ко вчерашнему" deltaKind="up"
                sparkline={<Spark values={[2,3,3,4,5,4,5]} height={24} color="var(--chart-1)" />} />
        <Metric label="Доход за день" value="38 400" unit="₽" delta="+12%" deltaKind="up"
                sparkline={<Spark values={[22,28,24,32,30,38,34,40,38]} height={24} />} />
        <Metric label="Просмотры страницы" value="142" delta="+34 за день" deltaKind="up"
                sparkline={<Spark values={[8,12,9,14,18,11,21,17,24]} height={24} />} />
        <Metric label="Новые клиенты" value="2" delta="на этой неделе"
                sparkline={<Spark values={[0,1,1,1,2,2,2]} height={24} color="var(--info)" />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 18, alignItems: 'flex-start' }}>
        {/* LEFT col */}
        <div className="col" style={{ minWidth: 0 }}>
          {/* Today schedule */}
          <Card>
            <div className="card-head">
              <div>
                <div className="section-title">Сегодня · {todayAppts.length} {pluralize(todayAppts.length, 'запись','записи','записей')}</div>
                <div className="section-sub">с 09:00 до 19:00 · 8 ч 15 мин клиентов</div>
              </div>
              <div className="actions">
                <Btn size="sm" kind="ghost" onClick={() => setPage('calendar')}>Открыть календарь <Icon name="arrow-up-right" size={11}/></Btn>
              </div>
            </div>
            <DayTimeline
              appts={todayAppts}
              clients={clients}
              services={services}
              onClientOpen={setSelectedClient}
              onClientChat={openClientChat}
            />
          </Card>

          {/* Tasks + activity row */}
          <div className="grid-2">
            <Card>
              <div className="card-head">
                <div className="section-title">Задачи · напоминания</div>
                <Btn size="sm" kind="ghost" icon="plus">Добавить</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {tasks.map(t => (
                  <div key={t.id} className="li-row" onClick={() => toggle(t.id)}>
                    <Check on={t.done} />
                    <div style={{ flex: 1, fontSize: 13, color: t.done ? 'var(--text-3)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>
                      {t.title}
                    </div>
                    <span className="badge plain" style={{ background: 'transparent', color: 'var(--text-3)' }}>{t.due}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="card-head">
                <div className="section-title">Новые клиенты</div>
                <Btn size="sm" kind="ghost" onClick={() => setPage('clients')}>Все клиенты <Icon name="arrow-up-right" size={11}/></Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {clients.filter(c => c.status === 'new').slice(0, 3).map(c => (
                  <button key={c.id} type="button" className="li-row" onClick={() => setSelectedClient(c)}>
                    <Avatar name={c.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {c.next !== '—' ? `Запись ${c.next}` : 'Без записи'}
                      </div>
                    </div>
                    <Badge kind="info" className="plain">Новый</Badge>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Performance snapshot */}
          <Card>
            <div className="card-head">
              <div>
                <div className="section-title">Эффективность</div>
                <div className="section-sub">Эта неделя по сравнению с прошлой</div>
              </div>
              <Btn size="sm" kind="ghost" onClick={() => setPage('analytics')}>Подробнее <Icon name="arrow-up-right" size={11}/></Btn>
            </div>
            <div className="grid-4">
              <PerfStat label="Записей" value="34" delta="+4" up
                spark={<Spark values={[14,18,22,19,28,26,34]} height={22}/>} />
              <PerfStat label="Конверсия" value="38%" delta="+3 п.п." up
                spark={<Spark values={[28,30,32,29,34,36,38]} height={22} color="var(--success)"/>} />
              <PerfStat label="Загрузка" value="78%" delta="+8 п.п." up
                spark={<Spark values={[55,62,60,65,72,70,78]} height={22} color="var(--info)"/>} />
              <PerfStat label="Отмены" value="2" delta="−1" up
                spark={<Spark values={[4,5,3,4,3,3,2]} height={22} color="var(--warn)"/>} />
            </div>
          </Card>

          <Card className="dashboard-wide-chart">
            <div className="card-head">
              <div>
                <div className="section-title">Динамика недели</div>
                <div className="section-sub">Записи, доход и просмотры по дням</div>
              </div>
              <div className="dashboard-chart-legend">
                <LegendDot label="Записи" color="var(--chart-1)" />
                <LegendDot label="Доход" color="var(--chart-2)" />
                <LegendDot label="Просмотры" color="var(--chart-3)" />
              </div>
            </div>
            <DashboardWeeklyChart />
          </Card>

          <WeeklyTipWide />
        </div>

        {/* RIGHT col */}
        <div className="col" style={{ minWidth: 0 }}>
          {/* Public page card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center' }}>
                <Icon name="page" size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="section-title">Личная страница</div>
                <div className="section-sub mono" style={{ marginTop: 1 }}>{master.publicUrl}</div>
              </div>
            </div>
            <div className="grid-2" style={{ gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Сегодня</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>34 <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>посетителя</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Конверсия</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>38%</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn size="sm" kind="secondary" icon="eye" onClick={() => setPage('public')} style={{ flex: 1 }}>Открыть</Btn>
              <Btn size="sm" kind="secondary" icon="copy" data-tip="Скопировать ссылку"></Btn>
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <div className="card-head">
              <div className="section-title">Уведомления</div>
              <Badge kind="accent">2 новых</Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.slice(0, 4).map((n, i) => (
                <div key={n.id} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)', display: 'flex', gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-2)' }}>
                    <Icon name={n.icon} size={11} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{n.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick actions */}
          <Card>
            <div className="section-title" style={{ marginBottom: 12 }}>Быстрые действия</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <QuickAction icon="plus"      label="Новая запись"  onClick={onCreate} />
              <QuickAction icon="users"     label="Добавить клиента" onClick={() => setPage('clients')} />
              <QuickAction icon="services"  label="Услуги"        onClick={() => setPage('services')} />
              <QuickAction icon="chart"     label="Аналитика"     onClick={() => setPage('analytics')} />
            </div>
          </Card>

          {/* Calm-day card (if low day) */}
          <Card style={{ background: 'var(--surface-2)', borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="serif" style={{ fontSize: 38, lineHeight: 1, color: 'var(--accent-text)' }}>“</div>
              <div>
                <div className="section-title" style={{ marginBottom: 4 }}>Завтра — спокойный день</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.55 }}>
                  Всего 4 записи и большое окно с 13 до 16. Хороший момент, чтобы записать материал для соц.сетей.
                </div>
              </div>
            </div>
          </Card>

          {/* Mini-calendar */}
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="section-title">Май 2026</div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button className="btn btn-ghost icon" style={{ width: 22, height: 22, padding: 0 }}><Icon name="chevron-left" size={11} /></button>
                <button className="btn btn-ghost icon" style={{ width: 22, height: 22, padding: 0 }}><Icon name="chevron-right" size={11} /></button>
              </div>
            </div>
            <MiniCalendar />
          </Card>

        </div>
      </div>
      {selectedClient && (
        <DashboardClientModal
          client={selectedClient}
          appointments={appointments}
          services={services}
          onClose={() => setSelectedClient(null)}
          onChat={() => openClientChat(selectedClient.id)}
          onCreate={onCreate}
        />
      )}
    </div>
  );
}

function pluralize(n, one, few, many) {
  const m = n % 10, t = n % 100;
  if (m === 1 && t !== 11) return one;
  if (m >= 2 && m <= 4 && (t < 10 || t >= 20)) return few;
  return many;
}

function PerfStat({ label, value, delta, up, spark }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
        <div className="tabular" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>{value}</div>
        <div style={{ fontSize: 11, color: up ? 'var(--success)' : 'var(--danger)' }}>{up && '↑'} {delta}</div>
      </div>
      <div style={{ marginTop: 8 }}>{spark}</div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="quick-action">
      <span className="ic"><Icon name={icon} size={13} /></span>
      <span style={{ fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function DashboardClientModal({ client, appointments = APPTS, services = SERVICES, onClose, onChat, onCreate }) {
  const clientAppointments = appointments
    .filter((item) => item.clientId === client.id)
    .sort((a, b) => a.day - b.day || minutesOf(a.start) - minutesOf(b.start));
  const upcoming = clientAppointments[0];
  const status = clientStatusMeta(client.status);

  return (
    <div className="modal-backdrop dashboard-client-backdrop" onClick={onClose}>
      <div className="modal dashboard-client-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div className="row" style={{ gap: 12, minWidth: 0 }}>
            <Avatar name={client.name} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div className="section-title" style={{ fontSize: 16 }}>{client.name}</div>
              <div className="section-sub mono" style={{ marginTop: 2 }}>{client.phone}</div>
              <div className="dashboard-client-status">
                <Badge kind={status.kind}>{status.label}</Badge>
                <button type="button" className="btn btn-secondary icon" onClick={onChat} data-tip="Открыть чат">
                  <Icon name="chat" size={14} />
                </button>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost icon" onClick={onClose} aria-label="Закрыть">
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="modal-body dashboard-client-body">
          <div className="dashboard-client-stats">
            <MiniClientStat label="Визитов" value={client.visits} />
            <MiniClientStat label="Последний" value={client.last} />
            <MiniClientStat label="Следующая" value={client.next} />
          </div>

          <div className="dashboard-client-block">
            <div className="section-title">Ближайшая запись</div>
            {upcoming ? (
              <div className="dashboard-client-next">
                <div className="dashboard-client-next-time tabular">{upcoming.start}–{upcoming.end}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{serviceName(upcoming, services)}</div>
                  <div className="section-sub">{dayLabel(upcoming.day)} · {servicePrice(upcoming, services)}</div>
                </div>
              </div>
            ) : (
              <div className="section-sub">Пока нет будущей записи.</div>
            )}
          </div>

          <div className="dashboard-client-block">
            <div className="section-title">Заметки</div>
            <div className="dashboard-client-note">
              {client.notes || 'Заметок пока нет. Можно добавить после следующего визита.'}
            </div>
          </div>

          <div className="dashboard-client-block">
            <div className="section-title">История в кабинете</div>
            <div className="dashboard-client-history">
              {clientAppointments.slice(0, 3).map((appt) => (
                <div key={appt.id} className="dashboard-client-history-row">
                  <span>{dayLabel(appt.day)}</span>
                  <strong>{serviceName(appt, services)}</strong>
                  <span className="tabular">{appt.start}</span>
                </div>
              ))}
              {!clientAppointments.length && <div className="section-sub">Истории пока нет.</div>}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Закрыть</button>
          <button type="button" className="btn btn-secondary" onClick={onChat}><Icon name="chat" size={14} /> Чат</button>
          <button type="button" className="btn btn-primary" onClick={onCreate}><Icon name="plus" size={14} /> Запись</button>
        </div>
      </div>
    </div>
  );
}

function MiniClientStat({ label, value }) {
  return (
    <div>
      <div className="section-sub">{label}</div>
      <div className="tabular" style={{ marginTop: 3, fontWeight: 600, fontSize: 17 }}>{value}</div>
    </div>
  );
}

function clientStatusMeta(status) {
  const map = {
    new: { label: 'Новый', kind: 'info' },
    regular: { label: 'Постоянный', kind: 'success' },
    vip: { label: 'VIP', kind: 'warn' },
    inactive: { label: 'Неактивный', kind: '' },
  };
  return map[status] || map.regular;
}

function dayLabel(day) {
  return ['Пн · 25 мая', 'Вт · 26 мая', 'Ср · 27 мая', 'Чт · 28 мая', 'Пт · 29 мая', 'Сб · 30 мая', 'Вс · 31 мая'][day] || 'Май 2026';
}

function serviceName(appt, services) {
  return services.find((item) => item.id === appt.serviceId)?.name || 'Услуга';
}

function servicePrice(appt, services) {
  const price = services.find((item) => item.id === appt.serviceId)?.price || 0;
  return price ? `${price.toLocaleString('ru-RU')} ₽` : 'без оплаты';
}

function LegendDot({ label, color }) {
  return (
    <span className="dashboard-legend-dot">
      <span style={{ background: color }} />
      {label}
    </span>
  );
}

function DashboardChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = [
    { key: 'bookingsPlot', label: 'Записи', value: payload[0]?.payload?.bookings, suffix: '' },
    { key: 'revenuePlot', label: 'Доход', value: payload[0]?.payload?.revenue, suffix: ' ₽' },
    { key: 'views', label: 'Просмотры', value: payload[0]?.payload?.views, suffix: '' },
  ];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {rows.map((row) => {
        const item = payload.find((entry) => entry.dataKey === row.key);
        if (!item) return null;
        return (
        <div className="chart-tooltip-row" key={row.key}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="chart-tooltip-dot" style={{ background: item.color || item.fill }} />
            {row.label}
          </span>
          <strong className="tabular">
            {Number(row.value || 0).toLocaleString('ru-RU')}{row.suffix}
          </strong>
        </div>
      );})}
    </div>
  );
}

function DashboardWeeklyChart() {
  const data = [
    { day: 'Пн', bookings: 5, revenue: 38400, views: 142 },
    { day: 'Вт', bookings: 4, revenue: 31200, views: 126 },
    { day: 'Ср', bookings: 7, revenue: 52200, views: 168 },
    { day: 'Чт', bookings: 6, revenue: 48100, views: 154 },
    { day: 'Пт', bookings: 8, revenue: 64200, views: 188 },
    { day: 'Сб', bookings: 5, revenue: 39800, views: 136 },
    { day: 'Вс', bookings: 2, revenue: 15600, views: 92 },
  ].map((item) => ({
    ...item,
    bookingsPlot: item.bookings * 24,
    revenuePlot: Math.round(item.revenue / 350),
  }));

  return (
    <div className="dashboard-weekly-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="dashboardBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="dashboardViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 7" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={{ stroke: 'var(--line-2)' }} tickLine={false} />
          <YAxis yAxisId="count" width={32} tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="money" orientation="right" hide domain={[0, 70000]} />
          <Tooltip cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }} wrapperStyle={{ outline: 'none' }} content={<DashboardChartTooltip />} />
          <Area yAxisId="count" type="monotone" dataKey="views" stroke="var(--chart-3)" strokeWidth={1.8} fill="url(#dashboardViews)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area yAxisId="money" type="monotone" dataKey="revenuePlot" stroke="var(--chart-2)" strokeWidth={1.8} fill="url(#dashboardRevenue)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area yAxisId="count" type="monotone" dataKey="bookingsPlot" stroke="var(--chart-1)" strokeWidth={2.2} fill="url(#dashboardBookings)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeeklyTipWide() {
  return (
    <Card className="weekly-tip-wide">
      <div className="weekly-tip-icon"><Icon name="sparkle" size={15} /></div>
      <div className="weekly-tip-copy">
        <div className="section-title">Подсказка недели</div>
        <div>
          <strong>78% клиентов</strong>, которым вы напоминали о записи накануне, пришли вовремя.
          У тех, кому напоминания не отправлялись, только 52%. Самое полезное действие сейчас — включить автонапоминания для записей на завтра.
        </div>
      </div>
      <Btn size="sm" kind="soft" icon="bell">Включить автонапоминания</Btn>
    </Card>
  );
}

/* === MiniCalendar (right rail) === */
function MiniCalendar() {
  // May 2026: starts on Friday. Mon=0..Sun=6
  // 1 May is Friday → offset 4 in Mon-first calendar
  const offset = 4;
  const daysInMonth = 31;
  const today = 25;
  const apptDays = new Set([25, 26, 27, 28, 29, 30]);

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {WEEK_LABELS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-4)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          const isToday = d === today;
          const isWeekend = (i % 7) >= 5;
          const has = d && apptDays.has(d);
          return (
            <div key={i} style={{
              aspectRatio: '1 / 1',
              display: 'grid', placeItems: 'center',
              position: 'relative',
              fontSize: 11.5,
              color: !d ? 'transparent' : isToday ? 'var(--on-accent)' : isWeekend ? 'var(--text-4)' : 'var(--text-2)',
              background: isToday ? 'var(--accent)' : 'transparent',
              borderRadius: 999,
              cursor: d ? 'pointer' : 'default',
              fontWeight: isToday ? 600 : 400,
              fontVariantNumeric: 'tabular-nums',
              transition: 'background 120ms',
            }}>
              {d || ''}
              {has && !isToday && (
                <span style={{ position: 'absolute', bottom: 2, width: 3, height: 3, borderRadius: 999, background: 'var(--accent)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* === Today's schedule (compact list) === */
const NOW_H = 15, NOW_M = 25;

function minutesOf(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function DayTimeline({ appts, clients = CLIENTS, services = SERVICES, onClientOpen, onClientChat }) {
  const nowMin = NOW_H * 60 + NOW_M;
  const sorted = [...appts].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
  const nowIndex = sorted.findIndex(a => minutesOf(a.end) > nowMin);
  const nowMarkerAt = nowIndex === -1 ? sorted.length : nowIndex;

  return (
    <div className="day-list">
      {sorted.map((a, i) => {
        const c = clients.find((x) => x.id === a.clientId);
        const sv = services.find((s) => s.id === a.serviceId);
        const st = STATUSES[a.status];
        const dur = minutesOf(a.end) - minutesOf(a.start);
        const past = minutesOf(a.end) <= nowMin;
        const current = minutesOf(a.start) <= nowMin && minutesOf(a.end) > nowMin;
        return (
          <React.Fragment key={a.id}>
            {i === nowMarkerAt && (
              <div className="day-list-now" aria-hidden="true">
                <span className="day-list-now-dot" />
                <span className="day-list-now-label">сейчас · {String(NOW_H).padStart(2,'0')}:{String(NOW_M).padStart(2,'0')}</span>
                <span className="day-list-now-line" />
              </div>
            )}
            <div className={`day-list-row${past ? ' is-past' : ''}${current ? ' is-current' : ''}`} onClick={() => c && onClientOpen?.(c)}>
              <div className="day-list-time">
                <div className="day-list-time-main tabular">{a.start}<span className="day-list-time-dash">–</span>{a.end}</div>
                <div className="day-list-time-sub">{dur} мин</div>
              </div>
              <Avatar name={c?.name} />
              <div className="day-list-info">
                <div className="day-list-name">{c?.name || 'Без клиента'}</div>
                <div className="day-list-svc">
                  {sv?.name || 'Услуга не выбрана'}
                  {sv?.price ? <> <span className="muted">·</span> <span className="tabular">{sv.price.toLocaleString('ru-RU')} ₽</span></> : null}
                </div>
              </div>
              <div className="day-list-status-actions">
                <Badge kind={st.kind} className="plain">{st.label}</Badge>
                <button
                  type="button"
                  className="btn btn-ghost icon day-list-chat"
                  data-tip="Открыть чат"
                  onClick={(event) => {
                    event.stopPropagation();
                    c && onClientChat?.(c.id);
                  }}
                >
                  <Icon name="chat" size={13} />
                </button>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {nowMarkerAt === sorted.length && (
        <div className="day-list-now" aria-hidden="true">
          <span className="day-list-now-dot" />
          <span className="day-list-now-label">все записи на сегодня завершены</span>
          <span className="day-list-now-line" />
        </div>
      )}
    </div>
  );
}
