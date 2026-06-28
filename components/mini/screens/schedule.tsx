'use client';

import { Fragment, useEffect, useState } from 'react';
import { useTheme } from '../theme';
import {
  ActionSheet, Card, FieldLabel, SectionTitle, Divider, Toggle, NeutralBtn, ScreenHeader, BottomSheet,
} from '../primitives/atoms';
import { type ScheduleDay } from '@/lib/mini-demo';
import { useMiniData } from '@/hooks/use-mini-data';
import { useMiniToast } from '../bridge';

export function ScheduleScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { SCHEDULE, updateSection } = useMiniData();
  const { show } = useMiniToast();
  const [scheduleMode, setScheduleMode] = useState<'free' | 'template'>('template');
  const [days, setDays] = useState<ScheduleDay[]>(SCHEDULE);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [presetTarget, setPresetTarget] = useState<'workdays' | 'all' | 'custom' | null>(null);

  useEffect(() => { setDays(SCHEDULE); }, [SCHEDULE]);

  async function persist(next: ScheduleDay[]) {
    const ok = await updateSection('availability', next.map((d, idx) => ({
      id: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][idx],
      weekdayIndex: idx,
      label: d.d,
      status: d.on ? (idx === 5 ? 'short' : 'workday') : 'day-off',
      slots: d.on ? [`${d.from} – ${d.to}`] : [],
      breaks: [],
      custom: false,
      enabled: d.on,
      startTime: d.on ? d.from : null,
      endTime: d.on ? d.to : null,
    })));
    if (!ok) show('Не удалось сохранить', 'error');
    return ok;
  }

  const setDay = (i: number, patch: Partial<ScheduleDay>) => {
    const next = days.map((d, j) => (j === i ? { ...d, ...patch } : d));
    setDays(next);
    persist(next);
  };

  async function applyPreset(kind: 'workdays' | 'all' | 'custom') {
    let next: ScheduleDay[];
    if (kind === 'workdays') {
      next = days.map((d, i) => ({
        ...d,
        on: i < 5,
        from: i < 5 ? '10:00' : '—',
        to: i < 5 ? '20:00' : '—',
      }));
    } else if (kind === 'all') {
      next = days.map((d) => ({ ...d, on: true, from: '10:00', to: '20:00' }));
    } else {
      next = days.map((d, i) => ({
        ...d,
        on: i !== 6,
        from: i === 6 ? '—' : i === 5 ? '11:00' : '10:00',
        to: i === 6 ? '—' : i === 5 ? '17:00' : i === 4 ? '18:00' : '20:00',
      }));
    }
    setDays(next);
    if (await persist(next)) show('Расписание применено', 'success');
  }

  const opts = [
    { id: 'free' as const, label: 'Свободный' },
    { id: 'template' as const, label: 'По шаблону' },
  ];

  return (
    <div>
      <ScreenHeader title="График работы" subtitle="Дни и часы приёма." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
          padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          boxShadow: T.cardShadow,
        }}>
          {opts.map((opt) => (
            <button key={opt.id} onClick={() => setScheduleMode(opt.id)} style={{
              padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: scheduleMode === opt.id ? T.cardElev : 'transparent',
              color: scheduleMode === opt.id ? T.text : T.text2,
              fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              boxShadow: scheduleMode === opt.id && T.cardShadow !== 'none' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>{opt.label}</button>
          ))}
        </div>

        <div>
          <SectionTitle title="Расписание" subtitle="Тапни день, чтобы изменить часы." />
          <Card padded={false}>
            {days.map((d, i) => (
              <Fragment key={d.d}>
                <div onClick={() => d.on && setOpenDay(i)} style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
                  cursor: d.on ? 'pointer' : 'default', opacity: d.on ? 1 : 0.5,
                }}>
                  <div style={{ minWidth: 30, fontSize: 13, color: T.text2, fontWeight: 500 }}>{d.d}</div>
                  <div style={{ flex: 1, fontSize: 14, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                    {d.on ? `${d.from} – ${d.to}` : 'Выходной'}
                  </div>
                  <Toggle on={d.on} onChange={(v) => setDay(i, { on: v, from: v && d.from === '—' ? '10:00' : d.from, to: v && d.to === '—' ? '20:00' : d.to })} size="sm" />
                </div>
                {i < days.length - 1 && <Divider />}
              </Fragment>
            ))}
          </Card>
        </div>

        <div>
          <SectionTitle title="Шаблоны" subtitle="Быстро применить к неделе." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <NeutralBtn onClick={() => setPresetTarget('workdays')}>Будни</NeutralBtn>
            <NeutralBtn onClick={() => setPresetTarget('all')}>Все дни</NeutralBtn>
            <NeutralBtn onClick={() => setPresetTarget('custom')}>Кастом</NeutralBtn>
          </div>
        </div>

        <div style={{
          padding: 16, border: `1px dashed ${T.border}`, borderRadius: 12,
          fontSize: 12, color: T.text2, lineHeight: 1.5,
        }}>
          Перерыв и обеды настраиваются внутри каждого дня. Праздничные исключения — в отдельной вкладке.
        </div>
      </div>

      <DayEditSheet
        day={openDay !== null ? days[openDay] : null}
        idx={openDay}
        onClose={() => setOpenDay(null)}
        onSave={async (idx, from, to) => {
          if (idx === null) return;
          const next = days.map((d, j) => (j === idx ? { ...d, from, to, on: true } : d));
          setDays(next);
          if (await persist(next)) show('Сохранено', 'success');
          setOpenDay(null);
        }}
      />
      <ActionSheet
        open={!!presetTarget}
        onClose={() => setPresetTarget(null)}
        title="Применить шаблон?"
        subtitle="Текущее расписание недели будет заменено выбранным пресетом."
        actions={[
          {
            id: 'apply-preset',
            label: presetTarget === 'workdays' ? 'Применить «Будни»' : presetTarget === 'all' ? 'Применить «Все дни»' : 'Применить «Кастом»',
            icon: 'calendar-check',
            tone: 'primary',
            onClick: () => { if (presetTarget) void applyPreset(presetTarget); setPresetTarget(null); },
          },
        ]}
      />
    </div>
  );
}

