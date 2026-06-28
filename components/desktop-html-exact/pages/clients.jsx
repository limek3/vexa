import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../desktop-html-data';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../desktop-html-ui';

/* Clients page */

export function ClientsPage({ onCreate, platform }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('c1');
  const [sortBy, setSortBy] = useState('last');
  const [viewMode, setViewMode] = useState('list');
  const clients = platform?.clients || CLIENTS;
  const appointments = platform?.appointments || APPTS;
  const services = platform?.services || SERVICES;

  const tabs = [
    { value: 'all',      label: 'Все',         count: clients.length },
    { value: 'vip',      label: 'VIP',         count: clients.filter(c => c.status === 'vip').length },
    { value: 'regular',  label: 'Постоянные',  count: clients.filter(c => c.status === 'regular').length },
    { value: 'new',      label: 'Новые',       count: clients.filter(c => c.status === 'new').length },
    { value: 'inactive', label: 'Неактивные',  count: clients.filter(c => c.status === 'inactive').length },
  ];

  const filtered = clients.filter(c =>
    (tab === 'all' || c.status === tab) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
  );
  const sortedClients = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ru');
    if (sortBy === 'visits') return (b.visits || 0) - (a.visits || 0);
    return String(b.last || '').localeCompare(String(a.last || ''), 'ru');
  });
  const sortLabels = {
    last: 'последний визит',
    visits: 'визиты',
    name: 'имя',
  };
  const cycleSort = () => setSortBy((value) => ({ last: 'visits', visits: 'name', name: 'last' })[value] || 'last');

  const selected = clients.find(c => c.id === selectedId) || clients[0];

  return (
    <div data-screen-label="03 Clients">
      <div className="page-head">
        <div>
          <h1 className="page-title">Клиенты</h1>
          <p className="page-subtitle">{clients.length} в базе · {clients.filter(c => c.status === 'regular').length} постоянных · {clients.filter(c => c.status === 'new').length} новых</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="paperclip" kind="secondary">Импорт</Btn>
          <Btn icon="plus" kind="primary" onClick={() => {
            const client = platform?.createClient?.({ name: 'Новый клиент', phone: '+7 000 000 00 00' });
            if (client?.id) setSelectedId(client.id);
          }}>Новый клиент</Btn>
        </div>
      </div>

      <TabsUnderline value={tab} onChange={setTab} items={tabs} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div className="input-with-icon" style={{ flex: 1, maxWidth: 320 }}>
          <Icon name="search" />
          <input className="input" placeholder="Поиск по имени или телефону…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Btn size="sm" kind="ghost" icon="filter" onClick={() => platform?.recordAction?.('Фильтры клиентов')}>Фильтры</Btn>
        <Btn size="sm" kind="ghost" icon="sort" onClick={cycleSort}>Сортировка: {sortLabels[sortBy]}</Btn>
        <div className="spacer" />
        <div className="seg">
          <button className={`seg-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><Icon name="list" size={12} /></button>
          <button className={`seg-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Icon name="grid" size={12} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'flex-start' }}>
        {viewMode === 'list' ? <Card flush>
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
              {sortedClients.map(c => (
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
          {sortedClients.length === 0 && (
            <Empty icon="users" title="Никого не нашли" body="Попробуйте изменить запрос или сбросить фильтры" />
          )}
        </Card> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {sortedClients.map((c) => (
              <button
                type="button"
                key={c.id}
                className="card hoverable"
                onClick={() => setSelectedId(c.id)}
                style={{
                  padding: 14,
                  textAlign: 'left',
                  borderColor: selectedId === c.id ? 'var(--accent)' : 'var(--line)',
                  background: selectedId === c.id ? 'var(--surface-2)' : 'var(--surface)',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={c.name} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div className="mono muted" style={{ fontSize: 11.5 }}>{c.phone}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 12 }}>
                  <StatusBadge status={c.status} />
                  <span className="muted" style={{ fontSize: 12 }}>{c.visits} визит.</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-3)' }}>Следующая: {c.next !== '—' ? c.next : 'нет'}</div>
              </button>
            ))}
            {sortedClients.length === 0 && (
              <Card><Empty icon="users" title="Никого не нашли" body="Попробуйте изменить запрос или сбросить фильтры" /></Card>
            )}
          </div>
        )}

        {selected && <ClientPanel client={selected} appointments={appointments} services={services} onCreate={onCreate} />}
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

function ClientPanel({ client, appointments = APPTS, services = SERVICES, onCreate }) {
  const visits = appointments.filter(a => a.clientId === client.id).map(a => ({
    ...a,
    service: services.find(s => s.id === a.serviceId),
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
        <Btn size="sm" kind="secondary" icon="plus" style={{ flex: 1 }} onClick={onCreate}>Записать</Btn>
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
