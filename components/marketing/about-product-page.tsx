// components/marketing/about-product-page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Globe2,
  Layers3,
  MessageCircleMore,
  Palette,
  Repeat2,
  Send,
  Sparkles,
  Star,
  UserRound,
  Users2,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { SiteHeader } from '@/components/shared/site-header';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';

type Locale = 'ru' | 'en';

type SheetId =
  | 'intro'
  | 'path'
  | 'product'
  | 'audience'
  | 'focus'
  | 'brand'
  | 'core';

type IconCard = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const ru = {
  nav: [
    ['intro', 'Старт'],
    ['path', 'Путь'],
    ['product', 'Продукт'],
    ['audience', 'Для кого'],
    ['focus', 'Фокус'],
    ['brand', 'Бренд'],
    ['core', 'Ядро'],
  ] satisfies Array<[SheetId, string]>,

  heroBadge: 'Платформа для мастера',
  heroTitle: 'Онлайн-запись, клиенты и каналы связи в одном кабинете.',
  heroText:
    'ClickBook помогает мастеру принимать записи, не терять клиентов из web, Telegram и VK, вести карточки клиентов и возвращать людей на повторный визит.',
  primaryCta: 'Войти в кабинет',
  secondaryCta: 'Посмотреть демо',
  publicCta: 'Публичная страница',
  scrollHint: 'Листать дальше',
  live: 'В работе',
  newBooking: 'Новая запись',
  today: 'Сегодня',
  clients: 'Клиенты',
  repeat: 'Повтор',
  clientFlow: 'web → карточка клиента → напоминание',
  bookingService: 'Маникюр',
  clientName: 'Мария Иванова',
  quickStats: [
    ['1 ссылка', 'профиль и запись'],
    ['3 канала', 'web, Telegram, VK'],
    ['1 база', 'все клиенты внутри'],
  ] as const,

  pathKicker: 'Лист 02',
  pathTitle: 'Клиент приходит из любого канала. Мастер видит один сценарий.',
  pathText:
    'Публичная страница, Telegram, VK или обычная заявка с телефоном превращаются в одну запись, одну карточку клиента и одно следующее действие.',
  flow: [
    {
      icon: Globe2,
      title: 'Web-заявка',
      text: 'Клиент открывает ссылку мастера, выбирает услугу, время и оставляет контакты.',
    },
    {
      icon: Send,
      title: 'Telegram',
      text: 'Записи, подтверждения, напоминания и быстрые действия работают через бота и Mini App.',
    },
    {
      icon: MessageCircleMore,
      title: 'VK',
      text: 'Клиент может прийти через VK, а мастер продолжит работу в том же кабинете.',
    },
    {
      icon: UserRound,
      title: 'Карточка клиента',
      text: 'Телефон, канал связи, записи, заметки, статусы и история собираются внутри.',
    },
  ] satisfies IconCard[],

  productKicker: 'Лист 03',
  productTitle: 'Внутри не набор страниц. Это рабочая цепочка.',
  productText:
    'Ссылка → запись → клиент → коммуникация → визит → отзыв → повтор. Каждый экран должен быть связан с реальным действием мастера.',
  product: [
    {
      icon: Globe2,
      title: 'Публичная страница',
      text: 'Фото, описание, услуги, портфолио, отзывы, адрес и кнопка записи в аккуратном профиле.',
    },
    {
      icon: CalendarClock,
      title: 'Запись и график',
      text: 'Клиент выбирает услугу и свободное окно, а мастер видит рабочий день без хаоса в сообщениях.',
    },
    {
      icon: Users2,
      title: 'База клиентов',
      text: 'Каждый клиент попадает в базу, даже если пришёл только с web-формы и без Telegram/VK.',
    },
    {
      icon: MessageCircleMore,
      title: 'Чаты и каналы',
      text: 'Web, Telegram и VK приводятся к одной логике, чтобы не плодить разные карточки одного человека.',
    },
    {
      icon: Bell,
      title: 'Напоминания',
      text: 'Подтверждение, перенос, ручная связь по телефону и действия после записи становятся понятными.',
    },
    {
      icon: Repeat2,
      title: 'Отзывы и повтор',
      text: 'После визита можно запросить отзыв, отметить результат и вернуть клиента на следующую запись.',
    },
  ] satisfies IconCard[],

  audienceKicker: 'Лист 04',
  audienceTitle: 'Для специалистов, которым нужна запись без тяжёлой CRM.',
  audienceText:
    'ClickBook подходит тем, кто работает с личными услугами, ведёт клиентов сам или в небольшой команде и хочет выглядеть профессионально.',
  audience: [
    'Маникюр и педикюр',
    'Брови и ресницы',
    'Барберы и стилисты',
    'Массаж и SPA',
    'Тату-мастера',
    'Тренеры и занятия',
    'Психологи и коучи',
    'Фотографы и эксперты',
  ],

  focusKicker: 'Лист 05',
  focusTitle: 'Не CRM-комбайн. Рабочий кабинет мастера.',
  focusText:
    'Большие системы закрывают кассы, склады, филиалы и сложные роли. ClickBook держит другой фокус: быстро запустить красивую запись, не терять заявки и вести клиентов в простом кабинете.',
  compare: [
    ['Тяжёлая CRM', 'много ролей, склад, касса, филиалы, сложные настройки'],
    ['ClickBook', 'одна ссылка, запись, клиенты, чаты, напоминания и понятный рабочий день'],
  ] as const,

  brandKicker: 'Лист 06',
  brandTitle: 'Публичная страница должна выглядеть как ваша.',
  brandText:
    'Логотип, цвета, тексты, отзывы и публичная ссылка помогают мастеру выглядеть профессионально и спокойно отправлять страницу клиенту.',
  brandItems: [
    ['Цвета и стиль', 'Аккуратная страница под мастера.'],
    ['Отзывы и доверие', 'Клиент видит живой профиль, а не пустую форму.'],
    ['Своя ссылка', 'Можно отправлять клиенту как нормальную страницу.'],
  ] as const,

  coreKicker: 'Лист 07',
  coreTitle: 'Сначала делаем ядро железным.',
  coreText:
    'Главная цель ClickBook — стабильная цепочка: клиент записался, попал в базу, мастер увидел действие, клиент получил напоминание, визит состоялся, отзыв и повтор не потерялись.',
  coreItems: [
    ['Запись', 'услуга, дата, время, источник'],
    ['Клиент', 'контакты, канал, история, заметки'],
    ['Повтор', 'напоминание, отзыв, следующий визит'],
  ] as const,
  finalAction: 'Запустить рабочий кабинет мастера',
  dashboardCta: 'Открыть кабинет',
};

