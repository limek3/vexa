import type { ReactNode } from 'react';
import Script from 'next/script';
import './desktop.css';

/**
 * Runs synchronously before React hydrates the desktop UI: reads persisted
 * theme/accent/density/radius from localStorage and applies them to <html> so
 * the first paint is already in the user's chosen theme. Without this, route
 * transitions briefly flash the default light theme.
 */
const THEME_INIT = `
(function () {
  try {
    var raw = localStorage.getItem('vexa.desktop.platform.v1');
    var prefs = raw ? (JSON.parse(raw).preferences || {}) : {};
    var root = document.documentElement;
    var theme = prefs.theme || 'light';
    root.dataset.desktopScreen = 'true';
    root.dataset.theme = theme;
    root.dataset.accent = prefs.accent || 'plum';
    root.dataset.density = prefs.density || 'default';
    root.dataset.radius = prefs.radius || 'default';
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme !== 'dark');
    root.style.colorScheme = theme;
  } catch (err) {
    document.documentElement.dataset.desktopScreen = 'true';
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.accent = 'plum';
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

export default function DesktopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script id="desktop-theme-init" strategy="beforeInteractive">{THEME_INIT}</Script>
      {children}
    </>
  );
}
