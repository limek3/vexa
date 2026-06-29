'use client';

import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Clock3, Waypoints } from 'lucide-react';
import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { DashboardHeader, MetricCard, SectionCard } from '@/components/dashboard/workspace-ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/master-workspace';
import { useMobile } from '@/hooks/use-mobile';

export default function SourcesPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const isMobile = useMobile();

  if (!hasHydrated) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <div className="workspace-page dashboard-mobile-sources space-y-4 md:space-y-5">
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
      <div className="workspace-page dashboard-mobile-sources space-y-4 md:space-y-5">
        <DashboardHeader
          badge={locale === 'ru' ? 'Аналитика / источники' : 'Analytics / sources'}
          title={locale === 'ru' ? 'Источники и каналы' : 'Sources and channels'}
          description={
            isMobile
              ? locale === 'ru'
                ? 'Каналы, часы и повторные клиенты.'
                : 'Top channels, peak hours, and returning clients.'
              : locale === 'ru'
                ? 'Где клиенты находят публичную страницу, какие каналы дают лучшую конверсию и в какие часы поток плотнее.'
                : 'Where clients find the public page, which channels convert best, and when demand peaks.'
          }
        />

        <div className="dashboard-kpi-grid grid grid-cols-2 gap-3">
          <MetricCard label={locale === 'ru' ? 'Источники' : 'Sources'} value={String(dataset.channels.length)} icon={Waypoints} />
          <MetricCard label={locale === 'ru' ? 'Лучший источник' : 'Top source'} value={dataset.channels[0]?.label ?? '—'} />
          <MetricCard label={locale === 'ru' ? 'Пиковый час' : 'Peak hour'} value={dataset.peakHours.sort((a, b) => b.bookings - a.bookings)[0]?.hour ?? '—'} icon={Clock3} />
          <MetricCard label={locale === 'ru' ? 'Возвратные клиенты' : 'Returning clients'} value={`${dataset.totals.returnRate}%`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <SectionCard
            title={locale === 'ru' ? 'Рейтинг каналов' : 'Channel ranking'}
            description={
              locale === 'ru'
                ? 'Переходы, записи и выручка.'
                : 'Compare traffic, bookings, and revenue by channel.'
            }
          >
            <div className="rounded-[18px] border border-border bg-accent/20 p-3">
              <ChartContainer config={{ bookings: { label: 'Bookings', color: 'var(--chart-2)' } }} className={isMobile ? "h-[190px] w-full" : "h-[320px] w-full"}>
                <BarChart data={dataset.channels}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[10, 10, 4, 4]} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="mt-4 grid gap-2">
              {dataset.channels.map((channel) => (
                <div key={channel.id} className="rounded-[14px] border border-border bg-accent/30 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-foreground">{channel.label}</span>
                    <Badge variant="outline">{channel.conversion}%</Badge>
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground">
                    {channel.visitors} {locale === 'ru' ? 'переходов' : 'visits'} · {channel.bookings} {locale === 'ru' ? 'записей' : 'bookings'} · {formatCurrency(channel.revenue, locale)}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={locale === 'ru' ? 'Пиковые часы и нагрузка' : 'Peak hours and load'}
            description={
              locale === 'ru'
                ? 'Пиковые часы и загрузка недели.'
                : 'When demand peaks and how the week distributes.'
            }
          >
            <div className="rounded-[18px] border border-border bg-accent/20 p-3">
              <ChartContainer config={{ bookings: { label: 'Bookings', color: 'var(--chart-3)' } }} className={isMobile ? "h-[170px] w-full" : "h-[220px] w-full"}>
                <LineChart data={dataset.peakHours}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="bookings" stroke="var(--color-bookings)" strokeWidth={2.2} dot={false} />
                </LineChart>
              </ChartContainer>
            </div>

            <div className="mt-4 grid gap-2">
              {dataset.weeklyLoad.map((item) => (
                <div key={item.week} className="rounded-[14px] border border-border bg-accent/30 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-foreground">{item.week}</span>
                    <Badge variant="outline">{item.utilization}%</Badge>
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground">
                    {item.bookings} {locale === 'ru' ? 'записей' : 'bookings'} · {item.hours} {locale === 'ru' ? 'часов' : 'hours'}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </WorkspaceShell>
  );
}
