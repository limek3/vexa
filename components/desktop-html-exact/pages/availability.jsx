import React, { useMemo, useState } from 'react';
import { Icon, Badge, Card, Btn, Switch, Segmented, Empty, Metric, Spark } from '../desktop-html-ui';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const DEFAULT_DAYS = DAY_NAMES.map((label, index) => ({
  id: `day-${index}`,
  label,
  short: DAY_LABELS[index],
  status: index < 5 ? 'workday' : index === 5 ? 'short' : 'day-off',
  slots: index < 5 ? ['09:00–13:00', '14:00–19:00'] : index === 5 ? ['10:00–15:00'] : [],
  breaks: index < 5 ? ['13:00–14:00'] : [],
}));

const PRESETS = {
  balanced: DEFAULT_DAYS,
  dense: DAY_NAMES.map((label, index) => ({
    id: `day-${index}`,
    label,
    short: DAY_LABELS[index],
    status: index < 6 ? 'workday' : 'short',
    slots: index < 6 ? ['09:00–13:00', '14:00–20:00'] : ['11:00–15:00'],
    breaks: index < 6 ? ['13:00–14:00'] : [],
  })),
  soft: DAY_NAMES.map((label, index) => ({
    id: `day-${index}`,
    label,
    short: DAY_LABELS[index],
    status: index < 5 ? 'short' : 'day-off',
    slots: index < 5 ? ['10:00–16:00'] : [],
    breaks: [],
  })),
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function minutes(time) {
  const [hours, mins] = String(time || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (mins || 0);
}

function slotMinutes(slot) {
  const [start, end] = String(slot || '').split('–');
  if (!start || !end) return 0;
  return Math.max(0, minutes(end) - minutes(start));
}

function formatHours(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins ? `${hours} ч ${mins} мин` : `${hours} ч`;
}

function normalizeDays(value) {
  if (!Array.isArray(value) || value.length !== 7) return clone(DEFAULT_DAYS);
  return value.map((day, index) => ({
    id: day.id || `day-${index}`,
    label: day.label || DAY_NAMES[index],
    short: day.short || DAY_LABELS[index],
    status: ['workday', 'short', 'day-off'].includes(day.status) ? day.status : 'workday',
    slots: Array.isArray(day.slots) ? day.slots : [],
    breaks: Array.isArray(day.breaks) ? day.breaks : [],
  }));
}

function statusLabel(status) {
  if (status === 'day-off') return 'Выходной';
  if (status === 'short') return 'Короткий день';
  return 'Рабочий день';
}

function statusBadge(status) {
  if (status === 'day-off') return 'plain';
  if (status === 'short') return 'info';
  return 'success';
}

function dayLoad(day) {
  return day.slots.reduce((sum, slot) => sum + slotMinutes(slot), 0);
}

function DayBar({ day, max }) {
  const load = dayLoad(day);
  const pct = max ? Math.max(4, Math.round((load / max) * 100)) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6 }}>
        <span>{day.short}</span>
        <span>{load ? formatHours(load) : '—'}</span>
      </div>
      <div className="progress" style={{ height: 8 }}>
        <span style={{ width: `${pct}%`, opacity: day.status === 'day-off' ? 0.28 : 1 }} />
      </div>
    </div>
  );
}

