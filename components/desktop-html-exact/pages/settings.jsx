import React, { useMemo, useState } from 'react';
import { Icon, Badge, Card, Btn, Switch, Segmented, Empty, NumberPopIn } from '../desktop-html-ui';

const GROUPS = [
  { value: 'workspace', label: 'Рабочее место' },
  { value: 'booking', label: 'Запись' },
  { value: 'notify', label: 'Уведомления' },
  { value: 'security', label: 'Безопасность' },
  { value: 'data', label: 'Данные' },
];

const SETTINGS = {
  workspace: [
    ['compactHeader', 'Компактная верхняя панель', 'Оставляет больше места под таблицы и календарь.', true],
    ['showCommandCenter', 'Командный центр', '⌘K / Ctrl+K открывает быстрые действия.', true],
    ['rememberLastPage', 'Запоминать последний раздел', 'Desktop возвращается туда, где вы закончили работу.', true],
  ],
  booking: [
    ['autoConfirm', 'Автоподтверждение записей', 'Новые заявки сразу попадают в расписание.', true],
    ['sendClientConfirmation', 'Отправлять подтверждение клиенту', 'После создания записи клиент получает сообщение.', true],
    ['protectBusySlots', 'Защита занятых слотов', 'Не давать создать две записи на одно время.', true],
    ['allowManualBlocks', 'Ручные блокировки времени', 'Можно закрывать интервалы прямо в календаре.', true],
  ],
  notify: [
    ['desktopToasts', 'Desktop-уведомления', 'Показывать тосты о новых записях и действиях.', true],
    ['quietHours', 'Тихие часы', 'Не шуметь вечером и ночью.', false],
    ['fallbackEmail', 'Email-дублирование', 'Критичные события отправлять на почту.', true],
    ['dailyDigest', 'Ежедневная сводка', 'Короткий отчёт в конце дня.', false],
  ],
  security: [
    ['sessionLock', 'Блокировка сессии', 'Запрашивать вход после долгой паузы.', false],
    ['safeMode', 'Безопасный режим изменений', 'Подтверждать массовые действия.', true],
    ['auditLog', 'Журнал действий', 'Сохранять важные операции в истории.', true],
  ],
  data: [
    ['syncWorkspace', 'Синхронизация с сайтом', 'Использовать общий workspace и API сайта.', true],
    ['demoFallback', 'Demo fallback', 'Показывать demo-данные, если нет профиля.', true],
    ['cacheDesktop', 'Локальный кеш desktop', 'Быстрее открывать приложение после перезапуска.', true],
  ],
};

const SHORTCUTS = [
  { page: 'profile', icon: 'page', title: 'Профиль мастера', body: 'Публичные данные, контакты, описание.' },
  { page: 'appearance', icon: 'palette', title: 'Внешний вид', body: 'Тема, акцент, плотность, скругления.' },
  { page: 'availability', icon: 'calendar', title: 'Доступность', body: 'График, слоты и перерывы.' },
  { page: 'finance', icon: 'card', title: 'Финансы', body: 'Доходы, средний чек, экспорт.' },
  { page: 'notifications', icon: 'bell', title: 'Уведомления', body: 'События, каналы, тихие часы.' },
  { page: 'integrations', icon: 'link', title: 'Интеграции', body: 'Telegram, VK, сайт и внешние сервисы.' },
  { page: 'payments', icon: 'card', title: 'Платежи', body: 'Способы оплаты и чеки.' },
  { page: 'limits', icon: 'shield', title: 'Лимиты', body: 'Квоты тарифа и ограничения.' },
  { page: 'subscription', icon: 'crown', title: 'Подписка', body: 'Тариф, история платежей, лимиты.' },
  { page: 'account', icon: 'gear', title: 'Аккаунт', body: 'Личные настройки и вход.' },
];

function settingValue(platform, group, key, fallback) {
  const stored = platform?.moduleState?.settings?.[`${group}.${key}`];
  return stored ?? fallback;
}

