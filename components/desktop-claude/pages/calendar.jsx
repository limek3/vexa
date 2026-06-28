'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../ui';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../data';

/* Calendar / Записи page */

export function CalendarPage({ onCreate }) {
  const [view, setView] = useState('week');   // day | week
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0); // unused, demo

  const filteredAppts = APPTS.filter(a => statusFilter === 'all' || a.status === statusFilter);

  const statusOptions = [
    { value: 'all', label: 'Все', count: APPTS.length },
    { value: 'new', label: 'Новые', count: APPTS.filter(a => a.status === 'new').length },
    { value: 'confirmed', label: 'Подтверждены', count: APPTS.filter(a => a.status === 'confirmed').length },
    { value: 'done', label: 'Завершены', count: 0 },
    { value: 'cancelled', label: 'Отменены', count: 0 },
  ];

  return (
    <div data-screen-label="02 Calendar">
      <div className="page-head">
        <div>
          <h1 className="page-title">Записи</h1>
          <p className="page-subtitle">Неделя 25 — 31 мая · {filteredAppts.length} записей, загрузка 62%</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="seg">
            <button className={`seg-btn ${view === 'day' ? 'active' : ''}`} onClick={() => setView('day')}>День</button>
            <button className={`seg-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Неделя</button>
          </div>
          <Btn icon="plus" kind="primary" onClick={onCreate}>Запись</Btn>
        </div>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Btn size="sm" kind="ghost" icon="chevron-left"></Btn>
          <Btn size="sm" kind="secondary">Сегодня</Btn>
          <Btn size="sm" kind="ghost" icon="chevron-right"></Btn>
          <div className="serif" style={{ fontSize: 18, marginLeft: 8, color: 'var(--text-2)' }}>Май 2026</div>
        </div>
        <div className="divider v" style={{ height: 22 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {statusOptions.map(o => (
            <button key={o.value} className={`chip ${statusFilter === o.value ? 'active' : ''}`} onClick={() => setStatusFilter(o.value)}>
              {o.label} <span style={{ opacity: 0.6, marginLeft: 2 }}>{o.count}</span>
            </button>
          ))}
        </div>
        <div className="spacer" />
        <Btn size="sm" kind="ghost" icon="filter">Фильтры</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAppt ? '1fr 360px' : '1fr', gap: 16, alignItems: 'flex-start' }}>
        <Card flush>
          {view === 'week'
            ? <WeekView appts={filteredAppts} onSelect={setSelectedAppt} selectedId={selectedAppt?.id} />
            : <DayView appts={filteredAppts.filter(a => a.day === 0)} onSelect={setSelectedAppt} />}
        </Card>

        {selectedAppt && (
          <AppointmentPanel appt={selectedAppt} onClose={() => setSelectedAppt(null)} />
        )}
      </div>
    </div>
  );
}

const HOUR_HEIGHT = 56; // px per hour
const START_H = 8, END_H = 21;

function WeekView({ appts, onSelect, selectedId }) {
  // 7 day columns + hour rail
  const days = [
    { num: 25, label: 'Пн', today: true },
    { num: 26, label: 'Вт' },
    { num: 27, label: 'Ср' },
    { num: 28, label: 'Чт' },
    { num: 29, label: 'Пт' },
    { num: 30, label: 'Сб' },
    { num: 31, label: 'Вс', off: true },
  ];

  const hours = [];
  for (let h = START_H; h <= END_H; h++) hours.push(h);

  return (
    <div>
      {/* Days header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '52px repeat(7, 1fr)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky', top: 'var(--topbar-h)', background: 'var(--surface)', zIndex: 2,
      }}>
        <div></div>
        {days.map((d, i) => (
          <div key={i} style={{
            padding: '10px 8px',
            borderLeft: '1px solid var(--line)',
            opacity: d.off ? 0.55 : 1,
            display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
            <div style={{
              fontSize: 16, fontWeight: 600,
              ...(d.today ? {
                color: 'var(--on-accent)', background: 'var(--accent)',
                width: 22, height: 22, borderRadius: 999,
                display: 'inline-grid', placeItems: 'center', fontSize: 12,
              } : {})
            }}>{d.num}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '52px repeat(7, 1fr)',
        position: 'relative',
        minHeight: hours.length * HOUR_HEIGHT,
      }}>
        {/* Hour rail */}
        <div>
          {hours.map((h, i) => (
            <div key={h} style={{ height: HOUR_HEIGHT, paddingRight: 8, textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-4)', position: 'relative', top: -6 }}>
                {i === 0 ? '' : `${String(h).padStart(2,'0')}:00`}
              </div>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d, dayIdx) => (
          <div key={dayIdx} style={{
            borderLeft: '1px solid var(--line)',
            position: 'relative',
            background: d.off ? 'repeating-linear-gradient(135deg, transparent 0 8px, var(--surface-2) 8px 9px)' : 'transparent',
          }}>
            {/* hour grid lines */}
            {hours.map((h, i) => (
              <div key={h} style={{
                position: 'absolute', left: 0, right: 0, top: i * HOUR_HEIGHT,
                borderTop: '1px solid var(--line)', height: HOUR_HEIGHT,
              }}>
                {/* half-hour line */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: HOUR_HEIGHT / 2, borderTop: '1px dashed var(--line)', opacity: 0.5 }} />
              </div>
            ))}

            {/* Lunch break 13:30-14:30 */}
            {!d.off && (
              <div style={{
                position: 'absolute', left: 4, right: 4,
                top: ((13 - START_H) + 0.5) * HOUR_HEIGHT,
                height: HOUR_HEIGHT,
                background: 'repeating-linear-gradient(45deg, transparent 0 4px, var(--surface-3) 4px 8px)',
                borderRadius: 6,
                opacity: 0.7,
              }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', padding: '4px 6px' }}>обед</div>
              </div>
            )}

            {/* Appointments */}
            {appts.filter(a => a.day === dayIdx).map(a => (
              <ApptBlock key={a.id} a={a} onSelect={onSelect} selected={selectedId === a.id} />
            ))}

            {/* Now line on today */}
            {d.today && <CalendarNowLine />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApptBlock({ a, onSelect, selected }) {
  const [h1, m1] = a.start.split(':').map(Number);
  const [h2, m2] = a.end.split(':').map(Number);
  const top = ((h1 - START_H) + m1 / 60) * HOUR_HEIGHT;
  const height = ((h2 - h1) + (m2 - m1) / 60) * HOUR_HEIGHT;
  const c = CLIENTS.find(c => c.id === a.clientId);
  const sv = SERVICES.find(s => s.id === a.serviceId);
  const st = STATUSES[a.status];

  const palette = {
    new:       { bg: 'var(--accent-soft)',  border: 'var(--accent)',  text: 'var(--accent-text)' },
    confirmed: { bg: 'var(--surface)',      border: 'var(--line-strong)', text: 'var(--text)' },
    done:      { bg: 'var(--surface-2)',    border: 'var(--text-4)',  text: 'var(--text-2)' },
    cancelled: { bg: 'var(--danger-soft)',  border: 'var(--danger)',  text: 'var(--danger)' },
    noshow:    { bg: 'var(--warn-soft)',    border: 'var(--warn)',    text: 'var(--warn)' },
  }[a.status];

  return (
    <div onClick={() => onSelect(a)} className="hoverable" style={{
      position: 'absolute',
      left: 3, right: 3,
      top: top + 2, height: height - 3,
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      borderLeft: `3px solid ${palette.border}`,
      borderRadius: 6,
      padding: '4px 7px',
      cursor: 'pointer',
      overflow: 'hidden',
      fontSize: 11.5,
      lineHeight: 1.3,
      boxShadow: selected ? '0 0 0 2px var(--accent), var(--shadow-sm)' : 'none',
      transition: 'box-shadow 120ms',
    }}>
      <div style={{ fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {c?.name}
      </div>
      <div style={{ color: 'var(--text-3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {sv?.name}
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{a.start}</div>
    </div>
  );
}

function CalendarNowLine() {
  const nowH = 15, nowM = 25;
  const top = ((nowH - START_H) + nowM / 60) * HOUR_HEIGHT;
  return (
    <div style={{ position: 'absolute', left: -6, right: 0, top, zIndex: 3, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)', boxShadow: '0 0 0 3px color-mix(in oklab, var(--accent) 20%, transparent)' }} />
        <div style={{ flex: 1, height: 1.5, background: 'var(--accent)' }} />
      </div>
    </div>
  );
}

function DayView({ appts, onSelect }) {
  const hours = [];
  for (let h = START_H; h <= END_H; h++) hours.push(h);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', padding: '6px 0' }}>
      <div>
        {hours.map(h => (
          <div key={h} style={{ height: HOUR_HEIGHT * 1.4, paddingRight: 10, textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-4)' }}>{String(h).padStart(2,'0')}:00</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', minHeight: hours.length * HOUR_HEIGHT * 1.4, borderLeft: '1px solid var(--line)' }}>
        {hours.map((h, i) => (
          <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: i * HOUR_HEIGHT * 1.4, borderTop: '1px dashed var(--line)' }} />
        ))}
        {/* Lunch */}
        <div style={{
          position: 'absolute', left: 8, right: 16,
          top: ((13 - START_H) + 0.5) * HOUR_HEIGHT * 1.4,
          height: HOUR_HEIGHT * 1.4,
          background: 'repeating-linear-gradient(45deg, transparent 0 4px, var(--surface-3) 4px 8px)',
          borderRadius: 8,
          padding: 10,
        }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>обеденный перерыв 13:30 – 14:30</div>
        </div>
        {appts.map(a => {
          const [h1, m1] = a.start.split(':').map(Number);
          const [h2, m2] = a.end.split(':').map(Number);
          const top = ((h1 - START_H) + m1 / 60) * HOUR_HEIGHT * 1.4;
          const height = ((h2 - h1) + (m2 - m1) / 60) * HOUR_HEIGHT * 1.4;
          const c = CLIENTS.find(c => c.id === a.clientId);
          const sv = SERVICES.find(s => s.id === a.serviceId);
          const st = STATUSES[a.status];
          const isNew = a.status === 'new';
          return (
            <div key={a.id} onClick={() => onSelect(a)} className="hoverable card" style={{
              position: 'absolute', left: 8, right: 16, top: top + 3, height: height - 6,
              padding: '10px 14px',
              background: isNew ? 'var(--accent-soft)' : 'var(--surface)',
              borderLeft: `3px solid ${isNew ? 'var(--accent)' : 'var(--line-strong)'}`,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: height > 70 ? 'flex-start' : 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.start} – {a.end}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{c?.name}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 12.5, marginTop: 1 }}>{sv?.name} · {sv?.price.toLocaleString('ru-RU')} ₽</div>
                </div>
                <Badge kind={st.kind}>{st.label}</Badge>
              </div>
            </div>
          );
        })}
        <CalendarNowLine />
      </div>
    </div>
  );
}

function AppointmentPanel({ appt, onClose }) {
  const c = CLIENTS.find(x => x.id === appt.clientId);
  const sv = SERVICES.find(s => s.id === appt.serviceId);
  const st = STATUSES[appt.status];
  return (
    <Card style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <Badge kind={st.kind}>{st.label}</Badge>
        <button className="btn btn-ghost icon" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 12 }}>
        <Avatar name={c.name} size="lg" />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 2 }}>{c.phone}</div>
        </div>
      </div>

      <div className="divider" style={{ margin: '0 calc(-1 * var(--pad-card)) 14px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow icon="services" label="Услуга" value={sv.name} />
        <DetailRow icon="clock"    label="Время"  value={`${appt.start} – ${appt.end} · ${sv.dur} мин`} />
        <DetailRow icon="calendar" label="Дата"   value="Понедельник, 25 мая 2026" />
        <DetailRow icon="card"     label="Цена"   value={`${sv.price.toLocaleString('ru-RU')} ₽`} />
      </div>

      {appt.notes && (
        <>
          <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Заметки</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{appt.notes}</div>
          </div>
        </>
      )}

      <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn size="sm" icon="chat">Написать</Btn>
        <Btn size="sm" icon="edit">Изменить</Btn>
        <Btn size="sm" icon="check" kind="soft">Подтвердить</Btn>
        <Btn size="sm" kind="danger" icon="x">Отменить</Btn>
      </div>
    </Card>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Icon name={icon} size={14} style={{ color: 'var(--text-3)', marginTop: 2 }} />
      <div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
        <div style={{ fontSize: 13.5, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}
