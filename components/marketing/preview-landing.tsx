// app/(marketing)/preview/preview-landing-page.tsx
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  CalendarClock,
  Chrome,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  Link2,
  LogIn,
  MessageCircleMore,
  Mail,
  LockKeyhole,
  Palette,
  QrCode,
  UserRound,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users2,
  WalletCards,
} from 'lucide-react';

import { SiteHeader } from '@/components/shared/site-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/locale-context';
import { BrandLogo } from '@/components/brand/brand-logo';

type Locale = 'ru' | 'en';
type SlideId = 'service' | 'flow' | 'public' | 'workspace' | 'audience' | 'final';
type Accent = 'emerald' | 'violet' | 'sky' | 'rose';
type AuthMode = 'register' | 'login';

interface SlideMeta {
  id: SlideId;
  eyebrow: string;
  title: string;
  description: string;
  accent: Accent;
}

const LOCK_MS = 380;

const ACCENT_CLASS: Record<
  Accent,
  {
    dot: string;
    text: string;
    soft: string;
  }
> = {
  emerald: {
    dot: 'bg-primary',
    text: 'text-primary',
    soft: 'border-primary/16 bg-primary/8',
  },
  violet: {
    dot: 'bg-primary',
    text: 'text-primary',
    soft: 'border-primary/16 bg-primary/8',
  },
  sky: {
    dot: 'bg-primary',
    text: 'text-primary',
    soft: 'border-primary/16 bg-primary/8',
  },
  rose: {
    dot: 'bg-primary',
    text: 'text-primary',
    soft: 'border-primary/16 bg-primary/8',
  },
};

const ACCENT_FRAME_CLASS: Record<Accent, string> = {
  emerald: 'border-white/8 bg-white/[0.018]',
  violet: 'border-white/8 bg-white/[0.018]',
  sky: 'border-white/8 bg-white/[0.018]',
  rose: 'border-white/8 bg-white/[0.018]',
};

const ACCENT_FRAME_STYLE: Record<Accent, CSSProperties> = {
  emerald: {
    background: `
      radial-gradient(760px 420px at 0% 0%, rgba(255,255,255,0.05), transparent 62%),
      radial-gradient(720px 420px at 100% 10%, rgba(255,255,255,0.025), transparent 64%),
      linear-gradient(180deg, rgba(255,255,255,0.018), transparent 36%)
    `,
  },
  violet: {
    background: `
      radial-gradient(760px 420px at 0% 0%, rgba(255,255,255,0.05), transparent 62%),
      radial-gradient(720px 420px at 100% 10%, rgba(255,255,255,0.025), transparent 64%),
      linear-gradient(180deg, rgba(255,255,255,0.018), transparent 36%)
    `,
  },
  sky: {
    background: `
      radial-gradient(760px 420px at 0% 0%, rgba(255,255,255,0.05), transparent 62%),
      radial-gradient(720px 420px at 100% 10%, rgba(255,255,255,0.025), transparent 64%),
      linear-gradient(180deg, rgba(255,255,255,0.018), transparent 36%)
    `,
  },
  rose: {
    background: `
      radial-gradient(760px 420px at 0% 0%, rgba(255,255,255,0.05), transparent 62%),
      radial-gradient(720px 420px at 100% 10%, rgba(255,255,255,0.025), transparent 64%),
      linear-gradient(180deg, rgba(255,255,255,0.018), transparent 36%)
    `,
  },
};


function getSlides(locale: Locale): SlideMeta[] {
  if (locale === 'ru') {
    return [
      {
        id: 'service',
        eyebrow: 'Платформа для мастера',
        title:
          'КликБук объединяет запись, клиентов, напоминания и переписку в одном кабинете.',
        description:
          'Публичная страница, услуги, график, база клиентов и каналы Telegram / VK / web работают как единая система.',
        accent: 'emerald',
      },
      {
        id: 'flow',
        eyebrow: 'Единый путь клиента',
        title:
          'Клиент приходит с сайта, Telegram, VK или по прямой ссылке — и всегда попадает в одну карточку.',
        description:
          'Заявка не теряется: запись, контакт, чат, заметки и последующие действия собираются в общей клиентской истории.',
        accent: 'violet',
      },
      {
        id: 'public',
        eyebrow: 'Публичная страница',
        title:
          'Дайте клиенту красивую ссылку, где можно посмотреть услуги, выбрать время и записаться без переписки.',
        description:
          'Страница мастера выглядит как аккуратная мини-витрина: фото, описание, услуги, отзывы, адрес и запись онлайн.',
        accent: 'rose',
      },
      {
        id: 'workspace',
        eyebrow: 'Кабинет мастера',
        title:
          'Внутри кабинета всё под рукой: записи, клиенты, чаты, шаблоны, внешний вид и рабочие настройки.',
        description:
          'ClickBook помогает не просто принять заявку, а довести клиента до визита и вернуть его на повторную запись.',
        accent: 'sky',
      },
      {
        id: 'audience',
        eyebrow: 'Для кого КликБук',
        title:
          'Платформа подходит мастерам, небольшим студиям и экспертам, которым нужен не тяжёлый CRM-комбайн, а понятный рабочий кабинет.',
        description:
          'Маникюр, барбер, брови, массаж, тату, тренер, консультации и другие персональные услуги — в одном сценарии записи.',
        accent: 'emerald',
      },
      {
        id: 'final',
        eyebrow: 'Начало работы',
        title:
          'Создайте кабинет, подключите каналы связи и начните принимать записи из одной системы.',
        description:
          'Telegram, VK и web-сценарии собираются в один рабочий поток без лишней рутины.',
        accent: 'violet',
      },
    ];
  }

  return [
    {
      id: 'service',
      eyebrow: 'One service for the specialist',
      title:
        'ClickBook helps you manage bookings, client communication, and your workday in one place.',
      description:
        'The public page, online booking, messages, and workspace are combined into one clear product.',
      accent: 'emerald',
    },
    {
      id: 'flow',
      eyebrow: 'How booking works',
      title:
        'The client quickly chooses a service, finds an available slot, and books without extra messages.',
      description:
        'One link moves the client from discovery to confirmed booking and follow-up actions inside the product.',
      accent: 'violet',
    },
    {
      id: 'public',
      eyebrow: 'Public specialist page',
      title:
        'Show services, available time, and your booking link on one polished page.',
      description:
        'The client instantly understands who you are, what you offer, and how to book right now.',
      accent: 'rose',
    },
    {
      id: 'workspace',
      eyebrow: 'Workspace',
      title:
        'Track bookings, revenue, messages, and page status from one working dashboard.',
      description:
        'Everything you need for day-to-day work stays on one clear overview screen.',
      accent: 'sky',
    },
    {
      id: 'audience',
      eyebrow: 'ClickBook plans',
      title:
        'ClickBook fits solo professionals, beauty specialists, and small studios.',
      description:
        'Pick the right plan and launch online booking without a long setup.',
      accent: 'emerald',
    },
    {
      id: 'final',
      eyebrow: 'Sign in to ClickBook',
      title:
        'Create an account or sign in to start taking bookings online.',
      description:
        'Fast sign in, clear registration, and a short path into the workspace.',
      accent: 'violet',
    },
  ];
}

