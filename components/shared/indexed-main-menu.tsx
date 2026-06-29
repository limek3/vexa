'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type IndexedMainMenuItem = {
  href: string;
  label: string;
};

export function IndexedMainMenu({
  items,
  pathname,
  compact = false,
}: {
  items: IndexedMainMenuItem[];
  pathname: string;
  compact?: boolean;
}) {
  return (
    <nav
      className={cn(
        'rounded-[22px] border border-black/[0.08] bg-[#ffffff]/82 p-2.5 shadow-none backdrop-blur-[22px]',
        'dark:border-white/[0.08] dark:bg-[#0d0d0d]/82',
        compact ? 'w-full' : 'w-[184px]',
      )}
    >
      <div className="flex flex-col gap-1">
        {items.map((item, index) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-[15px] px-2.5 py-2.5 transition-colors duration-150',
                active
                  ? 'bg-black/[0.045] text-black dark:bg-white/[0.065] dark:text-white'
                  : 'text-black/48 hover:bg-black/[0.035] hover:text-black/78 dark:text-white/48 dark:hover:bg-white/[0.045] dark:hover:text-white/82',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tracking-[-0.02em] transition-colors',
                  active
                    ? 'border-black/[0.12] bg-black/[0.035] text-black dark:border-white/[0.16] dark:bg-white/[0.05] dark:text-white'
                    : 'border-black/[0.08] text-black/38 group-hover:border-black/[0.13] group-hover:text-black/70 dark:border-white/[0.08] dark:text-white/38 dark:group-hover:border-white/[0.14] dark:group-hover:text-white/70',
                )}
              >
                {index + 1}
              </span>

              <span className="truncate text-[13px] font-semibold tracking-[-0.045em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}