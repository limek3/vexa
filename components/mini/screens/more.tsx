'use client';

import { Fragment, useState } from 'react';
import { useTheme } from '../theme';
import { ActionSheet, Card, Avatar, ListRow, Divider, SectionTitle } from '../primitives/atoms';
import { useMiniData } from '@/hooks/use-mini-data';
import { useChats } from '@/hooks/use-chats';
import { useMiniToast } from '../bridge';

interface MenuItem {
  icon: string;
  label: string;
  sub?: string;
  go?: string;
  danger?: boolean;
  accent?: boolean;
  onAction?: () => void;
}

export function MoreScreen({ go }: { go: (kind: string) => void }) {
  const { T, mode } = useTheme();
  const { MASTER, SUBSCRIPTION, TEMPLATES } = useMiniData();
  const { threads } = useChats();
  const { show } = useMiniToast();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const openSupport = () => {
    if (typeof window !== 'undefined') {
      window.open('https://t.me/clickbook_support', '_blank');
    }
  };
  const openDocs = () => {
    if (typeof window !== 'undefined') {
      window.open('https://clickbook.app/docs', '_blank');
    }
  };
  const logout = () => setLogoutOpen(true);
  const confirmLogout = () => {
    setLogoutOpen(false);
    show('Сессия завершена', 'success');
    if (typeof window !== 'undefined') {
      setTimeout(() => { window.location.href = '/auth/signout'; }, 600);
    }
  };
  const periodEnd = SUBSCRIPTION.currentPeriodEnd
    ? new Date(SUBSCRIPTION.currentPeriodEnd).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : '';
  const subSub = `${SUBSCRIPTION.planLabel}${periodEnd ? ' · до ' + periodEnd : ''}`;
  const unreadTotal = threads.reduce((sum, thread) => sum + thread.unread, 0);
  const chatSub = unreadTotal > 0 ? `${unreadTotal} непрочитанных` : `${threads.length} переписок`;
  const reviewsSub = `${MASTER.rating ? MASTER.rating.toFixed(1) : '—'}${MASTER.rating ? ' рейтинг' : ''}`;

  return (
    <div style={{ padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={MASTER.name} src={MASTER.avatar} size={52} radius={14} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: T.text, letterSpacing: '-0.01em' }}>{MASTER.name}</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>{MASTER.username} · {MASTER.city}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: T.text3 }}>★ {MASTER.rating}</span>
              <span style={{ fontSize: 11, color: T.text3 }}>·</span>
              <span style={{ fontSize: 11, color: T.text3 }}>{MASTER.service}</span>
            </div>
          </div>
        </div>
      </Card>

      <MoreSection title="Работа" go={go} items={[
        { icon: 'list',           label: 'Услуги',             sub: 'Прайс, длительность, видимость', go: 'services' },
        { icon: 'message-square', label: 'Чаты',               sub: chatSub,                            go: 'chats' },
        { icon: 'bar-chart-3',    label: 'Аналитика',          sub: 'Выручка, конверсия, топы',      go: 'analytics' },
        { icon: 'calendar-clock', label: 'График работы',      sub: 'Дни и часы приёма',             go: 'schedule' },
        { icon: 'file-text',      label: 'Шаблоны сообщений',  sub: `${TEMPLATES.length} заготовок`,    go: 'templates' },
        { icon: 'star',           label: 'Отзывы',             sub: reviewsSub,                         go: 'reviews' },
      ]} />

      <MoreSection title="Каналы и продвижение" go={go} items={[
        { icon: 'plug',             label: 'Интеграции',     sub: 'TG, ВК, Сайт, Карты',  go: 'integrations' },
        { icon: 'arrow-down-right', label: 'Каналы записи',  sub: 'Источники и UTM',      go: 'sources' },
        { icon: 'megaphone',        label: 'Маркетинг',      sub: '2 активных кампании',  go: 'marketing' },
      ]} />

      <MoreSection title="Деньги" go={go} items={[
        { icon: 'wallet',     label: 'Финансы', sub: 'Баланс и история',         go: 'finance' },
        { icon: 'credit-card',label: 'Платежи', sub: 'Способы приёма оплат',     go: 'payments' },
        { icon: 'sparkles',   label: 'Подписка',sub: subSub,                      go: 'subscription', accent: true },
        { icon: 'gauge',      label: 'Лимиты',  sub: 'Использование тарифа',     go: 'limits' },
      ]} />

      <MoreSection title="Настройки" go={go} items={[
        { icon: 'user',     label: 'Профиль',       sub: 'Имя, специализация, био',                                  go: 'profile' },
        { icon: 'palette',  label: 'Внешний вид',   sub: mode === 'dark' ? 'Тёмная тема' : 'Светлая тема',           go: 'appearance' },
        { icon: 'bell',     label: 'Уведомления',   sub: 'Push, Email, Telegram',                                    go: 'notifications' },
      ]} />

      <MoreSection go={go} items={[
        { icon: 'book-open',       label: 'Инструкции',          onAction: openDocs },
        { icon: 'message-circle',  label: 'Связь с поддержкой',  onAction: openSupport },
        { icon: 'log-out',         label: 'Выйти', danger: true, onAction: logout },
      ]} />

      <div style={{ padding: '16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success }} />
        <span style={{ fontSize: 11, color: T.text3 }}>Все системы работают. КликБук v2.4.1</span>
      </div>
      <ActionSheet
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Выйти из аккаунта?"
        subtitle="Сессия miniapp завершится, но данные профиля и записи останутся."
        actions={[
          {
            id: 'logout',
            label: 'Выйти',
            icon: 'log-out',
            tone: 'danger',
            onClick: confirmLogout,
          },
        ]}
      />
    </div>
  );
}

function MoreSection({ title, items, go }: { title?: string; items: MenuItem[]; go: (kind: string) => void }) {
  return (
    <div>
      {title && <SectionTitle title={title} />}
      <Card padded={false}>
        {items.map((it, i) => (
          <Fragment key={i}>
            <ListRow
              icon={it.icon}
              label={it.label}
              sub={it.sub}
              danger={it.danger}
              accent={it.accent}
              onClick={it.go ? () => go(it.go!) : (it.onAction ?? undefined)}
            />
            {i < items.length - 1 && <Divider />}
          </Fragment>
        ))}
      </Card>
    </div>
  );
}
