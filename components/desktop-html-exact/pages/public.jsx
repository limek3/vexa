import React, { useEffect, useMemo, useState } from 'react';
import { MASTER, SERVICES } from '../desktop-html-data';
import { Icon, Badge, Btn, Check } from '../desktop-html-ui';

/* Public page — клиентская страница записи */

export function PublicPage({ asPreview, platform }) {
  const [serviceId, setServiceId] = useState('s1');
  const [dateIdx, setDateIdx] = useState(2);
  const [slotIdx, setSlotIdx] = useState(null);
  const [step, setStep] = useState(0); // 0 select 1 form 2 success
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [error, setError] = useState('');
  const master = platform?.master || MASTER;
  const services = platform?.services || SERVICES;
  const publicServices = useMemo(() => services.filter(s => s.public && s.active), [services]);
  const selectedService = services.find(s => s.id === serviceId) || publicServices[0];
  useEffect(() => {
    if (!services.some((service) => service.id === serviceId) && publicServices[0]) {
      const id = window.setTimeout(() => setServiceId(publicServices[0].id), 0);
      return () => window.clearTimeout(id);
    }
  }, [serviceId, services, publicServices]);

  const days = [
    { label: 'Пн', d: 25 }, { label: 'Вт', d: 26 }, { label: 'Ср', d: 27 },
    { label: 'Чт', d: 28 }, { label: 'Пт', d: 29 }, { label: 'Сб', d: 30 },
    { label: 'Вс', d: 31, off: true },
  ];
  const slots = ['09:00','10:30','11:30','12:30','—','14:30','15:30','16:30','17:30','18:30'];
  const submitBooking = async () => {
    setError('');
    if (step === 0) {
      if (!selectedService) {
        setError('Выберите услугу');
        return;
      }
      if (slotIdx === null) {
        setError('Выберите свободное время');
        return;
      }
      setStep(1);
      return;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Заполните имя и телефон');
      return;
    }
    const created = await platform?.createBooking?.({
      clientName: form.name,
      clientPhone: form.phone,
      serviceId: selectedService?.id,
      date: `${days[dateIdx].d} мая`,
      time: slotIdx !== null ? slots[slotIdx] : '10:00',
      notes: form.notes,
      status: 'new',
    });
    if (platform?.createBooking && !created) {
      setError('Не удалось создать запись. Попробуйте другой слот.');
      return;
    }
    setStep(2);
  };

  return (
    <div data-screen-label="07 Public" style={{ background: 'var(--bg)', minHeight: '100%' }}>
      {!asPreview && (
        <div style={{
          background: 'var(--surface-2)', borderBottom: '1px solid var(--line)',
          padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
        }}>
          <Icon name="eye" size={13} style={{ color: 'var(--text-3)' }} />
          <span className="muted">Предпросмотр публичной страницы</span>
          <span className="mono muted">кликбук.рф/{master.username}</span>
          <div className="spacer" />
          <button className="link" style={{ fontSize: 12 }} onClick={() => window.open(`/m/${master.username}`, '_blank', 'noopener,noreferrer')}>Открыть в новой вкладке</button>
        </div>
      )}

      {/* Hero with cover */}
      <div style={{ position: 'relative' }}>
        <div style={{
          height: 220,
          background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))',
          backgroundImage: `
            radial-gradient(at 20% 30%, color-mix(in oklab, var(--surface) 70%, transparent), transparent 52%),
            radial-gradient(at 80% 70%, color-mix(in oklab, var(--bg-elev) 80%, transparent), transparent 52%),
            linear-gradient(135deg, var(--surface-2), var(--surface-3))
          `,
        }} />

        <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: -52 }}>
            <div style={{
              width: 104, height: 104, borderRadius: 22,
              background: 'var(--surface-3)', color: 'var(--text)',
              border: '4px solid var(--bg)',
              display: 'grid', placeItems: 'center',
              fontSize: 36, fontFamily: 'var(--font-display)', fontStyle: 'italic',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}>
              {master.initials}
            </div>
            <div style={{ paddingBottom: 6, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Badge kind="success" className="plain">Принимаю записи</Badge>
                <span className="muted" style={{ fontSize: 12 }}>· {master.city}</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>{master.name}</h1>
              <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>{master.profession}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 6 }}>
              <button className="btn btn-secondary" onClick={() => platform?.recordAction?.('Отзывы мастера')}><Icon name="star" size={13} /> {master.rating}</button>
              <button className="btn btn-secondary" onClick={() => { window.location.href = `tel:${master.phone}`; }}><Icon name="phone" size={13} /></button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start' }}>
          <div>
            {/* About */}
            <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--text-2)', marginTop: 0, textWrap: 'pretty' }}>{master.about}</p>

            <div style={{ display: 'flex', gap: 16, marginTop: 18, color: 'var(--text-3)', fontSize: 13, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="pin" size={13} /> {master.studio}</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="clock" size={13} /> Пн–Сб · 09:00–19:00</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="users" size={13} /> {master.reviews} отзывов</span>
            </div>

            {step === 0 && (
              <>
                {/* Services */}
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', margin: '36px 0 14px' }}>Услуги</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {publicServices.map(s => (
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
                {error && <div style={{ marginTop: 12, color: 'var(--danger)', fontSize: 12.5 }}>{error}</div>}
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
                  {error && <div style={{ color: 'var(--danger)', fontSize: 12.5 }}>{error}</div>}
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
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>{selectedService?.name}</div>
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
                service={selectedService}
                day={days[dateIdx]}
                slot={slotIdx !== null ? slots[slotIdx] : null}
                step={step}
                onNext={submitBooking}
                onBack={() => setStep(0)}
                master={master}
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
          <span className="mono">{master.publicUrl}</span>
          <span>Онлайн-запись</span>
        </div>
      </div>
    </div>
  );
}

function BookingSummary({ service, day, slot, step, onNext, onBack, master = MASTER }) {
  if (!service) {
    return (
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title">Нет доступных услуг</div>
        <div className="section-sub" style={{ marginTop: 6 }}>Включите публичную активную услугу в кабинете.</div>
      </div>
    );
  }
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
        <SumRow icon="pin" label="Где" value={master.studio.split(',')[0]} />
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
