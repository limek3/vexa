import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../desktop-html-data';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark, NumberPopIn } from '../desktop-html-ui';

/* Analytics page */

export function AnalyticsPage() {
  const [range, setRange] = useState('30d');

  return (
    <div data-screen-label="06 Analytics">
      <div className="page-head">
        <div>
          <h1 className="page-title">Статистика</h1>
          <p className="page-subtitle">Как идёт работа · сравнение с предыдущим периодом</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Segmented value={range} onChange={setRange} items={[
            { value: '7d',  label: '7 дней' },
            { value: '30d', label: '30 дней' },
            { value: '90d', label: '3 месяца' },
            { value: '1y',  label: 'Год' },
          ]} />
          <Btn icon="arrow-up-right" kind="secondary">Экспорт</Btn>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Metric label="Записей" value="124" delta="+18% к прошлому" deltaKind="up"
                sparkline={<Spark values={[14,18,22,17,20,28,24,30,28,34,38,44,40,48,52,49,58,62,60,66]} height={28} />} />
        <Metric label="Доход" value="312 800" unit="₽" delta="+12%" deltaKind="up"
                sparkline={<Spark values={[8,12,9,14,15,18,17,22,20,26,28,32,30,36,38,42,40,44,48,52]} height={28} color="var(--success)" />} />
        <Metric label="Просмотры" value="2 138" delta="+34%" deltaKind="up"
                sparkline={<Spark values={[40,48,55,49,60,68,72,80,85,90,98,105,110,118,125,138,140,148,156,162]} height={28} color="var(--info)" />} />
        <Metric label="Конверсия" value="38" unit="%" delta="+3 п.п." deltaKind="up"
                sparkline={<Spark values={[28,30,32,29,34,33,36,35,38,37,40,38]} height={28} color="var(--accent)" />} />
      </div>

      {/* Main: big chart + conversion */}
      <div className="grid-cols-2-1" style={{ marginBottom: 18, alignItems: 'stretch' }}>
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div>
              <div className="section-title">Записи и просмотры страницы</div>
              <div className="section-sub">За последние 30 дней</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
              <LegendDot label="Записи" color="var(--accent)" />
              <LegendDot label="Просмотры" color="var(--info)" />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <DualLineChart />
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            <MiniInsight label="Лучший день"    value="22 мая"  sub="9 записей" />
            <MiniInsight label="Пик просмотров" value="14:00"  sub="среднее по периоду" />
            <MiniInsight label="Доля новых"     value="32%"    sub="на этой неделе" />
            <MiniInsight label="LTV клиента"    value="18 400 ₽" sub="за 12 месяцев" />
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div>
              <div className="section-title">Воронка конверсии</div>
              <div className="section-sub">От просмотра до записи</div>
            </div>
            <span className="badge accent plain">38%</span>
          </div>
          <FunnelChart />
          <div className="card-divider" />
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Где теряем клиентов</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DropoffRow from="Открыли услуги" to="Выбрали дату"          pct={29} hint="самый большой дроп" warn />
            <DropoffRow from="Выбрали дату"   to="Подтвердили запись"    pct={10} />
          </div>
          <div className="card-divider" />
          <Btn size="sm" kind="soft" icon="sparkle">Что улучшить →</Btn>
        </Card>
      </div>

      {/* Row of three: bars / donut / popular services */}
      <div className="grid-3" style={{ marginBottom: 18, alignItems: 'stretch' }}>
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div>
              <div className="section-title">Загрузка по дням недели</div>
              <div className="section-sub">Среднее по месяцу</div>
            </div>
            <Badge>62% средн.</Badge>
          </div>
          <BarsChart />
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="section-title">Структура клиентов</div>
            <Btn size="sm" kind="ghost" onClick={() => {}}>Подробнее</Btn>
          </div>
          <DonutChart />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <Legend label="Постоянные" value="58%" color="var(--accent)" />
            <Legend label="Новые"      value="24%" color="var(--info)" />
            <Legend label="VIP"        value="12%" color="var(--success)" />
            <Legend label="Неактивные" value="6%"  color="var(--warn)" />
          </div>
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div>
              <div className="section-title">Популярные услуги</div>
              <div className="section-sub">по числу записей</div>
            </div>
            <Btn size="sm" kind="ghost" icon="arrow-up-right">Все</Btn>
          </div>
          <PopularServices />
        </Card>
      </div>

      {/* Heatmap full-width */}
      <Card style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div>
            <div className="section-title">Часы работы · heatmap записей</div>
            <div className="section-sub">Темнее — больше записей. Можно увидеть пиковые часы по дням недели.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-3)' }}>
            Меньше
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
              <span key={v} style={{ width: 14, height: 14, borderRadius: 3, background: `color-mix(in oklab, var(--accent) ${Math.round(v * 80)}%, var(--surface-3))` }} />
            ))}
            Больше
          </div>
        </div>
        <Heatmap />
      </Card>

      {/* Bottom strip */}
      <div className="grid-4">
        <SmallStat label="Повторные клиенты" value="64%"   delta="+5 п.п."    deltaKind="up" />
        <SmallStat label="Отмены"            value="3.4%"  delta="−1 п.п."    deltaKind="up" />
        <SmallStat label="Неявки"            value="0.8%"  delta="без изменений" />
        <SmallStat label="Средний чек"       value="5 200 ₽" delta="+220 ₽"  deltaKind="up" />
      </div>
    </div>
  );
}