const en = {
  nav: [
    ['intro', 'Start'],
    ['path', 'Path'],
    ['product', 'Product'],
    ['audience', 'Audience'],
    ['focus', 'Focus'],
    ['brand', 'Brand'],
    ['core', 'Core'],
  ] satisfies Array<[SheetId, string]>,

  heroBadge: 'Platform for specialists',
  heroTitle: 'Bookings, clients, and channels in one workspace.',
  heroText:
    'ClickBook helps specialists accept bookings, keep web, Telegram, and VK clients in one database, and bring people back for repeat visits.',
  primaryCta: 'Open workspace',
  secondaryCta: 'View demo',
  publicCta: 'Public page',
  scrollHint: 'Scroll down',
  live: 'Live',
  newBooking: 'New booking',
  today: 'Today',
  clients: 'Clients',
  repeat: 'Repeat',
  clientFlow: 'web → client card → reminder',
  bookingService: 'Nails',
  clientName: 'Maria Ivanova',
  quickStats: [
    ['1 link', 'profile and booking'],
    ['3 channels', 'web, Telegram, VK'],
    ['1 base', 'all clients inside'],
  ] as const,

  pathKicker: 'Sheet 02',
  pathTitle: 'Clients come from any channel. You see one clear flow.',
  pathText:
    'Public page, Telegram, VK, or a phone request become one booking, one client card, and one next action.',
  flow: [
    {
      icon: Globe2,
      title: 'Web request',
      text: 'The client opens the link, chooses a service and time, and leaves contact details.',
    },
    {
      icon: Send,
      title: 'Telegram',
      text: 'Bookings, confirmations, reminders, and quick actions work through the bot and Mini App.',
    },
    {
      icon: MessageCircleMore,
      title: 'VK',
      text: 'The client can come from VK while the specialist continues in the same workspace.',
    },
    {
      icon: UserRound,
      title: 'Client card',
      text: 'Phone, channel, bookings, notes, statuses, and history are stored in one place.',
    },
  ] satisfies IconCard[],

  productKicker: 'Sheet 03',
  productTitle: 'Inside, it is not a set of pages. It is a working chain.',
  productText:
    'Link → booking → client → communication → visit → review → repeat. Every screen is connected to a real action.',
  product: [
    {
      icon: Globe2,
      title: 'Public page',
      text: 'Photo, description, services, portfolio, reviews, address, and booking in one polished profile.',
    },
    {
      icon: CalendarClock,
      title: 'Booking and schedule',
      text: 'The client chooses a service and slot, while the specialist sees the workday without message chaos.',
    },
    {
      icon: Users2,
      title: 'Client database',
      text: 'Every client gets into the database, even if they came only from a web form without Telegram/VK.',
    },
    {
      icon: MessageCircleMore,
      title: 'Chats and channels',
      text: 'Web, Telegram, and VK follow one logic so one person does not become several records.',
    },
    {
      icon: Bell,
      title: 'Reminders',
      text: 'Confirm, reschedule, call manually, and post-booking steps become clear.',
    },
    {
      icon: Repeat2,
      title: 'Reviews and repeat',
      text: 'After a visit, request a review, mark the result, and bring the client back.',
    },
  ] satisfies IconCard[],

  audienceKicker: 'Sheet 04',
  audienceTitle: 'For specialists who need booking without a heavy CRM.',
  audienceText:
    'ClickBook is best for personal services, solo specialists, and small teams that want to look professional.',
  audience: [
    'Nails',
    'Brows and lashes',
    'Barbers and stylists',
    'Massage and SPA',
    'Tattoo',
    'Trainers and classes',
    'Psychologists and coaches',
    'Photographers and experts',
  ],

  focusKicker: 'Sheet 05',
  focusTitle: 'Not a CRM monster. A specialist workspace.',
  focusText:
    'Large systems cover cash desks, stock, branches, and complex roles. ClickBook focuses on beautiful booking, requests, clients, and a simple workday.',
  compare: [
    ['Heavy CRM', 'many roles, stock, cash desk, branches, complex settings'],
    ['ClickBook', 'one link, booking, clients, chats, reminders, and a clear workday'],
  ] as const,

  brandKicker: 'Sheet 06',
  brandTitle: 'The public page should feel like yours.',
  brandText:
    'Logo, colors, copy, reviews, and the public link help the specialist look professional and confidently share the page.',
  brandItems: [
    ['Colors and style', 'A polished public page for the specialist.'],
    ['Reviews and trust', 'The client sees a living profile, not an empty form.'],
    ['Own link', 'A page that feels good to send to clients.'],
  ] as const,

  coreKicker: 'Sheet 07',
  coreTitle: 'First, the core must be solid.',
  coreText:
    'The goal is a stable chain: the client books, enters the database, the specialist sees the next action, the client receives reminders, the visit happens, and repeat booking is not lost.',
  coreItems: [
    ['Booking', 'service, date, time, source'],
    ['Client', 'contacts, channel, history, notes'],
    ['Repeat', 'reminder, review, next visit'],
  ] as const,
  finalAction: 'Launch the specialist workspace',
  dashboardCta: 'Open dashboard',
};

function MicroLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-[10px] font-semibold uppercase tracking-[0.16em] text-black/38 dark:text-white/34',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'relative rounded-[22px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-[#111111] shadow-none dark:text-white',
        className,
      )}
    >
      {children}
    </section>
  );
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-[var(--cb-border)] bg-[var(--cb-soft-surface)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function MovingLine() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px overflow-hidden">
      <motion.div
        className="h-px w-1/2 bg-gradient-to-r from-transparent via-black/30 to-transparent dark:via-white/38"
        animate={{ x: ['-100%', '260%'] }}
        transition={{
          duration: 3.7,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 1.2,
        }}
      />
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-10 items-center justify-center gap-2 rounded-[11px] border border-black bg-black px-4 text-[12px] font-semibold text-white transition hover:bg-black/88 active:scale-[0.99] dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/88"
    >
      {children}
      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[11px] border border-[var(--cb-border)] bg-[var(--cb-soft-surface)] px-4 text-[12px] font-semibold text-black/58 transition hover:bg-[var(--cb-soft-surface)] hover:text-black active:scale-[0.99] dark:text-white/52 dark:hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}

function SheetNavigation({ items }: { items: Array<[SheetId, string]> }) {
  return (
    <nav className="pointer-events-none fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
      <div className="pointer-events-auto rounded-[16px] border border-[var(--cb-border)] bg-[var(--cb-surface)] p-1.5 backdrop-blur-[18px]">
        <div className="grid gap-1">
          {items.map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              className="group flex h-8 items-center gap-2 rounded-[10px] px-2 text-[10.5px] font-semibold text-black/36 transition hover:bg-black/[0.045] hover:text-black/72 dark:text-white/32 dark:hover:bg-white/[0.065] dark:hover:text-white/72"
            >
              <span className="grid size-4 place-items-center rounded-full border border-[var(--cb-border)] text-[8px]">
                {index + 1}
              </span>
              <span className="w-[72px] truncate">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function StatStrip({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(([value, label], index) => (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.35, delay: index * 0.06 }}
        >
          <Panel className="px-4 py-3">
            <div className="text-[20px] font-semibold leading-none tracking-[-0.06em] text-black/80 dark:text-white/78">
              {value}
            </div>
            <div className="mt-1.5 text-[11px] leading-4 text-black/42 dark:text-white/36">
              {label}
            </div>
          </Panel>
        </motion.div>
      ))}
    </div>
  );
}

