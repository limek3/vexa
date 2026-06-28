'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

function createPattern(value: string) {
  const size = 21;
  const cells: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  let seed = 0;

  for (let index = 0; index < value.length; index += 1) {
    seed = (seed * 31 + value.charCodeAt(index)) % 2147483647;
  }

  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  const paintFinder = (row: number, col: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const isFrame = x === 0 || x === 6 || y === 0 || y === 6;
        const isCore = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[row + y][col + x] = isFrame || isCore;
      }
    }
  };

  paintFinder(0, 0);
  paintFinder(0, size - 7);
  paintFinder(size - 7, 0);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const reserved =
        (y < 7 && x < 7) ||
        (y < 7 && x >= size - 7) ||
        (y >= size - 7 && x < 7);

      if (reserved) continue;
      cells[y][x] = next() > 0.52;
    }
  }

  return cells;
}

export function FakeQrCode({ value, className }: { value: string; className?: string }) {
  const matrix = useMemo(() => createPattern(value), [value]);

  return (
    <div className={cn('grid gap-[2px] rounded-[18px] border border-border bg-card p-3 shadow-sm', className)}
      style={{ gridTemplateColumns: `repeat(${matrix[0]?.length ?? 21}, minmax(0, 1fr))` }}>
      {matrix.flatMap((row, rowIndex) =>
        row.map((active, colIndex) => (
          <span
            key={`${rowIndex}-${colIndex}`}
            className={cn(
              'block aspect-square rounded-[2px] transition-colors',
              active ? 'bg-foreground' : 'bg-accent/60',
            )}
          />
        )),
      )}
    </div>
  );
}
