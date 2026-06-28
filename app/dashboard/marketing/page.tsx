// app/dashboard/marketing/page.tsx
'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  Check,
  Copy,
  Globe2,
  Link2,
  QrCode,
  Send,
  Share2,
  Sparkles,
  SquarePen,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { FakeQrCode } from '@/components/dashboard/qr-code';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type CopyTarget = 'public-link' | 'short' | 'client' | 'referral';

function pageBg(light: boolean) {
  return light ? 'bg-[#f7f6f2]' : 'bg-[#080808]';
}

function pageText(light: boolean) {
  return light ? 'text-[#111111]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#6b7280]' : 'text-[#9ca3af]';
}

function faintText(light: boolean) {
  return light ? 'text-black/32' : 'text-white/26';
}

function borderTone(light: boolean) {
  return light ? 'border-[#e6e2da]' : 'border-white/[0.08]';
}

function divideTone(light: boolean) {
  return light ? 'divide-[#e6e2da]' : 'divide-white/[0.08]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-[#e6e2da] bg-white shadow-[0_12px_30px_rgba(17,17,17,0.035),0_1px_2px_rgba(17,17,17,0.035)]'
    : 'border-white/[0.08] bg-[#141414] shadow-none';
}

function insetTone(light: boolean) {
  return light
    ? 'border-black/[0.075] bg-black/[0.018] shadow-[0_8px_22px_rgba(17,17,17,0.025),inset_0_1px_0_rgba(255,255,255,0.74)]'
    : 'border-white/[0.07] bg-white/[0.026] shadow-[inset_0_1px_0_rgba(255,255,255,0.024)]';
}

function buttonBase(light: boolean, active = false) {
  return cn(
    'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.985]',
    active
      ? light
        ? 'cb-neutral-primary cb-neutral-primary-light hover:opacity-[0.98]'
        : 'cb-neutral-primary cb-neutral-primary-dark hover:opacity-[0.98]'
      : light
        ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
        : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  );
}

function disabledButtonClass() {
  return 'disabled:pointer-events-none disabled:opacity-40';
}

function Card({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[11px] border', cardTone(light), className)}>
      {children}
    </section>
  );
}

function CardTitle({
  title,
  description,
  light,
}: {
  title: string;
  description?: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[58px] items-center justify-between gap-4 border-b px-4 py-3',
        borderTone(light),
      )}
    >
      <div className="min-w-0">
        <h2
          className={cn(
            'truncate text-[13px] font-semibold tracking-[-0.018em]',
            pageText(light),
          )}
        >
          {title}
        </h2>

        {description ? (
          <p className={cn('mt-1 truncate text-[11px]', mutedText(light))}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Panel({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[10px] border', insetTone(light), className)}>
      {children}
    </div>
  );
}

function MicroLabel({
  children,
  light,
  active,
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-medium',
        active
          ? 'cb-accent-pill-active'
          : light
            ? 'border-black/[0.08] bg-white text-black/50'
            : 'border-white/[0.08] bg-white/[0.04] text-white/42',
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatusDot({ light, active }: { light: boolean; active?: boolean }) {
  return (
    <span
      className={cn(
        'size-1.5 shrink-0 rounded-full',
        active ? 'bg-current' : light ? 'bg-black/24' : 'bg-white/22',
      )}
    />
  );
}

function HeroStat({
  label,
  value,
  hint,
  light,
}: {
  label: string;
  value: string | number;
  hint?: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[10px] border px-3.5 py-3 transition-colors duration-150',
        light
          ? 'border-black/[0.07] bg-white hover:bg-black/[0.018]'
          : 'border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.055]',
      )}
    >
      <div className="grid min-h-[34px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <div className={cn('truncate text-[10.5px] font-medium', mutedText(light))}>
            {label}
          </div>

          {hint ? (
            <div className={cn('mt-0.5 truncate text-[10px]', faintText(light))}>
              {hint}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            'min-w-[54px] max-w-[170px] truncate text-right text-[18px] font-semibold leading-none tracking-[-0.055em] tabular-nums',
            pageText(light),
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function KeyValue({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-h-10 items-center justify-between gap-3 rounded-[9px] border px-3',
        insetTone(light),
      )}
    >
      <span className={cn('text-[11px] font-medium', mutedText(light))}>
        {label}
      </span>

      <span
        className={cn(
          'truncate text-right text-[11.5px] font-medium',
          pageText(light),
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ListBox({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[10px] border divide-y',
        insetTone(light),
        divideTone(light),
        className,
      )}
    >
      {children}
    </div>
  );
}

function ListRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('px-4 py-3.5', className)}>{children}</div>;
}

function ActionLink({
  href,
  children,
  light,
  active,
  className,
}: {
  href: string;
  children: ReactNode;
  light: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonBase(light, active), className)}>
      {children}
    </Link>
  );
}

function ActionButton({
  children,
  light,
  active,
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(buttonBase(light, active), disabledButtonClass(), className)}
    >
      {children}
    </button>
  );
}

function CopyButton({
  copied,
  onClick,
  label,
  copiedLabel,
  light,
  active,
  className,
}: {
  copied: boolean;
  onClick: () => void;
  label: string;
  copiedLabel: string;
  light: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <ActionButton light={light} active={active} onClick={onClick} className={className}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? copiedLabel : label}
    </ActionButton>
  );
}

