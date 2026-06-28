import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../desktop-html-data';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../desktop-html-ui';

/* Services page */

export function ServicesPage({ platform }) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Все');
  const [editing, setEditing] = useState(null);
  const [localServices, setLocalServices] = useState(SERVICES);
  const services = platform?.services || localServices;

  const categories = ['Все', ...new Set(services.map(s => s.cat))];
  const filtered = services.filter(s =>
    (activeCat === 'Все' || s.cat === activeCat) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleField = (id, field) => {
    if (platform?.toggleServiceField) {
      platform.toggleServiceField(id, field);
      return;
    }
    setLocalServices(s => s.map(x => x.id === id ? { ...x, [field]: !x[field] } : x));
  };

  const saveService = (draft) => {
    const saved = platform?.saveService
      ? platform.saveService(draft)
      : (() => {
        const next = { ...draft, id: draft.id || `s_${Date.now()}` };
        setLocalServices(s => draft.id ? s.map(x => x.id === draft.id ? next : x) : [next, ...s]);
        return next;
      })();
    setEditing(saved || null);
  };
  const duplicateService = () => {
    const source = (editing?.id ? editing : filtered[0]) || services[0];
    if (!source) {
      platform?.recordAction?.('Нет услуги для дублирования');
      return;
    }
    setEditing({
      ...source,
      id: undefined,
      name: `${source.name} (копия)`,
      public: source.public ?? true,
      active: source.active ?? true,
    });
    platform?.recordAction?.('Дублирование услуги');
  };

  return (
    <div data-screen-label="05 Services">
      <div className="page-head">
        <div>
          <h1 className="page-title">Услуги</h1>
          <p className="page-subtitle">{services.filter(s => s.active).length} активных · {services.filter(s => s.public).length} видны клиентам</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="copy" kind="secondary" onClick={duplicateService}>Дублировать</Btn>
          <Btn icon="plus" kind="primary" onClick={() => setEditing({})}>Новая услуга</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ width: 280 }}>
          <Icon name="search" />
          <input className="input" placeholder="Найти услугу" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {categories.map(c => (
            <button key={c} className={`chip ${activeCat === c ? 'active' : ''}`} onClick={() => setActiveCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr 380px' : '1fr', gap: 16, alignItems: 'flex-start' }}>
        {/* Grid of services */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(s => (
            <ServiceCard key={s.id} s={s} onEdit={() => setEditing(s)} onToggle={toggleField} active={editing?.id === s.id} />
          ))}
          <button onClick={() => setEditing({})} style={{
            border: '1.5px dashed var(--line-2)',
            borderRadius: 'var(--r-md)',
            padding: 'var(--pad-card)',
            background: 'transparent',
            color: 'var(--text-3)',
            font: 'inherit',
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 6,
            minHeight: 160,
            transition: 'border-color 120ms, color 120ms',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.color = 'var(--text-3)'; }}>
            <Icon name="plus" size={18} />
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>Добавить услугу</span>
          </button>
        </div>

        {editing && <ServiceEditor s={editing} onClose={() => setEditing(null)} onSave={saveService} />}
      </div>
    </div>
  );
}

function ServiceCard({ s, onEdit, onToggle, active }) {
  return (
    <div className="card hoverable" style={{
      padding: 18,
      cursor: 'pointer',
      ...(active ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' } : {}),
    }} onClick={onEdit}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.cat}</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, letterSpacing: '-0.01em' }}>{s.name}</div>
        </div>
        <button className="btn btn-ghost icon" onClick={e => { e.stopPropagation(); onEdit?.(); }}><Icon name="more-v" size={13} /></button>
      </div>

      {s.short && (
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5, textWrap: 'pretty' }}>
          {s.short}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
        <div className="tabular" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>
          {s.price === 0 ? <span className="serif" style={{ fontStyle: 'italic', color: 'var(--success)' }}>бесплатно</span> : <>{s.price.toLocaleString('ru-RU')}<span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 400 }}> ₽</span></>}
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>· {s.dur} мин</div>
      </div>

      <div className="divider" style={{ margin: '14px -18px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
          <Icon name={s.public ? 'eye' : 'eye-off'} size={12} />
          {s.public ? 'видна клиентам' : 'скрыта'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Активна</span>
          <Switch on={s.active} onChange={() => onToggle(s.id, 'active')} />
        </div>
      </div>
    </div>
  );
}

function ServiceEditor({ s, onClose, onSave }) {
  const [form, setForm] = useState({
    id: s.id,
    name: s.name || '',
    cat: s.cat || 'Стрижка',
    dur: s.dur || 60,
    price: s.price || 0,
    short: s.short || '',
    public: s.public ?? true,
    active: s.active ?? true,
  });
  return (
    <Card style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="section-title">{s.id ? 'Редактирование' : 'Новая услуга'}</div>
          <div className="section-sub" style={{ marginTop: 2 }}>{s.id ? 'Сохранится автоматически' : 'Заполните данные'}</div>
        </div>
        <button className="btn btn-ghost icon" onClick={onClose}><Icon name="x" size={14} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <div className="field-label">Название</div>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Например, Стрижка волос" />
        </div>
        <div className="field">
          <div className="field-label">Категория</div>
          <select className="select" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
            {['Окрашивание','Стрижка','Уход','Укладка','Консультация'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid-2">
          <div className="field">
            <div className="field-label">Длительность</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" className="input" value={form.dur} onChange={e => setForm({ ...form, dur: +e.target.value })} />
              <span className="muted" style={{ alignSelf: 'center', fontSize: 12 }}>мин</span>
            </div>
          </div>
          <div className="field">
            <div className="field-label">Цена</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="number" className="input" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
              <span className="muted" style={{ alignSelf: 'center', fontSize: 12 }}>₽</span>
            </div>
          </div>
        </div>
        <div className="field">
          <div className="field-label">Описание</div>
          <textarea className="textarea" value={form.short} onChange={e => setForm({ ...form, short: e.target.value })} placeholder="Что входит в услугу. Видно клиенту." />
        </div>

        <div className="card" style={{ padding: 12, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Активна</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Можно создавать записи</div>
            </div>
            <Switch on={form.active} onChange={v => setForm({ ...form, active: v })} />
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Видна на личной странице</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Клиенты могут самостоятельно записаться</div>
            </div>
            <Switch on={form.public} onChange={v => setForm({ ...form, public: v })} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <Btn kind="primary" style={{ flex: 1 }} onClick={() => onSave?.(form)}>{s.id ? 'Сохранить' : 'Создать'}</Btn>
          <Btn kind="ghost" onClick={onClose}>Отмена</Btn>
        </div>
      </div>
    </Card>
  );
}
