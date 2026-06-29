'use client';

import { Fragment, useMemo, useState } from 'react';
import { useTheme } from '../theme';
import { Card, Divider, Avatar, EmptyState, SearchBox, Icon } from '../primitives/atoms';
import { MiniBottomSheet } from '../primitives/mini-bottom-sheet';
import { type Client } from '@/lib/mini-demo';
import { useMiniData } from '@/hooks/use-mini-data';
import { haptic, useMiniToast } from '../bridge';

export function ClientsScreen({ go }: { go?: (kind: string) => void }) {
  const { T } = useTheme();
  const { CLIENTS } = useMiniData();
  const { show } = useMiniToast();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Client | null>(null);
  const filtered = useMemo(() => CLIENTS.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)
  ), [q, CLIENTS]);

  return (
    <div style={{ padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Клиенты</div>
        <div style={{ fontSize: 13, color: T.text2, marginTop: 2 }}>
          {CLIENTS.length} человек · {CLIENTS.reduce((a, c) => a + c.visits, 0)} визитов всего.
        </div>
      </div>

      <SearchBox value={q} onChange={setQ} placeholder="Поиск по имени или телефону" />

      <Card padded={false}>
        {filtered.map((c, i) => (
          <Fragment key={i}>
            <ClientRow client={c} onClick={() => setActive(c)} />
            {i < filtered.length - 1 && <Divider />}
          </Fragment>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 16 }}>
            <EmptyState
              icon={q ? 'search-x' : 'users'}
              title={q ? 'Никого не найдено' : 'Клиентов пока нет'}
              text={q ? 'Проверь имя или номер телефона.' : 'Клиенты появятся после первых записей из формы, Telegram или ВК.'}
            />
          </div>
        )}
      </Card>

      <MiniBottomSheet open={Boolean(active)} onClose={() => setActive(null)} maxHeight="min(72vh, 560px)" tail>
        <ClientSheetContent
          client={active}
          onClose={() => setActive(null)}
          onChat={() => { setActive(null); go?.('chats'); }}
          onBook={() => { setActive(null); show('Создание записи скоро', 'info'); }}
        />
      </MiniBottomSheet>
    </div>
  );
}

function ClientRow({ client, onClick }: { client: Client; onClick?: () => void }) {
  const { T } = useTheme();
  return (
    <div onClick={onClick} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
      <Avatar name={client.name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: T.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</div>
        <div style={{ fontSize: 12, color: T.text2, fontVariantNumeric: 'tabular-nums' }}>{client.phone}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, color: T.text, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          {client.total.toLocaleString('ru-RU')} ₽
        </div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          {client.visits} визитов
        </div>
      </div>
    </div>
  );
}

function ClientSheetContent({
  client,
  onClose,
  onChat,
  onBook,
}: {
  client: Client | null;
  onClose: () => void;
  onChat: () => void;
  onBook: () => void;
}) {
  const { T } = useTheme();

  if (!client) return null;

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar name={client.name} size={46} radius={16} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '-0.025em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {client.name}
            </div>
            <a href={`tel:${client.phone}`} style={{ display: 'block', marginTop: 4, fontSize: 12, color: T.accent, textDecoration: 'none', fontVariantNumeric: 'tabular-nums' }}>
              {client.phone}
            </a>
          </div>
        </div>

        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 11, border: `1px solid ${T.border}`, background: T.cardElev, color: T.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
          <Icon name="x" size={15} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <ClientStat label="Визитов" value={String(client.visits)} />
        <ClientStat label="Сумма" value={`${client.total.toLocaleString('ru-RU')} ₽`} />
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 16, background: T.cardElev, border: `1px solid ${T.border}`, marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>Профиль клиента</div>
        <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.45 }}>
          Здесь можно быстро перейти в чат, создать запись или связаться с клиентом.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={() => { haptic('light'); onChat(); }}
          style={{ ...actionButton, background: T.accent, borderColor: T.accent, color: '#fff' }}
        >
          <Icon name="message-square" size={16} />
          Чат
        </button>

        <button
          onClick={() => { haptic('light'); onBook(); }}
          style={actionButton}
        >
          <Icon name="calendar-plus" size={16} />
          Записать
        </button>
      </div>
    </div>
  );
}

function ClientStat({ label, value }: { label: string; value: string }) {
  const { T } = useTheme();
  return (
    <div style={{ padding: '12px 14px', borderRadius: 16, background: T.cardElev, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}