'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icons } from '@/components/concept/icons';
import { useToast } from '@/components/concept/toast';
import { bookings, statusLabel } from '@/components/concept/data';

const chartSeries: Record<'week' | '14d' | 'month', { points: [number, number][]; total: string; prev: string }> = {
  week: {
    points: [[40, 170], [140, 150], [240, 140], [340, 120], [440, 100], [540, 85], [600, 75]],
    total: '₽82 100', prev: '₽74 200',
  },
  '14d': {
    points: [[40, 180], [90, 175], [140, 160], [190, 155], [240, 145], [290, 135], [340, 125], [390, 115], [440, 105], [490, 95], [540, 85], [600, 55]],
    total: '₽184 200', prev: '₽156 300',
  },
  month: {
    points: [[40, 200], [90, 195], [140, 180], [190, 170], [240, 165], [290, 150], [340, 145], [390, 130], [440, 120], [490, 110], [540, 95], [600, 70]],
    total: '₽712 800', prev: '₽641 500',
  },
};

const channelData = [
  { name: 'Telegram', pct: 54 },
  { name: 'VK', pct: 22 },
  { name: 'Сайт', pct: 14 },
  { name: 'Звонок', pct: 7 },
  { name: 'Прочее', pct: 3 },
];

const topServices = [
  { name: 'Окрашивание AirTouch', amount: 56400 },
  { name: 'Маникюр + покрытие', amount: 41200 },
  { name: 'Стрижка женская', amount: 33100 },
  { name: 'Брови · форма', amount: 18700 },
];

const todayBookings = bookings.filter((b) => b.date === '11 мая');

const attention = [
  { initials: 'МР', name: 'Марина Родина', text: 'Три пропуска подряд — позвонить' },
  { initials: 'ВН', name: 'Виктория Новикова · 11:00', text: 'Не подтвердила запись — отправить напоминание' },
  { initials: 'КЛ', name: 'Катя Лебедева', text: 'День рождения завтра — отправить промокод' },
  { initials: '·3', name: 'Три отзыва без ответа', text: 'Средняя оценка 4.3 за последнюю неделю' },
];

const fmt = (n: number) => n.toLocaleString('ru-RU');
const pillClass = (s: keyof typeof statusLabel) =>
  s === 'confirmed' ? 'pill good' : s === 'pending' ? 'pill warn' : s === 'paid' ? 'pill brand' : s === 'cancelled' ? 'pill bad' : 'pill';

