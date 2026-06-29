'use client';

import { Fragment, useMemo, useState } from 'react';
import { useTheme } from '../theme';
import {
  Card, FieldLabel, SectionTitle, Divider, Pill, ScreenHeader,
} from '../primitives/atoms';
import { useMiniData } from '@/hooks/use-mini-data';

function money(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
}

export function AnalyticsScreen({ back }: { back: () => void }) {
  const { T } = useTheme();
  const { REVENUE_WEEK, SERVICES, CLIENTS, APPOINTMENTS } = useMiniData();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const total = REVENUE_WEEK.reduce((a, x) => a + x.v, 0);
  const max = Math.max(...REVENUE_WEEK.map((x) => x.v), 1);

  const metrics = useMemo(() => {
    const completed = APPOINTMENTS.filter((a) => a.rawStatus === 'completed');
    const active = APPOINTMENTS.filter((a) => a.rawStatus === 'new' || a.rawStatus === 'confirmed' || a.rawStatus === 'completed');
    const cancelled = APPOINTMENTS.filter((a) => a.rawStatus === 'cancelled' || a.rawStatus === 'no_show');
    const revenue = completed.reduce((sum, a) => sum + (a.price ?? 0), 0);
    const avg = completed.length > 0 ? Math.round(revenue / completed.length) : 0;
    const repeatClients = CLIENTS.filter((c) => c.visits > 1).length;
    return {
      bookings: active.length,
      averageCheck: avg,
      conversion: APPOINTMENTS.length > 0 ? Math.round((active.length / APPOINTMENTS.length) * 100) : 0,
      repeatRate: CLIENTS.length > 0 ? Math.round((repeatClients / CLIENTS.length) * 100) : 0,
      views: APPOINTMENTS.length,
      cancelRate: APPOINTMENTS.length > 0 ? Math.round((cancelled.length / APPOINTMENTS.length) * 100) : 0,
    };
  }, [APPOINTMENTS, CLIENTS]);

  const topClientMax = Math.max(...CLIENTS.map((c) => c.total), 1);

  return (
    <div>
      <ScreenHeader title="Аналитика" subtitle="Выручка, конверсия, топы." onBack={back} />
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Pill active={period === 'week'} onClick={() => setPeriod('week')}>Неделя</Pill>
          <Pill active={period === 'month'} onClick={() => setPeriod('month')}>Месяц</Pill>
          <Pill active={period === 'year'} onClick={() => setPeriod('year')}>Год</Pill>
        </div>

        <Card>
          <FieldLabel>Выручка</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {money(total)}
            </div>
            <div style={{ fontSize: 12, color: T.text2, fontVariantNumeric: 'tabular-nums' }}>по завершённым визитам</div>
          </div>
          <div style={{ fontSize: 12, color: T.text2, marginTop: 4 }}>За неделю · средний чек {money(metrics.averageCheck)}</div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 24, height: 110 }}>
            {REVENUE_WEEK.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 6, height: `${Math.max(4, (b.v / max) * 100)}%`, borderRadius: 3,
                  background: b.active ? T.accent : T.text3,
                  opacity: b.active ? 1 : 0.6,
                }} />
                <span style={{ fontSize: 10, color: b.active ? T.text : T.text3 }}>{b.d}</span>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <MetricCard label="Записей" value={String(metrics.bookings)} sub="активные + завершённые" />
          <MetricCard label="Средний чек" value={money(metrics.averageCheck)} sub="по завершённым" valueSize={20} />
          <MetricCard label="Конверсия" value={`${metrics.conversion}%`} sub="заявки → запись" />
          <MetricCard label="Повторные" value={`${metrics.repeatRate}%`} sub="клиенты" />
          <MetricCard label="Заявки" value={String(metrics.views)} sub="всего" />
          <MetricCard label="Отмены" value={`${metrics.cancelRate}%`} sub="всего" />
        </div>

        <div>
          <SectionTitle title="Топ-5 услуг" subtitle="По выручке за период." />
          <Card padded={false}>
            {SERVICES.slice(0, 5).length > 0 ? SERVICES.slice(0, 5).map((s, i) => (
              <Fragment key={s.id ?? s.n}>
                <TopRow rank={i + 1} title={s.name} value={money(s.revenue ?? s.price * s.count)} pct={s.popularity} />
                {i < Math.min(SERVICES.length, 5) - 1 && <Divider />}
              </Fragment>
            )) : <EmptyAnalyticsRow text="Нет услуг для аналитики" />}
          </Card>
        </div>

        <div>
          <SectionTitle title="Топ-5 клиентов" subtitle="По сумме за всё время." />
          <Card padded={false}>
            {CLIENTS.slice(0, 5).length > 0 ? CLIENTS.slice(0, 5).map((c, i) => (
              <Fragment key={`${c.phone}-${c.name}-${i}`}>
                <TopRow rank={i + 1} title={c.name} value={money(c.total)} pct={c.total / topClientMax} />
                {i < Math.min(CLIENTS.length, 5) - 1 && <Divider />}
              </Fragment>
            )) : <EmptyAnalyticsRow text="Клиенты появятся после первых записей" />}
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyAnalyticsRow({ text }: { text: string }) {
  const { T } = useTheme();
  return <div style={{ padding: 22, textAlign: 'center', color: T.text3, fontSize: 13 }}>{text}</div>;
}

function MetricCard({ label, value, sub, valueSize = 26 }: { label: string; value: string; sub: string; valueSize?: number }) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      boxShadow: T.cardShadow, padding: '16px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ fontSize: valueSize, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: T.text2 }}>{sub}</div>
    </div>
  );
}

function TopRow({ rank, title, value, pct }: { rank: number; title: string; value: string; pct: number }) {
  const { T } = useTheme();
  return (
    <div style={{ padding: '14px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: T.text3, fontVariantNumeric: 'tabular-nums', minWidth: 18 }}>#{rank}</span>
        <span style={{ fontSize: 14, color: T.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <span style={{ fontSize: 13, color: T.text, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{value}</span>
      </div>
      <div style={{ height: 2, background: T.skeleton, borderRadius: 2, overflow: 'hidden', marginLeft: 30 }}>
        <div style={{ height: '100%', width: `${Math.min(Math.max(pct, 0), 1) * 100}%`, background: T.accent }} />
      </div>
    </div>
  );
}
