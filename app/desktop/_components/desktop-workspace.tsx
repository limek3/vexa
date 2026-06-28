'use client';

import DesktopHtmlExactApp from '@/components/desktop-html-exact/desktop-html-app';

export function DesktopWorkspace({ initialScreen }: { initialScreen: string }) {
  return <DesktopHtmlExactApp initialPage={initialScreen} />;
}

export function DesktopBootScreen() {
  return (
    <div className="cb-desktop-html" data-theme="light" data-accent="plum" data-density="default" data-radius="default">
      <div className="boot-exact">
        <div>
          <strong>Рабочий кабинет</strong>
          <em>Открываем интерфейс...</em>
        </div>
      </div>
    </div>
  );
}

export function DesktopDashboardApp() { return <DesktopWorkspace initialScreen="dashboard" />; }
export function DesktopScheduleApp() { return <DesktopWorkspace initialScreen="schedule" />; }
export function DesktopClientsApp() { return <DesktopWorkspace initialScreen="clients" />; }
export function DesktopChatsApp() { return <DesktopWorkspace initialScreen="chats" />; }
export function DesktopServicesApp() { return <DesktopWorkspace initialScreen="services" />; }
export function DesktopAvailabilityApp() { return <DesktopWorkspace initialScreen="availability" />; }
export function DesktopProfileApp() { return <DesktopWorkspace initialScreen="profile" />; }
export function DesktopPublicApp() { return <DesktopWorkspace initialScreen="public" />; }
export function DesktopAppearanceApp() { return <DesktopWorkspace initialScreen="appearance" />; }
export function DesktopTemplatesApp() { return <DesktopWorkspace initialScreen="templates" />; }
export function DesktopNotificationsApp() { return <DesktopWorkspace initialScreen="notifications" />; }
export function DesktopIntegrationsApp() { return <DesktopWorkspace initialScreen="integrations" />; }
export function DesktopAnalyticsApp() { return <DesktopWorkspace initialScreen="analytics" />; }
export function DesktopReviewsApp() { return <DesktopWorkspace initialScreen="reviews" />; }
export function DesktopSubscriptionApp() { return <DesktopWorkspace initialScreen="subscription" />; }
export function DesktopSettingsApp() { return <DesktopWorkspace initialScreen="settings" />; }
export function DesktopAccountApp() { return <DesktopWorkspace initialScreen="account" />; }
export function DesktopFinanceApp() { return <DesktopWorkspace initialScreen="finance" />; }
export function DesktopMarketingApp() { return <DesktopWorkspace initialScreen="marketing" />; }
export function DesktopPaymentsApp() { return <DesktopWorkspace initialScreen="payments" />; }
export function DesktopLimitsApp() { return <DesktopWorkspace initialScreen="limits" />; }
export function DesktopSourcesApp() { return <DesktopWorkspace initialScreen="sources" />; }
export function DesktopHelpApp() { return <DesktopWorkspace initialScreen="help" />; }
