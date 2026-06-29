import React, { useEffect, useMemo, useState } from 'react';
import { Icon, Avatar, Badge, Card, Btn, Switch, Empty, NumberPopIn } from '../desktop-html-ui';

function profileDraft(master, services = []) {
  return {
    name: master?.name || '',
    profession: master?.profession || '',
    city: master?.city || '',
    studio: master?.studio || '',
    about: master?.about || '',
    phone: master?.phone || '',
    email: master?.email || '',
    username: master?.username || '',
    servicesText: Array.isArray(master?.services) && master.services.length ? master.services.join('\n') : services.map((item) => item.name).filter(Boolean).join('\n'),
    hidePhone: Boolean(master?.hidePhone),
    hideTelegram: Boolean(master?.hideTelegram),
    hideWhatsapp: Boolean(master?.hideWhatsapp),
  };
}

function completion(draft) {
  const fields = ['name', 'profession', 'city', 'about', 'phone', 'username'];
  const filled = fields.filter((key) => String(draft[key] || '').trim()).length;
  return Math.round((filled / fields.length) * 100);
}

function normalizePublicUrl(username) {
  const slug = String(username || 'master').trim().replace(/^@/, '').replace(/\s+/g, '-').toLowerCase();
  return `кликбук.рф/${slug || 'master'}`;
}

export function ProfilePage({ platform, go }) {
  const master = platform?.master || {};
  const [draft, setDraft] = useState(() => profileDraft(master, platform?.services || []));
  const [saving, setSaving] = useState(false);
  const score = useMemo(() => completion(draft), [draft]);
  const publicUrl = normalizePublicUrl(draft.username || master.username);

  useEffect(() => {
    setDraft(profileDraft(master, platform?.services || []));
  }, [master.name, master.profession, master.city, master.studio, master.about, master.phone, master.email, master.username, platform?.services]);

  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await platform?.saveMaster?.(draft);
      platform?.recordAction?.('Профиль мастера сохранён', publicUrl, { notify: true, icon: 'page' });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(publicUrl);
      platform?.recordAction?.('Ссылка скопирована', publicUrl, { notify: true, icon: 'copy' });
    } catch {
      platform?.recordAction?.('Ссылка готова', publicUrl, { notify: true, icon: 'copy' });
    }
  };

  return (
    <div data-screen-label="Desktop Master Profile">
      <div className="page-head">
        <div>
          <h1 className="page-title">Профиль мастера</h1>
          <p className="page-subtitle">Публичные данные, контакты и карточка специалиста. Сохраняется через тот же профиль, что и сайт.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="eye" kind="secondary" onClick={() => go?.('public')}>Предпросмотр</Btn>
          <Btn icon="check" kind="primary" onClick={save} disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить'}</Btn>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Card>
          <div className="metric-label">Заполнено</div>
          <div className="metric-value tabular"><NumberPopIn value={`${score}%`} /></div>
          <div className="progress" style={{ marginTop: 12 }}><span style={{ width: `${score}%` }} /></div>
        </Card>
        <Card>
          <div className="metric-label">Публичная ссылка</div>
          <div className="metric-value" style={{ fontSize: 18 }}>{publicUrl}</div>
          <button type="button" className="link" onClick={copyLink} style={{ marginTop: 8 }}>Скопировать</button>
        </Card>
        <Card>
          <div className="metric-label">Рейтинг</div>
          <div className="metric-value tabular"><NumberPopIn value={master.rating || 5.0} /></div>
          <div className="metric-delta up"><Icon name="star" size={11} /> {master.reviews || master.reviewCount || 0} отзывов</div>
        </Card>
        <Card>
          <div className="metric-label">Статус</div>
          <div className="metric-value" style={{ fontSize: 20 }}>Онлайн</div>
          <div className="metric-delta up"><Icon name="check" size={11} /> профиль активен</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) 380px', gap: 18, alignItems: 'start' }}>
        <Card>
          <div className="card-head">
            <div>
              <div className="section-title">Основная информация</div>
              <div className="section-sub">То, что клиент видит перед записью.</div>
            </div>
            <Badge kind="accent">master profile</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Имя мастера" value={draft.name} onChange={(value) => setField('name', value)} placeholder="Анна Смирнова" />
            <Field label="Специализация" value={draft.profession} onChange={(value) => setField('profession', value)} placeholder="Стилист по волосам" />
            <Field label="Город" value={draft.city} onChange={(value) => setField('city', value)} placeholder="Москва" />
            <Field label="Адрес / студия" value={draft.studio} onChange={(value) => setField('studio', value)} placeholder="ул. Примерная, 12" />
            <Field label="Телефон" value={draft.phone} onChange={(value) => setField('phone', value)} placeholder="+7 999 000 00 00" />
            <Field label="Email" value={draft.email} onChange={(value) => setField('email', value)} placeholder="hello@clickbook.ru" />
            <Field label="Слаг страницы" value={draft.username} onChange={(value) => setField('username', value)} placeholder="anna-hair" />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="field">
              <div className="field-label">Описание</div>
              <textarea className="textarea" rows={5} value={draft.about} onChange={(event) => setField('about', event.target.value)} placeholder="Коротко расскажите, чем занимаетесь и почему клиенту стоит записаться." />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="field">
              <div className="field-label">Услуги для публичного профиля</div>
              <textarea className="textarea" rows={4} value={draft.servicesText} onChange={(event) => setField('servicesText', event.target.value)} placeholder={'Стрижка\nОкрашивание\nУкладка'} />
            </div>
          </div>
        </Card>

        <div className="col">
          <Card>
            <div className="section-title">Превью карточки</div>
            <div className="section-sub" style={{ marginTop: 4 }}>Так профиль выглядит внутри desktop.</div>
            <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={draft.name || master.name} size="xl" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 650, letterSpacing: '-0.02em' }}>{draft.name || 'Имя мастера'}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{draft.profession || 'Специализация'}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <Badge kind="success"><Icon name="star" size={11} /> {master.rating || 5.0}</Badge>
                  <Badge className="outline plain">{draft.city || 'Город'}</Badge>
                </div>
              </div>
            </div>
            <div className="card" style={{ marginTop: 14, background: 'var(--surface-2)', padding: 14 }}>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>{draft.about || 'Описание появится здесь.'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Btn size="sm" kind="secondary" icon="copy" onClick={copyLink}>Ссылка</Btn>
              <Btn size="sm" kind="ghost" icon="palette" onClick={() => go?.('appearance')}>Внешний вид</Btn>
            </div>
          </Card>

          <Card>
            <div className="section-title">Контакты на странице</div>
            <div className="section-sub" style={{ marginTop: 4 }}>Можно скрывать отдельные каналы.</div>
            <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
            {[
              ['hidePhone', 'Скрыть телефон', 'Клиент не увидит номер до записи.'],
              ['hideTelegram', 'Скрыть Telegram', 'Не показывать TG-контакт.'],
              ['hideWhatsapp', 'Скрыть WhatsApp/VK', 'Оставить только запись через платформу.'],
            ].map(([key, title, body]) => (
              <div key={key} className="li-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13 }}>{title}</strong>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{body}</div>
                </div>
                <Switch on={!!draft[key]} onChange={(value) => setField(key, value)} />
              </div>
            ))}
          </Card>

          {!draft.name && (
            <Empty icon="page" title="Профиль не заполнен" body="Добавьте имя, специализацию и город, чтобы карточка стала полноценной." />
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}
