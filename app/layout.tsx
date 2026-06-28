import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/app/providers';

export const metadata: Metadata = {
  title: {
    default: 'Vexa',
    template: '%s · Vexa',
  },
  description: 'Vexa desktop workspace for Telegram monitoring.',
  generator: 'Vexa',
  applicationName: 'Vexa',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Script id="vexa-shell-preferences" strategy="beforeInteractive">
          {`document.documentElement.dataset.vexaDesktop = 'true';`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
