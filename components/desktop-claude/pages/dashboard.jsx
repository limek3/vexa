'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../ui';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../data';

/* Dashboard — главная страница мастера */

export function DashboardPage({ setPage, onCreate }) {
  const todayAppts = APPTS.filter(a => a.day === 0);
  const next = todayAppts[0];
  const occupancy = Math.min(100, Math.round(todayAppts.reduce((s, a) => {
    const [h1, m1] = a.start.split(':').map(Number);
    const [h2, m2] = a.end.split(':').map(Number);
    return s + (h2 * 60 + m2 - h1 * 60 - m1);
  }, 0) / (9 * 60) * 100));

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  const [tasks, setTasks] = useState(TASKS);
  const toggle = (id) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));

  return (
    <div data-screen-label="01 Dashboard">
      {/* Greeting head */}
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {greeting}, {MASTER.name.split(' ')[0]}
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
        <Metric label="Записей сегодня" value={todayAppts.length} delta="+1 ко вчерашнему" deltaKind="up" />
        <Metric label="Доход за день" value="38 400" unit="₽" delta="+12%" deltaKind="up"
                sparkline={<Spark values={[22,28,24,32,30,38,34,40,38]} height={24} />} />
        <Metric label="Просмотры страницы" value="142" delta="+34 за день" deltaKind="up"
                sparkline={<Spark values={[8,12,9,14,18,11,21,17,24]} height={24} />} />
        <Metric label="Новые клиенты" value="2" delta="на этой неделе" />
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
                <Btn size="sm" kind="ghost" onClick={() => setPage('schedule')}>Открыть календарь <Icon name="arrow-up-right" size={11}/></Btn>
              </div>
            </div>
            <DayTimeline appts={todayAppts} />
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
                {CLIENTS.filter(c => c.status === 'new').slice(0, 3).map(c => (
                  <div key={c.id} className="li-row">
                    <Avatar name={c.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {c.next !== '—' ? `Запись ${c.next}` : 'Без записи'}
                      </div>
                    </div>
                    <Badge kind="info" className="plain">Новый</Badge>
                  </div>
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
                <div className="section-sub mono" style={{ marginTop: 1 }}>{MASTER.publicUrl}</div>
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
              {NOTIFICATIONS.slice(0, 4).map((n, i) => (
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

          {/* Insight */}
          <Card style={{
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 6%, var(--surface)), var(--surface))',
            borderColor: 'color-mix(in oklab, var(--accent) 22%, var(--line))',
          }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--accent)', color: 'var(--on-accent)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name="sparkle" size={13} />
              </div>
              <div className="section-title">Подсказка недели</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 10 }}>
              <strong style={{ color: 'var(--text)' }}>78% клиентов</strong>, которым вы напоминали о записи накануне, пришли вовремя. У тех, кому напоминания не отправлялись — только 52%.
            </div>
            <Btn size="sm" kind="soft" icon="bell">Включить автонапоминания</Btn>
          </Card>
        </div>
      </div>
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

/* === DayTimeline component (used on dashboard) === */
const TL_HOUR = 56;
const TL_START_H = 9, TL_END_H = 19;

function DayTimeline({ appts }) {
  const hours = [];
  for (let h = TL_START_H; h <= TL_END_H; h++) hours.push(h);
  const total = (TL_END_H - TL_START_H) * TL_HOUR;

  return (
    <div className="timeline" style={{ minHeight: total + 12 }}>
      {/* hour labels */}
      {hours.map((h, i) => (
        <div key={`l-${h}`} className="tl-hour-label" style={{ top: i * TL_HOUR }}>
          {String(h).padStart(2, '0')}:00
        </div>
      ))}
      {/* grid pane */}
      <div className="tl-grid" style={{ height: total }}>
        {hours.slice(0, -1).map((h, i) => (
          <div key={`g-${h}`} className="tl-hour-line" style={{ top: (i + 1) * TL_HOUR }} />
        ))}
        <DayTimelineNow />
        {appts.map(a => {
          const [h1, m1] = a.start.split(':').map(Number);
          const [h2, m2] = a.end.split(':').map(Number);
          const top = ((h1 - TL_START_H) + m1 / 60) * TL_HOUR;
          const height = ((h2 - h1) + (m2 - m1) / 60) * TL_HOUR;
          const c = CLIENTS.find(c => c.id === a.clientId);
          const sv = SERVICES.find(s => s.id === a.serviceId);
          const st = STATUSES[a.status];
          const compact = height < 52;
          return (
            <div key={a.id}
              className={`tl-appt ${a.status} ${compact ? 'compact' : ''}`}
              style={{ top: top + 3, height: Math.max(28, height - 6) }}
            >
              {compact ? (
                <>
                  <div className="tl-appt-row1">{a.start}–{a.end}</div>
                  <div className="tl-appt-name" style={{ flex: 1, minWidth: 0 }}>{c?.name}</div>
                  <div className="tl-appt-svc" style={{ flexShrink: 0 }}>{sv?.name}</div>
                  <Badge kind={st.kind} className="plain">{st.label}</Badge>
                </>
              ) : (
                <>
                  <div className="tl-appt-row1">
                    <span>{a.start}–{a.end}</span>
                    <span style={{ color: 'var(--text-4)' }}>·</span>
                    <span>{sv?.dur} мин</span>
                    <span style={{ marginLeft: 'auto' }}>
                      <Badge kind={st.kind} className="plain">{st.label}</Badge>
                    </span>
                  </div>
                  <div className="tl-appt-name">{c?.name}</div>
                  <div className="tl-appt-svc">
                    {sv?.name} · {sv?.price ? `${sv.price.toLocaleString('ru-RU')} ₽` : 'бесплатно'}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayTimelineNow() {
  const nowH = 15, nowM = 25;
  if (nowH < TL_START_H || nowH > TL_END_H) return null;
  const top = ((nowH - TL_START_H) + nowM / 60) * TL_HOUR;
  return (
    <div className="tl-now" style={{ top }}>
      <div className="tl-now-dot" />
      <div className="tl-now-line" />
      <div className="tl-now-pill">{String(nowH).padStart(2,'0')}:{String(nowM).padStart(2,'0')}</div>
    </div>
  );
}
