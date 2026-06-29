import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Vexa — мониторинг Telegram',
    short_name: 'Vexa',
    description: 'Мониторинг Telegram-источников по ключевым словам, новые совпадения и уведомления через Vexa-бота.',
    start_url: '/desktop/searches?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#120A1E',
    theme_color: '#8F6BFF',
    categories: ['business', 'productivity'],
    lang: 'ru',
    icons: [
      {
        src: '/icons/pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/pwa-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Мониторинг',
        short_name: 'Мониторинг',
        description: 'Открыть поиски Vexa',
        url: '/desktop/searches?source=pwa-shortcut',
        icons: [{ src: '/icons/pwa-icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Совпадения',
        short_name: 'Совпадения',
        description: 'Открыть ленту Telegram-совпадений',
        url: '/desktop/matches?source=pwa-shortcut',
        icons: [{ src: '/icons/pwa-icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Источники',
        short_name: 'Источники',
        description: 'Открыть библиотеку Telegram-источников',
        url: '/desktop/vexa-sources?source=pwa-shortcut',
        icons: [{ src: '/icons/pwa-icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