function InlineCopyButton({
  copied,
  onClick,
  copyLabel,
  copiedLabel,
  light,
}: {
  copied: boolean;
  onClick: () => void;
  copyLabel: string;
  copiedLabel: string;
  light: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? copiedLabel : copyLabel}
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[10px] border text-[11px] font-medium shadow-none transition-[width,background,border-color,color,opacity,transform] duration-200 active:scale-[0.985]',
        copied ? 'w-[118px] px-3' : 'w-9 px-0',
        light
          ? 'border-black/[0.08] bg-black/[0.035] text-black/54 hover:border-black/[0.12] hover:bg-black/[0.06] hover:text-black'
          : 'border-white/[0.08] bg-white/[0.055] text-white/58 hover:border-white/[0.13] hover:bg-white/[0.085] hover:text-white',
      )}
    >
      {copied ? <Check className="size-3.5 shrink-0" /> : <Copy className="size-3.5 shrink-0" />}
      {copied ? <span className="truncate">{copiedLabel}</span> : null}
    </button>
  );
}

function TextMaterialRow({
  title,
  text,
  copied,
  copyLabel,
  copiedLabel,
  sendLabel,
  onCopy,
  onShare,
  light,
}: {
  title: string;
  text: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  sendLabel: string;
  onCopy: () => void;
  onShare: () => void;
  light: boolean;
}) {
  return (
    <ListRow className="py-4">
      <div className="min-w-0">
        <div
          className={cn(
            'text-[13px] font-semibold tracking-[-0.018em]',
            pageText(light),
          )}
        >
          {title}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div
            className={cn(
              'min-h-10 rounded-[10px] border px-4 py-3 text-[12px] leading-6',
              light
                ? 'border-black/[0.06] bg-white text-black/58'
                : 'border-white/[0.06] bg-black/22 text-white/55',
            )}
          >
            {text}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
            <CopyButton
              copied={copied}
              onClick={onCopy}
              label={copyLabel}
              copiedLabel={copiedLabel}
              light={light}
              className="min-w-[118px]"
            />

            <ActionButton light={light} onClick={onShare} className="min-w-[104px]">
              <Send className="size-3.5" />
              {sendLabel}
            </ActionButton>
          </div>
        </div>
      </div>
    </ListRow>
  );
}

function TrafficRow({
  label,
  visitors,
  bookings,
  conversion,
  visitsLabel,
  bookingsLabel,
  conversionLabel,
  light,
}: {
  label: string;
  visitors: number;
  bookings: number;
  conversion: number;
  visitsLabel: string;
  bookingsLabel: string;
  conversionLabel: string;
  light: boolean;
}) {
  const strong = conversion >= 10;

  return (
    <ListRow>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
        <div className="min-w-0">
          <div className={cn('truncate text-[12.5px] font-semibold', pageText(light))}>
            {label}
          </div>

          <div className={cn('mt-1 text-[11px]', mutedText(light))}>
            {visitors} {visitsLabel} · {bookings} {bookingsLabel}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'size-1.5 rounded-full',
                strong
                  ? light
                    ? 'bg-black/58'
                    : 'bg-white/62'
                  : light
                    ? 'bg-black/24'
                    : 'bg-white/24',
              )}
            />

            <span className={cn('text-[11px] font-medium', mutedText(light))}>
              {conversionLabel}
            </span>
          </div>

          <span
            className={cn(
              'min-w-[48px] text-right text-[12.5px] font-semibold tabular-nums',
              pageText(light),
            )}
          >
            {conversion}%
          </span>
        </div>
      </div>
    </ListRow>
  );
}

