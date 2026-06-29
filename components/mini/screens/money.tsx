'use client';

import { type CSSProperties, type ReactNode, Fragment, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../theme';
import {
  Card, EmptyState, FieldLabel, SectionTitle, Divider, Avatar, Toggle, Pill, Icon, NeutralBtn,
  ListRow, ScreenHeader, BottomSheet,
} from '../primitives/atoms';
import {
  INTEGRATIONS,
  type FinanceOp, type Integration, type Review,
} from '@/lib/mini-demo';
import { useMiniToast } from '../bridge';
import { useMiniData } from '@/hooks/use-mini-data';
import { useApp } from '@/lib/app-context';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

function copyText(text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return Promise.reject(new Error('clipboard'));
  return navigator.clipboard.writeText(text);
}

export function FinanceScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { show } = useMiniToast();
  const { APPOINTMENTS } = useMiniData();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const completed = APPOINTMENTS.filter((a) => a.rawStatus === 'completed');
  const processing = APPOINTMENTS.filter((a) => a.rawStatus === 'new' || a.rawStatus === 'confirmed');
  const balance = completed.reduce((sum, a) => sum + (a.price ?? 0), 0);
  const processingAmount = processing.reduce((sum, a) => sum + (a.price ?? 0), 0);
  const ops: FinanceOp[] = completed
    .slice()
    .sort((a, b) => `${b.date ?? ''} ${b.time}`.localeCompare(`${a.date ?? ''} ${a.time}`))
    .slice(0, period === 'week' ? 8 : period === 'month' ? 20 : 50)
    .map((a) => ({
      date: a.date ? new Date(`${a.date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : a.dateLabel ?? '',
      desc: `${a.service} · ${a.name}`,
      amount: a.price ?? 0,
    }));

  async function withdraw() {
    const n = parseInt(amount.replace(/\s/g, ''), 10);
    if (!n || n <= 0) { show('Введите сумму', 'error'); return; }
    if (n > balance) { show('Сумма больше баланса', 'error'); return; }
    setWithdrawOpen(false);
    setAmount('');
    show(`Заявка на ${n.toLocaleString('ru-RU')} ₽ создана`, 'success');
  }

  return (
    <div>
      <ScreenHeader title="Финансы" subtitle="Баланс, история, выплаты." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <FieldLabel>Доступно к выводу</FieldLabel>
          <div style={{ fontSize: 36, fontWeight: 600, color: T.text, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginTop: 10, lineHeight: 1 }}>
            {money(balance)}
          </div>
          <div style={{ fontSize: 12, color: T.text2, marginTop: 8 }}>+ {money(processingAmount)} в обработке</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <NeutralBtn icon="arrow-up-right" full onClick={() => setWithdrawOpen(true)}>Вывести</NeutralBtn>
            <NeutralBtn icon="arrow-down-left" full onClick={() => show('Пополнение через эквайринг', 'info')}>Пополнить</NeutralBtn>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 8 }}>
          <Pill active={period === 'week'} onClick={() => setPeriod('week')}>Неделя</Pill>
          <Pill active={period === 'month'} onClick={() => setPeriod('month')}>Месяц</Pill>
          <Pill active={period === 'all'} onClick={() => setPeriod('all')}>Всё</Pill>
        </div>

        <SectionTitle title="История операций" />
        <Card padded={false}>
          {ops.length > 0 ? ops.map((op, i) => (
            <Fragment key={`${op.date}-${op.desc}-${i}`}>
              <FinanceOpRow op={op} />
              {i < ops.length - 1 && <Divider />}
            </Fragment>
          )) : (
            <div style={{ padding: 16 }}>
              <EmptyState icon="receipt" title="Операций пока нет" text="Завершённые оплаты появятся здесь после закрытия записей." />
            </div>
          )}
        </Card>

        <SectionTitle title="Реквизиты для выплат" />
        <Card padded={false}>
          <ListRow icon="credit-card" label="Карта не подключена" sub="Добавьте способ вывода в настройках" />
          <Divider />
          <ListRow icon="plus" label="Добавить способ" onClick={() => show('Добавление через настройки платежей', 'info')} />
        </Card>
      </div>

      <BottomSheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Вывод средств" subtitle={`Доступно ${money(balance)} · обычно в течение 1 рабочего дня`}>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SheetInput label="Сумма, ₽">
            <input
              autoFocus
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d ]/g, ''))}
              placeholder="0"
              style={sheetBigInput(T)}
            />
          </SheetInput>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <NeutralBtn onClick={() => setAmount(String(Math.floor(balance / 2)))}>50%</NeutralBtn>
            <NeutralBtn onClick={() => setAmount(String(balance))}>Всё</NeutralBtn>
            <NeutralBtn onClick={() => setAmount('')}>Сброс</NeutralBtn>
          </div>
          <NeutralBtn icon="check" full onClick={withdraw}>Подтвердить</NeutralBtn>
        </div>
      </BottomSheet>
    </div>
  );
}

function FinanceOpRow({ op }: { op: FinanceOp }) {
  const { T } = useTheme();
  const positive = op.amount > 0;
  return (
    <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, background: T.cardElev, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2,
      }}>
        <Icon name={positive ? 'arrow-down-left' : 'arrow-up-right'} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.desc}</div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{op.date}</div>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
        color: positive ? T.success : T.danger,
      }}>
        {positive ? '+' : ''}{money(op.amount)}
      </div>
    </div>
  );
}

type PaymentMethodKey = 'cash' | 'card' | 'sbp' | 'link';
interface PaymentMethod {
  id: PaymentMethodKey;
  label: string;
  sub: string;
  fee: string;
  on: boolean;
  description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', label: 'Наличные', sub: 'Без комиссии', fee: '0%', on: true, description: 'Классический способ оплаты без внешней интеграции.' },
  { id: 'card', label: 'Банковская карта', sub: 'Комиссия 2.4%', fee: '2.4%', on: true, description: 'Оплата через эквайринг или терминал после визита.' },
  { id: 'sbp', label: 'СБП', sub: 'Комиссия 0.7%', fee: '0.7%', on: true, description: 'Быстрая оплата по QR или ссылке через Систему быстрых платежей.' },
  { id: 'link', label: 'Ссылка на оплату', sub: 'Без онлайн-эквайринга', fee: 'по эквайрингу', on: false, description: 'Ссылка для удалённой оплаты до или после визита.' },
];

export function PaymentsScreen({ back }: { back: () => void }) {
  const { show } = useMiniToast();
  const [methods, setMethods] = useState<PaymentMethod[]>(PAYMENT_METHODS);
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null);
  const [activeAcquirer, setActiveAcquirer] = useState<'tinkoff' | 'yookassa' | null>(null);

  const updateMethod = (next: PaymentMethod) => {
    setMethods((prev) => prev.map((item) => (item.id === next.id ? next : item)));
  };

  const toggleMethod = (id: PaymentMethodKey) => {
    setMethods((prev) => prev.map((item) => item.id === id ? { ...item, on: !item.on } : item));
  };

  return (
    <div>
      <ScreenHeader title="Платежи" subtitle="Способы приёма оплат и эквайринг." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle title="Способы" subtitle="Открывай способ, чтобы настроить детали." />
        <Card padded={false}>
          {methods.map((method, idx) => (
            <Fragment key={method.id}>
              <PayRow
                label={method.label}
                sub={method.sub}
                on={method.on}
                onChange={() => toggleMethod(method.id)}
                onClick={() => setActiveMethod(method)}
              />
              {idx < methods.length - 1 && <Divider />}
            </Fragment>
          ))}
        </Card>

        <SectionTitle title="Подключённые эквайринги" />
        <Card padded={false}>
          <ListRow icon="landmark" label="Тинькофф Касса" sub="ID: 1002457831 · активен" onClick={() => setActiveAcquirer('tinkoff')} />
          <Divider />
          <ListRow icon="landmark" label="ЮKassa" sub="не подключено" onClick={() => setActiveAcquirer('yookassa')} />
          <Divider />
          <ListRow icon="plus" label="Добавить эквайринг" onClick={() => show('Подключение нового эквайринга добавлю следующим шагом', 'info')} />
        </Card>
      </div>

      <PaymentMethodSheet
        method={activeMethod}
        onClose={() => setActiveMethod(null)}
        onSave={(next) => { updateMethod(next); setActiveMethod(null); show('Способ оплаты обновлён', 'success'); }}
      />
      <AcquirerSheet
        acquirer={activeAcquirer}
        onClose={() => setActiveAcquirer(null)}
      />
    </div>
  );
}

function PayRow({ label, sub, on, onChange, onClick }: { label: string; sub: string; on: boolean; onChange: (n: boolean) => void; onClick?: () => void }) {
  const { T } = useTheme();
  return (
    <div onClick={onClick} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: T.text }}>{label}</div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{sub}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} style={{ background: 'transparent', border: 'none', color: T.text3, cursor: 'pointer', padding: 4 }}>
        <Icon name="settings-2" size={15} />
      </button>
      <div onClick={(e) => e.stopPropagation()}>
        <Toggle on={on} onChange={onChange} />
      </div>
    </div>
  );
}

function PaymentMethodSheet({ method, onClose, onSave }: { method: PaymentMethod | null; onClose: () => void; onSave: (next: PaymentMethod) => void }) {
  const { T } = useTheme();
  const [draft, setDraft] = useState<PaymentMethod | null>(method);

  useEffect(() => {
    setDraft(method);
  }, [method]);

  if (!draft) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;
  return (
    <BottomSheet open={!!draft} onClose={onClose} title={draft.label} subtitle={draft.description} footer={<NeutralBtn icon="check" full onClick={() => onSave(draft)}>Сохранить</NeutralBtn>}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SheetInput label="Подпись для клиента">
          <input value={draft.sub} onChange={(e) => setDraft({ ...draft, sub: e.target.value })} style={sheetTextInput(T)} />
        </SheetInput>
        <SheetInput label="Комиссия / примечание">
          <input value={draft.fee} onChange={(e) => setDraft({ ...draft, fee: e.target.value })} style={sheetTextInput(T)} />
        </SheetInput>
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.text }}>Показывать способ оплаты</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Клиент увидит его в сценарии оплаты и после записи.</div>
            </div>
            <Toggle on={draft.on} onChange={(next) => setDraft({ ...draft, on: next })} />
          </div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NeutralBtn icon="qr-code" full onClick={() => onClose()}>QR / ссылка</NeutralBtn>
          <NeutralBtn icon="receipt-text" full onClick={() => onClose()}>Правила оплаты</NeutralBtn>
        </div>
      </div>
    </BottomSheet>
  );
}

function AcquirerSheet({ acquirer, onClose }: { acquirer: 'tinkoff' | 'yookassa' | null; onClose: () => void }) {
  const { T } = useTheme();
  if (!acquirer) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;
  const isActive = acquirer === 'tinkoff';
  const title = acquirer === 'tinkoff' ? 'Тинькофф Касса' : 'ЮKassa';
  return (
    <BottomSheet open={!!acquirer} onClose={onClose} title={title} subtitle={isActive ? 'Эквайринг подключён и используется в онлайн-оплатах.' : 'Подключение пока не завершено.'}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <MetricCardMini label="Статус" value={isActive ? 'Активен' : 'Ожидает'} accent={isActive} />
          <MetricCardMini label="Комиссия" value={acquirer === 'tinkoff' ? '2.4%' : '—'} />
        </div>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>
            {isActive ? 'Можно принимать оплату картой и ссылкой, сверять платежи и использовать онлайн-чеки.' : 'Для подключения понадобится merchant ID, ключи и callback URL. Могу следующим шагом связать это с реальными настройками backend.'}
          </div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NeutralBtn icon="shield-check" full onClick={onClose}>{isActive ? 'Проверить' : 'Подключить'}</NeutralBtn>
          <NeutralBtn icon="copy" full onClick={onClose}>Скопировать ID</NeutralBtn>
        </div>
      </div>
    </BottomSheet>
  );
}

export function IntegrationsScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { show } = useMiniToast();
  const [list, setList] = useState<Integration[]>(INTEGRATIONS);
  const [active, setActive] = useState<Integration | null>(null);

  const toggle = (id: string) => setList((ls) => ls.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  const save = (next: Integration) => {
    setList((ls) => ls.map((x) => (x.id === next.id ? next : x)));
    show('Интеграция обновлена', 'success');
  };

  return (
    <div>
      <ScreenHeader title="Интеграции" subtitle="Каналы и внешние сервисы, откуда приходят клиенты." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card padded={false}>
          {list.map((it, i) => (
            <Fragment key={it.id}>
              <div onClick={() => setActive(it)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: T.cardElev,
                  border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2,
                }}><Icon name={it.icon} size={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: T.text }}>{it.name}</span>
                    {it.on && <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.accent }} />}
                  </div>
                  <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{it.sub}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setActive(it); }} style={ghostButtonStyle(T)}>Настроить</button>
                <div onClick={(e) => e.stopPropagation()}>
                  <Toggle on={it.on} onChange={() => toggle(it.id)} size="sm" />
                </div>
              </div>
              {i < list.length - 1 && <Divider />}
            </Fragment>
          ))}
        </Card>
      </div>

      <IntegrationSheet integration={active} onClose={() => setActive(null)} onSave={(next) => { save(next); setActive(null); }} />
    </div>
  );
}

function IntegrationSheet({ integration, onClose, onSave }: { integration: Integration | null; onClose: () => void; onSave: (next: Integration) => void }) {
  const { T } = useTheme();
  const [draft, setDraft] = useState<Integration | null>(integration);

  useEffect(() => {
    setDraft(integration);
  }, [integration]);

  if (!draft) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;
  return (
    <BottomSheet open={!!draft} onClose={onClose} title={draft.name} subtitle={draft.sub} footer={<NeutralBtn icon="check" full onClick={() => onSave(draft)}>Сохранить</NeutralBtn>}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <MetricCardMini label="Статус" value={draft.on ? 'Подключено' : 'Выключено'} accent={draft.on} />
          <MetricCardMini label="Канал" value={draft.name} />
        </div>
        <SheetInput label="Описание">
          <textarea value={draft.sub} onChange={(e) => setDraft({ ...draft, sub: e.target.value })} rows={3} style={{ ...sheetTextInput(T), resize: 'none', lineHeight: 1.5 }} />
        </SheetInput>
        <Card style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.text }}>Интеграция активна</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Если выключить, новые записи из этого канала перестанут приниматься.</div>
            </div>
            <Toggle on={draft.on} onChange={(next) => setDraft({ ...draft, on: next })} />
          </div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <NeutralBtn icon="link" full onClick={onClose}>Проверить ссылку</NeutralBtn>
          <NeutralBtn icon="shield-check" full onClick={onClose}>Тест события</NeutralBtn>
        </div>
      </div>
    </BottomSheet>
  );
}

export function SourcesScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { show } = useMiniToast();
  const { APPOINTMENTS, MASTER } = useMiniData();
  const [utmOpen, setUtmOpen] = useState(false);
  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);

  const sourceStats = APPOINTMENTS
    .filter((a) => {
      if (!a.date) return true;
      const ms = new Date(`${a.date}T00:00:00`).getTime();
      return Number.isFinite(ms) ? ms >= since.getTime() : true;
    })
    .reduce<Record<string, { key: string; name: string; records: number }>>((acc, a) => {
      const raw = String(a.source || 'Web').toLowerCase();
      const key = raw.includes('telegram') || raw === 'тг' || raw === 'tg' ? 'telegram'
        : raw.includes('vk') || raw.includes('вк') ? 'vk'
        : raw.includes('instagram') || raw.includes('инст') ? 'instagram'
        : 'web';
      const name = key === 'telegram' ? 'Telegram'
        : key === 'vk' ? 'ВКонтакте'
        : key === 'instagram' ? 'Instagram'
        : 'Сайт / ссылка';
      acc[key] = acc[key] ?? { key, name, records: 0 };
      acc[key].records += 1;
      return acc;
    }, {});

  const sources = Object.values(sourceStats).sort((a, b) => b.records - a.records);
  const max = Math.max(...sources.map((s) => s.records), 1);
  const total = sources.reduce((a, s) => a + s.records, 0);

  return (
    <div>
      <ScreenHeader title="Каналы записи" subtitle="Источники трафика, ссылки и конверсия." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <FieldLabel>Записей за 30 дней</FieldLabel>
          <div style={{ fontSize: 32, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>{total}</div>
          <div style={{ fontSize: 12, color: T.text2, marginTop: 4 }}>{sources.length || 0} активных источников</div>
        </Card>

        <Card padded={false}>
          {sources.length > 0 ? sources.map((source, i) => (
            <Fragment key={source.key}>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: T.text, flex: 1 }}>{source.name}</span>
                  <span style={{ fontSize: 13, color: T.text, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{source.records}</span>
                </div>
                <div style={{ height: 2, background: T.skeleton, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${(source.records / max) * 100}%`, background: T.accent }} />
                </div>
                <div style={{ fontSize: 11, color: T.text3, fontVariantNumeric: 'tabular-nums' }}>доля {Math.round((source.records / Math.max(total, 1)) * 100)}%</div>
              </div>
              {i < sources.length - 1 && <Divider />}
            </Fragment>
          )) : (
            <div style={{ padding: 16 }}>
              <EmptyState icon="arrow-down-right" title="Источников пока нет" text="Каналы появятся после первых записей из ссылки, Telegram, ВК или сайта." />
            </div>
          )}
        </Card>

        <NeutralBtn icon="link" full onClick={() => setUtmOpen(true)}>Создать UTM-ссылку</NeutralBtn>
      </div>

      <UtmBuilderSheet masterLink={MASTER.link} onClose={() => setUtmOpen(false)} open={utmOpen} onSuccess={() => show('UTM-ссылка скопирована', 'success')} />
    </div>
  );
}

