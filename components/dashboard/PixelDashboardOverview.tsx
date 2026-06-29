"use client";

import Link from "next/link";
import styles from "./pixel-dashboard.module.css";

/**
 * Interactive hotspots for the pixel‑perfect dashboard.
 *
 * Each hotspot corresponds to a navigation item or clickable element on the
 * underlying reference screenshot. We intentionally keep the Hotspot array
 * simple so you can add new interactive areas without editing the JSX.
 */
interface Hotspot {
  /** URL to navigate to when the hotspot is clicked. */
  href: string;
  /** ARIA label describing the hotspot. */
  label: string;
  /** CSS class on .hotspot positioning the element over the reference. */
  className: string;
}

// Define all clickable areas on the dashboard. The positions are encoded
// as CSS classes in pixel-dashboard.module.css.
const HOTSPOTS: Hotspot[] = [
  { href: "/dashboard", label: "Обзор", className: styles.navOverview },
  { href: "/dashboard/today", label: "Записи", className: styles.navBookings },
  { href: "/dashboard/clients", label: "Клиенты", className: styles.navClients },
  { href: "/dashboard/services", label: "Услуги", className: styles.navServices },
  { href: "/dashboard/finance", label: "Финансы", className: styles.navFinance },
  { href: "/dashboard/stats", label: "Аналитика", className: styles.navAnalytics },
  { href: "/dashboard/profile", label: "Настройки", className: styles.navSettings },
  { href: "/dashboard/finance", label: "Перейти к кассе", className: styles.cashButton },
  { href: "/dashboard/chats", label: "Сообщения", className: styles.messagesCard },
];

export function PixelDashboardOverview() {
  return (
    <main className={styles.page}>
      <div
        className={styles.stage}
        // This style scales the 2048×1448 reference to fit the width of the page
        // while maintaining the aspect ratio. The scale is applied via CSS so
        // the coordinates in pixel-dashboard.module.css remain valid.
        style={{
          transform: `scale(min(100vw / 2048, 100vh / 1448))`,
        }}
      >
        {/* Render the background reference image */}
        <img
          src="/assets/clickbook/reference/01_dashboard_overview.png"
          alt="КликБук dashboard"
          className={styles.image}
          draggable={false}
        />
        {/* Render interactive hotspots on top of the image */}
        {HOTSPOTS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            className={`${styles.hotspot} ${item.className}`}
          />
        ))}
      </div>
    </main>
  );
}

export default PixelDashboardOverview;