export default function ConceptHome() {
  const [range, setRange] = useState<'week' | '14d' | 'month'>('14d');
  const [reminders, setReminders] = useState(false);
  const [query, setQuery] = useState('');
  const toast = useToast();

  const chart = chartSeries[range];
  const path = useMemo(() => {
    const pts = chart.points;
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [cx, cy] = pts[i];
      const midX = (px + cx) / 2;
      d += ` C${midX},${py} ${midX},${cy} ${cx},${cy}`;
    }
    return d;
  }, [chart]);

  return (
    <>
      <div className="top">
        <div>
          <h1>Доброе утро, Анна</h1>
          <div className="sub">Понедельник · 11 мая · {todayBookings.length} записи на сегодня</div>
        </div>
        <div className="spacer" />
        <div className="search">
          <Icons.Search width={13} height={13} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск клиента, услуги…"
          />
          <span className="k">⌘K</span>
        </div>
        <button className="btn" onClick={() => toast.push('Открыта панель уведомлений')}>
          <Icons.Bell width={14} height={14} /> Уведомления
        </button>
        <Link href="/concept/bookings" className="btn primary">
          <Icons.Plus width={14} height={14} /> Новая запись
        </Link>
        <div className="avatar">АК</div>
      </div>

      <div className="col">
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="pill">эта неделя</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>11–17 мая</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
              Выручка ₽184 200 · загрузка 82%
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 13.5, maxWidth: 560, lineHeight: 1.5, marginTop: 6 }}>
              Записей на 18% больше, чем неделей ранее. Большая часть прироста пришла из Telegram‑канала. Свободны 12 слотов до пятницы.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                className={reminders ? 'btn' : 'btn primary'}
                onClick={() => {
                  setReminders((v) => !v);
                  toast.push(reminders ? 'Автонапоминания выключены' : 'Автонапоминания включены');
                }}
              >
                {reminders ? '✓ Напоминания включены' : 'Включить напоминания'}
              </button>
              <button className="btn" onClick={() => toast.push('Отчёт за неделю скачан')}>Отчёт за неделю</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, minWidth: 440 }}>
            {[
              { label: 'Выручка', value: '₽184 200', delta: '+18%' },
              { label: 'Записи', value: '47', delta: '+12' },
              { label: 'Загрузка', value: '82%', delta: '+6 п.п.' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, fontWeight: 600 }}>{s.label}</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--good)', marginTop: 4 }}>{s.delta}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="kpis">
          <div className="card kpi"><h5>Сегодня</h5><div className="v">₽28 400</div><div className="delta"><span className="up">+12%</span> к прошл. понед.</div></div>
          <div className="card kpi"><h5>Записей · сегодня</h5><div className="v">{todayBookings.length} <small>/ 7 слотов</small></div><div className="delta">{7 - todayBookings.length} свободных слота</div></div>
          <div className="card kpi"><h5>Новых клиентов · нед.</h5><div className="v">9</div><div className="delta"><span className="up">+3</span> к прошл.</div></div>
          <div className="card kpi"><h5>NPS · 30 дней</h5><div className="v">8.7</div><div className="delta"><span className="dn">−0.2</span> к прошл.</div></div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="section-title">
              <h3>Динамика выручки</h3>
              <div className="tabs">
                <button className={range === 'week' ? 'on' : ''} onClick={() => setRange('week')}>Неделя</button>
                <button className={range === '14d' ? 'on' : ''} onClick={() => setRange('14d')}>14 дней</button>
                <button className={range === 'month' ? 'on' : ''} onClick={() => setRange('month')}>Месяц</button>
              </div>
            </div>
            <div style={{ height: 240, marginTop: 8 }}>
              <svg viewBox="0 0 600 240" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <g stroke="#ececef" strokeWidth={1}>
                  <line x1={0} y1={50} x2={600} y2={50} />
                  <line x1={0} y1={110} x2={600} y2={110} />
                  <line x1={0} y1={170} x2={600} y2={170} />
                  <line x1={0} y1={230} x2={600} y2={230} />
                </g>
                <g fontSize={10} fill="#8b8b94" fontFamily="Inter">
                  <text x={6} y={48}>₽20k</text>
                  <text x={6} y={108}>₽15k</text>
                  <text x={6} y={168}>₽10k</text>
                </g>
                <path d={path} stroke="#0a0a0b" strokeWidth={2} fill="none" />
                <circle cx={chart.points[chart.points.length - 1][0]} cy={chart.points[chart.points.length - 1][1]} r={4} fill="#0a0a0b" />
                <circle cx={chart.points[chart.points.length - 1][0]} cy={chart.points[chart.points.length - 1][1]} r={8} fill="#0a0a0b" opacity={0.1} />
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--text-3)', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
              <span><i style={{ width: 10, height: 2, display: 'inline-block', marginRight: 7, verticalAlign: 'middle', background: '#0a0a0b' }} />Этот период · {chart.total}</span>
              <span>Прошлый · {chart.prev}</span>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><h3>Каналы записи</h3><a className="link">Все каналы →</a></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {channelData.map((c) => (
                <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 44px', gap: 12, alignItems: 'center', fontSize: 13 }}>
                  <span>{c.name}</span>
                  <span style={{ height: 6, background: 'var(--soft)', borderRadius: 99, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${c.pct}%`, background: 'var(--text)' }} />
                  </span>
                  <span className="num" style={{ color: 'var(--text-3)', fontSize: 12, textAlign: 'right' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
            <hr />
            <div className="section-title"><h3>Топ‑услуги недели</h3></div>
            {topServices.map((s) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 13, borderBottom: '1px solid var(--line)' }}>
                <b style={{ fontWeight: 500 }}>{s.name}</b>
                <span className="num" style={{ color: 'var(--text-2)' }}>₽{fmt(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="section-title">
              <h3>Сегодняшний график</h3>
              <Link href="/concept/schedule" className="link">Открыть график →</Link>
            </div>
            {todayBookings.map((b) => (
              <Link key={b.id} href={`/concept/bookings?id=${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="tl">
                  <div className="t">{b.time}<span>{b.duration}</span></div>
                  <div className="body">
                    <b>{b.service} · {b.clientName}</b>
                    <span>Мастер {b.master} · {b.channel} · ₽{fmt(b.amount)}</span>
                  </div>
                  <span className={pillClass(b.status)}><span className="dot" />{statusLabel[b.status]}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="card">
            <div className="section-title"><h3>Требует внимания</h3><span className="pill">{attention.length}</span></div>
            {attention.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < attention.length - 1 ? '1px solid var(--line)' : '0', fontSize: 13 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--soft)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 11, color: 'var(--text-2)' }}>{a.initials}</div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontWeight: 500, display: 'block' }}>{a.name}</b>
                  <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{a.text}</span>
                </div>
                <button className="btn" onClick={() => toast.push(`Открыто: ${a.name}`)}>Открыть</button>
              </div>
            ))}
            <hr />
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => toast.push('Открыты все задачи')}>Все задачи</button>
          </div>
        </div>
      </div>
    </>
  );
}