function SlotsEditor({ day, onChange }) {
  const [draft, setDraft] = useState(() => day.slots.join('\n'));
  const [breaks, setBreaks] = useState(() => day.breaks.join('\n'));

  const commit = () => {
    onChange({
      ...day,
      slots: draft.split('\n').map((item) => item.trim()).filter(Boolean),
      breaks: breaks.split('\n').map((item) => item.trim()).filter(Boolean),
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
      <div className="field">
        <div className="field-label">Слоты</div>
        <textarea className="textarea" rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="09:00–13:00" />
      </div>
      <div className="field">
        <div className="field-label">Перерывы</div>
        <textarea className="textarea" rows={3} value={breaks} onChange={(event) => setBreaks(event.target.value)} placeholder="13:00–14:00" />
      </div>
      <Btn size="sm" kind="secondary" icon="check" onClick={commit}>Применить</Btn>
    </div>
  );
}

export function AvailabilityPage({ platform }) {
  const sourceDays = platform?.availabilityDays || platform?.moduleState?.availability?.days;
  const [days, setDays] = useState(() => normalizeDays(sourceDays));
  const [preset, setPreset] = useState('balanced');
  const [activeDay, setActiveDay] = useState(0);
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    const totalMinutes = days.reduce((sum, day) => sum + dayLoad(day), 0);
    const workingDays = days.filter((day) => day.status !== 'day-off').length;
    const slots = days.reduce((sum, day) => sum + day.slots.length, 0);
    const max = Math.max(...days.map(dayLoad), 1);
    return { totalMinutes, workingDays, slots, max };
  }, [days]);

  const updateDay = (index, patch) => {
    setDays((current) => current.map((day, dayIndex) => (
      dayIndex === index ? { ...day, ...(typeof patch === 'function' ? patch(day) : patch) } : day
    )));
  };

  const applyPreset = (value) => {
    setPreset(value);
    setDays(clone(PRESETS[value] || DEFAULT_DAYS));
  };

  const save = async () => {
    setSaving(true);
    try {
      await platform?.saveAvailability?.(days);
      platform?.recordAction?.('График сохранён', 'Доступность обновлена для desktop и сайта', { notify: true, icon: 'calendar' });
    } finally {
      setSaving(false);
    }
  };

  const selected = days[activeDay] || days[0];

  return (
    <div data-screen-label="Desktop Availability">
      <div className="page-head">
        <div>
          <h1 className="page-title">Доступность</h1>
          <p className="page-subtitle">Рабочий график, слоты и перерывы. Сохраняется в тот же workspace, что и сайт.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="refresh" kind="secondary" onClick={() => applyPreset('balanced')}>Сбросить</Btn>
          <Btn icon="check" kind="primary" onClick={save} disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить график'}</Btn>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Metric label="Рабочих дней" value={summary.workingDays} delta="на неделе" deltaKind="up" />
        <Metric label="Рабочее время" value={formatHours(summary.totalMinutes)} delta="суммарно" />
        <Metric label="Активных слотов" value={summary.slots} delta="для записи" />
        <Metric label="Буфер" value="15" unit="мин" delta="между визитами" sparkline={<Spark values={[10, 15, 15, 20, 15, 15]} height={24} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) 360px', gap: 18, alignItems: 'start' }}>
        <Card>
          <div className="card-head">
            <div>
              <div className="section-title">Недельный график</div>
              <div className="section-sub">Выберите день, включите/выключите и поправьте интервалы.</div>
            </div>
            <Segmented value={preset} onChange={applyPreset} items={[
              { value: 'balanced', label: 'Баланс' },
              { value: 'dense', label: 'Плотно' },
              { value: 'soft', label: 'Мягко' },
            ]} />
          </div>

          <div className="grid-7" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
            {days.map((day, index) => (
              <button
                key={day.id}
                type="button"
                className="card hoverable"
                onClick={() => setActiveDay(index)}
                style={{
                  padding: 12,
                  textAlign: 'left',
                  borderColor: activeDay === index ? 'var(--accent)' : 'var(--line)',
                  boxShadow: activeDay === index ? '0 0 0 3px var(--accent-soft)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <strong>{day.short}</strong>
                  <Badge kind={statusBadge(day.status)} className="plain">{day.status === 'day-off' ? 'off' : 'on'}</Badge>
                </div>
                <DayBar day={day} max={summary.max} />
              </button>
            ))}
          </div>

          {selected ? (
            <div className="card" style={{ background: 'var(--surface-2)', padding: 16 }}>
              <div className="card-head">
                <div>
                  <div className="section-title">{selected.label}</div>
                  <div className="section-sub">{statusLabel(selected.status)} · {selected.slots.join(', ') || 'нет доступных слотов'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge kind={statusBadge(selected.status)}>{statusLabel(selected.status)}</Badge>
                  <Switch
                    on={selected.status !== 'day-off'}
                    onChange={(enabled) => updateDay(activeDay, enabled ? { status: 'workday', slots: selected.slots.length ? selected.slots : ['10:00–18:00'] } : { status: 'day-off', slots: [], breaks: [] })}
                  />
                </div>
              </div>
              <Segmented value={selected.status} onChange={(value) => updateDay(activeDay, value === 'day-off' ? { status: value, slots: [], breaks: [] } : { status: value, slots: value === 'short' ? ['10:00–15:00'] : ['09:00–13:00', '14:00–19:00'], breaks: value === 'workday' ? ['13:00–14:00'] : [] })} items={[
                { value: 'workday', label: 'Рабочий' },
                { value: 'short', label: 'Короткий' },
                { value: 'day-off', label: 'Выходной' },
              ]} />
              <div style={{ marginTop: 14 }}>
                {selected.status === 'day-off' ? (
                  <Empty icon="calendar" title="День выключен" body="Клиенты не смогут выбрать этот день для записи." />
                ) : (
                  <SlotsEditor day={selected} onChange={(next) => updateDay(activeDay, next)} />
                )}
              </div>
            </div>
          ) : null}
        </Card>

        <div className="col">
          <Card>
            <div className="section-title">Правила записи</div>
            <div className="section-sub" style={{ marginTop: 4 }}>Настройки поведения календаря в desktop.</div>
            <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
            {[
              ['autoConfirm', 'Автоподтверждение', 'Новые записи сразу попадают в расписание.'],
              ['clientBuffer', 'Буфер между визитами', 'Оставлять 15 минут на подготовку.'],
              ['hidePastSlots', 'Скрывать прошедшие слоты', 'Клиент видит только актуальное время.'],
            ].map(([key, title, sub]) => (
              <div key={key} className="li-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13 }}>{title}</strong>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{sub}</div>
                </div>
                <Switch on={platform?.moduleState?.availability?.[key] ?? true} onChange={(value) => platform?.setModuleValue?.('availability', key, value)} />
              </div>
            ))}
          </Card>

          <Card>
            <div className="section-title">Синхронизация</div>
            <div className="section-sub" style={{ marginTop: 4 }}>Этот раздел подключён к workspace.</div>
            <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
            <div style={{ display: 'grid', gap: 10 }}>
              <SyncRow icon="check" title="Desktop" body="Редактирование внутри приложения" />
              <SyncRow icon="globe" title="Сайт" body="График сохраняется в workspace section" />
              <SyncRow icon="calendar" title="Записи" body="Новые записи используют эти интервалы" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SyncRow({ icon, title, body }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--accent-text)' }}>
        <Icon name={icon} size={14} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12 }}>{body}</div>
      </div>
    </div>
  );
}
