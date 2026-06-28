import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../desktop-html-data';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../desktop-html-ui';

/* Subscription — тариф и лимиты */

export function SubscriptionPage() {
  const [plan, setPlan] = useState('studio');
  const [yearly, setYearly] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  const plans = [
    {
      id: 'free', name: 'Free', tag: '',
      priceM: 0, priceY: 0,
      tagline: 'Чтобы попробовать',
      features: [
        { t: 'До 20 записей в месяц' },
        { t: 'До 30 клиентов' },
        { t: '3 услуги' },
        { t: 'Базовая публичная страница' },
        { t: 'Без чатов', off: true },
        { t: 'Без аналитики', off: true },
      ],
    },
    {
      id: 'studio', name: 'Studio', tag: 'Популярный',
      priceM: 690, priceY: 6900,
      tagline: 'Для частных мастеров',
      features: [
        { t: 'Без лимита на записи' },
        { t: 'До 500 клиентов' },
        { t: 'До 30 услуг' },
        { t: 'Чаты с клиентами' },
        { t: 'Полная аналитика' },
        { t: 'Настройка внешнего вида' },
        { t: 'Уведомления в Telegram' },
      ],
    },
    {
      id: 'team', name: 'Team', tag: '',
      priceM: 1690, priceY: 16900,
      tagline: 'Несколько мастеров',
      features: [
        { t: 'Всё из Studio' },
        { t: 'До 5 мастеров' },
        { t: 'Без лимита на клиентов' },
        { t: 'Совместное расписание' },
        { t: 'Роли и права' },
        { t: 'Брендирование страницы' },
        { t: 'API и интеграции' },
      ],
    },
  ];

  const current = plans.find(p => p.id === 'studio');
  const usage = [
    { label: 'Записи',  used: 156, total: '∞',  hint: 'без лимита' },
    { label: 'Клиенты', used: 248, total: 500,  pct: 49 },
    { label: 'Услуги',  used: 9,   total: 30,   pct: 30 },
    { label: 'Чаты',    used: 84,  total: '∞',  hint: 'без лимита' },
  ];

  const payments = [
    { id: 1, date: '01 мая 2026',  amount: '690 ₽',  desc: 'Studio · месяц',     status: 'paid' },
    { id: 2, date: '01 апр 2026',  amount: '690 ₽',  desc: 'Studio · месяц',     status: 'paid' },
    { id: 3, date: '01 мар 2026',  amount: '690 ₽',  desc: 'Studio · месяц',     status: 'paid' },
    { id: 4, date: '01 фев 2026',  amount: '690 ₽',  desc: 'Studio · месяц',     status: 'paid' },
    { id: 5, date: '01 янв 2026',  amount: '0 ₽',    desc: 'Пробный период',     status: 'trial' },
  ];

  return (
    <div data-screen-label="10 Subscription">
      <div className="page-head">
        <div>
          <h1 className="page-title">Подписка</h1>
          <p className="page-subtitle">Управляйте тарифом, лимитами и платежами.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="card" kind="secondary">Способ оплаты</Btn>
          <Btn icon="sparkle" kind="primary">Сменить тариф</Btn>
        </div>
      </div>

      {/* Current plan */}
      <Card style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Badge kind="accent">{current.name}</Badge>
              <Badge kind="success">Активна</Badge>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 6 }}>
              Ваш тариф — <span style={{ fontStyle: 'italic' }}>Studio</span>
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 13.5, marginBottom: 18 }}>
              Следующее списание <span style={{ color: 'var(--text)' }}>01 июня 2026</span> · 690 ₽
              · Visa <span className="mono">•• 4421</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="secondary" size="sm">Перейти на годовой и сэкономить 16%</Btn>
              <Btn kind="ghost" size="sm">Отменить подписку</Btn>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {usage.map(u => (
              <div key={u.label} style={{
                padding: 14, background: 'var(--surface-2)',
                border: '1px solid var(--line)', borderRadius: 'var(--r)',
              }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6 }}>{u.label}</div>
                <div className="tabular" style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {u.used} <span style={{ color: 'var(--text-3)', fontSize: 14, fontWeight: 400 }}>/ {u.total}</span>
                </div>
                {u.pct != null ? (
                  <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${u.pct}%` }} /></div>
                ) : (
                  <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 8 }}>{u.hint}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{
          background: 'var(--accent-soft)',
          padding: '12px 24px',
          borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: 'var(--accent-text)',
        }}>
          <Icon name="info" size={14} />
          <span>Лимит клиентов на тарифе Studio будет достигнут примерно через 6 недель при текущей скорости роста.</span>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost sm" style={{ color: 'var(--accent-text)' }} onClick={() => setShowPaywall(true)}>
              Посмотреть Team →
            </button>
          </div>
        </div>
      </Card>

      {/* Plans grid */}
      <div className="card-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="section-title">Сравнение тарифов</div>
          <div className="section-sub">Все тарифы можно отменить в любое время.</div>
        </div>
        <Segmented value={yearly ? 'y' : 'm'} onChange={v => setYearly(v === 'y')} items={[
          { value: 'm', label: 'Месяц' },
          { value: 'y', label: 'Год · −16%' },
        ]} />
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {plans.map(p => {
          const isCurrent = p.id === 'studio';
          const isHighlighted = p.id === 'studio';
          return (
            <div key={p.id} className="card" style={{
              padding: 22,
              borderColor: isHighlighted ? 'var(--accent)' : 'var(--line)',
              boxShadow: isHighlighted ? '0 0 0 3px var(--accent-soft)' : 'none',
              position: 'relative',
            }}>
              {p.tag && (
                <div style={{
                  position: 'absolute', top: -10, right: 18,
                  background: 'var(--accent)', color: 'var(--on-accent)',
                  fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 999,
                }}>{p.tag}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
                {isCurrent && <Badge>Текущий</Badge>}
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: 12.5, marginBottom: 18 }}>{p.tagline}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 18 }}>
                <span className="tabular" style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>
                  {yearly ? Math.round(p.priceY / 12) : p.priceM}
                </span>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>₽ / мес</span>
                {yearly && p.priceY > 0 && (
                  <span style={{ color: 'var(--text-4)', fontSize: 11.5, marginLeft: 6 }}>при оплате {p.priceY} ₽ / год</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {p.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: f.off ? 'var(--text-4)' : 'var(--text-2)' }}>
                    <Icon name={f.off ? 'x' : 'check'} size={13} style={{
                      color: f.off ? 'var(--text-4)' : 'var(--success)',
                      flexShrink: 0, marginTop: 3,
                    }} />
                    <span style={{ textDecoration: f.off ? 'line-through' : 'none' }}>{f.t}</span>
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <Btn kind="secondary" className="" style={{ width: '100%' }}>Ваш тариф</Btn>
              ) : (
                <button className={`btn ${p.id === 'team' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%' }}>
                  {p.priceM === 0 ? 'Перейти на Free' : `Перейти на ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid-cols-2-1" style={{ alignItems: 'flex-start' }}>
        {/* Payments history */}
        <Card>
          <div className="card-head">
            <div>
              <div className="section-title">История платежей</div>
              <div className="section-sub">Последние 12 месяцев</div>
            </div>
            <Btn kind="ghost" size="sm" icon="arrow-up-right">Скачать все</Btn>
          </div>
          <div style={{ overflow: 'hidden', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th><th>Описание</th><th>Сумма</th><th style={{ width: 100 }}>Статус</th><th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="row-hover">
                    <td className="mono" style={{ color: 'var(--text-2)' }}>{p.date}</td>
                    <td>{p.desc}</td>
                    <td className="tabular" style={{ fontWeight: 500 }}>{p.amount}</td>
                    <td>
                      {p.status === 'paid'  && <Badge kind="success">Оплачено</Badge>}
                      {p.status === 'trial' && <Badge kind="info">Пробный</Badge>}
                    </td>
                    <td><button className="btn btn-ghost icon"><Icon name="arrow-up-right" size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right column */}
        <div className="col">
          <Card>
            <div className="section-title" style={{ marginBottom: 12 }}>Что входит в Studio</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { i: 'calendar', t: 'Безлимитные записи и календарь' },
                { i: 'chat', t: 'Чат с клиентами' },
                { i: 'chart', t: 'Полная аналитика и отчёты' },
                { i: 'palette', t: 'Настройка внешнего вида страницы' },
                { i: 'bell', t: 'Уведомления о новых записях' },
                { i: 'shield', t: 'Резервные копии каждый день' },
              ].map(it => (
                <div key={it.t} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'var(--surface-2)', border: '1px solid var(--line)',
                    display: 'grid', placeItems: 'center', color: 'var(--accent-text)',
                  }}>
                    <Icon name={it.i} size={14} />
                  </div>
                  <span>{it.t}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', color: 'var(--accent-text)' }}>
                <Icon name="help" size={16} />
              </div>
              <div>
                <div className="section-title">Нужна помощь с тарифом?</div>
                <div className="section-sub" style={{ marginTop: 2 }}>Ответим в течение часа.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="secondary" size="sm" icon="mail">Написать в поддержку</Btn>
            </div>
          </Card>
        </div>
      </div>

      {/* Paywall demo modal */}
      {showPaywall && (
        <div className="modal-backdrop" onClick={() => setShowPaywall(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center' }}>
                    <Icon name="sparkle" size={14} />
                  </div>
                  <Badge kind="accent">Team</Badge>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '-0.02em' }}>
                  Эта функция доступна <span style={{ fontStyle: 'italic' }}>на тарифе Team</span>
                </div>
              </div>
              <button className="btn btn-ghost icon" onClick={() => setShowPaywall(false)}><Icon name="x" size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ color: 'var(--text-2)', fontSize: 13.5, marginBottom: 18, lineHeight: 1.55 }}>
                Тариф Team снимает лимиты по клиентам и добавляет совместное расписание для нескольких мастеров, роли и брендирование.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Без лимитов по клиентам и записям', 'До 5 мастеров в команде', 'Брендирование публичной страницы', 'API и интеграции'].map(t => (
                  <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13.5 }}>
                    <Icon name="check" size={14} style={{ color: 'var(--success)' }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <Btn kind="ghost" onClick={() => setShowPaywall(false)}>Не сейчас</Btn>
              <Btn kind="primary" icon="sparkle">Попробовать 14 дней бесплатно</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