function DayEditSheet({
  day, idx, onClose, onSave,
}: {
  day: ScheduleDay | null;
  idx: number | null;
  onClose: () => void;
  onSave: (idx: number | null, from: string, to: string) => void;
}) {
  const { T } = useTheme();
  const [from, setFrom] = useState('10:00');
  const [to, setTo] = useState('20:00');
  useEffect(() => {
    if (!day) return;
    setFrom(day.from === '—' ? '10:00' : day.from);
    setTo(day.to === '—' ? '20:00' : day.to);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <BottomSheet open={day !== null} onClose={onClose} title={day ? `${day.d} — рабочий день` : ''}>
      {day && (
        <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <TimeField label="Начало" value={from} onChange={setFrom} />
            <TimeField label="Конец" value={to} onChange={setTo} />
          </div>
          <div>
            <FieldLabel>Перерывы</FieldLabel>
            <Card padded={false} style={{ marginTop: 10 }}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: T.text, flex: 1 }}>Обед</span>
                <span style={{ fontSize: 13, color: T.text2, fontVariantNumeric: 'tabular-nums' }}>13:00 – 14:00</span>
              </div>
            </Card>
            <NeutralBtn icon="plus" full style={{ marginTop: 10 }}>Добавить перерыв</NeutralBtn>
          </div>
          <NeutralBtn icon="check" full onClick={() => onSave(idx, from, to)}>Сохранить</NeutralBtn>
        </div>
      )}
    </BottomSheet>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange?: (v: string) => void }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.cardElev, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: '12px 14px',
    }}>
      <FieldLabel style={{ fontSize: 9 }}>{label}</FieldLabel>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: '100%', marginTop: 6, padding: 0, fontSize: 18, fontWeight: 600,
          background: 'transparent', border: 'none', outline: 'none',
          color: T.text, fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit',
        }}
      />
    </div>
  );
}
