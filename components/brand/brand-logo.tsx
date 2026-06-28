import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  tone?: 'auto' | 'light' | 'dark';
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  alt?: string;
}

export function BrandLogo({
  tone = 'auto',
  className,
  imageClassName,
  priority = false,
  alt = 'КликБук',
}: BrandLogoProps) {
  const lightLogo = (
    <Image
      src="/brand/clickbook-logo-light-transparent.png"
      alt={alt}
      width={936}
      height={272}
      priority={priority}
      className={cn('block h-full w-auto max-w-full select-none object-contain', imageClassName)}
    />
  );

  const darkLogo = (
    <Image
      src="/brand/clickbook-logo-dark-transparent.png"
      alt={alt}
      width={936}
      height={272}
      priority={priority}
      className={cn('block h-full w-auto max-w-full select-none object-contain', imageClassName)}
    />
  );

  if (tone === 'light') {
    return <div className={cn('flex h-7 shrink-0 items-center', className)}>{lightLogo}</div>;
  }

  if (tone === 'dark') {
    return <div className={cn('flex h-7 shrink-0 items-center', className)}>{darkLogo}</div>;
  }

  return (
    <div className={cn('flex h-7 shrink-0 items-center', className)}>
      <div className="flex h-full items-center dark:hidden">{lightLogo}</div>
      <div className="hidden h-full items-center dark:flex">{darkLogo}</div>
    </div>
  );
}
