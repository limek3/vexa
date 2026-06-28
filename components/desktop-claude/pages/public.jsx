'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../ui';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../data';

/* Public page — клиентская страница записи */

export function PublicPage({ tweaks, asPreview }) {
  const [serviceId, setServiceId] = useState('s1');
  const [dateIdx, setDateIdx] = useState(2);
  const [slotIdx, setSlotIdx] = useState(null);
  const [step, setStep] = useState(0); // 0 select 1 form 2 success
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });

  const days = [
    { label: 'Пн', d: 25 }, { label: 'Вт', d: 26 }, { label: 'Ср', d: 27 },
    { label: 'Чт', d: 28 }, { label: 'Пт', d: 29 }, { label: 'Сб', d: 30 },
    { label: 'Вс', d: 31, off: true },
  ];
  const slots = ['09:00','10:30','11:30','12:30','—','14:30','15:30','16:30','17:30','18:30'];

  return (
    <div data-screen-label="07 Public" style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {!asPreview && (
        <div style={{
          background: 'var(--surface-2)', borderBottom: '1px solid var(--line)',
          padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
        }}>
          <Icon name="eye" size={13} style={{ color: 'var(--text-3)' }} />
          <span className="muted">Предпросмотр публичной страницы</span>
          <span className="mono muted">кликбук.рф/{MASTER.username}</span>
          <div className="spacer" />
          <button className="link" style={{ fontSize: 12 }}>Открыть в новой вкладке</button>
        </div>
      )}

      {/* Hero with cover */}
      <div style={{ position: 'relative' }}>
        <div style={{
          height: 220,
          background: `linear-gradient(135deg,
            color-mix(in oklab, var(--accent) 30%, var(--surface-2)),
            color-mix(in oklab, var(--accent) 6%, var(--surface-3)) 100%
          )`,
          backgroundImage: `
            radial-gradient(at 20% 30%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 50%),
            radial-gradient(at 80% 70%, color-mix(in oklab, oklch(0.7 0.10 220) 30%, transparent), transparent 50%),
            linear-gradient(135deg, var(--surface-2), var(--surface-3))
          `,
        }} />

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: -52 }}>
            <div style={{
              width: 104, height: 104, borderRadius: 22,
              background: 'oklch(0.88 0.04 50)', color: 'oklch(0.36 0.10 50)',
              border: '4px solid var(--bg)',
              display: 'grid', placeItems: 'center',
              fontSize: 36, fontFamily: 'var(--font-display)', fontStyle: 'italic',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}>
              {MASTER.initials}
            </div>
            <div style={{ paddingBottom: 6, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge kind="success" className="plain">Принимаю записи</Badge>
                <span className="muted" style={{ fontSize: 12 }}>· {MASTER.city}</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>{MASTER.name}</h1>
              <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>{MASTER.profession}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 6 }}>
              <button className="btn btn-secondary"><Icon name="star" size={13} /> {MASTER.rating}</button>
              <button className="btn btn-secondary"><Icon name="phone" size={13} /></button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start' }}>
          <div>
            {/* About */}
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--text-2)', marginTop: 0, textWrap: 'pretty' }}>{MASTER.about}</p>

            <div style={{ display: 'flex', gap: 16, marginTop: 18, color: 'var(--text-3)', fontSize: 13, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="pin" size={13} /> {MASTER.studio}</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="clock" size={13} /> Пн–Сб · 09:00–19:00</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="users" size={13} /> {MASTER.reviews} отзывов</span>
            </div>

            {step === 0 && (
              <>
                {/* Services */}
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '36px 0 14px' }}>Услуги</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {SERVICES.filter(s => s.public && s.active).map(s => (
                    <button key={s.id} onClick={() => setServiceId(s.id)} className="card hoverable" style={{
                      padding: '14px 18px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: serviceId === s.id ? 'var(--surface-2)' : 'var(--surface)',
                      borderColor: serviceId === s.id ? 'var(--accent)' : 'var(--line)',
                      borderWidth: serviceId === s.id ? 2 : 1,
                      padding: serviceId === s.id ? '13px 17px' : '14px 18px',
                      font: 'inherit',
                    }}>
                      <div className={`check ${serviceId === s.id ? 'on' : ''}`} style={{ borderRadius: 999 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)' }}>{s.name}</div>
                        {s.short && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2, textWrap: 'pretty' }}>{s.short}</div>}
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>{s.dur} мин · {s.cat}</div>
                      </div>
                      <div className="tabular" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                        {s.price === 0 ? <span className="serif" style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>бесплатно</span> : `${s.price.toLocaleString('ru-RU')} ₽`}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Date picker */}
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '32px 0 14px' }}>Дата</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {days.map((d, i) => (
                    <button key={i} disabled={d.off} onClick={() => setDateIdx(i)} style={{
                      padding: '12px 0',
                      background: dateIdx === i ? 'var(--accent)' : 'var(--surface)',
                      color: dateIdx === i ? 'var(--on-accent)' : d.off ? 'var(--text-disabled)' : 'var(--text)',
                      border: '1px solid ' + (dateIdx === i ? 'var(--accent)' : 'var(--line)'),
                      borderRadius: 'var(--r)',
                      cursor: d.off ? 'not-allowed' : 'pointer',
                      font: 'inherit',
                      textAlign: 'center',
                      transition: 'all 120ms',
                    }}>
                      <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{d.d}</div>
                    </button>
                  ))}
                </div>

                {/* Time slots */}
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '32px 0 14px' }}>Время</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {slots.map((t, i) => (
                    <button key={i} disabled={t === '—'} onClick={() => setSlotIdx(i)} style={{
                      padding: '12px 0',
                      background: slotIdx === i ? 'var(--accent)' : t === '—' ? 'var(--surface-3)' : 'var(--surface)',
                      color: slotIdx === i ? 'var(--on-accent)' : t === '—' ? 'var(--text-disabled)' : 'var(--text)',
                      border: '1px solid ' + (slotIdx === i ? 'var(--accent)' : 'var(--line)'),
                      borderRadius: 'var(--r-sm)',
                      cursor: t === '—' ? 'not-allowed' : 'pointer',
                      font: 'inherit', fontSize: 14, fontWeight: 500,
                      textDecoration: t === '—' ? 'line-through' : 'none',
                      transition: 'all 120ms',
                    }}>{t === '—' ? '·' : t}</button>
                  ))}
                </div>

                {slotIdx === null && (
                  <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-2)', borderRadius: 'var(--r)', fontSize: 12.5, color: 'var(--text-3)', display: 'flex', gap: 8 }}>
                    <Icon name="info" size={14} style={{ color: 'var(--text-3)', marginTop: 1 }} />
                    Выберите свободный слот, чтобы перейти к подтверждению.
                  </div>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '36px 0 6px' }}>Ваши контакты</h3>
                <p className="muted" style={{ fontSize: 13, margin: '0 0 18px' }}>Пришлю подтверждение и напоминание</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="field">
                    <div className="field-label">Имя</div>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Как к вам обращаться" />
                  </div>
                  <div className="field">
                    <div className="field-label">Телефон</div>
                    <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+7 (___) ___-__-__" />
                  </div>
                  <div className="field">
                    <div className="field-label">Комментарий</div>
                    <textarea className="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Что важно знать перед визитом" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Check on={true} />
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Согласен с обработкой данных и условиями отмены</span>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div style={{ marginTop: 36, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 999,
                  background: 'var(--success-soft)', color: 'var(--success)',
                  display: 'grid', placeItems: 'center', margin: '0 auto 16px',
                }}><Icon name="check" size={28} /></div>
                <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.015em', margin: '0 0 6px' }}>
                  Вы записаны
                </h2>
                <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                  Подтверждение и адрес студии придут в SMS. Если планы изменятся — отмените запись по ссылке из сообщения.
                </p>
                <div className="card" style={{ maxWidth: 340, margin: '24px auto 0', textAlign: 'left', padding: 16, background: 'var(--surface-2)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Запись</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>{SERVICES.find(s => s.id === serviceId)?.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>
                    {days[dateIdx].label}, {days[dateIdx].d} мая · {slotIdx !== null && slots[slotIdx]}
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => { setStep(0); setSlotIdx(null); }}>На главную</button>
              </div>
            )}
          </div>

          {/* Sticky summary */}
          {step < 2 && (
            <div style={{ position: 'sticky', top: 24 }}>
              <BookingSummary
                service={SERVICES.find(s => s.id === serviceId)}
                day={days[dateIdx]}
                slot={slotIdx !== null ? slots[slotIdx] : null}
                step={step}
                onNext={() => setStep(step + 1)}
                onBack={() => setStep(0)}
              />
              <div style={{ marginTop: 14, padding: '14px 18px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <Icon name="shield" size={14} style={{ color: 'var(--success)', marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    Бесплатная отмена за 24 часа. Подтверждение в SMS.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="info" size={14} style={{ color: 'var(--text-3)', marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    Если не уверены в услуге — запишитесь на бесплатную консультацию.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: 12 }}>
          <span className="mono">{MASTER.publicUrl}</span>
          <span>Powered by <strong style={{ color: 'var(--text-2)' }}>КликБук</strong></span>
        </div>
      </div>
    </div>
  );
}

function BookingSummary({ service, day, slot, step, onNext, onBack }) {
  const canNext = step === 0 ? slot != null : true;
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Ваша запись</div>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{service.name}</div>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{service.dur} мин · {service.cat}</div>
      <div className="divider" style={{ margin: '14px -18px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SumRow icon="calendar" label="Дата" value={day ? `${day.label}, ${day.d} мая` : '—'} />
        <SumRow icon="clock" label="Время" value={slot || <span className="muted">не выбрано</span>} />
        <SumRow icon="pin" label="Где" value={MASTER.studio.split(',')[0]} />
      </div>
      <div className="divider" style={{ margin: '14px -18px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Итого</span>
        <span className="tabular" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {service.price === 0 ? <span className="serif" style={{ fontStyle: 'italic', color: 'var(--success)' }}>бесплатно</span> : `${service.price.toLocaleString('ru-RU')} ₽`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {step > 0 && <Btn kind="ghost" onClick={onBack}>Назад</Btn>}
        <Btn kind="primary" onClick={onNext} disabled={!canNext} style={{ flex: 1 }}>
          {step === 0 ? 'Продолжить' : 'Подтвердить запись'}
        </Btn>
      </div>
    </div>
  );
}

function SumRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
      <Icon name={icon} size={13} style={{ color: 'var(--text-3)' }} />
      <span style={{ color: 'var(--text-3)', flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