function IntroPreview({
  t,
}: {
  t: {
    live: string;
    newBooking: string;
    today: string;
    clients: string;
    repeat: string;
    clientFlow: string;
    bookingService: string;
    clientName: string;
  };
}) {
  return (
    <Panel className="relative overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cb-border)] pb-4">
        <BrandLogo className="w-[144px]" />

        <motion.div
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--cb-border)] bg-[var(--cb-surface)] px-2.5 py-1.5 text-[10.5px] font-semibold text-black/42 dark:text-white/38"
        >
          <span className="size-1.5 rounded-full bg-black/42 dark:bg-white/42" />
          {t.live}
        </motion.div>
      </div>

      <div className="mt-4 space-y-3">
        <Panel className="bg-[var(--cb-surface)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <MicroLabel>{t.newBooking}</MicroLabel>
              <div className="mt-2 text-[18px] font-semibold tracking-[-0.055em] text-black/82 dark:text-white/80">
                14:00 · {t.bookingService}
              </div>
              <div className="mt-1 text-[12px] text-black/44 dark:text-white/38">
                {t.clientName} · Web
              </div>
            </div>

            <CheckCircle2 className="size-5 shrink-0 text-black/44 dark:text-white/40" />
          </div>
        </Panel>

        <div className="grid grid-cols-3 gap-2">
          {[
            [Globe2, 'Web'],
            [Send, 'TG'],
            [MessageCircleMore, 'VK'],
          ].map(([Icon, label], index) => {
            const NodeIcon = Icon as LucideIcon;

            return (
              <motion.div
                key={label as string}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Panel className="grid min-h-[74px] place-items-center p-3 text-center">
                  <NodeIcon className="size-4 text-black/48 dark:text-white/42" />
                  <div className="mt-2 text-[11px] font-semibold text-black/50 dark:text-white/44">
                    {label as string}
                  </div>
                </Panel>
              </motion.div>
            );
          })}
        </div>

        <Panel className="bg-[var(--cb-surface)] p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-black text-[14px] font-semibold text-white dark:bg-white dark:text-black">
              {t.clientName.slice(0, 1)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-black/78 dark:text-white/76">
                {t.clientName}
              </div>
              <div className="mt-1 truncate text-[11px] text-black/40 dark:text-white/35">
                {t.clientFlow}
              </div>
            </div>

            <ChevronRight className="size-4 shrink-0 text-black/32 dark:text-white/30" />
          </div>
        </Panel>

        <Panel className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              [t.today, '7'],
              [t.clients, '124'],
              [t.repeat, '38%'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="truncate text-[10.5px] text-black/36 dark:text-white/30">
                  {label}
                </div>
                <div className="mt-1 text-[17px] font-semibold tracking-[-0.055em] text-black/74 dark:text-white/72">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Panel>
  );
}

