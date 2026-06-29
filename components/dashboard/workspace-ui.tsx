'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { CheckCircle2, Copy, ExternalLink, Globe2, Link2, Share2, Sparkles } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MasterAvatar } from '@/components/profile/master-avatar';
import { useMobile } from '@/hooks/use-mobile';
import type { MasterProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { NumberPopIn } from '@/components/ui/number-pop-in';
import { useLocale } from '@/lib/locale-context';

export function DashboardHeader({
  badge,
  title,
  description,
  actions,
}: {
  badge?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-5 md:mb-7 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {badge ? (
          <div className="mb-3 inline-flex h-7 items-center gap-1.5 rounded-[9px] border border-black/[0.08] bg-black/[0.025] px-2.5 text-[10.5px] font-medium text-black/50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/42">
            <span className="size-1.5 rounded-full bg-black dark:bg-white" />
            {badge}
          </div>
        ) : null}

        <h1 className="text-[31px] font-semibold tracking-[-0.075em] text-[#111111] dark:text-white md:text-[42px]">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-[760px] text-[13px] leading-5 text-black/48 dark:text-white/42">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  icon?: LucideIcon;
}) {
  const compactValue = value.trim().length >= 8;

  return (
    <div className="workspace-card min-w-0 rounded-[11px] border p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-black/48 dark:text-white/42">{label}</div>
          <div
            className={cn(
              'mt-2 truncate text-[25px] font-semibold tracking-[-0.06em] text-[#111111] dark:text-white',
              compactValue && 'text-[21px]',
            )}
          >
            <NumberPopIn value={value} />
          </div>
          {hint || delta ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-black/48 dark:text-white/42">
              {delta ? <span className="workspace-pill">{delta}</span> : null}
              {hint ? <span>{hint}</span> : null}
            </div>
          ) : null}
        </div>

        {Icon ? (
          <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-black/[0.07] bg-black/[0.025] text-black/38 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white/38">
            <Icon className="size-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('workspace-card overflow-hidden rounded-[11px] border', className)}>
      <div className="flex min-h-[58px] items-center justify-between gap-4 border-b border-black/[0.08] px-4 py-3 dark:border-white/[0.08]">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-[9px] border border-black/[0.07] bg-black/[0.025] text-black/38 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white/38">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold tracking-[-0.018em] text-[#111111] dark:text-white">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-[720px] truncate text-[11px] leading-4 text-black/48 dark:text-white/42">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  );
}

export function PublicPageHero({
  profile,
  alignTop = false,
  sticky = false,
}: {
  profile: MasterProfile;
  alignTop?: boolean;
  sticky?: boolean;
}) {
  const { locale } = useLocale();
  const isMobile = useMobile();
  const [copiedState, setCopiedState] = useState<'link' | 'message' | null>(null);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/m/${profile.slug}`;
    return `${window.location.origin}/m/${profile.slug}`;
  }, [profile.slug]);

  const shareMessage = useMemo(() => {
    return locale === 'ru'
      ? `Здравствуйте! Вот моя ссылка для записи: ${publicUrl}\nНа странице есть услуги, свободные слоты и быстрый способ оставить заявку.`
      : `Hello! Here is my booking link: ${publicUrl}\nThe page already includes services, available slots, and a quick request flow.`;
  }, [locale, publicUrl]);

  const copyValue = async (value: string, type: 'link' | 'message') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedState(type);
      window.setTimeout(() => setCopiedState(null), 1400);
    } catch {}
  };

  const handleShare = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ title: profile.name, text: shareMessage, url: publicUrl });
    } catch {}
  };

  const labels = locale === 'ru'
    ? {
        badge: 'Публичная страница активна',
        title: 'Главная ссылка мастера',
        description: 'Сразу видно, как выглядит карточка, какая ссылка уходит клиенту и какими действиями поделиться без лишних шагов.',
        connected: 'Подключено',
        live: 'Страница доступна для записи',
        copyLink: copiedState === 'link' ? 'Скопировано' : 'Скопировать ссылку',
        copyMessage: copiedState === 'message' ? 'Скопировано' : 'Скопировать сообщение',
        share: 'Поделиться',
        open: 'Открыть страницу',
      }
    : {
        badge: 'Public page is active',
        title: 'Primary specialist link',
        description: 'See the page card, the live URL, and the sharing actions in one compact block.',
        connected: 'Connected',
        live: 'Ready to accept bookings',
        copyLink: copiedState === 'link' ? 'Copied' : 'Copy link',
        copyMessage: copiedState === 'message' ? 'Copied' : 'Copy message',
        share: 'Share',
        open: 'Open page',
      };

  if (isMobile) {
    return (
      <section
        className={cn(
          'workspace-card accent-gradient overflow-hidden rounded-[18px] p-3',
          alignTop && 'mt-0',
        )}
      >
        <div className="flex items-start gap-3">
          <MasterAvatar name={profile.name} avatar={profile.avatar} className="h-12 w-12 rounded-[14px]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-card/82 backdrop-blur">
                <CheckCircle2 className="size-3.5" />
                {labels.connected}
              </Badge>
            </div>
            <div className="mt-1 truncate text-[15px] font-semibold tracking-[-0.03em] text-[#111111] dark:text-white">
              {profile.name}
            </div>
            <div className="truncate text-[11px] font-medium text-black/48 dark:text-white/42">
              {profile.profession} · {profile.city}
            </div>
          </div>
          <Button asChild size="sm" className="h-8 rounded-full px-3">
            <Link href={`/m/${profile.slug}`}>
              <ExternalLink className="size-3.5" />
              {labels.open}
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: locale === 'ru' ? 'Статус' : 'Status', value: labels.connected },
            { label: 'Slug', value: profile.slug },
            { label: locale === 'ru' ? 'Режим' : 'Mode', value: labels.live },
          ].map((item) => (
            <div key={item.label} className="rounded-[14px] border border-border/80 bg-card/72 px-2.5 py-2">
              <div className="truncate text-[9.5px] uppercase tracking-[0.14em] text-black/48 dark:text-white/42">{item.label}</div>
              <div className="mt-1 truncate text-[11px] font-medium text-[#111111] dark:text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-[14px] border border-border/80 bg-card/72 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-black/48 dark:text-white/42">
            <Link2 className="size-3.5 shrink-0" />
            <span className="truncate">{publicUrl}</span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => copyValue(publicUrl, 'link')}>
            <Copy className="size-3.5" />
            {labels.copyLink}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="size-3.5" />
            {labels.share}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="col-span-2" onClick={() => copyValue(shareMessage, 'message')}>
            <Copy className="size-3.5" />
            {labels.copyMessage}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'workspace-card hero-grid accent-gradient overflow-hidden rounded-[20px] p-3.5 md:p-5',
        alignTop && 'mt-0',
        sticky && 'xl:sticky xl:top-4 xl:z-20',
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-card/80 backdrop-blur">
            <CheckCircle2 className="size-3.5" />
            {labels.badge}
          </Badge>

          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[#111111] dark:text-white md:text-[30px]">{labels.title}</h2>
            <p className="mt-2 max-w-[720px] text-[12px] leading-6 text-black/48 dark:text-white/42 md:mt-3 md:text-[14px] md:leading-7">
              {labels.description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: locale === 'ru' ? 'Статус' : 'Status', value: labels.connected },
              { label: locale === 'ru' ? 'Slug' : 'Slug', value: profile.slug },
              { label: locale === 'ru' ? 'Публичный режим' : 'Public mode', value: labels.live },
            ].map((item) => (
              <div key={item.label} className="rounded-[14px] border border-border bg-card/70 px-3 py-2.5 backdrop-blur">
                <div className="text-[10px] text-black/48 dark:text-white/42 md:text-[11px]">{item.label}</div>
                <div className="mt-1 truncate text-[12px] font-medium text-[#111111] dark:text-white md:text-[13px]">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <div className="workspace-soft-panel flex min-h-10 items-center gap-2.5 px-3 py-2.5">
              <Link2 className="size-4 text-black/48 dark:text-white/42" />
              <span className="truncate text-[12px] text-[#111111] dark:text-white md:text-[13px]">{publicUrl}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => copyValue(publicUrl, 'link')}>
              <Copy className="size-4" />
              {labels.copyLink}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copyValue(shareMessage, 'message')}>
              <Copy className="size-4" />
              {labels.copyMessage}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="size-4" />
              {labels.share}
            </Button>
          </div>
        </div>

        <div className="workspace-card rounded-[18px] border border-border/80 bg-card/80 p-3.5 backdrop-blur md:rounded-[22px] md:p-4">
          <div className="flex items-start gap-3">
            <MasterAvatar name={profile.name} avatar={profile.avatar} className="h-14 w-14 rounded-[16px] md:h-16 md:w-16 md:rounded-[18px]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-[15px] font-semibold text-[#111111] dark:text-white md:text-[17px]">{profile.name}</div>
                <Badge variant="outline">
                  <Globe2 className="size-3.5" />
                  {labels.connected}
                </Badge>
              </div>
              <div className="truncate text-[12px] text-black/48 dark:text-white/42 md:text-[13px]">{profile.profession}</div>
              <div className="mt-1 truncate text-[11px] font-medium text-black/48 dark:text-white/42 md:text-[12px]">{profile.city}</div>
            </div>
          </div>

          <div className="mt-3 line-clamp-3 text-[12px] leading-5 text-black/48 dark:text-white/42 md:mt-4 md:text-[13px] md:leading-6">{profile.bio}</div>

          <div className="mt-3 flex flex-wrap gap-2 md:mt-4">
            {profile.services.slice(0, 4).map((service) => (
              <span key={service} className="chip-muted">
                {service}
              </span>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:mt-4">
            <Button asChild size="sm">
              <Link href={`/m/${profile.slug}`}>
                <ExternalLink className="size-4" />
                {labels.open}
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => copyValue(publicUrl, 'link')}>
              <Copy className="size-4" />
              {labels.copyLink}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
