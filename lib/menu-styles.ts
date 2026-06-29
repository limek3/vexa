// lib/menu-styles.ts
import { cn } from '@/lib/utils';

const glassTriggerBase = [
  'border-black/[0.08] bg-[#fbfbfa]/[0.54] text-black shadow-[0_16px_48px_-38px_rgba(15,23,42,0.62)]',
  'backdrop-blur-2xl hover:border-black/[0.13] hover:bg-[#fbfbfa]/[0.66]',
  'data-[state=open]:border-black/[0.16] data-[state=open]:bg-[#fbfbfa]/[0.72]',
  'dark:border-white/[0.10] dark:bg-[#07080d]/[0.56] dark:text-white dark:shadow-[0_18px_54px_-34px_rgba(0,0,0,0.74)]',
  'dark:hover:border-white/[0.15] dark:hover:bg-[#07080d]/[0.66]',
  'dark:data-[state=open]:border-white/[0.18] dark:data-[state=open]:bg-[#07080d]/[0.72]',
];

const glassContentBase = [
  'border-black/[0.08] bg-[#fbfbfa]/[0.54] text-black shadow-[0_22px_80px_-54px_rgba(15,23,42,0.62)]',
  'backdrop-blur-2xl',
  'before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent',
  'dark:border-white/[0.10] dark:bg-[#07080d]/[0.56] dark:text-white dark:shadow-[0_24px_84px_-48px_rgba(0,0,0,0.80)] dark:before:via-white/16',
];

export function menuTriggerBaseClass() {
  return cn(
    'h-9 rounded-[14px] border px-3 text-[11px] font-semibold outline-none',
    'transition-[background,border-color,box-shadow,transform,opacity] duration-300 ease-out',
    'focus:ring-0 focus:ring-offset-0 active:scale-[0.985]',
    glassTriggerBase,
  );
}

export function menuContentBaseClass() {
  return cn(
    'cb-glass-dropdown-surface z-[160] overflow-hidden rounded-[22px] border p-1.5 outline-none',
    'origin-[var(--radix-dropdown-menu-content-transform-origin)] will-change-[transform,opacity,clip-path]',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[side=bottom]:slide-in-from-top-3 data-[side=top]:slide-in-from-bottom-3 data-[side=left]:slide-in-from-right-3 data-[side=right]:slide-in-from-left-3',
    glassContentBase,
  );
}

export function menuItemBaseClass() {
  return cn(
    'relative my-0.5 flex min-h-11 w-full cursor-pointer select-none items-center justify-between gap-3',
    'rounded-[15px] px-3 py-2 text-left text-[12px] font-semibold outline-none',
    'transition-[background,color,border-color,transform] duration-200 ease-out active:scale-[0.99]',
    'text-black/68 hover:bg-white/[0.48] hover:text-black focus:bg-white/[0.52] focus:text-black data-[highlighted]:bg-white/[0.52] data-[highlighted]:text-black',
    'dark:text-white/68 dark:hover:bg-white/[0.075] dark:hover:text-white dark:focus:bg-white/[0.085] dark:focus:text-white dark:data-[highlighted]:bg-white/[0.085] dark:data-[highlighted]:text-white',
  );
}

export function menuSeparatorBaseClass() {
  return 'my-1 h-px bg-black/[0.07] dark:bg-white/[0.08]';
}

export function menuTriggerClass(light: boolean) {
  return cn(
    menuTriggerBaseClass(),
    light
      ? [
          'border-black/[0.08]',
          'bg-[#fbfbfa]/[0.54] text-black',
          'hover:border-black/[0.13] hover:bg-[#fbfbfa]/[0.66]',
          'data-[state=open]:border-black/[0.16] data-[state=open]:bg-[#fbfbfa]/[0.72]',
        ]
      : [
          'border-white/[0.10]',
          'bg-[#07080d]/[0.56] text-white',
          'hover:border-white/[0.15] hover:bg-[#07080d]/[0.66]',
          'data-[state=open]:border-white/[0.18] data-[state=open]:bg-[#07080d]/[0.72]',
        ],
  );
}

export function menuContentClass(light: boolean) {
  return cn(
    menuContentBaseClass(),
    light
      ? [
          'border-black/[0.08]',
          'bg-[#fbfbfa]/[0.54] text-black',
          'shadow-[0_22px_80px_-54px_rgba(15,23,42,0.62)]',
        ]
      : [
          'border-white/[0.10]',
          'bg-[#07080d]/[0.56] text-white',
          'shadow-[0_24px_84px_-48px_rgba(0,0,0,0.80)]',
        ],
  );
}

export function menuItemClass(light: boolean, active = false, danger = false) {
  return cn(
    menuItemBaseClass(),
    danger
      ? active
        ? light
          ? 'bg-red-500/[0.07] text-red-700'
          : 'bg-red-300/[0.09] text-red-200'
        : light
          ? [
              'text-red-600',
              'hover:bg-red-500/[0.055] hover:text-red-700',
              'focus:bg-red-500/[0.055] focus:text-red-700',
              'data-[highlighted]:bg-red-500/[0.055] data-[highlighted]:text-red-700',
            ]
          : [
              'text-red-300',
              'hover:bg-red-300/[0.075] hover:text-red-200',
              'focus:bg-red-300/[0.075] focus:text-red-200',
              'data-[highlighted]:bg-red-300/[0.075] data-[highlighted]:text-red-200',
            ]
      : active
        ? light
          ? 'bg-white/[0.58] text-black'
          : 'bg-white/[0.095] text-white'
        : light
          ? [
              'text-black/68',
              'hover:bg-white/[0.48] hover:text-black',
              'focus:bg-white/[0.52] focus:text-black',
              'data-[highlighted]:bg-white/[0.52] data-[highlighted]:text-black',
            ]
          : [
              'text-white/68',
              'hover:bg-white/[0.075] hover:text-white',
              'focus:bg-white/[0.085] focus:text-white',
              'data-[highlighted]:bg-white/[0.085] data-[highlighted]:text-white',
            ],
  );
}

export function menuItemInnerClass() {
  return 'flex min-w-[220px] w-full items-center justify-between gap-3 py-0.5';
}

export function menuItemLeftClass() {
  return 'flex min-w-0 items-center gap-3';
}

export function menuItemLabelClass() {
  return 'truncate text-[12px] font-semibold';
}

export function menuItemCheckSlotClass() {
  return 'grid size-4 shrink-0 place-items-center';
}

export function menuItemIconClass(light: boolean, danger = false) {
  return cn(
    'grid size-4 shrink-0 place-items-center',
    danger
      ? light
        ? 'text-red-600'
        : 'text-red-300'
      : light
        ? 'text-black/46'
        : 'text-white/48',
  );
}

export function menuSeparatorClass(light: boolean) {
  return cn(
    menuSeparatorBaseClass(),
    light ? 'bg-black/[0.07]' : 'bg-white/[0.08]',
  );
}
