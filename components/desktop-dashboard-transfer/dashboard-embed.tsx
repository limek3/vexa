'use client';

import DashboardOverviewPage from '@/app/dashboard/page';
import DashboardAppearancePage from '@/app/dashboard/appearance/page';
import DashboardAvailabilityPage from '@/app/dashboard/availability/page';
import DashboardChatsPage from '@/app/dashboard/chats/page';
import DashboardClientsPage from '@/app/dashboard/clients/page';
import DashboardFinancePage from '@/app/dashboard/finance/page';
import DashboardIntegrationsPage from '@/app/dashboard/integrations/page';
import DashboardLimitsPage from '@/app/dashboard/limits/page';
import DashboardMarketingPage from '@/app/dashboard/marketing/page';
import DashboardNotificationsPage from '@/app/dashboard/notifications/page';
import DashboardPaymentsPage from '@/app/dashboard/payments/page';
import DashboardProfilePage from '@/app/dashboard/profile/page';
import DashboardReviewsPage from '@/app/dashboard/reviews/page';
import DashboardServicesPage from '@/app/dashboard/services/page';
import DashboardSourcesPage from '@/app/dashboard/sources/page';
import DashboardStatsPage from '@/app/dashboard/stats/page';
import DashboardSubscriptionPage from '@/app/dashboard/subscription/page';
import DashboardTemplatesPage from '@/app/dashboard/templates/page';
import DashboardTodayPage from '@/app/dashboard/today/page';
import { WorkspaceShellEmbedProvider } from '@/components/shared/workspace-shell';
import { DesktopSettingsIndex } from './desktop-settings-index';

function DashboardTransferPageContent({ page }: { page: string }) {
  switch (page) {
    case 'calendar':
    case 'schedule':
    case 'today':
    case 'bookings':
      return <DashboardTodayPage />;
    case 'clients':
      return <DashboardClientsPage />;
    case 'chats':
      return <DashboardChatsPage />;
    case 'services':
      return <DashboardServicesPage />;
    case 'availability':
      return <DashboardAvailabilityPage />;
    case 'analytics':
    case 'stats':
      return <DashboardStatsPage />;
    case 'finance':
      return <DashboardFinancePage />;
    case 'profile':
    case 'master-profile':
      return <DashboardProfilePage />;
    case 'appearance':
    case 'design':
      return <DashboardAppearancePage />;
    case 'templates':
      return <DashboardTemplatesPage />;
    case 'notifications':
      return <DashboardNotificationsPage />;
    case 'integrations':
      return <DashboardIntegrationsPage />;
    case 'reviews':
      return <DashboardReviewsPage />;
    case 'subscription':
      return <DashboardSubscriptionPage />;
    case 'marketing':
      return <DashboardMarketingPage />;
    case 'payments':
      return <DashboardPaymentsPage />;
    case 'limits':
      return <DashboardLimitsPage />;
    case 'sources':
      return <DashboardSourcesPage />;
    case 'settings':
    case 'account':
      return <DesktopSettingsIndex />;
    case 'dashboard':
    default:
      return <DashboardOverviewPage />;
  }
}

export function DesktopDashboardTransferPage({ page }: { page: string }) {
  return (
    <WorkspaceShellEmbedProvider>
      <div className="desktop-dashboard-embed" data-desktop-dashboard-page={page}>
        <DashboardTransferPageContent page={page} />
      </div>
    </WorkspaceShellEmbedProvider>
  );
}