function UtmBuilderSheet({ open, onClose, onSuccess, masterLink }: { open: boolean; onClose: () => void; onSuccess: () => void; masterLink: string }) {
  const { T } = useTheme();
  const [source, setSource] = useState('telegram');
  const [medium, setMedium] = useState('miniapp');
  const [campaign, setCampaign] = useState('spring-promo');

  const preview = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://clickbook.app';
    const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign || 'campaign' });
    return `${base}${masterLink}?${params.toString()}`;
  }, [campaign, masterLink, medium, source]);

  return (
    <BottomSheet open={open} onClose={onClose} title="UTM-ссылка" subtitle="Собери ссылку для Telegram, ВК, рекламы или промо." footer={<NeutralBtn icon="copy" full onClick={() => copyText(preview).then(onSuccess, onClose)}>Скопировать ссылку</NeutralBtn>}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SheetInput label="Источник (utm_source)"><input value={source} onChange={(e) => setSource(e.target.value)} style={sheetTextInput(T)} /></SheetInput>
        <SheetInput label="Канал (utm_medium)"><input value={medium} onChange={(e) => setMedium(e.target.value)} style={sheetTextInput(T)} /></SheetInput>
        <SheetInput label="Кампания (utm_campaign)"><input value={campaign} onChange={(e) => setCampaign(e.target.value)} style={sheetTextInput(T)} /></SheetInput>
        <Card style={{ padding: 14 }}>
          <FieldLabel>Превью</FieldLabel>
          <div style={{ marginTop: 10, fontSize: 12, color: T.text, lineHeight: 1.55, wordBreak: 'break-all' }}>{preview}</div>
        </Card>
      </div>
    </BottomSheet>
  );
}