function Sheet({
  id,
  index,
  total,
  kicker,
  title,
  text,
  children,
  className,
}: {
  id: SheetId;
  index: number;
  total: number;
  kicker: string;
  title: string;
  text?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className="min-h-[calc(100vh-64px)] snap-start px-4 py-5 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-[1320px] items-center">
        <Surface className={cn('w-full overflow-hidden', className)}>
          <MovingLine />

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:p-7 xl:p-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.35 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[420px] flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <MicroLabel>{kicker}</MicroLabel>

                  <div className="rounded-full border border-[var(--cb-border)] bg-[var(--cb-soft-surface)] px-2.5 py-1 text-[10px] font-semibold text-black/36 dark:text-white/32">
                    {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
                  </div>
                </div>

                <h2 className="mt-5 max-w-[760px] text-[34px] font-semibold leading-[0.98] tracking-[-0.085em] text-black dark:text-white sm:text-[50px] lg:text-[58px]">
                  {title}
                </h2>

                {text ? (
                  <p className="mt-5 max-w-[680px] text-[13.5px] leading-7 text-black/52 dark:text-white/44 sm:text-[14px]">
                    {text}
                  </p>
                ) : null}
              </div>

              <div className="mt-8 hidden items-center gap-3 text-[11px] font-semibold text-black/34 dark:text-white/30 lg:flex">
                <span className="h-px w-12 bg-black/[0.12] dark:bg-white/[0.12]" />
                ClickBook
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              {children}
            </motion.div>
          </div>
        </Surface>
      </div>
    </section>
  );
}

function FlowBoard({ items }: { items: IconCard[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.35 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <Panel className="p-4">
              <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-black/52 dark:text-white/48">
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[14px] font-semibold tracking-[-0.025em] text-black/78 dark:text-white/76">
                      {item.title}
                    </div>
                    <div className="text-[10.5px] font-semibold text-black/28 dark:text-white/24">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="mt-1.5 text-[12px] leading-5 text-black/46 dark:text-white/40">
                    {item.text}
                  </div>
                </div>
              </div>
            </Panel>
          </motion.div>
        );
      })}
    </div>
  );
}

function ProductGrid({ items }: { items: IconCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
          >
            <Panel className="h-full p-4 transition hover:bg-[var(--cb-soft-surface)]">
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-black/52 dark:text-white/48">
                  <Icon className="size-4" />
                </div>

                <div className="text-[10.5px] font-semibold text-black/26 dark:text-white/22">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>

              <div className="mt-5 text-[15px] font-semibold leading-5 tracking-[-0.035em] text-black/78 dark:text-white/76">
                {item.title}
              </div>

              <div className="mt-2 text-[12px] leading-5 text-black/46 dark:text-white/40">
                {item.text}
              </div>
            </Panel>
          </motion.div>
        );
      })}
    </div>
  );
}

