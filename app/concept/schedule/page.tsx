'use client';

import { useMemo, useState } from 'react';
import { Icons } from '@/components/concept/icons';
import { useToast } from '@/components/concept/toast';
import { Modal } from '@/components/concept/modal';
import { events as initialEvents, masters, statusLabel, type ScheduleEvent, type Status, dayStartHour } from '@/components/concept/data';

const PX_PER_MIN = 80 / 60;
const HOURS = 9;
const NOW_MIN = 174;

const borderColor = (s: Status) =>
  s === 'pending' ? 'var(--warn)' : s === 'confirmed' ? 'var(--text)' : s === 'paid' ? 'var(--brand)' : '#8b8b94';

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
  const [view, setView] = useState<'day' | 'week' | 'month' | 'masters'>('week');
  const [dayOffset, setDayOffset] = useState(0);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [bookSlot, setBookSlot] = useState<{ masterId: string; startMin: number } | null>(null);
  const toast = useToast();

  const dayLabel = useMemo(() => {
    const base = new Date(2026, 4, 11);
    base.setDate(base.getDate() + dayOffset);
    return base.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
  }, [dayOffset]);

  const totalSlots = masters.reduce((s, m) => s + m.busy + m.free, 0);
  const busySlots = masters.reduce((s, m) => s + m.busy, 0);
  const freeSlots = totalSlots - busySlots;
  const utilization = Math.round((busySlots / totalSlots) * 100);
  const openEvent = events.find((e) => e.id === openEventId);
  const eventClient = openEvent?.client?.split(' · ')[0] ?? '';

  const cancelEvent = (id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'cancelled' as Status } : e)));
    setOpenEventId(null);
    toast.push('Запись отменена');
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>График работы</h1>
          <div className="sub">Неделя 11–17 мая · загрузка {utilization}% · {freeSlots} свободных слотов</div>
        </div>
        <div className="spacer" />
        <div className="tabs">
          {(['day', 'week', 'month', 'masters'] as const).map((v) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
              {v === 'day' ? 'День' : v === 'week' ? 'Неделя' : v === 'month' ? 'Месяц' : 'Мастера'}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => setDayOffset((d) => d - 1)}><Icons.ArrowLeft width={14} height={14} /></button>
        <button className="btn" style={{ minWidth: 140, justifyContent: 'center' }} onClick={() => setDayOffset(0)}>{dayLabel}</button>
        <button className="btn" onClick={() => setDayOffset((d) => d + 1)}><Icons.ArrowRight width={14} height={14} /></button>
        <button className="btn primary" onClick={() => setBookSlot({ masterId: masters[0].id, startMin: 60 * 8 })}>
          <Icons.Plus width={14} height={14} /> Запись
        </button>
        <div className="avatar">АК</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 18 }}>
        <div className="card kpi"><h5>Слотов всего</h5><div className="v">{totalSlots}</div><div className="delta"><span className="up">+4</span> новая смена</div></div>
        <div className="card kpi"><h5>Занято</h5><div className="v">{busySlots} <small>/ {totalSlots}</small></div><div className="delta">{utilization}% загрузка</div></div>
        <div className="card kpi"><h5>Свободно</h5><div className="v">{freeSlots}</div><div className="delta">записать клиента</div></div>
        <div className="card kpi"><h5>Прогноз выручки</h5><div className="v">₽198k</div><div className="delta"><span className="up">+8%</span> к прошл.</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>
        <section style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${masters.length + 1}, 1fr)`, borderBottom: '1px solid var(--line)', background: 'var(--soft)' }}>
            <div style={{ padding: 14, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', fontWeight: 600, borderRight: '1px solid var(--line)' }}>{dayLabel}</div>
            {masters.map((m) => (
              <div key={m.id} style={{ padding: 14, borderRight: '1px solid var(--line)', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--paper)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, color: 'var(--text-2)', fontSize: 11.5 }}>{m.initials}</div>
                  <div>
                    <b style={{ fontSize: 13, display: 'block', fontWeight: 600, lineHeight: 1.2 }}>{m.name}</b>
                    <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{m.role}</span>
                  </div>
                </div>
                <div style={{ color: 'var(--text-3)', fontSize: 10.5, marginTop: 8, display: 'flex', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ color: 'var(--good)' }}>{m.busy} занято</span>
                  <span>{m.free} свободно</span>
                </div>
              </div>
            ))}
            <div style={{ padding: 14, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--paper)', border: '1px dashed var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, color: 'var(--text-3)', fontSize: 14 }}>+</div>
                <div>
                  <b style={{ fontSize: 13, display: 'block', fontWeight: 600 }}>Кабинет 4</b>
                  <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Ищем мастера</span>
                </div>
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: 10.5, marginTop: 8 }}>опубликовать вакансию</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${masters.length + 1}, 1fr)`, position: 'relative', height: HOURS * 80 }}>
            <div style={{ borderRight: '1px solid var(--line)', fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              {Array.from({ length: HOURS }, (_, i) => (
                <div key={i} style={{ height: 80, padding: '6px 10px', textAlign: 'right', borderBottom: '1px dashed var(--line)' }}>{String(dayStartHour + i).padStart(2, '0')}:00</div>
              ))}
            </div>

            {masters.map((m) => (
              <div key={m.id} style={{ borderRight: '1px solid var(--line)', position: 'relative' }}>
                {Array.from({ length: HOURS }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setBookSlot({ masterId: m.id, startMin: i * 60 })}
                    style={{
                      height: 80,
                      borderBottom: '1px dashed var(--line)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
                {events.filter((e) => e.masterId === m.id).map((e) => (
                  <div
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); setOpenEventId(e.id); }}
                    style={{
                      position: 'absolute',
                      top: e.startMin * PX_PER_MIN,
                      height: e.durationMin * PX_PER_MIN,
                      left: 8, right: 8,
                      borderRadius: 9,
                      padding: '10px 12px',
                      fontSize: 12, lineHeight: 1.4,
                      cursor: 'pointer',
                      border: e.kind === 'lunch' ? '1px dashed var(--line)' : '1px solid var(--line)',
                      borderLeft: e.kind === 'lunch' ? '1px dashed var(--line)' : `3px solid ${borderColor(e.status)}`,
                      background: e.kind === 'lunch'
                        ? 'repeating-linear-gradient(45deg,#f9f9fa,#f9f9fa 6px,transparent 6px,transparent 12px)'
                        : e.status === 'cancelled' ? 'var(--soft)' : 'var(--paper)',
                      opacity: e.status === 'cancelled' ? 0.55 : 1,
                      textDecoration: e.status === 'cancelled' ? 'line-through' : 'none',
                      overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2,
                    }}
                  >
                    {e.status === 'pending' && (
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9.5, padding: '1px 6px', borderRadius: 5, fontWeight: 600, background: '#fdf3e0', color: 'var(--warn)', border: '1px solid #f3e0b6' }}>Ожидает</span>
                    )}
                    {e.status === 'paid' && (
                      <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9.5, padding: '1px 6px', borderRadius: 5, fontWeight: 600, background: '#e9ecff', color: '#1c2bb3', border: '1px solid #cfd5fa' }}>Оплачено</span>
                    )}
                    <b style={{ fontSize: 12.5, fontWeight: 600, color: e.kind === 'lunch' ? 'var(--text-3)' : 'var(--text)' }}>{e.title}</b>
                    {e.client && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{e.client}</span>}
                    <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatRange(e.startMin, e.durationMin)}{e.amount ? ` · ₽${e.amount.toLocaleString('ru-RU')}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 80, bottom: 80, left: 8, right: 8,
                background: 'repeating-linear-gradient(45deg,#f9f9fa,#f9f9fa 6px,transparent 6px,transparent 12px)',
                border: '1px dashed var(--line)', borderRadius: 9, padding: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10,
              }}>
                <b style={{ color: 'var(--text-2)', fontSize: 13 }}>Кабинет свободен весь день</b>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Сдать в аренду или нанять мастера</span>
                <button className="chip" onClick={() => toast.push('Создана вакансия')}>Опубликовать вакансию</button>
              </div>
            </div>

            <div style={{ position: 'absolute', top: NOW_MIN * PX_PER_MIN, left: 80, right: 0, height: 0, borderTop: '1.5px solid var(--text)', zIndex: 5 }}>
              <span style={{ position: 'absolute', left: -4, top: -4, width: 7, height: 7, borderRadius: 99, background: 'var(--text)' }} />
              <span style={{ position: 'absolute', left: -66, top: -9, fontSize: 10, color: 'var(--text)', background: 'var(--paper)', padding: '2px 6px', borderRadius: 5, border: '1px solid var(--line)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>11:54</span>
            </div>
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="section-title"><h3>Тепловая карта недели</h3><span className="pill">пн–вс</span></div>
            <Heatmap />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: 'var(--text-3)', marginTop: 14, flexWrap: 'wrap' }}>
              <span><i style={{ width: 10, height: 10, borderRadius: 2, display: 'inline-block', marginRight: 7, verticalAlign: 'middle', background: '#f4f4f5', border: '1px solid var(--line)' }} />пусто</span>
              <span><i style={{ width: 10, height: 10, borderRadius: 2, display: 'inline-block', marginRight: 7, verticalAlign: 'middle', background: '#c8c8cd' }} />средне</span>
              <span><i style={{ width: 10, height: 10, borderRadius: 2, display: 'inline-block', marginRight: 7, verticalAlign: 'middle', background: '#0a0a0b' }} />пик</span>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><h3>Свободные слоты</h3><span className="pill">{freeSlots}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FreeSlot label="Сегодня · Анна" sub="17:00 · 60 мин" onClick={() => setBookSlot({ masterId: 'm4', startMin: 60 * 8 })} />
              <FreeSlot label="Сегодня · Мария" sub="16:00 · 60 мин" onClick={() => setBookSlot({ masterId: 'm2', startMin: 60 * 7 })} />
              <FreeSlot label="Завтра · Дина" sub="10:00 · 90 мин" onClick={() => setBookSlot({ masterId: 'm1', startMin: 60 })} />
              <FreeSlot label="Ср · Лера" sub="12:30 · 60 мин" onClick={() => setBookSlot({ masterId: 'm3', startMin: 60 * 3 + 30 })} />
            </div>
          </div>

          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderLeft: '2px solid var(--text)', borderRadius: 11, padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>AI оптимизация</div>
            <h3 style={{ fontSize: 13, marginBottom: 4, fontWeight: 600 }}>Окно 13:00–14:00 у Леры пустует</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 12 }}>
              4 недели подряд этот слот не занят. Запустить акцию «обед = брови» для VK‑аудитории — расчётный отклик 8–12 записей.
            </p>
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => toast.push('Акция создана')}>Создать акцию</button>
          </div>
        </aside>
      </div>

      <Modal open={Boolean(openEvent)} onClose={() => setOpenEventId(null)} title={openEvent?.title ?? ''} description={openEvent ? formatRange(openEvent.startMin, openEvent.durationMin) : ''}>
        {openEvent && (
          <>
            <Detail label="Клиент" value={eventClient} />
            <Detail label="Мастер" value={masters.find((m) => m.id === openEvent.masterId)?.name ?? ''} />
            <Detail label="Длительность" value={`${openEvent.durationMin} мин`} />
            {openEvent.amount && <Detail label="Сумма" value={`₽${openEvent.amount.toLocaleString('ru-RU')}`} />}
            <Detail label="Статус" value={statusLabel[openEvent.status]} last />
            <div className="row">
              <button className="btn" onClick={() => setOpenEventId(null)}>Закрыть</button>
              <button className="btn danger" onClick={() => cancelEvent(openEvent.id)} disabled={openEvent.status === 'cancelled'}>Отменить запись</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={Boolean(bookSlot)} onClose={() => setBookSlot(null)} title="Новая запись" description={bookSlot ? `${masters.find((m) => m.id === bookSlot.masterId)?.name} · ${formatTime(bookSlot.startMin)}` : ''}>
        <div className="field"><label>Клиент</label><input type="text" placeholder="Имя или телефон" /></div>
        <div className="field"><label>Услуга</label><input type="text" placeholder="Например: Стрижка" /></div>
        <div className="field"><label>Длительность</label><input type="text" placeholder="60 мин" /></div>
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn" onClick={() => setBookSlot(null)}>Отмена</button>
          <button className="btn primary" onClick={() => { setBookSlot(null); toast.push('Запись создана (демо)'); }}>Создать запись</button>
        </div>
      </Modal>
    </>
  );
}

function FreeSlot({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '10px 12px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 9, cursor: 'pointer' }}>
      <div>
        {label}
        <span style={{ color: 'var(--text-3)', fontSize: 11, display: 'block', marginTop: 2 }}>{sub}</span>
      </div>
      <span className="chip">записать →</span>
    </div>
  );
}

function Detail({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: last ? 0 : '1px solid var(--line)' }}>
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <b style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
    </div>
  );
}

function Heatmap() {
  const data: [number, number[]][] = [
    [9, [1, 3, 4, 2, 3, 4, 1]],
    [11, [3, 4, 4, 4, 4, 4, 2]],
    [13, [2, 3, 4, 3, 4, 4, 2]],
    [15, [4, 4, 3, 4, 4, 4, 3]],
    [17, [3, 4, 4, 4, 4, 4, 4]],
    [19, [2, 3, 2, 1, 3, 3, 1]],
  ];
  const colors = ['#f4f4f5', '#e7e7ea', '#c8c8cd', '#7a7a83', '#0a0a0b'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(7,1fr)', gap: 3, fontSize: 10, color: 'var(--text-3)' }}>
      {data.map(([h, row]) => (
        <Row key={h} h={h} row={row} colors={colors} />
      ))}
      <span />
      {['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map((d) => (
        <span key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '.05em' }}>{d}</span>
      ))}
    </div>
  );
}

function Row({ h, row, colors }: { h: number; row: number[]; colors: string[] }) {
  return (
    <>
      <span style={{ alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>{h}</span>
      {row.map((v, i) => (
        <span key={i} style={{ height: 18, borderRadius: 3, background: colors[v], border: v < 2 ? '1px solid var(--line)' : 'none' }} />
      ))}
    </>
  );
}

function formatTime(min: number) {
  const h = dayStartHour + Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatRange(startMin: number, durationMin: number) {
  return `${formatTime(startMin)} → ${formatTime(startMin + durationMin)}`;
}
