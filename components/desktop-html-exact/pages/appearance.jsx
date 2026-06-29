import React, { useState } from 'react';
import { Icon, Badge, Card, Btn, Switch, Segmented, NumberPopIn } from '../desktop-html-ui';

/* Appearance page — настройки внешности приложения и публичной страницы */

export function AppearancePage({ tweaks, setTweak }) {
  const [section, setSection] = useState('theme');
  const [coverStyle, setCoverStyle] = useState('gradient');

  return (
    <div data-screen-label="08 Appearance">
      <div className="page-head">
        <div>
          <h1 className="page-title">Внешний вид</h1>
          <p className="page-subtitle">Тема и стиль приложения, а также личной страницы записи</p>
        </div>
        <Btn icon="check" kind="primary">Сохранить</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Side nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 'calc(var(--topbar-h) + 24px)' }}>
          {[
            { id: 'theme',  label: 'Тема и accent',     icon: 'palette' },
            { id: 'typography', label: 'Типографика',   icon: 'edit' },
            { id: 'layout', label: 'Плотность и углы',  icon: 'grid' },
            { id: 'cards',  label: 'Карточки',          icon: 'services' },
            { id: 'page',   label: 'Личная страница',   icon: 'page' },
            { id: 'buttons',label: 'Кнопки и бейджи',   icon: 'zap' },
          ].map(it => (
            <button key={it.id} onClick={() => setSection(it.id)} className={`nav-item ${section === it.id ? 'active' : ''}`}>
              <Icon name={it.icon} size={14} className="icon" />
              <span>{it.label}</span>
            </button>
          ))}
        </div>

        {/* Settings */}
        <div className="col">
          {section === 'theme' && <>
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Тема оформления</div>
              <div className="grid-3">
                {[
                  { v: 'light',  label: 'Светлая', desc: 'Тёплый off-white' },
                  { v: 'dark',   label: 'Тёмная',  desc: 'Мягкий графит' },
                  { v: 'system', label: 'Системная', desc: 'По настройкам ОС' },
                ].map(t => (
                  <ThemeCard key={t.v} item={t} active={tweaks.theme === t.v || (tweaks.theme === 'light' && t.v === 'system' && false)} onClick={() => setTweak('theme', t.v === 'system' ? 'light' : t.v)} />
                ))}
              </div>
            </Card>

            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Accent tone</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { v: 'clay',   label: 'Коралловый', color: '#F25D73' },
                  { v: 'sage',   label: 'Зелёный',     color: '#35B978' },
                  { v: 'indigo', label: 'Синий',       color: '#5B7CFA' },
                  { v: 'plum',   label: 'Фиолетовый',  color: '#9B6CFF' },
                  { v: 'amber',  label: 'Янтарный',    color: '#D89A32' },
                ].map(c => (
                  <button key={c.v} onClick={() => setTweak('accent', c.v)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px',
                    background: tweaks.accent === c.v ? 'var(--surface-2)' : 'transparent',
                    border: '1.5px solid ' + (tweaks.accent === c.v ? c.color : 'var(--line)'),
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer', font: 'inherit',
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: c.color, boxShadow: tweaks.accent === c.v ? '0 0 0 3px var(--accent-soft-2)' : 'none' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', fontSize: 12.5, color: 'var(--text-3)' }}>
                Accent используется для активных пунктов меню, кнопок, статусов, ссылок и графиков. Меняется мгновенно.
              </div>
            </Card>
          </>}

          {section === 'layout' && <>
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Плотность интерфейса</div>
              <div className="grid-3">
                {['compact','default','cozy'].map(d => (
                  <DensityCard key={d} value={d} active={tweaks.density === d} onClick={() => setTweak('density', d)} />
                ))}
              </div>
            </Card>
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Скругления</div>
              <div className="grid-3">
                {[
                  { v: 'sharp', label: 'Острые', r: 4 },
                  { v: 'default', label: 'Стандарт', r: 10 },
                  { v: 'round', label: 'Круглые', r: 20 },
                ].map(d => (
                  <button key={d.v} onClick={() => setTweak('radius', d.v)} style={{
                    padding: 20, textAlign: 'center',
                    border: '1.5px solid ' + (tweaks.radius === d.v ? 'var(--accent)' : 'var(--line)'),
                    background: tweaks.radius === d.v ? 'var(--accent-soft)' : 'var(--surface)',
                    borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'inherit',
                  }}>
                    <div style={{ width: 50, height: 38, background: 'var(--surface-3)', borderRadius: d.r, margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</div>
                  </button>
                ))}
              </div>
            </Card>
          </>}

          {section === 'cards' && (
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Стиль карточек</div>
              <div className="grid-2">
                {[
                  { v: 'solid',  label: 'Сплошные',  border: '1px solid var(--line)', shadow: 'none' },
                  { v: 'soft',   label: 'Мягкие',    border: '1px solid var(--line)', shadow: 'var(--shadow-sm)' },
                ].map(c => (
                  <div key={c.v} className="card" style={{ border: c.border, boxShadow: c.shadow, cursor: 'pointer' }}>
                    <div className="section-title" style={{ marginBottom: 4 }}>{c.label}</div>
                    <div className="section-sub">Превью карточки</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'page' && <>
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Стиль обложки</div>
              <div className="grid-3">
                {[
                  { v: 'gradient', label: 'Градиент' },
                  { v: 'photo',    label: 'Фотография' },
                  { v: 'solid',    label: 'Сплошная' },
                ].map(c => (
                  <button key={c.v} onClick={() => setCoverStyle(c.v)} style={{
                    padding: 0, border: '1.5px solid ' + (coverStyle === c.v ? 'var(--accent)' : 'var(--line)'),
                    background: 'transparent',
                    borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'inherit', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: 80,
                      background: c.v === 'gradient' ? 'linear-gradient(135deg, var(--surface-2), var(--surface-3))' :
                        c.v === 'photo' ? 'repeating-linear-gradient(135deg, var(--surface-2) 0 8px, var(--surface-3) 8px 16px)' :
                        'var(--accent-soft-2)',
                    }} />
                    <div style={{ padding: '10px', fontSize: 13, fontWeight: 500, textAlign: 'left' }}>{c.label}</div>
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Что показывать на странице</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <ToggleRow label="Фото мастера" sub="Аватар крупным планом" defaultOn />
                <ToggleRow label="О себе" sub="Текстовое описание под именем" defaultOn />
                <ToggleRow label="Адрес и контакты" sub="Студия, телефон, мессенджеры" defaultOn />
                <ToggleRow label="Рейтинг и отзывы" sub="Звёзды и количество отзывов" defaultOn />
                <ToggleRow label="Список услуг" sub="Карточки услуг с ценой" defaultOn />
                <ToggleRow label="Watermark на странице записи" sub="Доступно в платных тарифах" />
              </div>
            </Card>
          </>}

          {section === 'buttons' && <>
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Стиль кнопок</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ToggleRow label="Подсветка hover" sub="Лёгкое изменение фона при наведении" defaultOn />
                <ToggleRow label="Анимация при клике" sub="Плавная отдача" defaultOn />
                <ToggleRow label="Tonal-кнопки" sub="Использовать мягкие приглушённые цвета вместо ярких" />
                <ToggleRow label="Иконки в кнопках" sub="Показывать иконку слева от текста" defaultOn />
              </div>

              <div className="card-divider" />

              <div className="section-title" style={{ marginBottom: 12 }}>Размер по умолчанию</div>
              <div className="grid-3" style={{ gap: 8 }}>
                {[
                  { v: 'sm', label: 'Компактные', h: 26 },
                  { v: 'md', label: 'Стандарт',   h: 32 },
                  { v: 'lg', label: 'Крупные',    h: 38 },
                ].map(o => (
                  <button key={o.v} style={{
                    padding: 16, border: '1.5px solid ' + (o.v === 'md' ? 'var(--accent)' : 'var(--line)'),
                    background: o.v === 'md' ? 'var(--accent-soft)' : 'var(--surface)',
                    borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'inherit', textAlign: 'center',
                  }}>
                    <div style={{
                      width: 80, height: o.h, background: 'var(--accent)', borderRadius: 6,
                      margin: '0 auto 10px',
                    }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{o.label}</div>
                  </button>
                ))}
              </div>

              <div className="card-divider" />

              <div className="section-title" style={{ marginBottom: 12 }}>Превью</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 14, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                <Btn kind="primary" icon="plus">Primary</Btn>
                <Btn kind="secondary" icon="edit">Secondary</Btn>
                <Btn kind="soft" icon="sparkle">Soft</Btn>
                <Btn kind="ghost" icon="more-v">Ghost</Btn>
                <Btn kind="danger" icon="trash">Danger</Btn>
                <Btn kind="primary" size="sm">Small</Btn>
                <Btn kind="secondary" size="sm">Small</Btn>
              </div>
            </Card>

            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Бейджи и статусы</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Badge>Обычный</Badge>
                <Badge kind="accent">Accent</Badge>
                <Badge kind="success">Готово</Badge>
                <Badge kind="info">Новый</Badge>
                <Badge kind="warn">Внимание</Badge>
                <Badge kind="danger">Отменено</Badge>
              </div>
            </Card>
          </>}

          {section === 'typography' && (
            <Card>
              <div className="section-title" style={{ marginBottom: 14 }}>Шрифт интерфейса</div>
              <div className="grid-2">
                {[
                  { v: 'JetBrains Mono', label: 'JetBrains Mono · стандарт' },
                  { v: 'Instrument Serif', label: 'Instrument Serif · display' },
                ].map(f => (
                  <button key={f.v} style={{
                    padding: 16, textAlign: 'left',
                    border: '1.5px solid ' + (f.v === 'JetBrains Mono' ? 'var(--accent)' : 'var(--line)'),
                    background: f.v === 'JetBrains Mono' ? 'var(--accent-soft)' : 'var(--surface)',
                    borderRadius: 'var(--r-sm)', cursor: 'pointer', font: 'inherit',
                  }}>
                    <div style={{ fontFamily: f.v === 'Instrument Serif' ? 'var(--font-display)' : 'var(--font-ui)', fontSize: 22, fontWeight: 600, letterSpacing: 0 }}>Aa</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 6 }}>{f.label}</div>
                  </button>
                ))}
              </div>

              <div className="card-divider" />

              <div className="section-title" style={{ marginBottom: 12 }}>Размер шрифта</div>
              <Segmented value="md" onChange={() => {}} items={[
                { value: 'sm', label: 'Меньше' },
                { value: 'md', label: 'Стандарт' },
                { value: 'lg', label: 'Больше' },
              ]} />
              <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6 }}>Превью</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>Заголовок страницы</div>
                <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 4 }}>Обычный текст и описание элементов интерфейса.</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>Мелкие подсказки и метаданные.</div>
              </div>
            </Card>
          )}
        </div>

        {/* Live preview */}
        <div style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 24px)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Предпросмотр</div>
          <PreviewMini />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ item, active, onClick }) {
  const isDark = item.v === 'dark';
  const isSys = item.v === 'system';
  return (
    <button onClick={onClick} style={{
      padding: 0,
      border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
      borderRadius: 'var(--r-sm)',
      background: 'transparent',
      cursor: 'pointer', font: 'inherit',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 100,
        background: isDark ? '#181818' : isSys ? 'linear-gradient(90deg, #eef4f9 50%, #181818 50%)' : '#eef4f9',
        position: 'relative',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ position: 'absolute', left: 12, top: 12, width: 8, height: 8, borderRadius: 999, background: isDark ? '#2d2d2d' : '#f1f3f6' }} />
        <div style={{ position: 'absolute', left: 12, top: 28, width: 60, height: 5, borderRadius: 999, background: isDark ? '#2d2d2d' : '#f1f3f6' }} />
        <div style={{ position: 'absolute', left: 12, top: 40, width: 40, height: 5, borderRadius: 999, background: isDark ? '#2d2d2d' : '#f1f3f6', opacity: 0.8 }} />
        <div style={{ position: 'absolute', right: 12, bottom: 12, width: 22, height: 10, background: 'var(--accent)', borderRadius: 3 }} />
      </div>
      <div style={{ padding: '10px 12px', textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{item.desc}</div>
      </div>
    </button>
  );
}

function DensityCard({ value, active, onClick }) {
  const labels = { compact: { l: 'Плотно', d: 'Меньше отступы' }, default: { l: 'Стандарт', d: 'Сбалансировано' }, cozy: { l: 'Свободно', d: 'Больше воздуха' } };
  const gaps = { compact: 4, default: 8, cozy: 14 };
  return (
    <button onClick={onClick} style={{
      padding: 16,
      border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
      background: active ? 'var(--accent-soft)' : 'var(--surface)',
      borderRadius: 'var(--r-sm)',
      cursor: 'pointer', font: 'inherit', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: gaps[value], marginBottom: 12 }}>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', width: '90%' }} />
        <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', width: '70%' }} />
        <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', width: '80%' }} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{labels[value].l}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{labels[value].d}</div>
    </button>
  );
}

function ToggleRow({ label, sub, defaultOn }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>
      </div>
      <Switch on={on} onChange={setOn} />
    </div>
  );
}

function PreviewMini() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--r-md)' }}>
      <div style={{ background: 'var(--bg)', padding: '6px 10px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--surface-3)' }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--surface-3)' }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--surface-3)' }} />
        </span>
        <span className="mono muted" style={{ fontSize: 10 }}>кликбук.рф</span>
      </div>

      <div style={{ padding: 16 }}>
        <div className="metric" style={{ padding: 14, marginBottom: 12 }}>
          <div className="metric-label">Записей сегодня</div>
          <div className="metric-value"><NumberPopIn value="5" /></div>
          <div className="metric-delta up"><Icon name="arrow-up" size={11} /> +1</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="card" style={{ padding: 10, background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-text)' }}>10:30 · Елена М.</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>AirTouch</div>
          </div>
          <div className="card" style={{ padding: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>15:00 · Дарья П.</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Уход K18</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <Btn size="sm" kind="primary" style={{ flex: 1 }}>Записать</Btn>
          <Btn size="sm" kind="secondary">Отмена</Btn>
        </div>
      </div>
    </div>
  );
}
