'use client';

import { useEffect } from 'react';

function canRegisterServiceWorker() {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;

  const { hostname, protocol } = window.location;
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

export function PwaRegister() {
  useEffect(() => {
    if (!canRegisterServiceWorker()) return;

    let cancelled = false;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (error) {
        if (!cancelled) {
          console.warn('[КликБук PWA] Service worker registration failed:', error);
        }
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
