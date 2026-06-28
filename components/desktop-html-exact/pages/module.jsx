import React, { useMemo, useState } from 'react';
import { Icon, Badge, Card, Btn, Switch, Empty, NumberPopIn } from '../desktop-html-ui';

const MODULES = {
  availability: {
    title: 'Доступность',
    subtitle: 'Рабочее время, перерывы и правила записи.',
    icon: 'calendar',
    primary: 'Сохранить график',
    metrics: ['Рабочих дней', 'Буфер', 'Горизонт записи'],
  },
  profile: {
    title: 'Профиль мастера',
    subtitle: 'Публичные данные специалиста и карточка команды.',
    icon: 'page',
    primary: 'Сохранить профиль',
    metrics: ['Заполнено', 'Публикация', 'Проверка'],
  },
  templates: {
    title: 'Шаблоны',
    subtitle: 'Быстрые ответы для чатов, записей и напоминаний.',
    icon: 'sparkle',
    primary: 'Создать шаблон',
    metrics: ['Активных', 'Использований', 'Каналов'],
  },
  notifications: {
    title: 'Уведомления',
    subtitle: 'События платформы, напоминания и тихие часы.',
    icon: 'bell',
    primary: 'Отметить прочитанными',
    metrics: ['Новых', 'Каналов', 'Тихие часы'],
  },
  integrations: {
    title: 'Интеграции',
    subtitle: 'Telegram, VK, сайт, календарь и внешние сервисы.',
    icon: 'link',
    primary: 'Подключить',
    metrics: ['Подключено', 'Ошибок', 'Синхронизация'],
  },
  reviews: {
    title: 'Отзывы',
    subtitle: 'Отзывы клиентов, публикация и ответы.',
    icon: 'star',
    primary: 'Запросить отзыв',
    metrics: ['Рейтинг', 'Новых', 'Опубликовано'],
  },
  finance: {
    title: 'Финансы',
    subtitle: 'Выручка, оплаты, долги и выгрузки.',
    icon: 'card',
    primary: 'Создать счет',
    metrics: ['Выручка', 'Оплачено', 'Долги'],
  },
  marketing: {
    title: 'Маркетинг',
    subtitle: 'Акции, рассылки и источники заявок.',
    icon: 'zap',
    primary: 'Запустить акцию',
    metrics: ['Лидов', 'Конверсия', 'Акции'],
  },
  payments: {
    title: 'Платежи',
    subtitle: 'Способы оплаты, чеки и статусы транзакций.',
    icon: 'card',
    primary: 'Добавить способ',
    metrics: ['Способов', 'Чеков', 'Возвратов'],
  },
  limits: {
    title: 'Лимиты',
    subtitle: 'Использование тарифа, квоты и ограничения.',
    icon: 'shield',
    primary: 'Обновить тариф',
    metrics: ['Клиенты', 'Сообщения', 'Записи'],
  },
  sources: {
    title: 'Источники',
    subtitle: 'Каналы привлечения и аналитика заявок.',
    icon: 'filter',
    primary: 'Добавить источник',
    metrics: ['Каналов', 'Заявок', 'Лучший'],
  },
  help: {
    title: 'Помощь',
    subtitle: 'Поддержка, диагностика и база знаний.',
    icon: 'help',
    primary: 'Написать в поддержку',
    metrics: ['Статус', 'Ответ', 'Документы'],
  },
  settings: {
    title: 'Настройки',
    subtitle: 'Настройки рабочего кабинета и поведения платформы.',
    icon: 'gear',
    primary: 'Сохранить',
    metrics: ['Профиль', 'Безопасность', 'Данные'],
  },
};

const DEFAULT_ROWS = [
  { key: 'autoConfirm', label: 'Автоподтверждение записей', sub: 'Новые записи сразу попадают в расписание.' },
  { key: 'clientReminders', label: 'Напоминания клиентам', sub: 'Платформа отправит сообщение за день и за два часа.' },
  { key: 'teamAccess', label: 'Доступ команды', sub: 'Администраторы могут видеть раздел и менять данные.' },
];

function metricValue(moduleId, index, platform) {
  if (moduleId === 'notifications') return index === 0 ? platform.notifications.filter((item) => item.unread).length : index === 1 ? 4 : '22:00';
  if (moduleId === 'templates') return index === 0 ? platform.templates.length : index === 1 ? '128' : 'TG/VK';
  if (moduleId === 'finance') return index === 0 ? '182 400 ₽' : index === 1 ? '91%' : '8 200 ₽';
  if (moduleId === 'reviews') return index === 0 ? platform.master.rating : index === 1 ? 3 : platform.master.reviews;
  if (moduleId === 'limits') return index === 0 ? `${platform.clients.length}/500` : index === 1 ? '341/2000' : `${platform.appointments.length}/300`;
  if (moduleId === 'integrations') return index === 0 ? 3 : index === 1 ? 0 : '5 мин';
  if (moduleId === 'sources') return index === 0 ? 5 : index === 1 ? 42 : 'Telegram';
  if (moduleId === 'availability') return index === 0 ? 6 : index === 1 ? '15 мин' : '30 дней';
  if (moduleId === 'profile') return index === 0 ? '86%' : index === 1 ? 'Онлайн' : 'ОК';
  if (moduleId === 'help') return index === 0 ? 'ОК' : index === 1 ? '< 5 мин' : 12;
  return index === 0 ? 'Вкл' : index === 1 ? 'ОК' : 'Авто';
}

