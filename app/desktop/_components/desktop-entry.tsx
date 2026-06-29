'use client';

import dynamic from 'next/dynamic';
import { VexaAuthGate } from '@/components/desktop-html-exact/vexa-auth-gate';

type DesktopScreen =
  | 'dashboard'
  | 'searches'
  | 'matches'
  | 'vexa-sources'
  | 'vexa-settings'
  | 'vexa-testing'
  | 'vexa-help'
  | 'schedule'
  | 'clients'
  | 'chats'
  | 'services'
  | 'availability'
  | 'profile'
  | 'public'
  | 'appearance'
  | 'templates'
  | 'notifications'
  | 'integrations'
  | 'analytics'
  | 'reviews'
  | 'subscription'
  | 'account'
  | 'settings'
  | 'finance'
  | 'marketing'
  | 'payments'
  | 'limits'
  | 'sources'
  | 'help';

// Transparent loading placeholder. The theme-init script in app/desktop/layout.tsx
// has already set data-theme on <html>, so the background colour matches the
// user's theme — no white flash on route transitions.
const loading = () => (
  <div aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'transparent', pointerEvents: 'none' }} />
);

const DesktopWorkspace = dynamic(
  () => import('./desktop-workspace').then((mod) => mod.DesktopWorkspace),
  { ssr: false, loading },
);

export function DesktopScreenApp({ screen }: { screen: DesktopScreen }) {
  return (
    <VexaAuthGate>
      <DesktopWorkspace initialScreen={screen} />
    </VexaAuthGate>
  );
}
