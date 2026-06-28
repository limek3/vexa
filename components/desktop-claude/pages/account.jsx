'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Avatar, Badge, Card, Btn, Switch, Check, Tabs, TabsUnderline, Segmented, Empty, Metric, Spark } from '../ui';
import { MASTER, STATUSES, SERVICES, CLIENTS, APPTS, CHATS, QUICK_REPLIES, TEMPLATES, NOTIFICATIONS, TASKS, WEEK_LABELS, today, fmtMonth } from '../data';

/* Account — настройки личного аккаунта */

export function AccountPage() {
  const [tab, setTab] = useState('profile');
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState({
    name: MASTER.name,
    profession: MASTER.profession,
    city: MASTER.city,
    studio: MASTER.studio,
    about: MASTER.about,
    phone: MASTER.phone,
    email: MASTER.email,
    username: MASTER.username,
  });
  const [hours, setHours] = useState([
    { day: 'Понедельник',  on: true,  from: '09:00', to: '19:00' },
    { day: 'Вторник',      on: true,  from: '09:00', to: '19:00' },
    { day: 'Среда',        on: true,  from: '10:00', to: '20:00' },
    { day: 'Четверг',      on: true,  from: '09:00', to: '19:00' },
    { day: 'Пятница',      on: true,  from: '10:00', to: '18:00' },
    { day: 'Суббота',      on: true,  from: '11:00', to: '17:00' },
    { day: 'Воскресенье',  on: false, from: '—',     to: '—' },
  ]);
  const [notif, setNotif] = useState({
    newBooking: true, cancel: true, reminders: true, chats: true,
    email: true, telegram: true, push: false, sms: false,
    digest: 'weekly',
  });
  const [security, setSecurity] = useState({ twoFA: true, sessions: 2 });
  const [confirm, setConfirm] = useState('auto');
  const [privacy, setPrivacy] = useState({ hideFullName: false, hidePhone: false, allowAnon: true });

  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabs = [
    { value: 'profile',   label: 'Профиль' },
    { value: 'hours',     label: 'Рабочие часы' },
    { value: 'notif',     label: 'Уведомления' },
    { value: 'public',    label: 'Публичная ссылка' },
    { value: 'security',  label: 'Безопасность' },
    { value: 'integrations', label: 'Интеграции' },
  ];

  return (
    <div data-screen-label="11 Account">
      <div className="page-head">
        <div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-subtitle">Профиль, расписание, уведомления и интеграции.</p>
        </div>
        <Btn kind="secondary" icon="check">Изменения сохранены</Btn>
      </div>

      <TabsUnderline value={tab} onChange={setTab} items={tabs} />

      {tab === 'profile' && (
        <div className="grid-cols-2-1" style={{ alignItems: 'flex-start' }}>
          <div className="col">
            <Card>
              <div className="section-title" style={{ marginBottom: 16 }}>Профиль мастера</div>
              <div style={{ display: 'flex', gap: 18, marginBottom: 22, alignItems: 'center' }}>
                <Avatar name={profile.name} size="xl" />
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <Btn kind="secondary" size="sm" icon="camera">Загрузить фото</Btn>
                    <Btn kind="ghost" size="sm">Удалить</Btn>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                    JPG / PNG до 4 МБ. Квадратное фото 400 × 400 пикселей.
                  </div>
                </div>
              </div>
              <div className="grid-2">
                <Field label="Имя и фамилия">
                  <input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                </Field>
                <Field label="Профессия">
                  <input className="input" value={profile.profession} onChange={e => setProfile({ ...profile, profession: e.target.value })} />
                </Field>
                <Field label="Город">
                  <input className="input" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} />
                </Field>
                <Field label="Адрес студии">
                  <input className="input" value={profile.studio} onChange={e => setProfile({ ...profile, studio: e.target.value })} />
                </Field>
              </div>
              <div style={{ marginTop: 14 }}>
                <Field label="О себе" hint="Это описание видят клиенты на публичной странице.">
                  <textarea className="textarea" rows="4" value={profile.about}
                    onChange={e => setProfile({ ...profile, about: e.target.value })} />
                </Field>
              </div>
            </Card>

            <Card>
              <div className="section-title" style={{ marginBottom: 16 }}>Контактные данные</div>
              <div className="grid-2">
                <Field label="Телефон" hint="Виден клиенту после подтверждения записи.">
                  <input className="input" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                </Field>
                <Field label="Email">
                  <input className="input" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                </Field>
                <Field label="Telegram">
                  <input className="input" defaultValue="@alisa_color" />
                </Field>
                <Field label="Instagram">
                  <input className="input" defaultValue="@alisa.studio" />
                </Field>
              </div>
            </Card>

            <Card>
              <div className="card-head">
                <div>
                  <div className="section-title">Язык и формат</div>
                  <div className="section-sub">Влияет на интерфейс и публичную страницу.</div>
                </div>
              </div>
              <div className="grid-2">
                <Field label="Язык интерфейса">
                  <select className="select" defaultValue="ru">
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="kk">Қазақша</option>
                  </select>
                </Field>
                <Field label="Часовой пояс">
                  <select className="select" defaultValue="msk">
                    <option value="msk">Europe / Moscow · GMT+3</option>
                    <option value="ekb">Asia / Yekaterinburg · GMT+5</option>
                    <option value="nsk">Asia / Novosibirsk · GMT+7</option>
                  </select>
                </Field>
                <Field label="Формат времени">
                  <Segmented value="24h" onChange={() => {}} items={[
                    { value: '24h', label: '24-часовой' },
                    { value: '12h', label: '12-часовой' },
                  ]} />
                </Field>
                <Field label="Валюта">
                  <select className="select" defaultValue="rub">
                    <option value="rub">₽ Рубль</option>
                    <option value="usd">$ Доллар</option>
                    <option value="eur">€ Евро</option>
                  </select>
                </Field>
              </div>
            </Card>
          </div>

          <div className="col">
            <Card style={{ background: 'var(--surface-2)' }}>
              <div className="section-title" style={{ marginBottom: 6 }}>Совет</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                Подробное «О себе» помогает клиентам определиться — мастера с описанием получают на 38% больше первичных записей.
              </div>
            </Card>
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Опасная зона</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Btn kind="secondary" icon="logout">Выйти из аккаунта</Btn>
                <Btn kind="danger" icon="trash">Удалить аккаунт</Btn>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 12, lineHeight: 1.5 }}>
                Удаление необратимо. Данные клиентов будут стёрты в течение 30 дней.
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'hours' && (
        <div className="grid-cols-2-1" style={{ alignItems: 'flex-start' }}>
          <Card>
            <div className="card-head">
              <div>
                <div className="section-title">Рабочие часы</div>
                <div className="section-sub">Эти часы видны клиентам при выборе времени.</div>
              </div>
              <Btn size="sm" kind="ghost">Применить ко всем дням</Btn>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {hours.map((h, i) => (
                <div key={h.day} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 1fr 1fr',
                  alignItems: 'center', gap: 14,
                  padding: '12px 4px',
                  borderBottom: i < hours.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Switch on={h.on} onChange={v => setHours(hours.map((x, j) => j === i ? { ...x, on: v } : x))} />
                    <div style={{ fontSize: 13.5, color: h.on ? 'var(--text)' : 'var(--text-4)' }}>{h.day}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center' }}>с</div>
                  {h.on ? (
                    <input className="input" value={h.from} style={{ maxWidth: 120 }}
                      onChange={e => setHours(hours.map((x, j) => j === i ? { ...x, from: e.target.value } : x))} />
                  ) : <div style={{ color: 'var(--text-4)', fontSize: 13 }}>Выходной</div>}
                  {h.on ? (
                    <input className="input" value={h.to} style={{ maxWidth: 120 }}
                      onChange={e => setHours(hours.map((x, j) => j === i ? { ...x, to: e.target.value } : x))} />
                  ) : <div />}
                </div>
              ))}
            </div>
          </Card>
          <div className="col">
            <Card>
              <div className="section-title" style={{ marginBottom: 12 }}>Перерывы</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { t: 'Обед', from: '13:00', to: '14:00' },
                  { t: 'Подготовка', from: '08:30', to: '09:00' },
                ].map(b => (
                  <div key={b.t} className="li-row" style={{ padding: '8px 10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{b.t}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{b.from}—{b.to}, каждый рабочий день</div>
                    </div>
                    <button className="btn btn-ghost icon"><Icon name="more-v" size={13} /></button>
                  </div>
                ))}
              </div>
              <Btn kind="ghost" size="sm" icon="plus" style={{ marginTop: 10 }}>Добавить перерыв</Btn>
            </Card>
            <Card>
              <div className="section-title" style={{ marginBottom: 12 }}>Минимальный шаг записи</div>
              <Segmented value="30" onChange={() => {}} items={[
                { value: '15', label: '15 мин' },
                { value: '30', label: '30 мин' },
                { value: '60', label: '60 мин' },
              ]} />
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 10, lineHeight: 1.5 }}>
                Влияет на сетку времени в расписании и на публичной странице.
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'notif' && (
        <div className="grid-cols-2-1" style={{ alignItems: 'flex-start' }}>
          <Card>
            <div className="card-head">
              <div>
                <div className="section-title">Что присылать</div>
                <div className="section-sub">Уведомления приходят на выбранные каналы.</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { k: 'newBooking', t: 'Новая запись',          d: 'Когда клиент сам записывается на услугу.' },
                { k: 'cancel',     t: 'Отмена и перенос',       d: 'Когда клиент отменяет или переносит запись.' },
                { k: 'reminders',  t: 'Напоминания о записях',  d: 'Напомним за 24 часа и за 2 часа до клиента.' },
                { k: 'chats',      t: 'Новые сообщения',        d: 'Когда клиент пишет в чат.' },
              ].map((it, i, arr) => (
                <div key={it.k} style={{ display: 'flex', gap: 16, padding: '14px 0', alignItems: 'flex-start', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{it.t}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{it.d}</div>
                  </div>
                  <Switch on={notif[it.k]} onChange={v => setNotif({ ...notif, [it.k]: v })} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="section-title" style={{ marginBottom: 12 }}>Каналы</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { k: 'email',    icon: 'mail',  t: 'Email',      d: profile.email },
                { k: 'telegram', icon: 'send',  t: 'Telegram',   d: '@alisa_color' },
                { k: 'push',     icon: 'bell',  t: 'Push в браузере',  d: 'Не подключено' },
                { k: 'sms',      icon: 'phone', t: 'SMS',        d: '+7 (921) ••• 12 02' },
              ].map(c => (
                <div key={c.k} className="li-row" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'var(--surface)', display: 'grid', placeItems: 'center',
                    color: 'var(--text-2)',
                  }}>
                    <Icon name={c.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.t}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{c.d}</div>
                  </div>
                  <Switch on={notif[c.k]} onChange={v => setNotif({ ...notif, [c.k]: v })} />
                </div>
              ))}
            </div>
            <div className="card-divider" />
            <div className="section-title" style={{ marginBottom: 10 }}>Сводка</div>
            <Segmented value={notif.digest} onChange={v => setNotif({ ...notif, digest: v })} items={[
              { value: 'daily', label: 'Каждый день' },
              { value: 'weekly', label: 'Раз в неделю' },
              { value: 'never', label: 'Не присылать' },
            ]} />
          </Card>
        </div>
      )}

      {tab === 'public' && (
        <div className="grid-cols-2-1" style={{ alignItems: 'flex-start' }}>
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Публичная ссылка</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
              <div style={{
                flex: 1,
                display: 'flex', alignItems: 'center',
                background: 'var(--surface-2)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                padding: '0 11px',
                fontFamily: 'var(--font-mono)', fontSize: 13,
                color: 'var(--text-2)',
                height: 36,
              }}>
                <span style={{ color: 'var(--text-3)' }}>кликбук.рф/</span>
                <input
                  style={{ border: 'none', background: 'transparent', outline: 'none', padding: '8px 0', flex: 1, font: 'inherit', color: 'var(--text)' }}
                  value={profile.username}
                  onChange={e => setProfile({ ...profile, username: e.target.value })}
                />
              </div>
              <Btn kind="secondary" icon={copied ? 'check' : 'copy'} onClick={copyLink}>
                {copied ? 'Скопировано' : 'Копировать'}
              </Btn>
              <Btn kind="ghost" icon="arrow-up-right">Открыть</Btn>
            </div>

            <div className="section-title" style={{ marginBottom: 10 }}>Подтверждение записей</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { v: 'auto',   t: 'Автоподтверждение',         d: 'Запись подтверждается сразу. Лучше для постоянных клиентов.' },
                { v: 'manual', t: 'Ручное подтверждение',      d: 'Вы вручную подтверждаете каждую запись.' },
                { v: 'new',    t: 'Только новых клиентов',     d: 'Авто для постоянных, вручную — для новых.' },
              ].map(o => (
                <div key={o.v}
                  className="li-row"
                  style={{
                    border: '1px solid', borderRadius: 'var(--r-sm)',
                    borderColor: confirm === o.v ? 'var(--accent)' : 'var(--line)',
                    background: confirm === o.v ? 'var(--accent-soft)' : 'transparent',
                    padding: '12px 14px',
                  }}
                  onClick={() => setConfirm(o.v)}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 999,
                    border: `2px solid ${confirm === o.v ? 'var(--accent)' : 'var(--line-strong)'}`,
                    background: 'var(--surface)',
                    display: 'grid', placeItems: 'center',
                    flexShrink: 0,
                  }}>
                    {confirm === o.v && <div style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: confirm === o.v ? 'var(--accent-text)' : 'var(--text)' }}>{o.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{o.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="col">
            <Card>
              <div className="section-title" style={{ marginBottom: 12 }}>Приватность</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { k: 'hideFullName', t: 'Скрывать фамилию', d: 'Покажем только имя.' },
                  { k: 'hidePhone',    t: 'Скрывать телефон до записи', d: 'Покажем после подтверждения.' },
                  { k: 'allowAnon',    t: 'Анонимные отзывы', d: 'Клиенты могут не указывать имя.' },
                ].map((it, i, arr) => (
                  <div key={it.k} style={{ display: 'flex', gap: 14, padding: '10px 0', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{it.t}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{it.d}</div>
                    </div>
                    <Switch on={privacy[it.k]} onChange={v => setPrivacy({ ...privacy, [it.k]: v })} />
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ background: 'var(--surface-2)' }}>
              <div className="section-title" style={{ marginBottom: 6 }}>Депозит за запись</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                Берёте небольшой депозит за сложные услуги — это снижает количество неявок до 4 раз.
              </div>
              <Btn kind="ghost" size="sm" style={{ marginTop: 10 }}>Настроить депозит →</Btn>
            </Card>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid-cols-2-1" style={{ alignItems: 'flex-start' }}>
          <Card>
            <div className="section-title" style={{ marginBottom: 14 }}>Пароль</div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <Field label="Текущий пароль">
                <input className="input" type="password" defaultValue="••••••••••••" />
              </Field>
              <Field label="Новый пароль" hint="Минимум 10 символов.">
                <input className="input" type="password" />
              </Field>
            </div>
            <Btn kind="secondary" icon="shield">Сменить пароль</Btn>

            <div className="card-divider" />

            <div className="section-title" style={{ marginBottom: 14 }}>Двухфакторная аутентификация</div>
            <div style={{ display: 'flex', gap: 14, padding: '12px 0', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--success-soft)', color: 'var(--success)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name="shield" size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Приложение-аутентификатор</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Подключено · Google Authenticator</div>
              </div>
              <Switch on={security.twoFA} onChange={v => setSecurity({ ...security, twoFA: v })} />
            </div>
          </Card>

          <Card>
            <div className="section-title" style={{ marginBottom: 12 }}>Активные сессии</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { d: 'Macbook Air · Safari',  city: 'Санкт-Петербург', time: 'Активна сейчас', cur: true },
                { d: 'iPhone 15 · ClickBook app',  city: 'Санкт-Петербург', time: '2 часа назад', cur: false },
              ].map(s => (
                <div key={s.d} className="li-row" style={{ padding: '10px 12px', background: 'var(--surface-2)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.d}
                      {s.cur && <Badge kind="success">Сейчас</Badge>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{s.city} · {s.time}</div>
                  </div>
                  {!s.cur && <Btn kind="ghost" size="sm">Завершить</Btn>}
                </div>
              ))}
            </div>
            <Btn kind="danger" size="sm" style={{ marginTop: 12 }}>Завершить все другие сессии</Btn>
          </Card>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="grid-3">
          {[
            { i: 'send', t: 'Telegram',     d: 'Уведомления и быстрые ответы клиентам.', on: true,  s: 'Подключено · @alisa_color' },
            { i: 'mail', t: 'Email',        d: 'Подтверждения и напоминания клиентам.',  on: true,  s: 'Подключено · noreply@кликбук.рф' },
            { i: 'calendar', t: 'Google Calendar', d: 'Синхронизация занятого времени.',  on: true,  s: 'Подключено · 2 календаря' },
            { i: 'calendar', t: 'Apple Calendar',  d: 'Импорт занятого времени.',         on: false, s: 'Не подключено' },
            { i: 'phone', t: 'SMS-шлюз',    d: 'Рассылка SMS клиентам без мессенджеров.',on: false, s: 'Доступно на Studio' },
            { i: 'link', t: 'Zapier',       d: 'Связь с CRM, таблицами и автоматизациями.', on: false, s: 'Доступно на Team' },
          ].map(it => (
            <div key={it.t} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--surface-2)', border: '1px solid var(--line)',
                  display: 'grid', placeItems: 'center',
                  color: 'var(--accent-text)',
                  marginBottom: 14,
                }}>
                  <Icon name={it.i} size={18} />
                </div>
                {it.on
                  ? <Badge kind="success">Подключено</Badge>
                  : <Badge>Выкл.</Badge>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{it.t}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>{it.d}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginBottom: 12 }}>{it.s}</div>
              <Btn kind={it.on ? 'secondary' : 'soft'} size="sm" style={{ width: '100%' }}>
                {it.on ? 'Настроить' : 'Подключить'}
              </Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