function EyebrowBadge({
  accent,
  children,
}: {
  accent: Accent;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'workspace-pill',
        ACCENT_CLASS[accent].soft,
        ACCENT_CLASS[accent].text,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', ACCENT_CLASS[accent].dot)} />
      <span>{children}</span>
    </div>
  );
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('workspace-section', className)}>{children}</div>;
}

function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('workspace-soft-panel', className)}>{children}</div>;
}

function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-foreground">{title}</div>
        {description ? <div className="mt-1 field-hint">{description}</div> : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="metric-label">{label}</div>
          <div className="mt-2 text-[18px] font-semibold tracking-[-0.04em] text-foreground">
            {value}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[calc(var(--radius-sm)-2px)] border border-border/80 bg-accent/50 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Panel>
  );
}

function FeatureCard({
  accent,
  icon: Icon,
  title,
  description,
  active = false,
}: {
  accent: Accent;
  icon: LucideIcon;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <Panel
      className={cn(
        'workspace-card-hover p-4',
        active && ACCENT_CLASS[accent].soft,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--radius-sm)-2px)] border border-border/80 bg-accent/50 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-foreground">{title}</div>
          <div className="mt-1 text-[12px] leading-6 text-muted-foreground">
            {description}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ActionRow({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      className="workspace-card-hover flex w-full items-center justify-between gap-3 rounded-[calc(var(--radius-md))] border border-border/90 bg-card px-4 py-3 text-left"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[calc(var(--radius-sm)-2px)] border border-border/80 bg-accent/50 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-[13px] font-medium text-foreground">
          {label}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function InfoRow({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[calc(var(--radius-md))] border border-border/90 bg-accent/35 px-3 py-3">
      <div className="text-[12px] text-muted-foreground">{left}</div>
      <div className="text-[12px] font-medium text-foreground">{right}</div>
    </div>
  );
}

function FieldCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Surface className={cn('px-3 py-3', className)}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-foreground">{value}</div>
    </Surface>
  );
}

function MiniButton({
  icon: Icon,
  children,
  variant = 'outline',
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  variant?: 'outline' | 'ghost';
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        'h-[var(--control-height)] rounded-[calc(var(--radius-sm))] px-3',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Button>
  );
}

function SlideTopActions({
  locale,
}: {
  locale: Locale;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MiniButton icon={BarChart3}>
        {locale === 'ru' ? 'Статистика' : 'Analytics'}
      </MiniButton>
      <MiniButton icon={LayoutDashboard}>
        {locale === 'ru' ? 'Профиль' : 'Profile'}
      </MiniButton>
      <Button
        size="sm"
        className="h-[var(--control-height)] rounded-[calc(var(--radius-sm))] px-3"
      >
        <Globe2 className="h-4 w-4" />
        {locale === 'ru' ? 'Публичная страница' : 'Public page'}
      </Button>
    </div>
  );
}

function PreviewProfileCard({
  locale,
}: {
  locale: Locale;
}) {
  const tags =
    locale === 'ru'
      ? ['Маникюр', 'Педикюр', 'Брови']
      : ['Nails', 'Pedicure', 'Brows'];

  return (
    <Panel className="h-full p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[calc(var(--radius-md))] border border-border/80 bg-accent/50 text-[12px] font-semibold text-foreground">
          Б
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[14px] font-semibold text-foreground">Борис</div>
            <div className="workspace-pill">{locale === 'ru' ? 'Онлайн' : 'Online'}</div>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {locale === 'ru' ? 'Мастер' : 'Master'}
          </div>
          <div className="text-[11px] text-muted-foreground">Калининград</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((item) => (
          <div key={item} className="chip-muted">
            {item}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-[var(--control-height)] min-w-[148px] rounded-[calc(var(--radius-sm))]"
        >
          <ExternalLink className="h-4 w-4" />
          {locale === 'ru' ? 'Открыть страницу' : 'Open page'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-[var(--control-height)] min-w-[148px] rounded-[calc(var(--radius-sm))]"
        >
          <Copy className="h-4 w-4" />
          {locale === 'ru' ? 'Скопировать ссылку' : 'Copy link'}
        </Button>
      </div>
    </Panel>
  );
}

function DashboardPreview({
  locale,
  accent,
  focus,
}: {
  locale: Locale;
  accent: Accent;
  focus: 'service' | 'workspace';
}) {
  const t =
    locale === 'ru'
      ? {
          live:
            focus === 'service'
              ? 'Публичная страница активна'
              : 'Рабочий кабинет мастера',
          title:
            focus === 'service' ? 'Главная ссылка мастера' : 'Кабинет мастера',
          description:
            focus === 'service'
              ? 'Покажите клиенту страницу мастера, отправьте ссылку и принимайте записи из одного понятного кабинета.'
              : 'Следите за ближайшими записями, выручкой, клиентами и быстрыми действиями на одном экране.',
          status: 'Статус',
          connected: 'Подключено',
          slug: 'Адрес страницы',
          publicMode: 'Режим записи',
          publicModeValue: 'Открыта для записи',
          copyLink: 'Скопировать ссылку',
          copyMessage: 'Скопировать сообщение',
          share: 'Поделиться',
          upcomingTitle: 'Ближайшие записи',
          upcomingDescription:
            'Все ближайшие клиенты и услуги на сегодня в одном коротком списке.',
          weeklyTitle: 'Динамика недели',
          weeklyDescription:
            'Доход, записи и активность страницы за последние дни.',
          pageState: 'Состояние страницы',
          publicLink: 'Публичная ссылка',
          active: 'Активна',
          conversion: 'Конверсия',
          newClients: 'Новые клиенты',
          quickActions: 'Быстрые действия',
          quickActionsDescription: 'Нужные настройки и рабочие сценарии под рукой.',
          popularServices: 'Популярные услуги',
          popularDescription:
            'Что чаще выбирают клиенты и что приносит больше выручки.',
          openCalendar: 'Открыть календарь',
          actions: [
            'Открыть чаты',
            'Настроить услуги',
            'Внешний вид',
            'Профиль мастера',
          ],
          services: [
            ['Маникюр + покрытие', '46%', '14 400 ₽'],
            ['Укладка', '28%', '8 200 ₽'],
            ['Брови', '19%', '5 700 ₽'],
          ] as const,
          stats: [
            ['Записи сегодня', '3', '2 подтверждено', CalendarClock],
            ['Доход за неделю', '31 200 ₽', 'средний чек 2 400 ₽', WalletCards],
            ['Просмотры страницы', '1240', '4.4% конверсия', BarChart3],
            ['Новые клиенты', '27', 'за последние 30 дней', Users2],
          ] as const,
          upcomingItems: [
            ['14:00', 'Мария Иванова', 'Маникюр + покрытие'],
            ['16:30', 'Елена Смирнова', 'Укладка'],
            ['18:00', 'Ольга Петрова', 'Брови'],
          ] as const,
          weeklyDays: [
            ['3 апр.', '4 800 ₽', '3 записи'],
            ['4 апр.', '2 400 ₽', '2 записи'],
            ['5 апр.', '2 400 ₽', '2 записи'],
            ['6 апр.', '4 800 ₽', '3 записи'],
          ] as const,
        }
      : {
          live:
            focus === 'service'
              ? 'Public page is active'
              : 'Specialist workspace',
          title: focus === 'service' ? 'Main specialist link' : 'Specialist workspace',
          description:
            focus === 'service'
              ? 'Show the public page to clients, share the link, and start taking bookings online.'
              : 'Track upcoming bookings, revenue, clients, and quick actions on one screen.',
          status: 'Status',
          connected: 'Connected',
          slug: 'Page address',
          publicMode: 'Booking mode',
          publicModeValue: 'Open for booking',
          copyLink: 'Copy link',
          copyMessage: 'Copy message',
          share: 'Share',
          upcomingTitle: 'Upcoming bookings',
          upcomingDescription:
            'All upcoming clients and services for today in one short list.',
          weeklyTitle: 'Weekly dynamics',
          weeklyDescription:
            'Revenue, bookings, and page activity over the last few days.',
          pageState: 'Page state',
          publicLink: 'Public link',
          active: 'Active',
          conversion: 'Conversion',
          newClients: 'New clients',
          quickActions: 'Quick actions',
          quickActionsDescription: 'Core settings and work actions close at hand.',
          popularServices: 'Popular services',
          popularDescription:
            'What clients choose most often and what drives more revenue.',
          openCalendar: 'Open calendar',
          actions: [
            'Open chats',
            'Configure services',
            'Appearance',
            'Specialist profile',
          ],
          services: [
            ['Nails + coating', '46%', '14 400 ₽'],
            ['Styling', '28%', '8 200 ₽'],
            ['Brows', '19%', '5 700 ₽'],
          ] as const,
          stats: [
            ['Bookings today', '3', '2 confirmed', CalendarClock],
            ['Revenue this week', '31 200 ₽', 'avg check 2 400 ₽', WalletCards],
            ['Page views', '1240', '4.4% conversion', BarChart3],
            ['New clients', '27', 'in the last 30 days', Users2],
          ] as const,
          upcomingItems: [
            ['14:00', 'Maria Ivanova', 'Nails + coating'],
            ['16:30', 'Elena Smirnova', 'Styling'],
            ['18:00', 'Olga Petrova', 'Brows'],
          ] as const,
          weeklyDays: [
            ['Apr 3', '4 800 ₽', '3 bookings'],
            ['Apr 4', '2 400 ₽', '2 bookings'],
            ['Apr 5', '2 400 ₽', '2 bookings'],
            ['Apr 6', '4 800 ₽', '3 bookings'],
          ] as const,
        };

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_288px]">
      <div className="min-w-0 space-y-4">
        <Panel className="hero-grid p-4 md:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0">
              <EyebrowBadge accent={accent}>{t.live}</EyebrowBadge>

              <h2 className="mt-4 text-[26px] font-semibold tracking-[-0.05em] text-foreground md:text-[28px]">
                {t.title}
              </h2>

              <p className="mt-3 max-w-[720px] text-[13px] leading-7 text-muted-foreground">
                {t.description}
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <FieldCard label={t.status} value={t.connected} />
                <FieldCard label={t.slug} value="www.кликбук.рф/m/boris" />
                <FieldCard label={t.publicMode} value={t.publicModeValue} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="workspace-input flex min-w-[260px] flex-1 items-center gap-2 px-3 text-[12px] text-muted-foreground">
                  <Link2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">https://www.кликбук.рф/m/boris</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-[var(--control-height)] rounded-[calc(var(--radius-sm))] px-3"
                >
                  <Copy className="h-4 w-4" />
                  {t.copyLink}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-[var(--control-height)] rounded-[calc(var(--radius-sm))] px-3"
                >
                  <Copy className="h-4 w-4" />
                  {t.copyMessage}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-[var(--control-height)] rounded-[calc(var(--radius-sm))] px-3"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.share}
                </Button>
              </div>
            </div>

            <div className="min-w-0">
              <PreviewProfileCard locale={locale} />
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {t.stats.map(([label, value, hint, Icon]) => (
            <StatCard
              key={label}
              icon={Icon}
              label={label}
              value={value}
              hint={hint}
            />
          ))}
        </div>

        <Panel className="p-4">
          <SectionTitle
            title={t.upcomingTitle}
            description={t.upcomingDescription}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-[var(--control-height)] rounded-[calc(var(--radius-sm))]"
              >
                {t.openCalendar}
                <ChevronRight className="h-4 w-4" />
              </Button>
            }
          />
          <div className="space-y-2">
            {t.upcomingItems.map(([time, client, service]) => (
              <div
                key={`${time}-${client}`}
                className="flex items-center justify-between gap-4 rounded-[calc(var(--radius-md))] border border-border/90 bg-accent/35 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{time}</div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">
                    {client}
                  </div>
                </div>
                <div className="shrink-0 text-[11px] text-muted-foreground">
                  {service}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle title={t.weeklyTitle} description={t.weeklyDescription} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0 rounded-[calc(var(--radius-md))] border border-border/90 bg-accent/35 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                {t.weeklyDays.map(([day, amount, count]) => (
                  <div
                    key={day}
                    className="rounded-[calc(var(--radius-sm))] border border-border/90 bg-card px-4 py-3"
                  >
                    <div className="text-[11px] text-muted-foreground">{day}</div>
                    <div className="mt-2 text-[14px] font-semibold text-foreground">
                      {amount}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[13px] font-medium text-foreground">{t.pageState}</div>
              <InfoRow left={t.publicLink} right={t.active} />
              <InfoRow left={t.conversion} right="4.4%" />
              <InfoRow left={t.newClients} right="27" />
            </div>
          </div>
        </Panel>
      </div>

      <div className="min-w-0 space-y-4">
        <Panel className="p-4">
          <SectionTitle
            title={t.quickActions}
            description={t.quickActionsDescription}
          />
          <div className="space-y-2">
            {t.actions.map((label, index) => (
              <ActionRow
                key={label}
                icon={
                  [MessageCircleMore, ReceiptText, Palette, LayoutDashboard][
                    index
                  ] as LucideIcon
                }
                label={label}
              />
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle
            title={t.popularServices}
            description={t.popularDescription}
          />
          <div className="space-y-2">
            {t.services.map(([name, percent, revenue]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 rounded-[calc(var(--radius-md))] border border-border/90 bg-accent/35 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-foreground">
                    {name}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {percent}
                  </div>
                </div>
                <div className="shrink-0 text-[12px] font-medium text-foreground">
                  {revenue}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PublicPagePreview({
  locale,
  accent,
}: {
  locale: Locale;
  accent: Accent;
}) {
  return (
    <Panel className="p-4">
      <div className="rounded-[calc(var(--radius-lg))] border border-border/90 bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius-md))] border border-border/80 bg-accent/50 text-[12px] font-semibold text-foreground">
              AP
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-foreground">
                Anna Petrova
              </div>
              <div className="text-[11px] text-muted-foreground">
                {locale === 'ru' ? 'Страница мастера' : 'Specialist page'}
              </div>
            </div>
          </div>
          <EyebrowBadge accent={accent}>
            {locale === 'ru' ? 'Запись открыта' : 'Booking open'}
          </EyebrowBadge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(locale === 'ru'
            ? ['Маникюр', 'Брови', 'Укладка']
            : ['Nails', 'Brows', 'Styling']
          ).map((item, index) => (
            <div
              key={item}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px]',
                index === 0
                  ? cn(
                      'border',
                      ACCENT_CLASS[accent].soft,
                      ACCENT_CLASS[accent].text,
                    )
                  : 'border-border/80 bg-accent/50 text-muted-foreground',
              )}
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[calc(var(--radius-md))] border border-border/90 bg-accent/35 px-4 py-3 text-[12px] text-foreground">
          {locale === 'ru'
            ? 'Ближайшее окно — сегодня, 16:30 · 60 мин'
            : 'Next slot — today, 16:30 · 60 min'}
        </div>

        <div className="mt-4">
          <Button className="h-[var(--control-height)] w-full rounded-[calc(var(--radius-sm))]">
            {locale === 'ru' ? 'Записаться' : 'Book now'}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function FlowScene({
  locale,
  accent,
}: {
  locale: Locale;
  accent: Accent;
}) {
  const steps =
    locale === 'ru'
      ? [
          [
            '01',
            'Мастер оформляет страницу',
            'Добавьте услуги, график работы и основную информацию, чтобы клиент сразу увидел всё нужное.',
          ],
          [
            '02',
            'Клиент выбирает время',
            'Одна ссылка ведёт к услугам, свободным слотам и кнопке записи без лишней переписки.',
          ],
          [
            '03',
            'Запись попадает в кабинет',
            'Дальше мастер работает с расписанием, сообщениями, напоминаниями и аналитикой.',
          ],
        ]
      : [
          [
            '01',
            'The master sets up the page',
            'Add services, schedule, and key profile info so the client sees everything important right away.',
          ],
          [
            '02',
            'The client picks a time',
            'One link leads to services, available slots, and the booking CTA without extra chat.',
          ],
          [
            '03',
            'The booking appears in workspace',
            'Then the master works with schedule, messages, reminders, and analytics.',
          ],
        ];

  const features =
    locale === 'ru'
      ? [
          [Bot, 'Шаблоны сообщений', 'Быстрее отвечайте клиентам и держите единый стиль общения.'],
          [CalendarClock, 'Напоминания', 'Снижайте количество пропусков и не забывайте о визитах.'],
          [ShieldCheck, 'Доверие к сервису', 'Аккуратная страница и понятная запись повышают конверсию.'],
          [ReceiptText, 'Статистика', 'Смотрите, какие услуги и действия приносят больше результата.'],
        ]
      : [
          [Bot, 'Message templates', 'Reply faster and keep communication consistent.'],
          [CalendarClock, 'Reminders', 'Reduce missed visits and keep appointments on track.'],
          [ShieldCheck, 'Product trust', 'A polished page and clear booking flow improve conversion.'],
          [ReceiptText, 'Analytics', 'See which services and actions drive better results.'],
        ];

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[0.96fr_1.04fr]">
      <div className="min-w-0 space-y-4">
        {steps.map(([step, title, description], index) => (
          <Panel
            key={title}
            className={cn(
              'workspace-card-hover p-4',
              index === 0 && ACCENT_CLASS[accent].soft,
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius-md))] border border-border/80 bg-accent/50 text-[13px] font-semibold text-foreground">
                {step}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-medium text-foreground">{title}</div>
                <div className="mt-2 text-[12px] leading-6 text-muted-foreground">
                  {description}
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {features.map(([Icon, title, description], index) => (
            <FeatureCard
              key={title}
              accent={accent}
              icon={Icon as LucideIcon}
              title={title}
              description={description}
              active={index === 0}
            />
          ))}
        </div>

        <Panel className="p-4">
          <SectionTitle
            title={locale === 'ru' ? 'Путь клиента' : 'Client journey'}
            description={
              locale === 'ru'
                ? 'Одна связка: страница мастера → запись → кабинет.'
                : 'One connected flow: master page → booking → workspace.'
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            {(
              locale === 'ru'
                ? [
                    ['Страница мастера', 'Услуги и профиль'],
                    ['Онлайн-запись', 'Свободное окно и CTA'],
                    ['Кабинет', 'Рабочие действия'],
                  ]
                : [
                    ['Specialist page', 'Services and profile'],
                    ['Online booking', 'Available slot and CTA'],
                    ['Workspace', 'Work actions'],
                  ]
            ).map(([label, value]) => (
              <FieldCard key={label} label={label} value={value} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PublicScene({
  locale,
  accent,
}: {
  locale: Locale;
  accent: Accent;
}) {
  const features =
    locale === 'ru'
      ? [
          [Sparkles, 'Чистый первый экран', 'Клиент сразу видит мастера, услуги и ближайшее свободное окно.'],
          [QrCode, 'Простое распространение', 'Ссылку удобно отправить в мессенджере, соцсетях или по QR-коду.'],
          [CalendarClock, 'Быстрая запись', 'Путь до записи короткий и понятный без лишней переписки.'],
          [Palette, 'Фирменная страница', 'Оформление страницы выглядит аккуратно и профессионально.'],
        ]
      : [
          [Sparkles, 'Clean first screen', 'The client immediately sees the master, services, and the next slot.'],
          [QrCode, 'Easy sharing', 'The link is easy to send in messengers, social apps, or by QR code.'],
          [CalendarClock, 'Fast booking', 'The booking route is short and clear without extra chat.'],
          [Palette, 'Branded page', 'The public page looks polished and professional.'],
        ];

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[0.94fr_1.06fr]">
      <div className="min-w-0 space-y-4">
        <PublicPagePreview locale={locale} accent={accent} />

        <Panel className="p-4">
          <SectionTitle
            title={locale === 'ru' ? 'Что получает клиент' : 'What the client gets'}
            description={
              locale === 'ru'
                ? 'Одна понятная страница для выбора услуги, свободного окна и онлайн-записи.'
                : 'One clear page for choosing a service, finding a slot, and booking online.'
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            {(
              locale === 'ru'
                ? [
                    ['Услуги', 'Каталог услуг'],
                    ['Свободное окно', 'Ближайшее время'],
                    ['Действие', 'Записаться онлайн'],
                  ]
                : [
                    ['Services', 'Service catalog'],
                    ['Available slot', 'Next open time'],
                    ['Action', 'Book online'],
                  ]
            ).map(([label, value]) => (
              <FieldCard key={label} label={label} value={value} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="min-w-0 grid gap-4 md:grid-cols-2">
        {features.map(([Icon, title, description], index) => (
          <FeatureCard
            key={title}
            accent={accent}
            icon={Icon as LucideIcon}
            title={title}
            description={description}
            active={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

function PricingCard({
  locale,
  accent,
  title,
  description,
  price,
  features,
  featured = false,
}: {
  locale: Locale;
  accent: Accent;
  title: string;
  description: string;
  price: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <Panel
      className={cn(
        'workspace-card-hover flex h-full flex-col p-5',
        featured && ACCENT_CLASS[accent].soft,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-semibold text-foreground">{title}</div>
          <div className="mt-2 text-[12px] leading-6 text-muted-foreground">
            {description}
          </div>
        </div>
        {featured ? (
          <EyebrowBadge accent={accent}>
            {locale === 'ru' ? 'популярный' : 'popular'}
          </EyebrowBadge>
        ) : null}
      </div>

      <div className="mt-5 text-[28px] font-semibold tracking-[-0.05em] text-foreground">
        {price}
      </div>

      <div className="mt-5 space-y-2">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-[12px] text-foreground">
            <CheckCircle2 className={cn('h-4 w-4', ACCENT_CLASS[accent].text)} />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AudienceScene({
  locale,
  accent,
}: {
  locale: Locale;
  accent: Accent;
}) {
  const audience =
    locale === 'ru'
      ? [
          [Users2, 'Частный мастер', 'Подходит для мастеров, которым нужна запись, клиенты и одна ссылка на страницу.'],
          [Sparkles, 'Beauty / wellness', 'Удобно для nails, lashes, hair, brow и других услуг по записи.'],
          [LayoutDashboard, 'Небольшая студия', 'Позволяет держать записи и рабочие действия в одном кабинете.'],
        ]
      : [
          [Users2, 'Solo professional', 'Fits masters who need bookings, clients, and one public page link.'],
          [Sparkles, 'Beauty / wellness', 'Works well for nails, lashes, hair, brows, and other appointment-based services.'],
          [LayoutDashboard, 'Small studio', 'Keeps bookings and daily work actions in one dashboard.'],
        ];

  const plans =
    locale === 'ru'
      ? [
          {
            title: 'Start',
            description: 'Для первых клиентов и базовой страницы мастера.',
            price: '₽0',
            features: ['Публичная страница', 'Услуги и ссылка', 'Быстрый старт'],
          },
          {
            title: 'Pro',
            description: 'Для мастера, которому нужны шаблоны, напоминания и аналитика.',
            price: '₽990',
            features: ['Напоминания', 'Шаблоны сообщений', 'Аналитика'],
            featured: true,
          },
          {
            title: 'Studio',
            description: 'Для небольшой команды с более высокими лимитами.',
            price: '₽2 490',
            features: ['Командный режим', 'Больше лимитов', 'Гибкие сценарии'],
          },
        ]
      : [
          {
            title: 'Start',
            description: 'For first clients and a basic public page.',
            price: '₽0',
            features: ['Public page', 'Services and link', 'Fast start'],
          },
          {
            title: 'Pro',
            description: 'For masters who need templates, reminders, and analytics.',
            price: '₽990',
            features: ['Reminders', 'Message templates', 'Analytics'],
            featured: true,
          },
          {
            title: 'Studio',
            description: 'Для студии или команды с расширенными лимитами.',
            price: '₽2 490',
            features: ['Team mode', 'Higher limits', 'Flexible flows'],
          },
        ];

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="min-w-0 space-y-4">
        {audience.map(([Icon, title, description], index) => (
          <FeatureCard
            key={title}
            accent={accent}
            icon={Icon as LucideIcon}
            title={title}
            description={description}
            active={index === 1}
          />
        ))}

        <Panel className="p-4">
          <SectionTitle
            title={locale === 'ru' ? 'Почему выбирают КликБук' : 'Why people choose ClickBook'}
            description={
              locale === 'ru'
                ? 'Публичная страница, запись, клиентская база и каналы связи в одном сервисе.'
                : 'Fast public page launch, online booking, and a working dashboard in one service.'
            }
          />
          <div className="text-[13px] leading-7 text-muted-foreground">
            {locale === 'ru'
              ? 'КликБук помогает не терять заявки, вести клиента от записи до визита и держать рабочий день под контролем.'
              : 'ClickBook helps professionals start taking bookings faster, stay connected with clients, and keep the workday under control.'}
          </div>
        </Panel>
      </div>

      <div className="min-w-0 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard
            key={plan.title}
            locale={locale}
            accent={accent}
            title={plan.title}
            description={plan.description}
            price={plan.price}
            features={plan.features}
            featured={plan.featured}
          />
        ))}
      </div>
    </div>
  );
}

function AuthInput({
  label,
  placeholder,
  type = 'text',
  autoComplete,
  icon: Icon,
}: {
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  icon: LucideIcon;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="group flex h-12 items-center gap-3 rounded-[14px] border border-border/80 bg-background px-3 transition-colors hover:border-foreground/14 focus-within:border-foreground/20">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-border/80 bg-card text-muted-foreground shadow-none">
          <Icon className="h-4 w-4" />
        </div>
        <input
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-full w-full border-0 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground/72"
        />
      </div>
    </label>
  );
}

function AuthSocialButton({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full justify-center gap-2 rounded-[12px] border-border/80 bg-background px-3 text-[12px] font-medium text-foreground shadow-none hover:bg-accent/40"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="inline-flex items-center justify-center text-center">{children}</span>
    </Button>
  );
}

function AuthScene({
  locale,
}: {
  locale: Locale;
  accent: Accent;
}) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>('login');

  const copy =
    locale === 'ru'
      ? {
          brand: 'КликБук',
          subtitle: 'Кабинет мастера',
          login: 'Вход',
          register: 'Регистрация',
          loginTitle: 'Войти в кабинет',
          registerTitle: 'Создать кабинет',
          loginDescription: 'Откройте кабинет и продолжайте рабочий день без лишних шагов.',
          registerDescription: 'Создайте кабинет, настройте страницу и начните принимать записи.',
          email: 'Email',
          password: 'Пароль',
          fullName: 'Имя и фамилия',
          submitLogin: 'Войти',
          submitRegister: 'Создать кабинет',
          remember: 'Запомнить меня',
          forgot: 'Восстановить доступ',
          agreement: 'Принимаю условия сервиса.',
          socialTitle: 'Быстрый вход',
          google: 'Google',
          telegram: 'Telegram',
          max: 'ВК',
        }
      : {
          brand: 'ClickBook',
          subtitle: 'Specialist workspace',
          login: 'Sign in',
          register: 'Register',
          loginTitle: 'Sign in',
          registerTitle: 'Create workspace',
          loginDescription: 'Open the workspace and continue the day without extra steps.',
          registerDescription: 'Create the workspace, set up the page, and start taking bookings.',
          email: 'Email',
          password: 'Password',
          fullName: 'Full name',
          submitLogin: 'Sign in',
          submitRegister: 'Create workspace',
          remember: 'Remember me',
          forgot: 'Recover access',
          agreement: 'I accept the service terms.',
          socialTitle: 'Quick access',
          google: 'Google',
          telegram: 'Telegram',
          max: 'ВК',
        };

  const panelVariants: Variants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.12 } },
        exit: { opacity: 0, transition: { duration: 0.08 } },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
          opacity: 0,
          y: -6,
          transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
        },
      };

  return (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-auto px-4 py-6 md:px-6">
      <div className="w-full max-w-[420px]">
        <div className="overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border/80 bg-card px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <BrandLogo className="w-[74px] sm:w-[84px]" />
                <div className="min-w-0">
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{copy.subtitle}</div>
                </div>
              </div>

              <div className="rounded-full border border-border/80 bg-background px-3 py-1 text-[11px] text-muted-foreground">
                {mode === 'register' ? copy.register : copy.login}
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 pb-6 pt-5">
            <div className="grid grid-cols-2 gap-1.5 rounded-[18px] border border-border/80 bg-background p-1.5">
              {(['login', 'register'] as AuthMode[]).map((item) => {
                const active = mode === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className="relative rounded-[14px] px-4 py-3 text-[13px] font-medium text-muted-foreground transition"
                  >
                    {active ? (
                      <motion.span
                        layoutId="auth-mode-indicator"
                        className="absolute inset-0 rounded-[14px] bg-foreground shadow-none"
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                      />
                    ) : null}
                    <span className={cn('relative z-10 inline-flex items-center gap-2', active ? 'text-background' : 'text-foreground/72')}>
                      {item === 'register' ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                      {item === 'register' ? copy.register : copy.login}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[22px] border border-border/80 bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{copy.socialTitle}</div>
                <div className="text-[11px] text-muted-foreground">Google · Telegram · ВК</div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <AuthSocialButton icon={Chrome}>{copy.google}</AuthSocialButton>
                <AuthSocialButton icon={Send}>{copy.telegram}</AuthSocialButton>
                <AuthSocialButton icon={MessageCircleMore}>{copy.max}</AuthSocialButton>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-background p-5">
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'login' ? (
                  <motion.div
                    key="login"
                    variants={panelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div>
                      <div className="text-[28px] font-semibold tracking-[-0.05em] text-foreground">{copy.loginTitle}</div>
                      <div className="mt-2 text-[14px] leading-7 text-muted-foreground">{copy.loginDescription}</div>
                    </div>

                    <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
                      <AuthInput
                        label={copy.email}
                        type="email"
                        placeholder="hello@clickbook.app"
                        autoComplete="email"
                        icon={Mail}
                      />
                      <AuthInput
                        label={copy.password}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        icon={LockKeyhole}
                      />

                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <label className="inline-flex items-center gap-2 rounded-[12px] border border-border/80 bg-card px-3 py-2 text-foreground/82 transition hover:border-foreground/16 hover:text-foreground">
                          <input type="checkbox" className="peer sr-only" defaultChecked />
                          <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-[6px] border border-border bg-background text-transparent transition peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background">
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="leading-none">{copy.remember}</span>
                        </label>

                        <button type="button" className="font-medium text-muted-foreground transition hover:text-foreground">
                          {copy.forgot}
                        </button>
                      </div>

                      <Button type="submit" className="h-12 w-full rounded-[15px]">
                        <LogIn className="h-4 w-4" />
                        {copy.submitLogin}
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    variants={panelVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div>
                      <div className="text-[28px] font-semibold tracking-[-0.05em] text-foreground">{copy.registerTitle}</div>
                      <div className="mt-2 text-[14px] leading-7 text-muted-foreground">{copy.registerDescription}</div>
                    </div>

                    <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
                      <AuthInput
                        label={copy.fullName}
                        placeholder={locale === 'ru' ? 'Анна Петрова' : 'Anna Petrova'}
                        autoComplete="name"
                        icon={UserRound}
                      />
                      <AuthInput
                        label={copy.email}
                        type="email"
                        placeholder="hello@clickbook.app"
                        autoComplete="email"
                        icon={Mail}
                      />
                      <AuthInput
                        label={copy.password}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        icon={LockKeyhole}
                      />

                      <label className="flex items-start gap-2 rounded-[14px] border border-border/80 bg-card px-3.5 py-3 text-[12px] leading-6 text-muted-foreground">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border border-border bg-background text-background">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{copy.agreement}</span>
                      </label>

                      <Button type="submit" className="h-12 w-full rounded-[15px]">
                        <UserPlus className="h-4 w-4" />
                        {copy.submitRegister}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneBody({

  slide,
  locale,
}: {
  slide: SlideMeta;
  locale: Locale;
}) {
  switch (slide.id) {
    case 'service':
      return <DashboardPreview locale={locale} accent={slide.accent} focus="service" />;
    case 'flow':
      return <FlowScene locale={locale} accent={slide.accent} />;
    case 'public':
      return <PublicScene locale={locale} accent={slide.accent} />;
    case 'workspace':
      return <DashboardPreview locale={locale} accent={slide.accent} focus="workspace" />;
    case 'audience':
      return <AudienceScene locale={locale} accent={slide.accent} />;
    case 'final':
      return <AuthScene locale={locale} accent={slide.accent} />;
    default:
      return null;
  }
}

function SlideFrame({
  slide,
  locale,
  index,
  total,
}: {
  slide: SlideMeta;
  locale: Locale;
  index: number;
  total: number;
}) {
  if (slide.id === 'final') {
    return (
      <div className="relative h-full min-h-0">
        <div className="relative z-10 h-full min-h-0">
          <SceneBody slide={slide} locale={locale} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'workspace-card relative flex h-full min-h-0 flex-col overflow-hidden border p-5 md:p-6 xl:p-7',
        ACCENT_FRAME_CLASS[slide.accent],
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={ACCENT_FRAME_STYLE[slide.accent]}
      />
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="subtle-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_70%)]" />
      </div>

      <div className="relative z-10 mb-5 flex flex-wrap items-start justify-between gap-4 border-b pb-5 quiet-divider">
        <div className="min-w-0 max-w-[920px]">
          <EyebrowBadge accent={slide.accent}>{slide.eyebrow}</EyebrowBadge>

          <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.065em] text-foreground md:text-[50px] xl:text-[58px]">
            {slide.title}
          </h1>

          <p className="mt-4 max-w-[780px] text-[14px] leading-7 text-muted-foreground md:text-[15px]">
            {slide.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <SlideTopActions locale={locale} />
          <div className="chip-muted">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="scrollbar-thin relative z-10 min-h-0 flex-1 overflow-auto pr-1">
        <SceneBody slide={slide} locale={locale} />
      </div>
    </div>
  );
}

function SlideDots({
  slides,
  activeIndex,
  onGoTo,
}: {
  slides: SlideMeta[];
  activeIndex: number;
  onGoTo: (index: number) => void;
}) {
  return (
    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/90 bg-card px-3 py-2 shadow-[var(--shadow-soft)]">
      {slides.map((slide, index) => {
        const active = index === activeIndex;

        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => onGoTo(index)}
            aria-label={slide.title}
            className="rounded-full p-1"
          >
            <span
              className={cn(
                'block h-2 rounded-full transition-all duration-[var(--motion-base)]',
                active ? cn('w-7', ACCENT_CLASS[slide.accent].dot) : 'w-2 bg-border',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}


const MOBILE_FEATURES: Record<SlideId, string[]> = {
  service: [
    'Одна ссылка для мастера: услуги, отзывы, адрес и онлайн-запись.',
    'Заявки, клиенты и быстрые действия собраны в одном кабинете.',
    'Напоминания, шаблоны и история клиента доступны без лишних экранов.',
  ],
  flow: [
    'Клиент может прийти с web, Telegram или VK без потери заявки.',
    'Подтверждение, перенос и коммуникация собираются в один понятный поток.',
    'Каждый клиент попадает в базу и в карточку клиента.',
  ],
  public: [
    'На странице мастера собраны услуги, отзывы, портфолио и кнопки связи.',
    'Клиент быстро понимает, кто вы, что предлагаете и как записаться.',
    'Интерфейс остаётся удобным и аккуратным даже на маленьком экране.',
  ],
  workspace: [
    'Главная, клиенты, чаты, шаблоны и настройки собраны в одном кабинете.',
    'На телефоне кабинет выглядит как аккуратное приложение, а не как тяжёлая CRM.',
    'Меньше шума, больше полезных действий и понятных сценариев.',
  ],
  audience: [
    'Подходит частным мастерам, небольшим студиям и экспертам по услугам.',
    'Можно быстро показать страницу клиенту или запустить запись без долгой настройки.',
    'ClickBook помогает стартовать быстро и работать в одном понятном интерфейсе.',
  ],
  final: [],
};

function MobileAboutCard({
  slide,
  index,
  locale,
}: {
  slide: SlideMeta;
  index: number;
  locale: Locale;
}) {
  const points = locale === 'ru'
    ? MOBILE_FEATURES[slide.id]
    : MOBILE_FEATURES[slide.id].map((item) => item);

  return (
    <section className="workspace-card rounded-[22px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={cn('chip-muted', ACCENT_CLASS[slide.accent].soft, ACCENT_CLASS[slide.accent].text)}>
            {slide.eyebrow}
          </div>
          <h2 className="mt-3 text-[22px] font-semibold leading-[1.08] tracking-[-0.05em] text-foreground">
            {slide.title}
          </h2>
        </div>
        <div className="rounded-full border border-border/80 bg-background/72 px-3 py-1 text-[11px] text-muted-foreground">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{slide.description}</p>

      <div className="mt-4 space-y-2">
        {points.map((point) => (
          <div key={point} className="flex items-start gap-2 rounded-[16px] border border-border/70 bg-background/72 px-3 py-3">
            <span className={cn('mt-1 block h-2 w-2 rounded-full', ACCENT_CLASS[slide.accent].dot)} />
            <span className="text-[13px] leading-6 text-foreground">{point}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function createSceneVariants(direction: number, reduceMotion: boolean): Variants {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.12 } },
      exit: { opacity: 0, transition: { duration: 0.1 } },
    };
  }

  return {
    initial: {
      opacity: 0,
      x: direction > 0 ? 30 : -30,
      y: 8,
      scale: 0.992,
      filter: 'blur(6px)',
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.34,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      x: direction > 0 ? -24 : 24,
      y: -4,
      scale: 0.996,
      filter: 'blur(4px)',
      transition: {
        duration: 0.22,
        ease: [0.4, 0, 1, 1],
      },
    },
  };
}

function PreviewLandingPage() {
  const { locale } = useLocale();
  const currentLocale: Locale = locale === 'ru' ? 'ru' : 'en';
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  const slides = useMemo(() => getSlides(currentLocale).filter((slide) => slide.id !== 'final'), [currentLocale]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const lockRef = useRef(false);
  const touchStartY = useRef<number | null>(null);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (lockRef.current) return;

      const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
      if (bounded === activeIndex) return;

      setDirection(bounded > activeIndex ? 1 : -1);
      setActiveIndex(bounded);

      lockRef.current = true;
      window.setTimeout(() => {
        lockRef.current = false;
      }, LOCK_MS);
    },
    [activeIndex, slides.length],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  const activeSlide = slides[activeIndex];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(query.matches);
    sync();

    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const onWheel = (event: WheelEvent) => {
      if (lockRef.current) return;
      if (Math.abs(event.deltaY) < 28) return;

      event.preventDefault();

      if (event.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown' ||
        event.key === 'PageDown'
      ) {
        event.preventDefault();
        goNext();
      }

      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowUp' ||
        event.key === 'PageUp'
      ) {
        event.preventDefault();
        goPrev();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartY.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartY.current == null) return;

      const endY = event.changedTouches[0]?.clientY ?? null;
      if (endY == null) return;

      const delta = touchStartY.current - endY;
      if (Math.abs(delta) < 56) return;

      if (delta > 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel as EventListener);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [goNext, goPrev, isMobile]);

  const sceneVariants = useMemo(
    () => createSceneVariants(direction, Boolean(reduceMotion)),
    [direction, reduceMotion],
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="workspace-page relative space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.15rem)] pt-3">
          <section className="workspace-card hero-grid overflow-hidden rounded-[24px] p-4">
            <div className="chip-muted">{currentLocale === 'ru' ? 'О платформе' : 'About the platform'}</div>
            <h1 className="mt-3 text-[30px] font-semibold leading-[1.04] tracking-[-0.06em] text-foreground">
              {currentLocale === 'ru'
                ? 'КликБук помогает принимать записи, вести клиентов и держать рабочий день под рукой.'
                : 'ClickBook keeps bookings and your workday in one place.'}
            </h1>
            <p className="mt-3 text-[14px] leading-7 text-muted-foreground">
              {currentLocale === 'ru'
                ? 'Для мастера это один понятный продукт: публичная страница, запись, клиенты, чаты и напоминания в компактном интерфейсе.'
                : 'On mobile the product should feel compact, clear, and easy to use.'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button asChild className="rounded-full">
                <Link href="/login">{currentLocale === 'ru' ? 'Войти в кабинет' : 'Open login'}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full shadow-none">
                <Link href="/demo/demo">{currentLocale === 'ru' ? 'Посмотреть платформу' : 'View platform'}</Link>
              </Button>
            </div>
          </section>

          <div className="space-y-3">
            {slides.map((slide, index) => (
              <MobileAboutCard key={slide.id} slide={slide} index={index} locale={currentLocale} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100svh] overflow-hidden bg-background text-foreground">
      <SiteHeader />

      <main className="workspace-page workspace-page-wide relative flex h-[calc(100svh-64px)] min-h-0 flex-col overflow-hidden bg-background !pt-0 pb-8">
        <div className="relative flex h-full min-h-0 flex-col">
          <div className="mb-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-[var(--control-height)] w-[var(--control-height)] items-center justify-center rounded-[calc(var(--radius-sm))] border border-border/90 bg-card text-foreground transition-colors duration-[var(--motion-base)] hover:bg-accent"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="flex h-[var(--control-height)] w-[var(--control-height)] items-center justify-center rounded-[calc(var(--radius-sm))] border border-border/90 bg-card text-foreground transition-colors duration-[var(--motion-base)] hover:bg-accent"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeSlide.id}
                variants={sceneVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0"
              >
                <SlideFrame
                  slide={activeSlide}
                  locale={currentLocale}
                  index={activeIndex}
                  total={slides.length}
                />
              </motion.div>
            </AnimatePresence>

            <SlideDots slides={slides} activeIndex={activeIndex} onGoTo={goTo} />
          </div>
        </div>
      </main>
    </div>
  );
}

export { PreviewLandingPage };
export default PreviewLandingPage;