'use client';

import { Fragment, useState } from 'react';
import { useTheme } from '../theme';
import { Card, Divider, EmptyState, NeutralBtn, ScreenHeader } from '../primitives/atoms';
import { ServiceDetailSheet } from '../sheets/detail-sheets';
import { type Service } from '@/lib/mini-demo';
import { useMiniData } from '@/hooks/use-mini-data';
import { useMiniToast } from '../bridge';

export function ServicesScreen({ back }: { back?: () => void }) {
  const { T } = useTheme();
  const { SERVICES, updateSection } = useMiniData();
  const { show } = useMiniToast();
  const [active, setActive] = useState<Service | null>(null);

  async function persistAll(list: Service[]) {
    const ok = await updateSection('services', list.map((s, index) => ({
      id: s.id ?? `service-${index + 1}`,
      sortOrder: index + 1,
      n: index + 1,
      name: s.name,
      price: s.price,
      duration: s.duration,
      popularity: s.popularity,
      bookings: s.count,
      count: s.count,
      revenue: s.revenue ?? s.price * s.count,
      category: s.category ?? 'Основное',
      status: s.status ?? 'active',
      visible: s.visible ?? true,
    })));
    if (!ok) show('Не удалось сохранить', 'error');
    return ok;
  }

  async function saveOne(next: Service) {
    const exists = SERVICES.some((s) => (s.id && next.id ? s.id === next.id : s.n === next.n));
    const list = exists
      ? SERVICES.map((s) => ((s.id && next.id ? s.id === next.id : s.n === next.n) ? next : s))
      : [...SERVICES, next];
    if (await persistAll(list)) show('Сохранено', 'success');
  }

  async function removeOne(s: Service) {
    const list = SERVICES.filter((x) => (s.id ? x.id !== s.id : x.n !== s.n));
    if (await persistAll(list)) show('Удалено', 'success');
  }

  async function addNew() {
    const nextN = (SERVICES.reduce((m, s) => Math.max(m, s.n), 0) || 0) + 1;
    const draft: Service = {
      n: nextN, id: `service-${Date.now()}`, name: 'Новая услуга', price: 1000, duration: 60, popularity: 0, count: 0, revenue: 0, category: 'Основное', status: 'active', visible: true,
    };
    if (await persistAll([...SERVICES, draft])) {
      show('Услуга добавлена', 'success');
      setActive(draft);
    }
  }

  const subtitle = `${SERVICES.filter((x) => x.visible !== false && x.status !== 'draft').length} активных · ${SERVICES.reduce((s, x) => s + x.count, 0)} записей за месяц.`;

  return (
    <div>
      {back ? (
        <ScreenHeader title="Услуги" subtitle={subtitle} onBack={back} />
      ) : null}
      <div style={{ padding: back ? '0 16px 24px' : '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!back && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Услуги</div>
            <div style={{ fontSize: 13, color: T.text2, marginTop: 2 }}>{subtitle}</div>
          </div>
        )}
        <NeutralBtn icon="plus" full onClick={addNew}>Добавить услугу</NeutralBtn>
      {SERVICES.length > 0 ? (
        <Card padded={false}>
          {SERVICES.map((s, i) => (
            <Fragment key={s.id ?? s.n}>
              <ServiceRowFull s={s} onClick={() => setActive(s)} />
              {i < SERVICES.length - 1 && <Divider />}
            </Fragment>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon="list-plus"
          title="Услуг пока нет"
          text="Добавь первую услугу — она сразу попадёт в форму записи и аналитику."
          action={<NeutralBtn icon="plus" onClick={addNew}>Добавить услугу</NeutralBtn>}
        />
      )}
      </div>
      <ServiceDetailSheet
        service={active}
        onClose={() => setActive(null)}
        onSave={saveOne}
        onDelete={removeOne}
      />
    </div>
  );
}

function ServiceRowFull({ s, onClick }: { s: Service; onClick: () => void }) {
  const { T } = useTheme();
  return (
    <div onClick={onClick} style={{ padding: '18px 20px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: T.text3, fontVariantNumeric: 'tabular-nums', minWidth: 20 }}>#{s.n}</span>
        <span style={{ fontSize: 15, color: T.text, flex: 1, letterSpacing: '-0.01em' }}>{s.name}</span>
        <span style={{ fontSize: 15, color: T.text, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          {s.price.toLocaleString('ru-RU')} ₽
        </span>
      </div>
      <div style={{ height: 2, background: T.skeleton, borderRadius: 2, overflow: 'hidden', marginBottom: 8, marginLeft: 32 }}>
        <div style={{ height: '100%', width: `${s.popularity * 100}%`, background: T.accent }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 32 }}>
        <span style={{ fontSize: 11, color: T.text3 }}>{s.count} записей · {s.duration} мин</span>
        <span style={{ fontSize: 11, color: T.text3, fontVariantNumeric: 'tabular-nums' }}>{Math.round(s.popularity * 100)}%</span>
      </div>
    </div>
  );
}
