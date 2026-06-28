import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'КликБук — рабочий кабинет',
    short_name: 'КликБук',
    description: 'Онлайн-запись, расписание, клиенты, чаты и аналитика для бизнеса.',
    start_url: '/dashboard?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f7f6f2',
    theme_color: '#111111',
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
        name: 'Расписание',
        short_name: 'Расписание',
        description: 'Открыть расписание записей',
        url: '/dashboard/today?source=pwa-shortcut',
        icons: [{ src: '/icons/pwa-icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Клиенты',
        short_name: 'Клиенты',
        description: 'Открыть клиентскую базу',
        url: '/dashboard/clients?source=pwa-shortcut',
        icons: [{ src: '/icons/pwa-icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Чаты',
        short_name: 'Чаты',
        description: 'Открыть сообщения клиентов',
        url: '/dashboard/chats?source=pwa-shortcut',
        icons: [{ src: '/icons/pwa-icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
