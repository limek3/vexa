'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../ui';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../data';

/* Clients page */

export function ClientsPage({ onCreate }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('c1');
  const [sortBy, setSortBy] = useState('last');

  const tabs = [
    { value: 'all',      label: 'Все',         count: CLIENTS.length },
    { value: 'vip',      label: 'VIP',         count: CLIENTS.filter(c => c.status === 'vip').length },
    { value: 'regular',  label: 'Постоянные',  count: CLIENTS.filter(c => c.status === 'regular').length },
    { value: 'new',      label: 'Новые',       count: CLIENTS.filter(c => c.status === 'new').length },
    { value: 'inactive', label: 'Неактивные',  count: CLIENTS.filter(c => c.status === 'inactive').length },
  ];

  const filtered = CLIENTS.filter(c =>
    (tab === 'all' || c.status === tab) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
  );

  const selected = CLIENTS.find(c => c.id === selectedId);

  return (
    <div data-screen-label="03 Clients">
      <div className="page-head">
        <div>
          <h1 className="page-title">Клиенты</h1>
          <p className="page-subtitle">{CLIENTS.length} в базе · 8 постоянных · 3 новых за неделю</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="paperclip" kind="secondary">Импорт</Btn>
          <Btn icon="plus" kind="primary">Новый клиент</Btn>
        </div>
      </div>

      <TabsUnderline value={tab} onChange={setTab} items={tabs} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div className="input-with-icon" style={{ flex: 1, maxWidth: 320 }}>
          <Icon name="search" />
          <input className="input" placeholder="Поиск по имени или телефону…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Btn size="sm" kind="ghost" icon="filter">Фильтры</Btn>
        <Btn size="sm" kind="ghost" icon="sort">Сортировка: последний визит</Btn>
        <div className="spacer" />
        <div className="seg">
          <button className="seg-btn active"><Icon name="list" size={12} /></button>
          <button className="seg-btn"><Icon name="grid" size={12} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'flex-start' }}>
        <Card flush>
          <table className="table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Статус</th>
                <th>Визиты</th>
                <th>Последний</th>
                <th>Ближайшая</th>
                <th>Теги</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="row-hover" onClick={() => setSelectedId(c.id)} style={selectedId === c.id ? { background: 'var(--surface-2)' } : {}}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={c.name} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div className="mono muted" style={{ fontSize: 11.5 }}>{c.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="tabular">{c.visits}</td>
                  <td className="muted">{c.last}</td>
                  <td>{c.next !== '—' ? <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{c.next}</span> : <span className="muted">—</span>}</td>
                  <td>
                    {c.notes && <Badge className="outline plain"><Icon name="pin" size={10} /> заметка</Badge>}
                  </td>
                  <td>
                    <button className="btn btn-ghost icon"><Icon name="more" size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <Empty icon="users" title="Никого не нашли" body="Попробуйте изменить запрос или сбросить фильтры" />
          )}
        </Card>

        {selected && <ClientPanel client={selected} />}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    vip:      { label: 'VIP',         kind: 'accent' },
    regular:  { label: 'Постоянный',  kind: 'success' },
    new:      { label: 'Новый',       kind: 'info' },
    inactive: { label: 'Неактивный',  kind: 'plain' },
  };
  const s = map[status];
  return <Badge kind={s.kind}>{s.label}</Badge>;
}

function ClientPanel({ client }) {
  const visits = APPTS.filter(a => a.clientId === client.id).map(a => ({
    ...a,
    service: SERVICES.find(s => s.id === a.serviceId),
  }));
  return (
    <Card style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <Avatar name={client.name} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{client.name}</div>
          <div className="mono muted" style={{ fontSize: 12, marginTop: 2 }}>{client.phone}</div>
        </div>
        <button className="btn btn-ghost icon"><Icon name="more-v" size={14} /></button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <Btn size="sm" kind="primary" icon="chat" style={{ flex: 1 }}>Написать</Btn>
        <Btn size="sm" kind="secondary" icon="plus" style={{ flex: 1 }}>Записать</Btn>
      </div>

      <div className="grid-3" style={{ gap: 8, marginBottom: 16 }}>
        <MiniStat label="Визитов" value={client.visits} />
        <MiniStat label="Последний" value={client.last} />
        <MiniStat label="Статус" value={<StatusBadge status={client.status} />} />
      </div>

      {client.notes && (
        <>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Заметки</div>
          <div className="card" style={{ padding: 12, background: 'var(--surface-2)', fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>
            {client.notes}
          </div>
        </>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Теги</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        <span className="chip">{client.status === 'vip' ? 'VIP' : 'регулярный'}</span>
        <span className="chip">окрашивание</span>
        <span className="chip">тёплые тона</span>
        <span className="chip"><Icon name="plus" size={10} /> добавить</span>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>История</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { date: '15 мая', service: 'Тонирование', price: 4500 },
          { date: '24 апр', service: 'Стрижка',     price: 3800 },
          { date: '03 апр', service: 'Окрашивание AirTouch', price: 12500 },
          { date: '18 мар', service: 'Глубокий уход K18', price: 3200 },
        ].map((v, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{v.service}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{v.date}</div>
            </div>
            <div className="tabular" style={{ fontSize: 13, color: 'var(--text-2)' }}>{v.price.toLocaleString('ru-RU')} ₽</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', textAlign: 'center' }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