export function MarketingScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { show } = useMiniToast();
  const { CLIENTS, TEMPLATES } = useMiniData();
  return (
    <div>
      <ScreenHeader title="Маркетинг" subtitle="Рассылки и акции клиентам." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <FieldLabel>База для рассылок</FieldLabel>
          <div style={{ fontSize: 32, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>{CLIENTS.length}</div>
          <div style={{ fontSize: 12, color: T.text2, marginTop: 4 }}>клиентов с историей записей</div>
        </Card>

        <NeutralBtn icon="plus" full onClick={() => show('Конструктор рассылок скоро', 'info')}>Создать рассылку</NeutralBtn>

        <SectionTitle title="Активные кампании" />
        <EmptyState icon="megaphone" title="Кампаний пока нет" text="После подключения рассылок здесь появятся реальные статусы отправки и клики." />

        <SectionTitle title="Шаблоны промо-сообщений" />
        <Card padded={false}>
          {(TEMPLATES.length > 0 ? TEMPLATES : [
            { id: 'promo-1', name: 'Скидка постоянным клиентам', body: '' },
            { id: 'promo-2', name: 'Анонс новой услуги', body: '' },
            { id: 'promo-3', name: 'Возврат давно не приходивших', body: '' },
          ]).map((tpl, i, arr) => (
            <Fragment key={tpl.id}>
              <ListRow label={tpl.name} sub={tpl.body ? tpl.body.slice(0, 64) : undefined} onClick={() => show(`Шаблон «${tpl.name}» открыт`, 'info')} />
              {i < arr.length - 1 && <Divider />}
            </Fragment>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function ReviewsScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { show } = useMiniToast();
  const { MASTER } = useMiniData();
  const app = useApp();
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const reviews: Review[] = (app.ownedProfile?.reviews ?? []).map((r) => ({
    name: r.author,
    stars: r.rating,
    text: r.text,
    date: r.dateLabel ?? '',
  }));
  const reviewCount = reviews.length || app.ownedProfile?.reviewCount || 0;
  const avg = reviews.length > 0
    ? reviews.reduce((a, x) => a + x.stars, 0) / reviews.length
    : MASTER.rating;
  const dist = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => Math.round(r.stars) === stars).length }));
  const max = Math.max(...dist.map((x) => x.count), 1);
  const avgLabel = avg ? avg.toFixed(1) : '—';

  return (
    <div>
      <ScreenHeader title="Отзывы" subtitle={`${reviewCount} отзывов всего.`} onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', gap: 18 }}>
            <div>
              <div style={{ fontSize: 44, fontWeight: 600, color: T.text, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{avgLabel}</div>
              <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Icon key={i} name="star" size={11} color={avg && i <= Math.round(avg) ? T.text : T.text3} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{reviewCount} оценок</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
              {dist.map((d) => (
                <div key={d.stars} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: T.text3, width: 10, fontVariantNumeric: 'tabular-nums' }}>{d.stars}</span>
                  <div style={{ flex: 1, height: 4, background: T.skeleton, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.count / max) * 100}%`, background: T.accent }} />
                  </div>
                  <span style={{ fontSize: 10, color: T.text3, fontVariantNumeric: 'tabular-nums', minWidth: 18, textAlign: 'right' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <NeutralBtn icon="send" full onClick={() => show('Ссылка на отзыв отправлена', 'success')}>Запросить отзыв</NeutralBtn>

        <Card padded={false}>
          {reviews.length > 0 ? reviews.map((r, i) => (
            <Fragment key={`${r.name}-${i}`}>
              <ReviewRow r={r} onReply={() => setActiveReview(r)} />
              {i < reviews.length - 1 && <Divider />}
            </Fragment>
          )) : (
            <div style={{ padding: 16 }}>
              <EmptyState icon="star" title="Отзывов пока нет" text="Отзывы появятся здесь после первых оценок клиентов." />
            </div>
          )}
        </Card>
      </div>

      <ReviewReplySheet review={activeReview} onClose={() => setActiveReview(null)} onSend={() => { setActiveReview(null); show('Ответ на отзыв сохранён', 'success'); }} />
    </div>
  );
}

function ReviewRow({ r, onReply }: { r: Review; onReply?: () => void }) {
  const { T } = useTheme();
  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Avatar name={r.name} size={32} radius={16} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: T.text }}>{r.name}</div>
          <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Icon key={i} name="star" size={9} color={i <= r.stars ? T.text : T.text3} />
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: T.text3 }}>{r.date}</span>
      </div>
      <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{r.text}</div>
      <button onClick={onReply} style={{
        background: 'transparent', border: 'none', color: T.text2,
        fontSize: 12, padding: '8px 0 0', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="reply" size={12} /> Ответить
      </button>
    </div>
  );
}

function ReviewReplySheet({ review, onClose, onSend }: { review: Review | null; onClose: () => void; onSend: () => void }) {
  const { T } = useTheme();
  const [text, setText] = useState('');
  const templates = [
    'Спасибо за отзыв! Буду рада видеть вас снова.',
    'Спасибо за обратную связь. Очень приятно, что вам понравилось.',
    'Благодарю! Если захотите повторить визит — всегда на связи.',
  ];

  useEffect(() => {
    if (!review) {
      setText('');
      return;
    }
    const starter = review.stars >= 5
      ? 'Спасибо большое за тёплый отзыв! Буду рада видеть вас снова 💙'
      : 'Спасибо за отзыв и честную обратную связь. Учту это в работе.';
    setText(starter);
  }, [review?.name, review?.stars]);

  if (!review) return <BottomSheet open={false} onClose={onClose}><div /></BottomSheet>;
  return (
    <BottomSheet open={!!review} onClose={onClose} title={`Ответ · ${review.name}`} subtitle={`Оценка ${review.stars}/5`} footer={<NeutralBtn icon="send" full onClick={onSend}>Сохранить ответ</NeutralBtn>}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{review.text}</div>
        </Card>
        <SheetInput label="Ответ">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} style={{ ...sheetTextInput(T), resize: 'none', lineHeight: 1.55 }} />
        </SheetInput>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {templates.map((tpl) => (
            <button key={tpl} onClick={() => setText(tpl)} style={{ ...ghostButtonStyle(T), padding: '8px 10px', borderRadius: 999 }}>{tpl.slice(0, 22)}…</button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

function MetricCardMini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { T } = useTheme();
  return (
    <div style={{ background: accent ? T.accentSoft : T.cardElev, border: `1px solid ${accent ? T.accentSoft : T.border}`, borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: accent ? T.accent : T.text, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function SheetInput({ label, children }: { label: string; children: ReactNode }) {
  const { T } = useTheme();
  return (
    <div style={{ background: T.cardElev, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px' }}>
      <FieldLabel style={{ fontSize: 9 }}>{label}</FieldLabel>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function sheetTextInput(T: ReturnType<typeof useTheme>['T']): CSSProperties {
  return {
    width: '100%', padding: 0, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 14, fontFamily: 'inherit',
  };
}

function sheetBigInput(T: ReturnType<typeof useTheme>['T']): CSSProperties {
  return {
    width: '100%', marginTop: 6, padding: 0, fontSize: 22, fontWeight: 600,
    background: 'transparent', border: 'none', outline: 'none', color: T.text,
    fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit',
  };
}

function ghostButtonStyle(T: ReturnType<typeof useTheme>['T']): CSSProperties {
  return {
    background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '6px 10px', fontSize: 11, color: T.text2, fontFamily: 'inherit', cursor: 'pointer',
  };
}
