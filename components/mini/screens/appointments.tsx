'use client';

import { useMemo, useState } from 'react';
import { useTheme } from '../theme';
import { EmptyState, FieldLabel, NavBtn, NeutralBtn, StatusDot, Icon } from '../primitives/atoms';
import { MiniBottomSheet } from '../primitives/mini-bottom-sheet';
import { type Appointment } from '@/lib/mini-demo';
import { useMiniData } from '@/hooks/use-mini-data';
import { haptic, useMiniToast } from '../bridge';

function localIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateIsoWithOffset(offset: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return localIso(d);
}

function formatFullDate(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', weekday: 'long',
  });
}

function formatDayLabel(offset: number) {
  if (offset === 0) return 'Сегодня';
  if (offset === 1) return 'Завтра';
  if (offset === -1) return 'Вчера';
  return new Date(`${dateIsoWithOffset(offset)}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function money(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function dateTimeLabel(a?: Appointment | null) {
  if (!a) return '—';
  const date = a.date
    ? new Date(`${a.date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : '';
  return `${date}${date ? ' · ' : ''}${a.time}`;
}

export function AppointmentsScreen({ openAppt, go }: { openAppt?: (a: Appointment) => void; go?: (kind: string) => void }) {
  const { T } = useTheme();
  const { APPOINTMENTS, updateBookingStatus } = useMiniData();
  const { show } = useMiniToast();
  const [day, setDay] = useState(0);
  const [active, setActive] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const selectedDate = dateIsoWithOffset(day);
  const dayAppointments = useMemo(
    () => APPOINTMENTS
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [APPOINTMENTS, selectedDate],
  );

  const activeCount = dayAppointments.filter((a) => a.rawStatus !== 'cancelled' && a.rawStatus !== 'no_show').length;
  const totalHours = dayAppointments.reduce((sum, a) => sum + (a.rawStatus === 'cancelled' || a.rawStatus === 'no_show' ? 0 : a.dur), 0) / 60;
  const potentialRevenue = dayAppointments.reduce((sum, a) => sum + (a.rawStatus === 'cancelled' || a.rawStatus === 'no_show' ? 0 : (a.price ?? 0)), 0);

  async function changeStatus(a: Appointment, status: 'confirmed' | 'completed' | 'cancelled', label: string) {
    if (!a.id) { show('Запись без идентификатора', 'error'); return; }
    try {
      await updateBookingStatus(a.id, status);
      show(label, 'success');
      setActive(null);
    } catch {
      show('Не удалось обновить', 'error');
    }
  }

  return (
    <div style={{ padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Записи</div>
        <div style={{ fontSize: 13, color: T.text2, marginTop: 2 }}>Расписание и статусы по дням.</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <NavBtn icon="chevron-left" onClick={() => setDay((d) => d - 1)} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: T.text, letterSpacing: '-0.01em' }}>{formatDayLabel(day)}</div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{formatFullDate(selectedDate)}</div>
        </div>
        <NavBtn icon="chevron-right" onClick={() => setDay((d) => d + 1)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <SummaryStat label="Записей" value={String(activeCount)} />
        <SummaryStat label="Часов" value={totalHours.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} />
        <SummaryStat label="Доход" value={money(potentialRevenue)} small />
      </div>

      {dayAppointments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dayAppointments.map((a, i) => (
            <ApptCard
              key={a.id ?? `${a.date}-${a.time}-${i}`}
              appt={a}
              active={a.status === 'in-focus' || i === 0}
              onClick={() => { openAppt?.(a); setActive(a); }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="calendar-x"
          title="На этот день записей нет"
          text="Новые записи появятся здесь сразу после бронирования клиентом."
          action={day !== 0 ? <NeutralBtn icon="calendar-days" onClick={() => setDay(0)}>Вернуться к сегодня</NeutralBtn> : undefined}
        />
      )}

      {dayAppointments.length > 0 && (
        <div style={{
          padding: '16px 18px', border: `1px dashed ${T.border}`, borderRadius: 14,
          color: T.text3, fontSize: 12, lineHeight: 1.5,
        }}>
          Последняя запись заканчивается примерно в {lastFinish(dayAppointments)}. Свободные окна считаются по графику работы и длительности услуг.
        </div>
      )}

      <MiniBottomSheet open={Boolean(active)} onClose={() => setActive(null)} maxHeight="min(76vh, 620px)" tail>
        <AppointmentSheetContent
          appt={active}
          onClose={() => setActive(null)}
          onConfirm={active && active.rawStatus !== 'confirmed' ? () => changeStatus(active, 'confirmed', 'Запись подтверждена') : undefined}
          onComplete={active ? () => changeStatus(active, 'completed', 'Запись завершена') : undefined}
          onCancel={active ? () => {
            haptic('warning');
            setCancelTarget(active);
            setActive(null);
          } : undefined}
          onChat={active ? () => { setActive(null); go?.('chats'); } : undefined}
        />
      </MiniBottomSheet>

      <MiniBottomSheet open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} maxHeight="340px" tail>
        <CancelConfirmContent
          appt={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancel={() => {
            if (cancelTarget) void changeStatus(cancelTarget, 'cancelled', 'Запись отменена');
            setCancelTarget(null);
          }}
        />
      </MiniBottomSheet>
    </div>
  );
}

function AppointmentSheetContent({
  appt,
  onClose,
  onConfirm,
  onComplete,
  onCancel,
  onChat,
}: {
  appt: Appointment | null;
  onClose: () => void;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onChat?: () => void;
}) {
  const { T } = useTheme();

  if (!appt) return null;

  const actionButton = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 15,
    border: `1px solid ${T.border}`,
    background: T.cardElev,
    color: T.text,
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
  } as const;

  return (
    <div style={{ padding: '18px 18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.025em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {appt.name}
          </div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 5 }}>{appt.service}</div>
        </div>

        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 11, border: `1px solid ${T.border}`, background: T.cardElev, color: T.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
          <Icon name="x" size={15} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <SheetInfo label="Дата и время" value={dateTimeLabel(appt)} />
        <SheetInfo label="Длительность" value={`${appt.dur} мин`} />
        <SheetInfo label="Стоимость" value={money(appt.price ?? 0)} />
        <div style={{ padding: '12px 14px', borderRadius: 16, background: T.cardElev, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>Статус</div>
          <StatusDot status={appt.status} />
          <div style={{ marginTop: 7, fontSize: 12, color: T.text2 }}>{appt.statusLabel ?? 'Запланирована'}</div>
        </div>
      </div>

      {appt.phone && (
        <a href={`tel:${appt.phone}`} style={{
          marginBottom: 14,
          width: '100%',
          padding: '12px 14px',
          borderRadius: 15,
          border: `1px solid ${T.border}`,
          background: T.cardElev,
          color: T.accent,
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <Icon name="phone" size={16} />
          {appt.phone}
        </a>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {onConfirm && (
          <button onClick={() => { haptic('success'); onConfirm(); }} style={{ ...actionButton, background: T.accent, borderColor: T.accent, color: '#fff' }}>
            <Icon name="check" size={16} />
            Подтвердить
          </button>
        )}

        {onComplete && (
          <button onClick={() => { haptic('success'); onComplete(); }} style={actionButton}>
            <Icon name="check-circle" size={16} />
            Завершить
          </button>
        )}

        {onChat && (
          <button onClick={() => { haptic('light'); onChat(); }} style={actionButton}>
            <Icon name="message-square" size={16} />
            Чат
          </button>
        )}

        {onCancel && (
          <button onClick={onCancel} style={{ ...actionButton, borderColor: 'rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.10)', color: T.danger }}>
            <Icon name="x-circle" size={16} />
            Отменить
          </button>
        )}
      </div>
    </div>
  );
}

function CancelConfirmContent({
  appt,
  onClose,
  onCancel,
}: {
  appt: Appointment | null;
  onClose: () => void;
  onCancel: () => void;
}) {
  const { T } = useTheme();

  return (
    <div style={{ padding: '18px 18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Отменить запись?</div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 5, lineHeight: 1.45 }}>
            {appt ? `${appt.name} · ${appt.service} · ${appt.time}` : 'Запись будет отмечена как отменённая.'}
          </div>
        </div>

        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 11, border: `1px solid ${T.border}`, background: T.cardElev, color: T.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
          <Icon name="x" size={15} />
        </button>
      </div>

      <button
        onClick={() => { haptic('warning'); onCancel(); }}
        style={{
          width: '100%',
          padding: '13px 14px',
          borderRadius: 15,
          border: '1px solid rgba(239,68,68,0.28)',
          background: 'rgba(239,68,68,0.12)',
          color: T.danger,
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name="x-circle" size={16} />
        Отменить запись
      </button>
    </div>
  );
}

function SheetInfo({ label, value }: { label: string; value: string }) {
  const { T } = useTheme();
  return (
    <div style={{ padding: '12px 14px', borderRadius: 16, background: T.cardElev, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function lastFinish(items: Appointment[]) {
  const latest = [...items]
    .filter((a) => a.rawStatus !== 'cancelled' && a.rawStatus !== 'no_show')
    .sort((a, b) => (b.time.localeCompare(a.time)))[0];
  if (!latest) return '—';
  const [h, m] = latest.time.split(':').map(Number);
  const start = (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  const end = start + latest.dur;
  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
}

function SummaryStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
      boxShadow: T.cardShadow, padding: '12px 12px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <FieldLabel style={{ fontSize: 9 }}>{label}</FieldLabel>
      <div style={{ fontSize: small ? 14 : 18, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function ApptCard({ appt, active, onClick }: { appt: Appointment; active?: boolean; onClick?: () => void }) {
  const { T } = useTheme();
  const label = appt.status === 'in-focus' ? 'В фокусе' : appt.statusLabel ?? 'Запланирована';
  return (
    <div onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      boxShadow: T.cardShadow, padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      position: 'relative', overflow: 'hidden', cursor: 'pointer',
    }}>
      {active && <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 2, background: T.accent }} />}
      <div style={{ minWidth: 52 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{appt.time}</div>
        <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{appt.dur} мин</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: T.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.name}</div>
        <div style={{ fontSize: 12, color: T.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appt.service}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <StatusDot status={appt.status} />
        <span style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', maxWidth: 86, textAlign: 'right' }}>
          {label}
        </span>
      </div>
    </div>
  );
}