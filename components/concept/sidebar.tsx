'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from './icons';

const primary = [
  { href: '/concept', label: 'Главная', icon: Icons.Home, exact: true },
  { href: '/concept/bookings', label: 'Записи', icon: Icons.Calendar, count: 12 },
  { href: '/concept/schedule', label: 'График', icon: Icons.Clock },
  { href: '/concept/clients', label: 'Клиенты', icon: Icons.Users },
  { href: '/concept/chats', label: 'Чаты', icon: Icons.Chat, count: 3 },
] as const;

const secondary = [
  { href: '/concept/services', label: 'Услуги', icon: Icons.Grid },
  { href: '/concept/staff', label: 'Сотрудники', icon: Icons.Staff },
  { href: '/concept/analytics', label: 'Аналитика', icon: Icons.Chart },
  { href: '/concept/settings', label: 'Настройки', icon: Icons.Cog },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="side">
      <Link href="/concept" className="logo">
        <div className="mark" />
        <div>
          <b>ClickBook</b>
          <span>Beauty Studio</span>
        </div>
      </Link>
      <nav className="nav">
        {primary.map(({ href, label, icon: Icon, count, exact }) => (
          <Link key={href} href={href} className={isActive(href, exact) ? 'active' : ''}>
            <Icon />
            {label}
            {count !== undefined && <span className="count">{count}</span>}
          </Link>
        ))}
        <div className="group">Управление</div>
        {secondary.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
      <div className="foot">
        <div className="av">АК</div>
        <div>
          <b>Анна Кузнецова</b>
          <span>Pro · до 12 авг</span>
        </div>
      </div>
    </aside>
  );
}
