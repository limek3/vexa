'use client';

import Link from 'next/link';
import { Eye, LayoutDashboard, Presentation, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/locale-context';

export function DemoModeBanner() {
  const { locale } = useLocale();

  return (
    <div className="border-b border-border/70 bg-primary/[0.07]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-background text-primary shadow-[0_10px_30px_rgba(18,125,254,0.12)]">
            <Presentation className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>{locale === 'ru' ? 'Включён demo mode' : 'Demo mode is enabled'}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                <Sparkles className="size-3" />
                {locale === 'ru' ? 'Презентация' : 'Presentation'}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {locale === 'ru'
                ? 'Платформа показывает демонстрационный workspace с фейковыми клиентами, бронированиями, чатами, аналитикой и публичной страницей без подключения реальной базы.'
                : 'The platform is showing a presentation workspace with sample clients, bookings, chats, analytics, and a public page without a live database.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/demo/demo">
              <Eye className="size-4" />
              {locale === 'ru' ? 'Публичная страница' : 'Public page'}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard?demo=1">
              <LayoutDashboard className="size-4" />
              {locale === 'ru' ? 'Демо workspace' : 'Demo workspace'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
