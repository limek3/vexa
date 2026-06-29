'use client';

import { useLocale } from '@/lib/locale-context';

export interface Category {
  id: string;
  name: string;
  nameRu?: string;
  icon: string;
}

interface CategoryChipProps {
  category: Category;
  onClick?: () => void;
  selected?: boolean;
}

export function CategoryChip({ category, onClick, selected }: CategoryChipProps) {
  const { locale } = useLocale();
  const name = locale === 'ru' ? category.nameRu || category.name : category.name;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-[96px] w-[92px] shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border p-3 transition-all ${
        selected
          ? 'border-primary/34 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_10%,white),color-mix(in_srgb,var(--primary)_12%,var(--card)))] shadow-[0_14px_28px_color-mix(in_srgb,var(--primary)_16%,transparent)] dark:bg-[linear-gradient(180deg,rgba(121,135,255,0.18),rgba(121,135,255,0.10))]'
          : 'border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_98%,white),color-mix(in_srgb,var(--card)_94%,var(--background)))] hover:border-primary/24 hover:bg-secondary/40 hover:shadow-[0_12px_24px_rgba(15,23,42,0.10)] dark:bg-[linear-gradient(180deg,rgba(18,24,36,0.96),rgba(11,17,28,0.98))]'
      }`}
    >
      <span className="absolute inset-x-3 top-2 h-4 rounded-full bg-[color-mix(in_srgb,var(--card)_78%,white)]/70 blur-md dark:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]" />
      <span
        className={`relative z-[1] flex h-11 w-11 items-center justify-center rounded-lg border border-white/40 text-2xl ${
          selected ? 'bg-primary/12 dark:bg-primary/16' : 'bg-secondary/55 dark:border-border/80 dark:bg-card/40'
        }`}
      >
        {category.icon}
      </span>
      <span
        className={`relative z-[1] text-center text-xs font-semibold leading-tight ${
          selected ? 'text-primary' : 'text-foreground'
        }`}
      >
        {name}
      </span>
    </button>
  );
}
