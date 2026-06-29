'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/components/mini/theme';
import { ActionSheet, BottomSheet, FieldLabel, Divider, Avatar, Icon, NeutralBtn, Toggle, Pill, ChannelTag, Card } from '@/components/mini/primitives/atoms';
import type { Appointment, Client, Service, Template } from '@/lib/mini-demo';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function copyText(text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return Promise.reject(new Error('clipboard'));
  return navigator.clipboard.writeText(text);
}

function statusLabel(status?: string) {
  if (status === 'in-focus') return 'В фокусе';
  if (status === 'completed') return 'Завершена';
  if (status === 'cancelled') return 'Отменена';
  if (status === 'scheduled') return 'Запланирована';
  return 'Статус';
}

function statTone(T: ReturnType<typeof useTheme>['T'], tone?: 'accent' | 'success' | 'danger') {
  if (tone === 'accent') return { bg: T.accentSoft, color: T.accent, border: `1px solid ${T.accentSoft}` };
  if (tone === 'success') return { bg: 'rgba(34,197,94,0.10)', color: T.success, border: `1px solid rgba(34,197,94,0.18)` };
  if (tone === 'danger') return { bg: 'rgba(239,68,68,0.10)', color: T.danger, border: `1px solid rgba(239,68,68,0.18)` };
  return { bg: T.cardElev, color: T.text, border: `1px solid ${T.border}` };
}

function SheetStat({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'success' | 'danger' }) {
  const { T } = useTheme();
  const palette = statTone(T, tone);
  return (
    <div style={{ borderRadius: 14, padding: '12px 14px', background: palette.bg, border: palette.border }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8, color: palette.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function InputCard({ label, children }: { label: string; children: ReactNode }) {
  const { T, mode } = useTheme();
  return (
    <div style={{
      background: mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(10,10,10,0.035)',
      border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.065)' : 'rgba(10,10,10,0.055)'}`,
      borderRadius: 14,
      padding: '12px 14px',
      boxShadow: mode === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.025)' : 'inset 0 1px 1px rgba(15,23,42,0.035)',
    }}>
      <FieldLabel style={{ fontSize: 9 }}>{label}</FieldLabel>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function DetailCell({ label, value, small }: { label: string; value: string; small?: boolean }) {
  const { T } = useTheme();
  return (
    <div style={{ background: T.cardElev, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 14, fontWeight: 500, color: T.text, marginTop: 8, lineHeight: 1.35, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</div>
    </div>
  );
}

export function ClientDetailSheet({
  client, onClose, onChat, onBook,
}: {
  client: Client | null;
  onClose: () => void;
  onChat?: (c: Client) => void;
  onBook?: (c: Client) => void;
}) {
  const { T } = useTheme();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!client) return;
    setNote('');
  }, [client?.phone]);

  if (!client) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;

  const avgCheck = Math.round(client.total / Math.max(client.visits, 1));
  const loyalty = client.visits >= 10 ? 'VIP' : client.visits >= 5 ? 'Постоянный' : 'Новый';

  return (
    <BottomSheet
      open={!!client}
      onClose={onClose}
      title={client.name}
      subtitle={<span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><ChannelTag channel={loyalty} /><span>{client.phone || 'Телефон не указан'}</span></span>}
    >
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={client.name} size={58} radius={18} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.text2 }}>Клиентская карточка</div>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 4, lineHeight: 1.45 }}>Быстрые действия, основные метрики и краткая заметка по клиенту.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <SheetStat label="Визитов" value={String(client.visits)} tone="accent" />
          <SheetStat label="Сумма" value={money(client.total)} />
          <SheetStat label="Средний чек" value={money(avgCheck)} tone="success" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NeutralBtn icon="phone" full onClick={() => { if (typeof window !== 'undefined') window.location.href = `tel:${client.phone}`; }}>Позвонить</NeutralBtn>
          <NeutralBtn icon="copy" full onClick={() => copyText(client.phone).catch(() => null)}>Скопировать</NeutralBtn>
          <NeutralBtn icon="message-circle" full onClick={() => onChat?.(client)}>Открыть чат</NeutralBtn>
          <NeutralBtn icon="calendar-plus" full onClick={() => onBook?.(client)}>Записать</NeutralBtn>
        </div>

        <InputCard label="Заметка по клиенту">
          <textarea
            className="cb-mini-transparent cb-mini-input-reset"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Например: любимый цвет, аллергии, пожелания, удобное время..."
            rows={4}
            style={{
              width: '100%', padding: 0, fontSize: 13, lineHeight: 1.55,
              background: 'transparent', backgroundColor: 'transparent', border: 'none', outline: 'none', resize: 'none',
              boxShadow: 'none', WebkitBoxShadow: 'none',
              color: T.text, WebkitTextFillColor: T.text, caretColor: T.accent, fontFamily: 'inherit',
            }}
          />
        </InputCard>

        <div style={{ paddingBottom: 2, fontSize: 11, color: T.text3, lineHeight: 1.5 }}>
          Заметка пока локальная внутри miniapp. Если нужно — следующим шагом могу вынести это в реальное хранение по клиенту.
        </div>
      </div>
    </BottomSheet>
  );
}