export function SettingsPage({ platform, go }) {
  const [group, setGroup] = useState('workspace');
  const rows = SETTINGS[group] || SETTINGS.workspace;
  const unread = platform?.notifications?.filter((item) => item.unread).length || 0;
  const enabledCount = useMemo(() => Object.entries(SETTINGS).flatMap(([groupId, items]) => items.map(([key,, , fallback]) => settingValue(platform, groupId, key, fallback))).filter(Boolean).length, [platform]);

  const setValue = (groupId, key, value) => {
    platform?.setModuleValue?.('settings', `${groupId}.${key}`, value);
    if (groupId === 'notify' && key === 'quietHours') platform?.setModuleValue?.('notifications', 'quietHours', value);
  };

  const save = () => {
    platform?.recordAction?.('Настройки сохранены', 'Desktop использует те же данные workspace, что и сайт', { notify: true, icon: 'gear' });
  };

  return (
    <div data-screen-label="Desktop Settings">
      <div className="page-head">
        <div>
          <h1 className="page-title">Настройки</h1>
          <p className="page-subtitle">Все основные настройки desktop-зоны: поведение записи, уведомления, синхронизация, профиль и внешний вид.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon="refresh" kind="secondary" onClick={() => platform?.resetDemoData?.()}>Сброс demo</Btn>
          <Btn icon="check" kind="primary" onClick={save}>Сохранить</Btn>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Card>
          <div className="metric-label">Активных настроек</div>
          <div className="metric-value tabular"><NumberPopIn value={enabledCount} /></div>
          <div className="metric-delta up"><Icon name="check" size={11} /> включено</div>
        </Card>
        <Card>
          <div className="metric-label">Workspace</div>
          <div className="metric-value" style={{ fontSize: 20 }}>{platform?.isLive ? 'Live' : 'Demo'}</div>
          <div className="metric-delta"><Icon name="globe" size={11} /> общий слой данных</div>
        </Card>
        <Card>
          <div className="metric-label">Уведомления</div>
          <div className="metric-value tabular"><NumberPopIn value={unread} /></div>
          <button type="button" className="link" onClick={() => platform?.markNotificationsRead?.()} style={{ marginTop: 8 }}>Отметить прочитанными</button>
        </Card>
        <Card>
          <div className="metric-label">Тема</div>
          <div className="metric-value" style={{ fontSize: 20 }}>{platform?.preferences?.theme === 'dark' ? 'Dark' : 'Light'}</div>
          <button type="button" className="link" onClick={() => go?.('appearance')} style={{ marginTop: 8 }}>Открыть внешний вид</button>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) 390px', gap: 18, alignItems: 'start' }}>
        <Card>
          <div className="card-head">
            <div>
              <div className="section-title">Поведение платформы</div>
              <div className="section-sub">Эти переключатели сохраняются в module state и используются desktop-оболочкой.</div>
            </div>
            <Badge kind="accent">settings</Badge>
          </div>

          <Segmented value={group} onChange={setGroup} items={GROUPS} />

          <div style={{ marginTop: 14, border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            {rows.map(([key, title, body, fallback]) => {
              const enabled = settingValue(platform, group, key, fallback);
              return (
                <div key={key} className="li-row" style={{ padding: '15px 16px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: enabled ? 'var(--accent-text)' : 'var(--text-4)' }}>
                    <Icon name={enabled ? 'check' : 'x'} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 13.5 }}>{title}</strong>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.45 }}>{body}</div>
                  </div>
                  <Switch on={!!enabled} onChange={(value) => setValue(group, key, value)} />
                </div>
              );
            })}
          </div>
        </Card>

        <div className="col">
          <Card>
            <div className="section-title">Быстрые настройки</div>
            <div className="section-sub" style={{ marginTop: 4 }}>Все разделы, которые относятся к настройкам приложения.</div>
            <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
            <div style={{ display: 'grid', gap: 8 }}>
              {SHORTCUTS.map((item) => (
                <button key={item.page} type="button" className="li-row" onClick={() => go?.(item.page)} style={{ padding: 10, borderRadius: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--accent-text)' }}>
                    <Icon name={item.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <strong style={{ fontSize: 13 }}>{item.title}</strong>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{item.body}</div>
                  </div>
                  <Icon name="chevron-right" size={13} style={{ color: 'var(--text-4)' }} />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="section-title">Состояние подключения</div>
            <div className="section-sub" style={{ marginTop: 4 }}>Desktop не отдельный мок, а поверх общего workspace.</div>
            <div className="divider" style={{ margin: '14px calc(-1 * var(--pad-card))' }} />
            {platform?.isLive ? (
              <div style={{ display: 'grid', gap: 9 }}>
                <Status icon="check" title="Профиль найден" body={platform.master?.publicUrl} />
                <Status icon="calendar" title="Записи подключены" body={`${platform.appointments?.length || 0} записей`} />
                <Status icon="users" title="Клиенты подключены" body={`${platform.clients?.length || 0} клиентов`} />
              </div>
            ) : (
              <Empty icon="shield" title="Demo-режим" body="Нет живого workspace или включён ?demo=1. Разделы всё равно работают локально." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Status({ icon, title, body }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--accent-text)' }}>
        <Icon name={icon} size={14} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12 }}>{body || 'готово'}</div>
      </div>
    </div>
  );
}
