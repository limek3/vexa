'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function NumberPopIn({
  value = '0',
  className,
}: {
  value?: string | number;
  className?: string;
}) {
  const text = String(value ?? '—');
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    setPlayKey((key) => key + 1);
  }, [text]);

  return (
    <span key={playKey} className={cn('t-digit-group is-animating', className)} aria-label={text}>
      {text.split('').map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="t-digit"
          style={{ ['--digit-index' as string]: Math.min(index, 10) } as CSSProperties}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}