function MiniInsight({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
      <div className="tabular" style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em', marginTop: 2 }}><NumberPopIn value={value} /></div>
      <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function DropoffRow({ from, to, pct, hint, warn }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: 'var(--text-2)' }}>{from}</span>
        <Icon name="chevron-right" size={11} style={{ margin: '0 4px', color: 'var(--text-4)', verticalAlign: 'middle' }} />
        <span>{to}</span>
        {hint && <span style={{ marginLeft: 6, fontSize: 10.5, color: warn ? 'var(--danger)' : 'var(--text-4)' }}>· {hint}</span>}
      </div>
      <div className="tabular" style={{ fontSize: 13, fontWeight: 500, color: warn ? 'var(--danger)' : 'var(--text-2)' }}>−{pct}%</div>
    </div>
  );
}

function LegendDot({ label, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
      <span className="muted">{label}</span>
    </span>
  );
}

function ChartTooltip({ active, payload, label, labels = {} }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label ? <div className="chart-tooltip-label">{label}</div> : null}
      {payload.map((item) => (
        <div className="chart-tooltip-row" key={item.dataKey}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="chart-tooltip-dot" style={{ background: item.color || item.fill }} />
            {labels[item.dataKey] || item.name || item.dataKey}
          </span>
          <strong className="tabular">{typeof item.value === 'number' ? item.value.toLocaleString('ru-RU') : item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function SmallStat({ label, value, delta, deltaKind }) {
  return (
    <Card>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }} className="tabular"><NumberPopIn value={value} /></div>
      <div className={`metric-delta ${deltaKind || ''}`} style={{ marginTop: 6 }}>
        {deltaKind === 'up' && <Icon name="arrow-up" size={11} />}
        {delta}
      </div>
    </Card>
  );
}

/* ---------- Charts ---------- */

function DualLineChart() {
  const seedA = [12,14,18,22,17,20,28,24,30,28,34,28,38,42,38,44,48,42,52,48,55,58,52,60,64,58,62,68,66,72];
  const seedB = [40,48,55,49,60,55,68,72,80,75,85,82,90,98,92,105,108,100,115,118,128,135,128,140,145,138,148,156,150,162];
  const data = seedA.map((bookings, index) => ({
    day: index + 1,
    label: `${index + 1} мая`,
    bookings,
    views: seedB[index],
  }));

  return (
    <div className="chart-panel" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bookingsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="viewsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 7" vertical={false} />
          <XAxis
            dataKey="label"
            ticks={['1 мая', '7 мая', '13 мая', '19 мая', '25 мая', '30 мая']}
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--line-2)' }}
            tickLine={false}
            minTickGap={14}
          />
          <YAxis
            yAxisId="bookings"
            width={34}
            domain={[0, 80]}
            tick={{ fill: 'var(--text-3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis yAxisId="views" orientation="right" hide domain={[0, 180]} />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
            wrapperStyle={{ outline: 'none' }}
            content={<ChartTooltip labels={{ bookings: 'Записи', views: 'Просмотры' }} />}
          />
          <Area yAxisId="views" type="monotone" dataKey="views" stroke="var(--chart-3)" strokeWidth={1.8} fill="url(#viewsArea)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          <Area yAxisId="bookings" type="monotone" dataKey="bookings" stroke="var(--chart-1)" strokeWidth={2.2} fill="url(#bookingsArea)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
      {/*
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="axis-text">
          {`${i + 1} мая`}
        </text>
      */}
    </div>
  );
}

function FunnelChart() {
  const steps = [
    { label: 'Просмотры страницы',  value: 2138, pct: 100, color: 'var(--info)' },
    { label: 'Открыли услуги',       value: 1242, pct: 58,  color: 'var(--info)' },
    { label: 'Выбрали дату',         value: 624,  pct: 29,  color: 'var(--accent)' },
    { label: 'Подтвердили запись',   value: 412,  pct: 19,  color: 'var(--accent)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {steps.map((s, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13 }}>{s.label}</span>
            <span className="tabular" style={{ fontSize: 13, fontWeight: 500 }}>
              {s.value.toLocaleString('ru-RU')}<span className="muted" style={{ marginLeft: 6, fontWeight: 400 }}>{s.pct}%</span>
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 999, transition: 'width 600ms var(--easing)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarsChart() {
  const data = [
    { d: 'Пн', v: 88 },
    { d: 'Вт', v: 92 },
    { d: 'Ср', v: 76 },
    { d: 'Чт', v: 84 },
    { d: 'Пт', v: 96 },
    { d: 'Сб', v: 64 },
    { d: 'Вс', v: 0, off: true },
  ];
  const max = 100;
  const H = 200;
  const barAreaH = H - 44;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, height: H, marginTop: 8 }}>
      {data.map((d, i) => {
        const barH = d.off ? 0 : Math.max(8, (d.v / max) * barAreaH);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <div className="tabular" style={{
              fontSize: 11, color: d.off ? 'var(--text-4)' : 'var(--text-3)',
              marginBottom: 6, fontStyle: d.off ? 'italic' : 'normal',
              fontVariantNumeric: 'tabular-nums',
              minHeight: 14,
            }}>
              {d.off ? '—' : `${d.v}%`}
            </div>
            {d.off ? (
              <div style={{ marginTop: 'auto', width: '100%', maxWidth: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  height: 8, width: '100%',
                  background: 'repeating-linear-gradient(45deg, transparent 0 4px, var(--surface-3) 4px 8px)',
                  borderRadius: 'var(--r-sm) var(--r-sm) 2px 2px',
                }} />
              </div>
            ) : (
              <div style={{ marginTop: 'auto', width: '100%', maxWidth: 40 }}>
                <div style={{
                  height: barH,
                  background: 'var(--accent)',
                  opacity: 0.55 + d.v / 250,
                  borderRadius: 'var(--r-sm) var(--r-sm) 2px 2px',
                  transition: 'height 500ms var(--easing)',
                }} />
              </div>
            )}
            <div style={{ fontSize: 11.5, color: d.off ? 'var(--text-4)' : 'var(--text-3)', marginTop: 8 }}>{d.d}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart() {
  const data = [
    { v: 58, color: 'var(--accent)' },
    { v: 24, color: 'var(--info)' },
    { v: 12, color: 'var(--success)' },
    { v: 6,  color: 'var(--warn)' },
  ];
  const r = 60, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="18" />
        {data.map((s, i) => {
          const dash = (s.v / 100) * c;
          const e = <circle key={i} cx="90" cy="90" r={r} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform="rotate(-90 90 90)" />;
          offset += dash;
          return e;
        })}
        <text x="90" y="86" textAnchor="middle" style={{ fontSize: 24, fontWeight: 600, fill: 'var(--text)' }}>134</text>
        <text x="90" y="106" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-3)' }}>клиентов</text>
      </svg>
    </div>
  );
}

function Legend({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
      <span style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
      <span style={{ flex: 1, color: 'var(--text-2)' }}>{label}</span>
      <span className="tabular" style={{ fontWeight: 500 }}><NumberPopIn value={value} /></span>
    </div>
  );
}

function PopularServices() {
  const data = [
    { name: 'Окрашивание AirTouch',   count: 28, pct: 100, price: 12500 },
    { name: 'Тонирование',            count: 22, pct: 78,  price: 4500 },
    { name: 'Женская стрижка',        count: 18, pct: 64,  price: 3800 },
    { name: 'Глубокий уход K18',      count: 12, pct: 42,  price: 3200 },
    { name: 'Однотонное окрашивание', count: 8,  pct: 28,  price: 5800 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13, gap: 8 }}>
            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span className="tabular muted">{d.count}</span>
              <span className="muted"> · </span>
              <span className="tabular">{(d.count * d.price).toLocaleString('ru-RU')} ₽</span>
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 999 }}>
            <div style={{
              width: `${d.pct}%`, height: '100%',
              background: 'var(--accent)', borderRadius: 999,
              opacity: 0.35 + d.pct / 200,
              transition: 'width 500ms var(--easing)',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Heatmap() {
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const hours = [9,10,11,12,13,14,15,16,17,18,19,20];
  const cell = (d, h) => {
    if (d === 6) return 0;
    const peak = h >= 11 && h <= 18 ? 0.75 : 0.3;
    const v = Math.min(1, peak + (Math.sin(d * 1.3 + h * 0.7) + 1) / 5);
    if (h === 13) return 0.05;
    return v;
  };
  const colW = '1fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${hours.length}, ${colW})`, gap: 4 }}>
        <span />
        {hours.map(h => <span key={h} className="mono" style={{ fontSize: 10.5, color: 'var(--text-4)', textAlign: 'center' }}>{h}</span>)}
      </div>
      {days.map((d, di) => (
        <div key={d} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${hours.length}, ${colW})`, gap: 4 }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-3)', alignSelf: 'center' }}>{d}</span>
          {hours.map((h, hi) => {
            const v = cell(di, h);
            const bg = v < 0.1 ? 'var(--surface-3)' : `color-mix(in oklab, var(--accent) ${Math.round(v * 85)}%, var(--surface-3))`;
            return (
              <div key={h} style={{
                height: 28,
                background: bg,
                borderRadius: 4,
              }} data-tip={`${d} ${h}:00 — ${Math.round(v * 100)}%`} />
            );
          })}
        </div>
      ))}
    </div>
  );
}
