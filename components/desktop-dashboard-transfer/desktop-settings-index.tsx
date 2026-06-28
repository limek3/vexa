'use client';

import Link from 'next/link';
import {
  Bell,
  CalendarRange,
  CreditCard,
  Globe2,
  LayoutPanelTop,
  Link2,
  MessageSquareText,
  Package2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  WalletCards,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { Button } from '@/components/ui/button';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { cn } from '@/lib/utils';

const GROUPS = [
  {
    title: 'Профиль и витрина',
    description: 'Всё, что влияет на публичную страницу, услуги и запись клиентов.',
    items: [
      { href: '/desktop/profile', title: 'Профиль мастера', description: 'Имя, описание, контакты, адрес и публичная ссылка.', icon: SquarePen },
      { href: '/desktop/appearance', title: 'Внешний вид', description: 'Тема, акцент, плотность, скругления и визуальный стиль.', icon: LayoutPanelTop },
      { href: '/desktop/services', title: 'Услуги', description: 'Каталог услуг, цены, длительность и видимость на странице.', icon: Package2 },
      { href: '/desktop/availability', title: 'Доступность', description: 'Рабочие часы, перерывы, исключения и заблокированные окна.', icon: CalendarRange },
      { href: '/desktop/templates', title: 'Шаблоны', description: 'Сообщения для подтверждений, напоминаний и повторных записей.', icon: MessageSquareText },
    ],
  },
  {
    title: 'Каналы и автоматизация',
    description: 'Подключения, уведомления и источники заявок.',
    items: [
      { href: '/desktop/notifications', title: 'Уведомления', description: 'Telegram, VK, email, напоминания мастеру и клиенту.', icon: Bell },
      { href: '/desktop/integrations', title: 'Интеграции', description: 'Подключённые сервисы и статусы соединений.', icon: Link2 },
      { href: '/desktop/sources', title: 'Источники', description: 'Каналы, откуда приходят записи и заявки.', icon: Globe2 },
      { href: '/desktop/marketing', title: 'Продвижение', description: 'Публичная ссылка, повторные визиты и точки роста.', icon: Sparkles },
    ],
  },
  {
    title: 'Оплата и доступ',
    description: 'Финансы, платежи, тарифы и ограничения кабинета.',
    items: [
      { href: '/desktop/finance', title: 'Финансы', description: 'Доход, средний чек, услуги и динамика оплат.', icon: WalletCards },
      { href: '/desktop/payments', title: 'Платежи', description: 'История оплат, статусы и активный способ оплаты.', icon: CreditCard },
      { href: '/desktop/subscription', title: 'Подписка', description: 'Тариф, доступные возможности и продление.', icon: Package2 },
      { href: '/desktop/limits', title: 'Лимиты', description: 'Использование, квоты и технические ограничения.', icon: SlidersHorizontal },
    ],
  },
];

export function DesktopSettingsIndex() {
  const { hasHydrated, locale } = useOwnedWorkspaceData();

  if (!hasHydrated) return null;

  return (
    <WorkspaceShell>
      <div className="workspace-page space-y-5">
        <section className="overflow-hidden rounded-[28px] border border-black/[0.075] bg-white p-6 shadow-[0_18px_60px_rgba(17,17,17,0.045)] dark:border-white/[0.08] dark:bg-[#141414] dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-[720px]">
              <div className="inline-flex h-8 items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.025] px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/36">
                <Settings2 className="size-3.5" />
                {locale === 'ru' ? 'Desktop / настройки' : 'Desktop / settings'}
              </div>
              <h1 className="mt-5 text-[34px] font-semibold tracking-[-0.055em] text-[#111111] dark:text-[#f8f7f4]">
                {locale === 'ru' ? 'Все настройки сайта внутри /desktop' : 'All website settings inside /desktop'}
              </h1>
              <p className="mt-3 max-w-[620px] text-[14px] leading-7 text-[#6b7280] dark:text-[#9ca3af]">
                {locale === 'ru'
                  ? 'Это не отдельные desktop-заглушки: разделы ниже ведут на перенесённые страницы dashboard и используют те же данные, API, хуки и сохранение.'
                  : 'These are not separate desktop placeholders: the sections below point to transferred dashboard pages and use the same data, APIs, hooks, and persistence.'}
              </p>
            </div>

            <Button asChild>
              <Link href="/desktop/dashboard">
                {locale === 'ru' ? 'На главную' : 'Back to overview'}
              </Link>
            </Button>
          </div>
        </section>

        <div className="grid gap-5">
          {GROUPS.map((group) => (
            <section key={group.title} className="rounded-[24px] border border-black/[0.075] bg-white p-4 shadow-[0_14px_36px_rgba(17,17,17,0.035)] dark:border-white/[0.08] dark:bg-[#141414] dark:shadow-none">
              <div className="px-1 pb-4">
                <h2 className="text-[18px] font-semibold tracking-[-0.04em] text-[#111111] dark:text-[#f8f7f4]">{group.title}</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#6b7280] dark:text-[#9ca3af]">{group.description}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group rounded-[18px] border p-4 transition duration-150 active:scale-[0.99]',
                        'border-black/[0.07] bg-black/[0.018] hover:border-black/[0.13] hover:bg-black/[0.035]',
                        'dark:border-white/[0.075] dark:bg-white/[0.026] dark:hover:border-white/[0.14] dark:hover:bg-white/[0.05]',
                      )}
                    >
                      <span className="flex size-10 items-center justify-center rounded-[14px] border border-black/[0.07] bg-white text-black/44 transition group-hover:text-black dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/40 dark:group-hover:text-white">
                        <Icon className="size-4" />
                      </span>
                      <span className="mt-4 block text-[14px] font-semibold tracking-[-0.03em] text-[#111111] dark:text-[#f8f7f4]">{item.title}</span>
                      <span className="mt-2 block text-[12px] leading-5 text-[#6b7280] dark:text-[#9ca3af]">{item.description}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
