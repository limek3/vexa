
'use client';

import Link from 'next/link';
import { CreditCard, ReceiptText } from 'lucide-react';
import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { DashboardHeader, MetricCard, SectionCard } from '@/components/dashboard/workspace-ui';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/master-workspace';

export default function PaymentsPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();

  if (!hasHydrated) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <div className="workspace-page">
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
      <div className="workspace-page workspace-page-payments space-y-5">
        <DashboardHeader
          badge="Billing / payments"
          title={locale === 'ru' ? 'Платежи' : 'Payments'}
          description={
            locale === 'ru'
              ? 'История оплат и статусы.'
              : 'Payment history, statuses, payment methods, and transparent billing inside the product.'
          }
        />

        <div className="dashboard-kpi-grid grid grid-cols-2 gap-4">
          <MetricCard label={locale === 'ru' ? 'Последний платёж' : 'Last payment'} value={formatCurrency(dataset.payments[0]?.amount ?? 0, locale)} icon={CreditCard} />
          <MetricCard label={locale === 'ru' ? 'История оплат' : 'Payment records'} value={String(dataset.payments.length)} icon={ReceiptText} />
          <MetricCard label={locale === 'ru' ? 'Активный метод' : 'Active method'} value={dataset.subscription.paymentMethodLabel || (locale === 'ru' ? 'Не привязана' : 'Not connected')} />
          <MetricCard label={locale === 'ru' ? 'Статус' : 'Status'} value={dataset.subscription.status === 'active' ? (locale === 'ru' ? 'Активно' : 'Active') : dataset.subscription.status} />
        </div>

        <SectionCard
          title={locale === 'ru' ? 'История платежей' : 'Payment history'}
          description={
            locale === 'ru'
              ? 'Начисления, возвраты и тарифы.'
              : 'Full list of charges, refunds, and related plans.'
          }
        >
          <div className="grid gap-2.5 md:hidden">
            {dataset.payments.map((payment) => (
              <div key={payment.id} className="rounded-[16px] border border-border bg-card/94 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground">{payment.plan}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{payment.date}</div>
                  </div>
                  <Badge variant="outline">{payment.status}</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-[12px] border border-border/80 bg-background/76 px-3 py-2">
                    <div className="text-[10px] text-muted-foreground">{locale === 'ru' ? 'Способ' : 'Method'}</div>
                    <div className="mt-1 text-[12px] font-medium text-foreground">{payment.method}</div>
                  </div>
                  <div className="rounded-[12px] border border-border/80 bg-background/76 px-3 py-2">
                    <div className="text-[10px] text-muted-foreground">{locale === 'ru' ? 'Сумма' : 'Amount'}</div>
                    <div className="mt-1 text-[12px] font-medium text-foreground">{formatCurrency(payment.amount, locale)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === 'ru' ? 'Дата' : 'Date'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'План' : 'Plan'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Способ' : 'Method'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Статус' : 'Status'}</TableHead>
                  <TableHead>{locale === 'ru' ? 'Сумма' : 'Amount'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.plan}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.status}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>
    </WorkspaceShell>
  );
}
