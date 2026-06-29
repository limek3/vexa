'use client';

import { useMemo, useState } from 'react';
import { Icons } from '@/components/concept/icons';
import { useToast } from '@/components/concept/toast';
import { Modal } from '@/components/concept/modal';
import { clients as initialClients, type Client } from '@/components/concept/data';

type Segment = 'vip' | 'regular' | 'new' | 'sleeping' | 'birthday';

const segments: { key: Segment; label: string; sub: string }[] = [
  { key: 'vip', label: 'VIP', sub: 'LTV > ₽50 000' },
  { key: 'regular', label: 'Постоянные', sub: '5+ визитов' },
  { key: 'new', label: 'Новые', sub: 'за 7 дней' },
  { key: 'sleeping', label: 'Спящие', sub: 'нет визита 60+ дней' },
  { key: 'birthday', label: 'Дни рождения', sub: 'в этом месяце' },
];

const fmt = (n: number) => n.toLocaleString('ru-RU');

export default function ClientsPage() {
  const [activeSeg, setActiveSeg] = useState<Segment>('vip');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'ltv' | 'visits' | 'name'>('ltv');
  const [selectedId, setSelectedId] = useState<string>(initialClients[0].id);
  const [addOpen, setAddOpen] = useState(false);
  const toast = useToast();

  const segCounts = useMemo(() => {
    const map: Record<Segment, number> = { vip: 0, regular: 0, new: 0, sleeping: 0, birthday: 0 };
    initialClients.forEach((c) => { map[c.segment] += 1; });
    map.vip = initialClients.filter((c) => c.ltv > 50000).length;
    map.regular = initialClients.filter((c) => c.visits >= 5 && c.ltv <= 50000).length;
    map.new = initialClients.filter((c) => c.segment === 'new').length;
    map.sleeping = initialClients.filter((c) => c.segment === 'sleeping').length;
    map.birthday = initialClients.filter((c) => c.segment === 'birthday').length;
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = initialClients.filter((c) => {
      if (activeSeg === 'vip' && c.ltv <= 50000) return false;
      if (activeSeg === 'regular' && (c.visits < 5 || c.ltv > 50000)) return false;
      if (activeSeg === 'new' && c.segment !== 'new') return false;
      if (activeSeg === 'sleeping' && c.segment !== 'sleeping') return false;
      if (activeSeg === 'birthday' && c.segment !== 'birthday') return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.tags.join(' ').toLowerCase().includes(q);
    });
    list.sort((a, b) => {
      if (sortBy === 'ltv') return b.ltv - a.ltv;
      if (sortBy === 'visits') return b.visits - a.visits;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [activeSeg, query, sortBy]);

  const selected: Client = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? initialClients[0];

  return (
    <>
      <div className="top">
        <div>
          <h1>Клиенты</h1>
          <div className="sub">{initialClients.length} всего · 9 новых за неделю · среднее LTV ₽14 200</div>
        </div>
        <div className="spacer" />
        <div className="search">
          <Icons.Search width={13} height={13} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Имя, телефон, тег" />
          <span className="k">⌘K</span>
        </div>
        <button className="btn" onClick={() => toast.push('CSV экспортирован')}>Экспорт CSV</button>
        <button className="btn primary" onClick={() => setAddOpen(true)}><Icons.Plus width={14} height={14} /> Добавить</button>
        <div className="avatar">АК</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 18 }}>
        {segments.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSeg(s.key)}
            style={{
              padding: 16, borderRadius: 11, border: `1px solid ${activeSeg === s.key ? 'var(--text)' : 'var(--line)'}`,
              background: 'var(--paper)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>
              {s.key === 'birthday' ? 'Событие' : 'Сегмент'}
            </div>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em' }}>{segCounts[s.key]}</div>
            <b style={{ fontSize: 13.5, display: 'block', marginTop: 6, fontWeight: 500 }}>{s.label}</b>
            <span style={{ color: 'var(--text-3)', fontSize: 11.5, display: 'block', marginTop: 1 }}>{s.sub}</span>
          </button>
        ))}
      </div>

      <div className="split">
        <div className="card flush">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
            <span className="pill dark">{segments.find((s) => s.key === activeSeg)?.label} · {segCounts[activeSeg]}</span>
            <span className="chip">Все мастера</span>
            <span className="chip">Все каналы</span>
            <span className="chip on" onClick={() => setSortBy(sortBy === 'ltv' ? 'visits' : sortBy === 'visits' ? 'name' : 'ltv')}>
              {sortBy === 'ltv' ? 'LTV ↓' : sortBy === 'visits' ? 'Визиты ↓' : 'Имя А–Я'}
            </span>
            <div className="spacer" />
            <button className="btn" onClick={() => toast.push('Создан черновик рассылки')}>Рассылка</button>
            <button className="btn" onClick={() => toast.push('Назначен тег')}>Назначить тег</button>
          </div>

          <table>
            <thead>
              <tr>
                <th />
                <th>Клиент</th>
                <th>Контакт</th>
                <th>Визиты</th>
                <th>LTV</th>
                <th>Последний</th>
                <th>Любимый мастер</th>
                <th>Score</th>
                <th>Теги</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>В этом сегменте никого</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className={selected.id === c.id ? 'selected' : ''} onClick={() => setSelectedId(c.id)}>
                  <td style={{ paddingLeft: 18 }}><div className="user"><div className="av">{c.initials}</div></div></td>
                  <td><b>{c.name}</b><div style={{ color: 'var(--text-3)', fontSize: 11 }}>{c.age} лет{c.meta ? ` · ${c.meta}` : ''}</div></td>
                  <td>{c.phone}<div style={{ color: 'var(--text-3)', fontSize: 11 }}>{c.channel}</div></td>
                  <td><b>{c.visits}</b></td>
                  <td>
                    <b>₽{fmt(c.ltv)}</b>
                    {c.ltvDelta !== undefined && (
                      <div style={{ color: c.ltvDelta > 0 ? 'var(--good)' : 'var(--bad)', fontSize: 11 }}>
                        {c.ltvDelta > 0 ? '+' : ''}₽{fmt(Math.abs(c.ltvDelta))}
                      </div>
                    )}
                  </td>
                  <td>{c.lastVisit}<div style={{ color: 'var(--text-3)', fontSize: 11 }}>{c.nextVisit ?? '—'}</div></td>
                  <td>{c.favMaster}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 500, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ width: 48, height: 5, background: 'var(--soft)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--line)', display: 'inline-block' }}>
                        <span style={{ display: 'block', height: '100%', width: `${c.score}%`, background: c.score < 50 ? 'var(--bad)' : 'var(--text)' }} />
                      </span>
                      {c.score}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {c.tags.map((t) => (
                        <span key={t} style={{
                          fontSize: 10.5, padding: '2px 7px', borderRadius: 5,
                          background: t === 'VIP' ? 'var(--text)' : t === 'Риск' ? '#fdecea' : 'var(--soft)',
                          color: t === 'VIP' ? '#fff' : t === 'Риск' ? 'var(--bad)' : 'var(--text-2)',
                          border: t === 'VIP' ? '1px solid var(--text)' : t === 'Риск' ? '1px solid #f3c8c5' : '1px solid var(--line)',
                        }}>{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', color: 'var(--text-3)', fontSize: 12, borderTop: '1px solid var(--line)' }}>
            <span>{filtered.length} клиентов</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="chip">←</button>
              <button className="chip on">1</button>
              <button className="chip">2</button>
              <button className="chip">→</button>
            </div>
          </div>
        </div>

        <aside className="card" style={{ position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '6px 0 20px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 68, height: 68, borderRadius: 16, background: 'var(--soft)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 20, color: 'var(--text-2)' }}>{selected.initials}</div>
            <b style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>{selected.name}</b>
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{selected.age} лет{selected.meta ? ` · ${selected.meta}` : ''}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {selected.tags.map((t) => (
                <span key={t} className={t === 'VIP' ? 'pill dark' : t === 'Риск' ? 'pill bad' : 'pill'}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
            <Metric label="визитов" value={String(selected.visits)} />
            <Metric label="LTV" value={`₽${selected.ltv >= 1000 ? `${Math.round(selected.ltv / 1000)}k` : selected.ltv}`} />
            <Metric label="score" value={String(selected.score)} />
          </div>

          <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '.06em', margin: '20px 0 10px', fontWeight: 600 }}>Активность · 12 месяцев</h4>
          <div style={{ height: 72, background: 'var(--soft)', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'flex-end', gap: 3, border: '1px solid var(--line)' }}>
            {[30, 55, 40, 70, 50, 65, 80, 45, 75, 60, 85, 90].map((h, i) => (
              <span key={i} style={{ flex: 1, background: 'var(--text)', borderRadius: 1, opacity: 0.85, height: `${h}%` }} />
            ))}
          </div>

          <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '.06em', margin: '20px 0 10px', fontWeight: 600 }}>Предпочтения</h4>
          <Fav label={selected.favMaster} sub={`${selected.visits} визитов`} />
          <Fav label="AirTouch окрашивание" sub="6 раз" />
          <Fav label="Утро · 10:00–12:00" sub="72%" last />

          {selected.note && (
            <>
              <h4 style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '.06em', margin: '20px 0 10px', fontWeight: 600 }}>Заметка мастера</h4>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55, background: 'var(--soft)', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>{selected.note}</p>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
            <button className="btn primary" style={{ justifyContent: 'center' }} onClick={() => toast.push(`Открыта форма записи для ${selected.name}`)}>+ Записать</button>
            <button className="btn" style={{ justifyContent: 'center' }} onClick={() => toast.push(`Открыт чат с ${selected.name}`)}>Открыть чат</button>
          </div>
        </aside>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Новый клиент" description="Добавьте контакт — система автоматически свяжет с чатом по номеру.">
        <div className="field"><label>Имя и фамилия</label><input type="text" placeholder="Иван Иванов" /></div>
        <div className="field"><label>Телефон</label><input type="text" placeholder="+7 999 ••• •• ••" /></div>
        <div className="field"><label>Канал</label><input type="text" placeholder="Telegram" /></div>
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn" onClick={() => setAddOpen(false)}>Отмена</button>
          <button className="btn primary" onClick={() => { setAddOpen(false); toast.push('Клиент добавлен (демо)'); }}>Добавить</button>
        </div>
      </Modal>
    </>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: 'var(--soft)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
      <div className="num" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>{value}</div>
      <span style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginTop: 3, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Fav({ label, sub, last }: { label: string; sub: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderBottom: last ? 0 : '1px solid var(--line)' }}>
      <div>{label}</div>
      <span style={{ color: 'var(--text-3)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{sub}</span>
    </div>
  );
}