function AudienceDeck({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map((item, index) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.32, delay: index * 0.045 }}
        >
          <Panel className="flex min-h-[58px] items-center gap-3 px-3.5 py-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-black/42 dark:text-white/38">
              <Check className="size-3.5" />
            </div>

            <div className="text-[12.5px] font-semibold text-black/64 dark:text-white/58">
              {item}
            </div>
          </Panel>
        </motion.div>
      ))}
    </div>
  );
}

function CompareBoard({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div className="grid gap-3">
      {items.map(([title, text], index) => {
        const active = index === 1;

        return (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.36, delay: index * 0.1 }}
          >
            <Panel
              className={cn(
                'p-5',
                active && 'bg-[var(--cb-soft-surface)]',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-[12px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-black/50 dark:text-white/46">
                  {active ? (
                    <Sparkles className="size-4" />
                  ) : (
                    <Layers3 className="size-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[16px] font-semibold tracking-[-0.045em] text-black/78 dark:text-white/76">
                    {title}
                  </div>
                  <div className="mt-2 text-[12.5px] leading-5 text-black/46 dark:text-white/40">
                    {text}
                  </div>
                </div>
              </div>
            </Panel>
          </motion.div>
        );
      })}
    </div>
  );
}

function BrandBoard({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  const icons: LucideIcon[] = [Palette, Star, Copy];

  return (
    <div className="grid gap-3">
      <Panel className="flex min-h-[150px] items-center justify-center p-5">
        <BrandLogo className="w-[168px]" />
      </Panel>

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(([title, text], index) => {
          const Icon = icons[index] ?? Sparkles;

          return (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.34, delay: index * 0.08 }}
            >
              <Panel className="h-full p-4">
                <Icon className="size-4 text-black/46 dark:text-white/40" />
                <div className="mt-4 text-[13px] font-semibold tracking-[-0.025em] text-black/70 dark:text-white/66">
                  {title}
                </div>
                <div className="mt-1.5 text-[11.5px] leading-5 text-black/42 dark:text-white/36">
                  {text}
                </div>
              </Panel>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CoreBoard({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  const icons: LucideIcon[] = [Clock3, UserRound, WalletCards];

  return (
    <div className="grid gap-3">
      {items.map(([title, text], index) => {
        const Icon = icons[index] ?? Sparkles;

        return (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: 22 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <Panel className="p-5">
              <div className="flex items-center gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-[14px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-black/50 dark:text-white/46">
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="text-[22px] font-semibold leading-none tracking-[-0.065em] text-black/78 dark:text-white/76">
                    {title}
                  </div>
                  <div className="mt-2 text-[12px] leading-5 text-black/44 dark:text-white/38">
                    {text}
                  </div>
                </div>
              </div>
            </Panel>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function AboutProductPage() {
  const { locale } = useLocale();
  const currentLocale: Locale = locale === 'en' ? 'en' : 'ru';
  const t = currentLocale === 'ru' ? ru : en;

  const totalSheets = 7;

  return (
    <div className="min-h-screen bg-[var(--cb-shell-bg)] text-[#111111] dark:text-white">
      <SiteHeader />

      <SheetNavigation items={t.nav} />

      <main className="h-[calc(100vh-64px)] snap-y snap-mandatory overflow-y-auto scroll-smooth">
        <section
          id="intro"
          className="min-h-[calc(100vh-64px)] snap-start px-4 py-5 sm:px-6 lg:px-8"
        >
          <div className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-[1320px] items-center">
            <Surface className="w-full overflow-hidden">
              <MovingLine />

              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:p-7 xl:p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex min-h-[500px] flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <MicroLabel>{t.heroBadge}</MicroLabel>

                      <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cb-border)] bg-[var(--cb-soft-surface)] px-2.5 py-1 text-[10px] font-semibold text-black/38 dark:text-white/34">
                        <Sparkles className="size-3" />
                        ClickBook
                      </div>
                    </div>

                    <h1 className="mt-6 max-w-[860px] text-[40px] font-semibold leading-[0.95] tracking-[-0.09em] text-black dark:text-white sm:text-[58px] lg:text-[70px]">
                      {t.heroTitle}
                    </h1>

                    <p className="mt-6 max-w-[720px] text-[13.5px] leading-7 text-black/52 dark:text-white/44 sm:text-[14px]">
                      {t.heroText}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2.5">
                      <PrimaryLink href="/login">{t.primaryCta}</PrimaryLink>

                      <SecondaryLink href="/demo/demo">
                        {t.secondaryCta}
                      </SecondaryLink>

                      <SecondaryLink
                        href="/m/admin"
                        icon={<Globe2 className="size-4" />}
                      >
                        {t.publicCta}
                      </SecondaryLink>
                    </div>

                    <div className="mt-7 max-w-[720px]">
                      <StatStrip items={t.quickStats} />
                    </div>
                  </div>

                  <a
                    href="#path"
                    className="mt-8 inline-flex w-fit items-center gap-2 rounded-[11px] border border-[var(--cb-border)] bg-[var(--cb-soft-surface)] px-3 py-2 text-[11px] font-semibold text-black/42 transition hover:text-black/70 dark:text-white/36 dark:hover:text-white/68"
                  >
                    {t.scrollHint}
                    <ArrowDown className="size-3.5" />
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.985 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{
                    duration: 0.5,
                    delay: 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="min-w-0"
                >
                  <IntroPreview t={t} />
                </motion.div>
              </div>
            </Surface>
          </div>
        </section>

        <Sheet
          id="path"
          index={2}
          total={totalSheets}
          kicker={t.pathKicker}
          title={t.pathTitle}
          text={t.pathText}
        >
          <FlowBoard items={t.flow} />
        </Sheet>

        <Sheet
          id="product"
          index={3}
          total={totalSheets}
          kicker={t.productKicker}
          title={t.productTitle}
          text={t.productText}
          className="lg:[&>div]:grid-cols-[minmax(0,0.72fr)_minmax(520px,1.28fr)]"
        >
          <ProductGrid items={t.product} />
        </Sheet>

        <Sheet
          id="audience"
          index={4}
          total={totalSheets}
          kicker={t.audienceKicker}
          title={t.audienceTitle}
          text={t.audienceText}
        >
          <AudienceDeck items={t.audience} />
        </Sheet>

        <Sheet
          id="focus"
          index={5}
          total={totalSheets}
          kicker={t.focusKicker}
          title={t.focusTitle}
          text={t.focusText}
        >
          <CompareBoard items={t.compare} />
        </Sheet>

        <Sheet
          id="brand"
          index={6}
          total={totalSheets}
          kicker={t.brandKicker}
          title={t.brandTitle}
          text={t.brandText}
        >
          <BrandBoard items={t.brandItems} />
        </Sheet>

        <Sheet
          id="core"
          index={7}
          total={totalSheets}
          kicker={t.coreKicker}
          title={t.coreTitle}
          text={t.coreText}
        >
          <div className="grid gap-5">
            <CoreBoard items={t.coreItems} />

            <Panel className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[18px] font-semibold tracking-[-0.055em] text-black/78 dark:text-white/76">
                    ClickBook
                  </div>
                  <div className="mt-1 text-[12px] text-black/42 dark:text-white/36">
                    {t.finalAction}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <PrimaryLink href="/login">{t.primaryCta}</PrimaryLink>
                  <SecondaryLink href="/dashboard">{t.dashboardCta}</SecondaryLink>
                </div>
              </div>
            </Panel>
          </div>
        </Sheet>
      </main>
    </div>
  );
}
