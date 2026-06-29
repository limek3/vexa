'use client';

import { useMemo, useState } from 'react';
import { Icons } from '@/components/concept/icons';
import { useToast } from '@/components/concept/toast';
import { Modal } from '@/components/concept/modal';
import { bookings as initialBookings, statusLabel, type Booking, type Status } from '@/components/concept/data';

type TabKey = 'all' | 'today' | 'tomorrow' | 'pending' | 'archive';

const tabs: { key: TabKey; label: string; filter: (b: Booking) => boolean }[] = [
  { key: 'all', label: 'Все', filter: () => true },
  { key: 'today', label: 'Сегодня', filter: (b) => b.date === '11 мая' },
  { key: 'tomorrow', label: 'Завтра', filter: (b) => b.date === '12 мая' },
  { key: 'pending', label: 'Не подтв.', filter: (b) => b.status === 'pending' },
  { key: 'archive', label: 'Архив', filter: (b) => b.status === 'cancelled' || b.status === 'completed' },
];

const pillClass = (s: Status) =>
  s === 'confirmed' ? 'pill good' : s === 'pending' ? 'pill warn' : s === 'paid' ? 'pill brand' : s === 'cancelled' ? 'pill bad' : 'pill';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export default function BookingsPage() {
  const [items, setItems] = useState<Booking[]>(initialBookings);
  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(initialBookings[0].id);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(0);
  const toast = useToast();

  const filtered = useMemo(() => {
    const filter = tabs.find((t) => t.key === tab)!.filter;
    const q = query.trim().toLowerCase();
    return items.filter((b) => {
      if (!filter(b)) return false;
      if (!q) return true;
      return (
        b.clientName.toLowerCase().includes(q) ||
        b.service.toLowerCase().includes(q) ||
        b.master.toLowerCase().includes(q)
      );
    });
  }, [items, tab, query]);

  const selected = items.find((b) => b.id === selectedId) ?? items[0];

  const updateStatus = (id: string, status: Status) => {
    setItems((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    toast.push(`Статус: ${statusLabel[status]}`);
  };

  const counters = {
    today: items.filter((b) => b.date === '11 мая').length,
    tomorrow: items.filter((b) => b.date === '12 мая').length,
    pending: items.filter((b) => b.status === 'pending').length,
    weekTotal: items.reduce((sum, b) => sum + b.amount, 0),
  };

  return (
    <>
      <div className="top">
        <div>
          <h1>Записи</h1>
          <div className="sub">{items.length} всего · {counters.pending} ожидают подтверждения</div>
        </div>
        <div className="spacer" />
        <div className="search">
          <Icons.Search width={13} height={13} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Имя, телефон, услуга" />
          <span className="k">⌘K</span>
        </div>
        <button className="btn" onClick={() => toast.push('CSV экспортирован')}>Экспорт</button>
        <button className="btn primary" onClick={() => setCreateOpen(true)}>
          <Icons.Plus width={14} height={14} /> Новая запись
        </button>
        <div className="avatar">АК</div>
      </div>

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="card kpi"><h5>Сегодня</h5><div className="v">{counters.today}</div><div className="delta">{items.filter((b) => b.date === '11 мая' && b.status === 'confirmed').length} подтверждены</div></div>
        <div className="card kpi"><h5>Завтра</h5><div className="v">{counters.tomorrow}</div><div className="delta">{items.filter((b) => b.date === '12 мая' && b.status === 'confirmed').length} подтверждены</div></div>
        <div className="card kpi"><h5>Не подтверждены</h5><div className="v">{counters.pending}</div><div className="delta"><span className="dn">истекают через 2 ч</span></div></div>
        <div className="card kpi"><h5>Выручка · неделя</h5><div className="v">₽{fmt(Math.round(counters.weekTotal / 1000))}k</div><div className="delta"><span className="up">+18%</span> к прошл.</div></div>
      </div>

      <div className="split">
        <div className="card flush">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="tabs">
              {tabs.map((t) => (
                <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => { setTab(t.key); setPage(0); }}>
                  {t.label} · {items.filter(t.filter).length}
                </button>
              ))}
            </div>
            <div className="spacer" />
            <span className="chip on">11–17 мая</span>
            <span className="chip">Все мастера</span>
            <span className="chip">Все услуги</span>
          </div>

          <div style={{ padding: '14px 18px 0' }}>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-3)', paddingBottom: 14 }}>
              <span className="pill good"><span className="dot" />Подтверждена</span>
              <span className="pill warn"><span className="dot" />Ожидает</span>
              <span className="pill brand"><span className="dot" />Оплачено</span>
              <span className="pill bad"><span className="dot" />Отмена</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th />
                <th>Клиент</th>
                <th>Услуга</th>
                <th>Мастер</th>
                <th>Дата · время</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Канал</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>Ничего не найдено</td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id} className={selectedId === b.id ? 'selected' : ''} onClick={() => setSelectedId(b.id)}>
                  <td style={{ paddingLeft: 18 }}>
                    <div className="user"><div className="av">{b.initials}</div></div>
                  </td>
                  <td><b>{b.clientName}</b><div style={{ color: 'var(--text-3)', fontSize: 11 }}>{b.clientMeta}</div></td>
                  <td>{b.service}</td>
                  <td>{b.master}</td>
                  <td><b>{b.date}</b><div style={{ color: 'var(--text-3)', fontSize: 11 }}>{b.time} · {b.duration}</div></td>
                  <td style={{ fontWeight: 600 }}>{b.amount > 0 ? `₽${fmt(b.amount)}` : '—'}</td>
                  <td><span className={pillClass(b.status)}><span className="dot" />{statusLabel[b.status]}</span></td>
                  <td>{b.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', color: 'var(--text-3)', fontSize: 12, borderTop: '1px solid var(--line)' }}>
            <span>{filtered.length === 0 ? '0' : `1–${filtered.length}`} из {items.length}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="chip" onClick={() => setPage((p) => Math.max(0, p - 1))}>←</button>
              <button className="chip on">1</button>
              <button className="chip">2</button>
              <button className="chip">3</button>
              <button className="chip" onClick={() => setPage((p) => p + 1)}>→</button>
            </div>
          </div>
        </div>

        <aside className="card" style={{ position: 'sticky', top: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'center', paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--soft)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 14, color: 'var(--text-2)' }}>{selected.initials}</div>
            <div>
              <b style={{ fontSize: 15, fontWeight: 600, display: 'block' }}>{selected.clientName}</b>
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{selected.clientMeta}</span>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={pillClass(selected.status)}><span className="dot" />{statusLabel[selected.status]}</span>
                <span className="pill">{selected.channel}</span>
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 0 10px' }}>Услуга</h4>
          <Kv label="Что" value={selected.service} />
          <Kv label="Мастер" value={selected.master} />
          <Kv label="Когда" value={`${selected.date} · ${selected.time}`} />
          <Kv label="Длительность" value={selected.duration} last />

          <h4 style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 0 10px' }}>Оплата</h4>
          <Kv label="Итого" value={selected.amount > 0 ? `₽${fmt(selected.amount)}` : 'бесплатно'} />
          <Kv label="Депозит" value={selected.amount > 0 ? '₽3 000 · оплачен' : '—'} last />

          <h4 style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', margin: '18px 0 10px' }}>История</h4>
          <Event time="10:42" text={`Запись создана через ${selected.channel}`} />
          <Event time="10:43" text="Депозит списан" />
          <Event time="11:10" text="Бот отправил напоминание" />
          <Event time="сейчас" text={`Статус: ${statusLabel[selected.status]}`} last />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
            <button
              className="btn primary"
              style={{ justifyContent: 'center' }}
              disabled={selected.status === 'confirmed'}
              onClick={() => updateStatus(selected.id, 'confirmed')}
            >
              {selected.status === 'confirmed' ? '✓ Подтверждена' : 'Подтвердить'}
            </button>
            <button className="btn" style={{ justifyContent: 'center' }} onClick={() => toast.push('Открыт перенос записи')}>Перенести</button>
            <button className="btn" style={{ justifyContent: 'center' }} onClick={() => toast.push(`Открыт чат с ${selected.clientName}`)}>Открыть чат</button>
            <button
              className="btn danger"
              style={{ justifyContent: 'center' }}
              disabled={selected.status === 'cancelled'}
              onClick={() => updateStatus(selected.id, 'cancelled')}
            >
              Отменить
            </button>
          </div>
        </aside>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Новая запись" description="Заполните основные поля. Полный мастер — в реальной интеграции.">
        <div className="field">
          <label>Клиент</label>
          <input type="text" placeholder="Имя или телефон" />
        </div>
        <div className="field">
          <label>Услуга</label>
          <input type="text" placeholder="Например: AirTouch окрашивание" />
        </div>
        <div className="row">
          <div className="field" style={{ margin: 0 }}>
            <label>Дата</label>
            <input type="text" placeholder="11 мая" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Время</label>
            <input type="text" placeholder="14:30" />
          </div>
        </div>
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn" onClick={() => setCreateOpen(false)}>Отмена</button>
          <button
            className="btn primary"
            onClick={() => {
              setCreateOpen(false);
              toast.push('Запись создана (демо)');
            }}
          >
            Создать запись
          </button>
        </div>
      </Modal>
    </>
  );
}

function Kv({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: last ? 0 : '1px solid var(--line)' }}>
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <b style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
    </div>
  );
}

function Event({ time, text, last }: { time: string; text: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '8px 0', fontSize: 12, color: 'var(--text-2)', borderBottom: last ? 0 : '1px solid var(--line)' }}>
      <span style={{ width: 54, color: 'var(--text)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{time}</span>
      {text}
    </div>
  );
}
