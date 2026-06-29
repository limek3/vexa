import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/app/providers';
import { PwaInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { PwaRegister } from '@/components/pwa/pwa-register';
import { buildAppearancePreferenceScript } from '@/lib/appearance';

export const metadata: Metadata = {
  title: {
    default: 'Vexa',
    template: '%s · Vexa',
  },
  description: 'Vexa — мониторинг Telegram-источников по ключевым словам и доставка новых совпадений в приложение и личные сообщения.',
  generator: 'Vexa',
  applicationName: 'Vexa',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Vexa',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#080808' },
  ],
};

const shellPreferenceScript = `
  try {
    const collapsed = window.localStorage.getItem('clickbook-sidebar-premium-v15');
    document.documentElement.dataset.slotySidebar = collapsed === 'true' ? 'collapsed' : 'expanded';
  } catch (error) {
    document.documentElement.dataset.slotySidebar = 'expanded';
  }
`;

const appearancePreferenceScript = buildAppearancePreferenceScript();

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Script id="sloty-appearance-preferences" strategy="beforeInteractive">
          {appearancePreferenceScript}
        </Script>
        <Script id="sloty-shell-preferences" strategy="beforeInteractive">
          {shellPreferenceScript}
        </Script>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
          <PwaRegister />
          <PwaInstallPrompt />
        </Suspense>
      </body>
    </html>
  );
}
