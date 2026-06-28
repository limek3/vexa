import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('min-h-screen bg-background text-foreground', className)}>{children}</div>;
}

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('mx-auto w-full max-w-[2080px] px-4 sm:px-6 xl:px-8 2xl:px-10', className)}>{children}</div>;
}

export function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn('py-8 sm:py-12', className)}>{children}</section>;
}