export function AppointmentDetailSheet({
  appt, onClose, onConfirm, onComplete, onCancel, onChat,
}: {
  appt: Appointment | null;
  onClose: () => void;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onChat?: (appt: Appointment) => void;
}) {
  const { T } = useTheme();
  if (!appt) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;

  const sourceLabel = appt.source || 'Канал не указан';
  const canManage = appt.status !== 'completed' && appt.status !== 'cancelled';
  const phone = appt.phone || '';

  return (
    <BottomSheet
      open={!!appt}
      onClose={onClose}
      title={appt.name}
      subtitle={<span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><ChannelTag channel={statusLabel(appt.status)} /><span>{appt.service}</span></span>}
    >
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <DetailCell label="Дата" value={appt.dateLabel || appt.date || '—'} />
          <DetailCell label="Время" value={appt.time} />
          <DetailCell label="Длительность" value={`${appt.dur} мин`} />
          <DetailCell label="Сумма" value={appt.price ? money(appt.price) : '—'} />
          <DetailCell label="Телефон" value={phone || '—'} small />
          <DetailCell label="Источник" value={sourceLabel} small />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NeutralBtn icon="message-circle" full onClick={() => onChat?.(appt)}>Написать</NeutralBtn>
          <NeutralBtn icon="phone" full onClick={() => phone && typeof window !== 'undefined' ? (window.location.href = `tel:${phone}`) : null}>Позвонить</NeutralBtn>
          <NeutralBtn icon="copy" full onClick={() => phone ? copyText(phone).catch(() => null) : null}>Скопировать</NeutralBtn>
          <NeutralBtn icon="calendar-clock" full onClick={() => onChat?.(appt)}>Перенести</NeutralBtn>
        </div>

        {canManage && (
          <>
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {onConfirm && <NeutralBtn icon="badge-check" full onClick={onConfirm}>Подтвердить запись</NeutralBtn>}
              {onComplete && <NeutralBtn icon="check-check" full onClick={onComplete}>Завершить визит</NeutralBtn>}
              {onCancel && <NeutralBtn icon="x-circle" full onClick={onCancel} style={{ color: T.danger, borderColor: 'rgba(239,68,68,0.24)' }}>Отменить запись</NeutralBtn>}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

export function ServiceDetailSheet({
  service, onClose, onSave, onDelete,
}: {
  service: Service | null;
  onClose: () => void;
  onSave?: (next: Service) => void;
  onDelete?: (s: Service) => void;
}) {
  const { T } = useTheme();
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(60);
  const [category, setCategory] = useState('Основное');
  const [status, setStatus] = useState<Service['status']>('active');
  const [visible, setVisible] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!service) return;
    setName(service.name);
    setPrice(service.price);
    setDuration(service.duration);
    setCategory(service.category ?? 'Основное');
    setStatus(service.status ?? 'active');
    setVisible(service.visible !== false);
  }, [service?.id, service?.n]);

  const footer = service ? (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <NeutralBtn full onClick={() => {
        onSave?.({
          ...service,
          name: name.trim() || service.name,
          price,
          duration,
          category,
          status,
          visible,
        });
        onClose();
      }}>Сохранить</NeutralBtn>
      <NeutralBtn icon="trash-2" full tone="danger" onClick={() => setConfirmDelete(true)}>Удалить</NeutralBtn>
    </div>
  ) : null;

  if (!service) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;

  const categories = ['Основное', 'Дизайн', 'Комплекс', 'Уход'];
  const statuses: { id: Service['status']; label: string }[] = [
    { id: 'active', label: 'Активна' },
    { id: 'seasonal', label: 'Сезонная' },
    { id: 'draft', label: 'Черновик' },
  ];

  return (
    <>
    <BottomSheet
      open={!!service}
      onClose={onClose}
      title={name || service.name}
      subtitle={`#${service.n} · ${service.count} записей · ${money(service.revenue ?? service.price * service.count)}`}
      footer={footer}
    >
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <InputCard label="Название">
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 16, fontWeight: 600, fontFamily: 'inherit' }} />
          </InputCard>
          <InputCard label="Категория">
            <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{category}</div>
          </InputCard>
          <InputCard label="Цена, ₽">
            <input inputMode="numeric" value={String(price)} onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '')) || 0)} style={{ width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit' }} />
          </InputCard>
          <InputCard label="Длительность, мин">
            <input inputMode="numeric" value={String(duration)} onChange={(e) => setDuration(Number(e.target.value.replace(/\D/g, '')) || 0)} style={{ width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit' }} />
          </InputCard>
        </div>

        <div>
          <FieldLabel>Статус</FieldLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {statuses.map((item) => (
              <Pill key={item.id} active={status === item.id} onClick={() => setStatus(item.id)}>{item.label}</Pill>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Категория</FieldLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {categories.map((item) => (
              <Pill key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Pill>
            ))}
          </div>
        </div>

        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.text }}>Показывать в форме записи</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Если выключить, услуга останется в системе, но скроется от клиентов.</div>
            </div>
            <Toggle on={visible} onChange={setVisible} />
          </div>
        </Card>
      </div>
    </BottomSheet>
    <ActionSheet
      open={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      title="Удалить услугу?"
      subtitle={`«${service.name}» исчезнет из miniapp и формы записи. История старых записей останется.`}
      actions={[
        {
          id: 'delete',
          label: 'Удалить услугу',
          sub: 'Это действие нельзя отменить из miniapp',
          icon: 'trash-2',
          tone: 'danger',
          onClick: () => { setConfirmDelete(false); onDelete?.(service); onClose(); },
        },
      ]}
    />
    </>
  );
}

export function TemplateDetailSheet({
  template, onClose, onSave, onDelete, onDuplicate,
}: {
  template: Template | null;
  onClose: () => void;
  onSave?: (next: Template) => void;
  onDelete?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
}) {
  const { T } = useTheme();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setBody(template.body);
  }, [template?.id]);

  const variables = useMemo(() => ['{имя}', '{дата}', '{время}', '{услуга}', '{ссылка}'], []);

  if (!template) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;

  return (
    <>
    <BottomSheet
      open={!!template}
      onClose={onClose}
      title={name || template.name}
      subtitle="Редактирование текста, быстрые переменные и предпросмотр сообщения."
      footer={
        <div style={{ display: 'grid', gridTemplateColumns: onDelete ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
          {onDuplicate && <NeutralBtn icon="copy-plus" full onClick={() => onDuplicate?.({ ...template, name, body })}>Дубль</NeutralBtn>}
          <NeutralBtn icon="check" full onClick={() => { onSave?.({ ...template, name: name.trim() || template.name, body }); onClose(); }}>Сохранить</NeutralBtn>
          {onDelete && <NeutralBtn icon="trash-2" full tone="danger" onClick={() => setConfirmDelete(true)}>Удалить</NeutralBtn>}
        </div>
      }
    >
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <InputCard label="Название">
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }} />
        </InputCard>

        <InputCard label="Текст">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            style={{ width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 13, lineHeight: 1.55, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </InputCard>

        <div>
          <FieldLabel>Переменные</FieldLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {variables.map((v) => (
              <button
                key={v}
                onClick={() => setBody((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + v)}
                style={{
                  fontSize: 11, padding: '7px 10px', borderRadius: 999,
                  border: `1px solid ${T.border}`, color: T.text2, fontFamily: 'monospace',
                  background: T.cardElev, cursor: 'pointer',
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        <Card style={{ padding: 14 }}>
          <FieldLabel>Предпросмотр</FieldLabel>
          <div style={{ marginTop: 10, fontSize: 13, color: T.text, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{body || 'Текст шаблона появится здесь.'}</div>
        </Card>
      </div>
    </BottomSheet>
    <ActionSheet
      open={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      title="Удалить шаблон?"
      subtitle={`«${template.name}» будет удалён из быстрых сообщений.`}
      actions={[
        {
          id: 'delete-template',
          label: 'Удалить шаблон',
          icon: 'trash-2',
          tone: 'danger',
          onClick: () => { setConfirmDelete(false); onDelete?.({ ...template, name, body }); onClose(); },
        },
      ]}
    />
    </>
  );
}
