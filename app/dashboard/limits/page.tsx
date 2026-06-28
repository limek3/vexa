'use client';

import Link from 'next/link';
import { Activity, Gauge, ShieldCheck } from 'lucide-react';
import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { DashboardHeader, MetricCard, SectionCard } from '@/components/dashboard/workspace-ui';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';

export default function LimitsPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const isMobile = useMobile();

  if (!hasHydrated) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <div className="workspace-page dashboard-mobile-limits space-y-4 md:space-y-5">
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
      <div className="workspace-page dashboard-mobile-limits space-y-4 md:space-y-5">
        <DashboardHeader
          badge="Billing / limits"
          title={locale === 'ru' ? 'Лимиты' : 'Limits'}
          description={
            isMobile
              ? locale === 'ru'
                ? 'Использование тарифа.'
                : 'Plan usage and where headroom is getting thin.'
              : locale === 'ru'
                ? 'Контроль ресурсов текущего плана: услуги, клиенты, напоминания, экспорт и запас по росту.'
                : 'Control the current plan resources: services, clients, reminders, exports, and growth headroom.'
          }
        />

        <div className="dashboard-kpi-grid grid grid-cols-2 gap-3">
          <MetricCard label={locale === 'ru' ? 'Лимитов отслеживается' : 'Tracked limits'} value={String(dataset.limits.length)} icon={Gauge} />
          <MetricCard label={locale === 'ru' ? 'Почти заполнены' : 'Near limit'} value={String(dataset.limits.filter((item) => item.used / item.total > 0.65).length)} icon={Activity} />
          <MetricCard label={locale === 'ru' ? 'Текущий план' : 'Current plan'} value={dataset.subscription.planName} icon={ShieldCheck} />
          <MetricCard label={locale === 'ru' ? 'Рекомендуется апгрейд' : 'Upgrade suggested'} value={dataset.limits.some((item) => item.used / Math.max(1, item.total) > 0.85) ? (locale === 'ru' ? 'Да' : 'Yes') : (locale === 'ru' ? 'Пока нет' : 'Not yet')} />
        </div>

        <SectionCard
          title={locale === 'ru' ? 'Использование лимитов' : 'Limit usage'}
          description={
            locale === 'ru'
              ? 'Лимиты, расход и остаток.'
              : 'Each limit is shown as a resource with current usage and remaining headroom.'
          }
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {dataset.limits.map((item) => {
              const progress = Math.min(100, Math.round((item.used / Math.max(1, item.total)) * 100));
              return (
                <div key={item.id} className="workspace-card rounded-[18px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[14px] font-medium text-foreground">{item.label}</div>
                    <div className="text-[12px] text-muted-foreground">{item.used}/{item.total}</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-border/60">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-3 text-[12px] text-muted-foreground">
                    {progress >= 70
                      ? locale === 'ru' ? 'Стоит держать под контролем.' : 'Worth watching closely.'
                      : locale === 'ru' ? 'Запас комфортный.' : 'Healthy remaining headroom.'}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
