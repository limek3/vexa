'use client';

import Link from 'next/link';
import { Globe2, Link2, MessageCircle, Sparkles } from 'lucide-react';
import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { DashboardHeader, MetricCard, SectionCard } from '@/components/dashboard/workspace-ui';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { Badge } from '@/components/ui/badge';
import { useMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

export default function IntegrationsPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const isMobile = useMobile();

  if (!hasHydrated) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <div className="workspace-page dashboard-mobile-integrations space-y-4 md:space-y-5">
          <div className="workspace-card rounded-[18px] p-8 text-center">
            <div className="text-[18px] font-semibold text-foreground">
              {locale === 'ru' ? 'Сначала настройте профиль мастера' : 'Create the master profile first'}
            </div>
            <div className="mt-4">
              <Button asChild>
                <Link href="/create-profile">{locale === 'ru' ? 'Создать профиль' : 'Create profile'}</Link>
              </Button>
            </div>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="workspace-page dashboard-mobile-integrations space-y-4 md:space-y-5">
        <DashboardHeader
          badge={locale === 'ru' ? 'Настройки / интеграции' : 'Settings / integrations'}
          title={locale === 'ru' ? 'Интеграции' : 'Integrations'}
          description={
            isMobile
              ? locale === 'ru'
                ? 'Подключения и статусы.'
                : 'Connections, statuses, and fast actions.'
              : locale === 'ru'
                ? 'Каналы связи и сервисы.'
                : 'Telegram, ВК, Instagram, website, calendar, and notifications in one system block.'
          }
        />

        <div className="dashboard-kpi-grid grid grid-cols-2 gap-3">
          <MetricCard label={locale === 'ru' ? 'Подключено' : 'Connected'} value={String(dataset.integrations.filter((item) => item.status === 'connected').length)} icon={Sparkles} />
          <MetricCard label={locale === 'ru' ? 'Рекомендовано' : 'Recommended'} value={String(dataset.integrations.filter((item) => item.status === 'recommended').length)} icon={Link2} />
          <MetricCard label={locale === 'ru' ? 'Каналы связи' : 'Messaging channels'} value="2" icon={MessageCircle} />
          <MetricCard label={locale === 'ru' ? 'Внешние ссылки' : 'External links'} value="2" icon={Globe2} />
        </div>

        <SectionCard
          title={locale === 'ru' ? 'Подключения' : 'Connections'}
          description={
            locale === 'ru'
              ? 'Подключённые сервисы и доступные действия.'
              : 'Integration status and why each one matters to the master.'
          }
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {dataset.integrations.map((item) => (
              <div key={item.id} className="workspace-card rounded-[18px] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-medium text-foreground">{item.name}</div>
                    <div className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.description}</div>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <div className="mt-4 rounded-[14px] border border-border bg-accent/30 px-3.5 py-3 text-[12px] text-muted-foreground">
                  {item.hint}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant={item.status === 'connected' ? 'outline' : 'default'} size="sm">
                    {item.status === 'connected'
                      ? locale === 'ru' ? 'Управлять' : 'Manage'
                      : locale === 'ru' ? 'Подключить' : 'Connect'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm">
                    {locale === 'ru' ? 'Подробнее' : 'Details'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