function moduleRows(moduleId, platform) {
  if (moduleId === 'notifications') {
    return platform.notifications.slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      active: item.unread,
      badge: item.time,
    }));
  }
  if (moduleId === 'templates') {
    return platform.templates.map((item) => ({
      id: item.key,
      title: item.title,
      body: item.text,
      active: true,
      badge: item.key,
    }));
  }
  if (moduleId === 'sources') {
    return ['Telegram', 'VK', 'Сайт', 'Рекомендации', 'Реклама'].map((title, index) => ({
      id: title,
      title,
      body: `${8 + index * 3} заявок за последние 30 дней`,
      active: index < 4,
      badge: index === 0 ? 'лучший' : 'активен',
    }));
  }
  if (moduleId === 'payments') {
    return ['СБП', 'Карта', 'Наличные', 'Ссылка на оплату'].map((title, index) => ({
      id: title,
      title,
      body: index < 2 ? 'Подключено и доступно клиентам.' : 'Можно включить в любой момент.',
      active: index < 2,
      badge: index < 2 ? 'подключено' : 'выкл',
    }));
  }
  return DEFAULT_ROWS.map((row) => ({ ...row, id: row.key, title: row.label, body: row.sub, active: true, badge: 'сохранено' }));
}

export function ModulePage({ id, platform, go }) {
  const config = MODULES[id] || MODULES.settings;
  const rows = useMemo(() => moduleRows(id, platform), [id, platform]);
  const moduleState = platform.moduleState[id] || {};
  const [note, setNote] = useState('');

  const toggle = (key, value) => platform.setModuleValue(id, key, value);
  const addNote = () => {
    if (!note.trim()) return;
    platform.setModuleValue(id, `note_${Date.now()}`, note.trim());
    setNote('');
  };

  return (
    <div data-screen-label={`Module: ${id}`}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{config.title}</h1>
          <p className="page-subtitle">{config.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="arrow-up-right" kind="secondary" onClick={() => go?.('dashboard')}>На главную</Btn>
          <Btn icon={config.icon} kind="primary" onClick={() => toggle('lastActionAt', new Date().toISOString())}>{config.primary}</Btn>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        {config.metrics.map((label, index) => (
          <Card key={label}>
            <div className="metric-label">{label}</div>
            <div className="metric-value tabular"><NumberPopIn value={metricValue(id, index, platform)} /></div>
            <div className="metric-delta up">
              <Icon name="check" size={11} /> работает
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.85fr', gap: 16, alignItems: 'start' }}>
        <Card flush>
          <div className="card-head" style={{ padding: '16px 18px' }}>
            <div>
              <div className="section-title">Рабочие настройки</div>
              <div className="section-sub">Изменения сохраняются локально и остаются после перезагрузки.</div>
            </div>
            <Badge kind="success">active</Badge>
          </div>
          <div className="divider" />
          {rows.length === 0 ? (
            <Empty icon={config.icon} title="Пока пусто" body="Добавьте первый элемент, чтобы раздел начал работать." />
          ) : rows.map((row) => {
            const active = moduleState[row.id] ?? row.active;
            return (
              <div key={row.id} className="li-row" style={{ padding: '14px 18px' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--surface-2)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent-text)',
                  flexShrink: 0,
                }}>
                  <Icon name={config.icon} size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: 13.5 }}>{row.title}</strong>
                    <Badge className="outline plain">{row.badge}</Badge>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{row.body}</div>
                </div>
                <Switch on={!!active} onChange={(value) => toggle(row.id, value)} />
              </div>
            );
          })}
        </Card>

        <Card>
          <div className="section-title">Операционный журнал</div>
          <div className="section-sub" style={{ marginTop: 4 }}>Заметки и последние действия по разделу.</div>
          <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
          <div className="field">
            <div className="field-label">Новая заметка</div>
            <textarea className="textarea" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Что нужно помнить по этому разделу" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <Btn size="sm" kind="primary" icon="plus" onClick={addNote}>Добавить</Btn>
          </div>
          <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(moduleState)
              .filter(([key]) => key.startsWith('note_'))
              .slice(-5)
              .reverse()
              .map(([key, value]) => (
                <div key={key} className="card" style={{ padding: 10, background: 'var(--surface-2)', fontSize: 12.5, lineHeight: 1.45 }}>
                  {value}
                </div>
              ))}
            {!Object.keys(moduleState).some((key) => key.startsWith('note_')) && (
              <div className="muted" style={{ fontSize: 12.5 }}>Пока нет заметок. Раздел готов к работе.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