function EmptyInfoCard({
  icon,
  label,
  title,
  description,
  light,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  description: string;
  light: boolean;
}) {
  return (
    <Card light={light}>
      <div className="p-4">
        <MicroLabel light={light}>
          {icon}
          {label}
        </MicroLabel>

        <div
          className={cn(
            'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
            pageText(light),
          )}
        >
          {title}
        </div>

        <p className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
          {description}
        </p>
      </div>
    </Card>
  );
}

export default function MarketingPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeMode = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const isLight = currentTheme === 'light';

  const publicHref = ownedProfile ? `/m/${ownedProfile.slug}` : '/create-profile';

  const publicUrl =
    mounted && typeof window !== 'undefined'
      ? `${window.location.origin}${publicHref}`
      : `https://klikbuk.app${publicHref}`;

  const confirmedFromLink = useMemo(
    () =>
      dataset?.daily
        .slice(-30)
        .reduce((total, item) => total + item.confirmed, 0) ?? 0,
    [dataset],
  );

  const copy =
    locale === 'ru'
      ? {
          title: 'Маркетинг',
          description:
            'Публичная ссылка, QR-код, готовые тексты и источники переходов в одном спокойном рабочем экране.',
          publicPage: 'Публичная',
          createProfileTitle: 'Сначала настройте профиль мастера',
          createProfileDescription:
            'Создайте профиль, чтобы открыть публичную ссылку, QR-код, тексты для клиентов и источники переходов.',
          createProfileButton: 'Создать профиль',
          emptyBadge: 'Профиль не найден',
          emptyCardLinkLabel: 'Ссылка',
          emptyCardLinkTitle: 'Публичная страница',
          emptyCardLinkText:
            'После создания профиля появится персональная ссылка для клиентов.',
          emptyCardQrLabel: 'QR',
          emptyCardQrTitle: 'QR-код для записи',
          emptyCardQrText:
            'QR можно использовать на визитке, стойке, в сторис и в печатных материалах.',
          emptyCardCopyLabel: 'Тексты',
          emptyCardCopyTitle: 'Готовые сообщения',
          emptyCardCopyText:
            'Появятся тексты для Telegram, ВК, био, рассылок и рекомендаций.',

          pageActive: 'Страница активна',
          publicLink: 'Персональная ссылка',
          publicHint: 'Отправляйте клиентам или закрепите в Telegram / Instagram.',
          openPage: 'Открыть',
          copyLink: 'Скопировать',
          copied: 'Скопировано',
          share: 'Поделиться',

          visits30: 'Переходы',
          bookingsFromLink: 'Записи',
          conversion: 'Конверсия',
          topSource: 'Источник',
          visits: 'визитов',
          bookings: 'записей',
          confirmed: 'запланировано',
          source: 'канал',

          linkDetails: 'Детали ссылки',
          linkDetailsDescription: 'Техническая сводка по публичной странице и основному каналу.',
          fullUrl: 'Полная ссылка',
          slug: 'Slug',
          status: 'Статус',
          channel: 'Канал',

          materials: 'Материалы для отправки',
          materialsDescription:
            'Готовые тексты для ВК, Telegram, био, рассылок и рекомендаций.',
          shortTitle: 'Короткое описание',
          clientTitle: 'Сообщение для клиента',
          referralTitle: 'Реферальный текст',
          copyText: 'Копировать',
          send: 'Отправить',

          qrTitle: 'QR-код',
          qrDescription:
            'Для визитки, стойки, сторис и быстрой записи без поиска ссылки.',
          showQr: 'Показать',
          hideQr: 'Скрыть',
          copyQrLink: 'Скопировать ссылку',

          sources: 'Источники переходов',
          sourcesDescription: 'Где ссылка работает лучше всего.',
        }
      : {
          title: 'Marketing',
          description:
            'Public link, QR code, ready-to-send copy, and traffic sources in one focused workspace.',
          publicPage: 'Public',
          createProfileTitle: 'Create the master profile first',
          createProfileDescription:
            'Create the profile to unlock the public link, QR code, client copy, and traffic sources.',
          createProfileButton: 'Create profile',
          emptyBadge: 'Profile missing',
          emptyCardLinkLabel: 'Link',
          emptyCardLinkTitle: 'Public page',
          emptyCardLinkText:
            'After profile setup, the personal client booking link will appear here.',
          emptyCardQrLabel: 'QR',
          emptyCardQrTitle: 'Booking QR code',
          emptyCardQrText:
            'The QR can be used on cards, front desk, stories, and printed materials.',
          emptyCardCopyLabel: 'Copy',
          emptyCardCopyTitle: 'Ready messages',
          emptyCardCopyText:
            'Copy for Telegram, ВК, bio, broadcasts, and referrals will appear here.',

          pageActive: 'Page active',
          publicLink: 'Personal link',
          publicHint: 'Send it to clients or pin it in Telegram / Instagram.',
          openPage: 'Open',
          copyLink: 'Copy',
          copied: 'Copied',
          share: 'Share',

          visits30: 'Visits',
          bookingsFromLink: 'Bookings',
          conversion: 'Conversion',
          topSource: 'Source',
          visits: 'visits',
          bookings: 'bookings',
          confirmed: 'confirmed',
          source: 'channel',

          linkDetails: 'Link details',
          linkDetailsDescription: 'Technical summary for the public page and main channel.',
          fullUrl: 'Full URL',
          slug: 'Slug',
          status: 'Status',
          channel: 'Channel',

          materials: 'Materials to send',
          materialsDescription:
            'Ready-to-send copy for ВК, Telegram, bio, broadcasts, and referrals.',
          shortTitle: 'Short profile text',
          clientTitle: 'Client message',
          referralTitle: 'Referral copy',
          copyText: 'Copy',
          send: 'Send',

          qrTitle: 'QR code',
          qrDescription:
            'For cards, front desk, stories, and quick booking without searching for the link.',
          showQr: 'Show',
          hideQr: 'Hide',
          copyQrLink: 'Copy link',

          sources: 'Traffic sources',
          sourcesDescription: 'Understand where the public link performs best.',
        };

  const materials = useMemo(
    () => [
      {
        id: 'short' as const,
        title: copy.shortTitle,
        text:
          locale === 'ru'
            ? `Запись к ${ownedProfile?.name ?? 'мастеру'}: услуги, свободные слоты и быстрая заявка по одной ссылке.`
            : `Book with ${ownedProfile?.name ?? 'the master'}: services, available slots, and a quick request flow in one link.`,
      },
      {
        id: 'client' as const,
        title: copy.clientTitle,
        text:
          locale === 'ru'
            ? `Здравствуйте! Вот моя страница для записи: ${publicUrl}`
            : `Hello! Here is my booking page: ${publicUrl}`,
      },
      {
        id: 'referral' as const,
        title: copy.referralTitle,
        text:
          locale === 'ru'
            ? `Поделитесь моей ссылкой с подругой — сейчас открыт удобный график на ближайшие недели: ${publicUrl}`
            : `Feel free to share my link with a friend — convenient slots are open for the coming weeks: ${publicUrl}`,
      },
    ],
    [
      copy.clientTitle,
      copy.referralTitle,
      copy.shortTitle,
      locale,
      ownedProfile?.name,
      publicUrl,
    ],
  );

  const handleCopy = async (target: CopyTarget, text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedTarget(target);

      window.setTimeout(() => {
        setCopiedTarget(null);
      }, 1400);
    } catch {
      setCopiedTarget(null);
    }
  };

  const handleShare = async (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: ownedProfile?.name ?? 'ClickBook',
          text,
          url: publicUrl,
        });
      } catch {
        await handleCopy('public-link', text);
      }

      return;
    }

    await handleCopy('public-link', text);
  };

  if (!hasHydrated || !mounted) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <main
          className={cn(
            'min-h-screen px-4 pb-12 pt-5 md:px-7 md:pt-6',
            pageBg(isLight),
          )}
        >
          <div className="mx-auto w-full max-w-[var(--page-max-width)]">
            <div className="mb-6 md:mb-7">
              <div className="min-w-0">
                <h1
                  className={cn(
                    'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                    pageText(isLight),
                  )}
                >
                  {copy.title}
                </h1>

                <p
                  className={cn(
                    'mt-2 max-w-[760px] text-[13px] leading-5',
                    mutedText(isLight),
                  )}
                >
                  {copy.description}
                </p>
              </div>
            </div>

            <Card light={isLight} className="overflow-hidden">
              <div className="grid min-h-[320px] place-items-center px-5 py-12 text-center">
                <div className="mx-auto max-w-[460px]">
                  <MicroLabel light={isLight}>
                    <StatusDot light={isLight} />
                    {copy.emptyBadge}
                  </MicroLabel>

                  <h2
                    className={cn(
                      'mt-5 text-[18px] font-semibold tracking-[-0.02em] md:text-[22px]',
                      pageText(isLight),
                    )}
                  >
                    {copy.createProfileTitle}
                  </h2>

                  <p className={cn('mt-3 text-[13px] leading-5', mutedText(isLight))}>
                    {copy.createProfileDescription}
                  </p>

                  <div className="mt-6 flex justify-center">
                    <ActionLink href="/create-profile" light={isLight} active>
                      <SquarePen className="size-3.5" />
                      {copy.createProfileButton}
                    </ActionLink>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <EmptyInfoCard
                light={isLight}
                icon={<Link2 className="size-3.5" />}
                label={copy.emptyCardLinkLabel}
                title={copy.emptyCardLinkTitle}
                description={copy.emptyCardLinkText}
              />

              <EmptyInfoCard
                light={isLight}
                icon={<QrCode className="size-3.5" />}
                label={copy.emptyCardQrLabel}
                title={copy.emptyCardQrTitle}
                description={copy.emptyCardQrText}
              />

              <EmptyInfoCard
                light={isLight}
                icon={<Sparkles className="size-3.5" />}
                label={copy.emptyCardCopyLabel}
                title={copy.emptyCardCopyTitle}
                description={copy.emptyCardCopyText}
              />
            </div>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'min-h-screen px-4 pb-12 pt-5 md:px-7 md:pt-6',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto w-full max-w-[var(--page-max-width)]">
          <div className="mb-6 md:mb-7">
            <div className="min-w-0">
              <h1
                className={cn(
                  'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                  pageText(isLight),
                )}
              >
                {copy.title}
              </h1>

              <p
                className={cn(
                  'mt-2 max-w-[760px] text-[13px] leading-5',
                  mutedText(isLight),
                )}
              >
                {copy.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card light={isLight} className="overflow-hidden">
              <div className="p-5 md:p-6">
                <div className={cn('text-[11px] font-medium', mutedText(isLight))}>
                  {copy.publicLink}
                </div>

                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2.5">
                  <div
                    className={cn(
                      'min-w-0 break-all text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]',
                      pageText(isLight),
                    )}
                  >
                    /m/{ownedProfile.slug}
                  </div>

                  <InlineCopyButton
                    copied={copiedTarget === 'public-link'}
                    onClick={() => void handleCopy('public-link', publicUrl)}
                    copyLabel={copy.copyLink}
                    copiedLabel={copy.copied}
                    light={isLight}
                  />
                </div>

                <p
                  className={cn(
                    'mt-3 max-w-[680px] text-[12.5px] leading-6',
                    mutedText(isLight),
                  )}
                >
                  {copy.publicHint}
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroStat
                    label={copy.visits30}
                    value={dataset.totals.visitors}
                    hint={copy.visits}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.bookingsFromLink}
                    value={confirmedFromLink}
                    hint={copy.bookings}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.conversion}
                    value={`${dataset.totals.conversion}%`}
                    hint={copy.confirmed}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.topSource}
                    value={dataset.channels[0]?.label ?? '—'}
                    hint={copy.source}
                    light={isLight}
                  />
                </div>
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.linkDetails}
                description={copy.linkDetailsDescription}
                light={isLight}
              />

              <div className="grid gap-2 p-4 md:grid-cols-2 xl:grid-cols-4">
                <KeyValue label={copy.fullUrl} value={publicUrl} light={isLight} />
                <KeyValue label={copy.slug} value={ownedProfile.slug} light={isLight} />
                <KeyValue label={copy.status} value={copy.pageActive} light={isLight} />
                <KeyValue
                  label={copy.channel}
                  value={dataset.channels[0]?.label ?? '—'}
                  light={isLight}
                />
              </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card light={isLight}>
                <CardTitle
                  title={copy.materials}
                  description={copy.materialsDescription}
                  light={isLight}
                />

                <div className="p-4">
                  <ListBox light={isLight}>
                    {materials.map((item) => (
                      <TextMaterialRow
                        key={item.id}
                        title={item.title}
                        text={item.text}
                        copied={copiedTarget === item.id}
                        copyLabel={copy.copyText}
                        copiedLabel={copy.copied}
                        sendLabel={copy.send}
                        onCopy={() => void handleCopy(item.id, item.text)}
                        onShare={() => void handleShare(item.text)}
                        light={isLight}
                      />
                    ))}
                  </ListBox>
                </div>
              </Card>

              <div className="space-y-4 xl:sticky xl:top-[84px] xl:self-start">
                <Card light={isLight}>
                  <CardTitle
                    title={copy.qrTitle}
                    description={copy.qrDescription}
                    light={isLight}
                  />

                  <div className="p-4">
                    {showQrCode ? (
                      <Panel light={isLight} className="p-5 text-center">
                        <div className="flex justify-center">
                          <FakeQrCode value={publicUrl} className="w-full max-w-[240px]" />
                        </div>

                        <div className="mt-5 grid gap-2">
                          <ActionButton
                            light={isLight}
                            onClick={() => setShowQrCode(false)}
                            className="w-full"
                          >
                            {copy.hideQr}
                          </ActionButton>

                          <CopyButton
                            copied={copiedTarget === 'public-link'}
                            onClick={() => void handleCopy('public-link', publicUrl)}
                            label={copy.copyQrLink}
                            copiedLabel={copy.copied}
                            light={isLight}
                            className="w-full"
                          />
                        </div>
                      </Panel>
                    ) : (
                      <Panel light={isLight} className="p-5 text-center">
                        <div className={cn('text-[12px] leading-5', mutedText(isLight))}>
                          {copy.qrDescription}
                        </div>

                        <div className="mt-4 flex justify-center">
                          <ActionButton light={isLight} onClick={() => setShowQrCode(true)}>
                            {copy.showQr}
                          </ActionButton>
                        </div>
                      </Panel>
                    )}
                  </div>
                </Card>

                <Card light={isLight}>
                  <CardTitle
                    title={copy.sources}
                    description={copy.sourcesDescription}
                    light={isLight}
                  />

                  <div className="p-4">
                    <ListBox light={isLight}>
                      {dataset.channels.map((channel) => (
                        <TrafficRow
                          key={channel.id}
                          label={channel.label}
                          visitors={channel.visitors}
                          bookings={channel.bookings}
                          conversion={channel.conversion}
                          visitsLabel={copy.visits}
                          bookingsLabel={copy.bookings}
                          conversionLabel={copy.conversion}
                          light={isLight}
                        />
                      ))}
                    </ListBox>

                    <div className="mt-4">
                      <ActionButton
                        light={isLight}
                        onClick={() => void handleShare(publicUrl)}
                        className="w-full justify-between"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Share2 className="size-3.5" />
                          {copy.share}
                        </span>
                        <ArrowRight className="size-3.5" />
                      </ActionButton>
                    </div>
                  </div>
                </Card>

                <Card light={isLight}>
                  <div className="grid gap-2 p-4">
                    <ActionLink href={publicHref} light={isLight} active className="w-full">
                      <Globe2 className="size-3.5" />
                      {copy.openPage}
                    </ActionLink>

                    <CopyButton
                      copied={copiedTarget === 'public-link'}
                      onClick={() => void handleCopy('public-link', publicUrl)}
                      label={copy.copyLink}
                      copiedLabel={copy.copied}
                      light={isLight}
                      className="w-full"
                    />

                    <ActionButton
                      light={isLight}
                      onClick={() => void handleShare(publicUrl)}
                      className="w-full"
                    >
                      <Share2 className="size-3.5" />
                      {copy.share}
                    </ActionButton>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
}