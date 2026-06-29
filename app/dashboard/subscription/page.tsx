// app/dashboard/subscription/page.tsx
'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  Globe2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  SquarePen,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { Button } from '@/components/ui/button';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { getTelegramAppSessionHeaders } from '@/lib/telegram-miniapp-auth-client';
import { formatCurrency } from '@/lib/master-workspace';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type BillingCycle = 'monthly' | 'yearly';
type AppLocale = 'ru' | 'en';

type PlanLike = {
  id: string;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  features: string[];
  popular?: boolean;
};

type PlanVisual = {
  key: 'start' | 'pro' | 'studio' | 'premium';
  material: string;
  accent: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  chipBg: string;
  chipText: string;
  statusBg: string;
  statusText: string;
  cardBg: string;
  shine: string;
  grain: string;
};

function pageBg(light: boolean) {
  return light ? 'bg-[#f7f6f2]' : 'bg-[#080808]';
}

function pageText(light: boolean) {
  return light ? 'text-[#111111]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#6b7280]' : 'text-[#9ca3af]';
}

function faintText(light: boolean) {
  return light ? 'text-black/32' : 'text-white/26';
}

function borderTone(light: boolean) {
  return light ? 'border-[#e6e2da]' : 'border-white/[0.08]';
}

function divideTone(light: boolean) {
  return light ? 'divide-[#e6e2da]' : 'divide-white/[0.08]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-[#e6e2da] bg-white shadow-[0_12px_30px_rgba(17,17,17,0.035),0_1px_2px_rgba(17,17,17,0.035)]'
    : 'border-white/[0.08] bg-[#141414] shadow-none';
}

function insetTone(light: boolean) {
  return light
    ? 'border-black/[0.075] bg-black/[0.018] shadow-[0_8px_22px_rgba(17,17,17,0.025),inset_0_1px_0_rgba(255,255,255,0.74)]'
    : 'border-white/[0.07] bg-white/[0.026] shadow-[inset_0_1px_0_rgba(255,255,255,0.024)]';
}

function buttonBase(light: boolean, active = false) {
  return cn(
    'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.985]',
    active
      ? light
        ? 'cb-neutral-primary cb-neutral-primary-light hover:opacity-[0.98]'
        : 'cb-neutral-primary cb-neutral-primary-dark hover:opacity-[0.98]'
      : light
        ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
        : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  );
}

function accentPillStyle(
  color: string,
  light: boolean,
  strength: 'soft' | 'strong' = 'soft',
): CSSProperties {
  const bgAmount = strength === 'strong' ? (light ? 18 : 30) : light ? 9 : 18;
  const borderAmount = strength === 'strong' ? (light ? 34 : 44) : light ? 20 : 30;

  return {
    background: light
      ? `color-mix(in srgb, ${color} ${bgAmount}%, #ffffff)`
      : `color-mix(in srgb, ${color} ${bgAmount}%, #101010)`,
    borderColor: light
      ? `color-mix(in srgb, ${color} ${borderAmount}%, rgba(0,0,0,0.08))`
      : `color-mix(in srgb, ${color} ${borderAmount}%, rgba(255,255,255,0.08))`,
    color: light
      ? `color-mix(in srgb, ${color} 72%, #101010)`
      : `color-mix(in srgb, ${color} 24%, #ffffff)`,
  };
}

function getPlanVisual(planName: string, locale: AppLocale): PlanVisual {
  const name = planName.toLowerCase();

  if (name.includes('premium')) {
    return {
      key: 'premium',
      material: locale === 'ru' ? 'белое золото' : 'white gold',
      accent: '#c8b874',
      text: '#111111',
      muted: 'rgba(0,0,0,0.58)',
      faint: 'rgba(0,0,0,0.34)',
      border: 'rgba(116,96,42,0.20)',
      chipBg: 'linear-gradient(135deg, #d7cca0 0%, #ffffff 48%, #a99758 100%)',
      chipText: '#111111',
      statusBg: 'rgba(255,255,255,0.64)',
      statusText: 'rgba(0,0,0,0.58)',
      cardBg: `
        radial-gradient(circle at 86% 8%, rgba(255,255,255,0.82), transparent 30%),
        radial-gradient(circle at 12% 88%, rgba(199,184,116,0.20), transparent 34%),
        linear-gradient(118deg, rgba(255,255,255,0.18), transparent 26%, rgba(199,184,116,0.16) 52%, transparent 78%),
        linear-gradient(135deg, #fbf8ec 0%, #ded3af 45%, #fffdf6 100%)
      `,
      shine:
        'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.10) 36%, rgba(255,255,255,0.96) 47%, rgba(216,202,154,0.42) 52%, rgba(255,255,255,0.78) 58%, rgba(255,255,255,0.10) 66%, transparent 78%, transparent 100%)',
      grain: 'rgba(91,75,32,0.035)',
    };
  }

  if (name.includes('studio')) {
    return {
      key: 'studio',
      material: locale === 'ru' ? 'золото' : 'gold',
      accent: '#d59a25',
      text: '#171105',
      muted: 'rgba(35,25,5,0.58)',
      faint: 'rgba(35,25,5,0.36)',
      border: 'rgba(116,76,12,0.22)',
      chipBg: 'linear-gradient(135deg, #9a671a 0%, #ffe08b 48%, #b67a1f 100%)',
      chipText: '#171105',
      statusBg: 'rgba(255,255,255,0.54)',
      statusText: 'rgba(35,25,5,0.58)',
      cardBg: `
        radial-gradient(circle at 88% 6%, rgba(255,255,255,0.64), transparent 30%),
        radial-gradient(circle at 12% 88%, rgba(213,154,37,0.18), transparent 34%),
        linear-gradient(116deg, rgba(255,255,255,0.12), transparent 28%, rgba(158,104,20,0.12) 54%, transparent 78%),
        linear-gradient(135deg, #fff1c4 0%, #d7ad56 48%, #fff7df 100%)
      `,
      shine:
        'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.10) 36%, rgba(255,255,255,0.78) 47%, rgba(255,205,86,0.50) 53%, rgba(255,248,210,0.68) 59%, rgba(255,255,255,0.08) 66%, transparent 78%, transparent 100%)',
      grain: 'rgba(91,58,10,0.035)',
    };
  }

  if (name.includes('pro')) {
    return {
      key: 'pro',
      material: locale === 'ru' ? 'серебро' : 'silver',
      accent: '#9aa4ad',
      text: '#101214',
      muted: 'rgba(16,18,20,0.56)',
      faint: 'rgba(16,18,20,0.34)',
      border: 'rgba(42,48,54,0.16)',
      chipBg: 'linear-gradient(135deg, #aab4bd 0%, #ffffff 48%, #808a94 100%)',
      chipText: '#101214',
      statusBg: 'rgba(255,255,255,0.60)',
      statusText: 'rgba(16,18,20,0.56)',
      cardBg: `
        radial-gradient(circle at 88% 6%, rgba(255,255,255,0.76), transparent 30%),
        radial-gradient(circle at 9% 88%, rgba(154,164,173,0.18), transparent 36%),
        linear-gradient(116deg, rgba(255,255,255,0.22), rgba(135,150,164,0.10) 30%, rgba(255,255,255,0.38) 52%, rgba(130,146,158,0.13) 72%, rgba(255,255,255,0.16)),
        linear-gradient(135deg, #f8f9fa 0%, #d5dde4 46%, #ffffff 100%)
      `,
      shine:
        'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.14) 36%, rgba(255,255,255,1) 47%, rgba(205,218,228,0.42) 53%, rgba(255,255,255,0.82) 59%, rgba(255,255,255,0.10) 66%, transparent 78%, transparent 100%)',
      grain: 'rgba(70,82,94,0.035)',
    };
  }

  return {
    key: 'start',
    material: locale === 'ru' ? 'матовый' : 'matte',
    accent: '#77776f',
    text: '#101010',
    muted: 'rgba(0,0,0,0.54)',
    faint: 'rgba(0,0,0,0.34)',
    border: 'rgba(0,0,0,0.12)',
    chipBg: 'linear-gradient(135deg, #2e2e2e 0%, #686868 100%)',
    chipText: '#ffffff',
    statusBg: 'rgba(255,255,255,0.60)',
    statusText: 'rgba(0,0,0,0.56)',
    cardBg: `
      radial-gradient(circle at 88% 6%, rgba(255,255,255,0.62), transparent 32%),
      radial-gradient(circle at 10% 88%, rgba(0,0,0,0.055), transparent 36%),
      linear-gradient(116deg, rgba(255,255,255,0.20), transparent 32%, rgba(0,0,0,0.025) 72%, rgba(255,255,255,0.16)),
      linear-gradient(135deg, #f4f1e9 0%, #e5dfd3 50%, #fbfaf7 100%)
    `,
    shine:
      'linear-gradient(105deg, transparent 0%, transparent 32%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.62) 49%, rgba(255,255,255,0.16) 58%, transparent 76%, transparent 100%)',
    grain: 'rgba(0,0,0,0.03)',
  };
}

function Card({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[11px] border', cardTone(light), className)}>
      {children}
    </section>
  );
}

function Panel({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[10px] border', insetTone(light), className)}>
      {children}
    </div>
  );
}

function CardTitle({
  title,
  description,
  light,
  right,
}: {
  title: string;
  description?: string;
  light: boolean;
  right?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[58px] items-center justify-between gap-4 border-b px-4 py-3',
        borderTone(light),
      )}
    >
      <div className="min-w-0">
        <h2
          className={cn(
            'truncate text-[13px] font-semibold tracking-[-0.018em]',
            pageText(light),
          )}
        >
          {title}
        </h2>

        {description ? (
          <p className={cn('mt-1 truncate text-[11px]', mutedText(light))}>
            {description}
          </p>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function MicroLabel({
  children,
  light,
  active,
  accentColor,
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  accentColor?: string;
  className?: string;
}) {
  return (
    <span
      style={active && accentColor ? accentPillStyle(accentColor, light) : undefined}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-medium',
        active && !accentColor
          ? light
            ? 'border-black/[0.1] bg-black/[0.045] text-black/62'
            : 'border-white/[0.11] bg-white/[0.075] text-white/68'
          : !active
            ? light
              ? 'border-black/[0.08] bg-white text-black/50'
              : 'border-white/[0.08] bg-white/[0.04] text-white/42'
            : '',
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatusDot({
  light,
  active,
  accentColor,
}: {
  light: boolean;
  active?: boolean;
  accentColor?: string;
}) {
  return (
    <span
      style={active && accentColor ? { background: accentColor } : undefined}
      className={cn(
        'size-1.5 shrink-0 rounded-full',
        !(active && accentColor) &&
          (active ? 'bg-current' : light ? 'bg-black/24' : 'bg-white/22'),
      )}
    />
  );
}

function BillingCycleSwitch({
  billing,
  setBilling,
  light,
  accentColor,
  monthlyLabel,
  yearlyLabel,
  monthlyHint,
  yearlyHint,
  yearlyDiscount,
}: {
  billing: BillingCycle;
  setBilling: (value: BillingCycle) => void;
  light: boolean;
  accentColor: string;
  monthlyLabel: string;
  yearlyLabel: string;
  monthlyHint: string;
  yearlyHint: string;
  yearlyDiscount: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 overflow-hidden rounded-[12px] border',
        light
          ? 'border-black/[0.08] bg-white'
          : 'border-white/[0.08] bg-white/[0.04]',
      )}
    >
      {[
        {
          value: 'monthly' as const,
          label: monthlyLabel,
          hint: monthlyHint,
          badge: null,
        },
        {
          value: 'yearly' as const,
          label: yearlyLabel,
          hint: yearlyHint,
          badge: yearlyDiscount,
        },
      ].map((option) => {
        const active = billing === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setBilling(option.value)}
            className={cn(
              'relative flex min-h-[58px] flex-col items-center justify-center border-r px-3 text-center transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
              light ? 'border-black/[0.07]' : 'border-white/[0.07]',
              active
                ? light
                  ? 'bg-black/[0.035] text-black'
                  : 'bg-white/[0.055] text-white'
                : light
                  ? 'text-black/42 hover:bg-black/[0.02] hover:text-black/70'
                  : 'text-white/36 hover:bg-white/[0.035] hover:text-white/70',
            )}
          >
            <span className="inline-flex items-center justify-center gap-2 text-[12px] font-semibold tracking-[-0.018em]">
              {option.label}

              {active ? (
                <span
                  style={{ background: accentColor }}
                  className="size-1.5 rounded-full"
                />
              ) : null}

              {option.badge ? (
                <span
                  style={accentPillStyle(accentColor, light)}
                  className="inline-flex h-5 items-center rounded-full border px-2 text-[9px] font-bold leading-none"
                >
                  {option.badge}
                </span>
              ) : null}
            </span>

            <span
              className={cn(
                'mt-1 block truncate text-[10px]',
                active
                  ? light
                    ? 'text-black/42'
                    : 'text-white/42'
                  : light
                    ? 'text-black/30'
                    : 'text-white/25',
              )}
            >
              {option.hint}
            </span>

            {active ? (
              <span
                style={{ background: accentColor }}
                className="absolute bottom-1 left-1/2 h-0.5 w-14 -translate-x-1/2 rounded-full"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ContactlessIcon({ color }: { color: string }) {
  return (
    <div className="relative h-5 w-5 shrink-0 opacity-65">
      <span
        className="absolute right-[8px] top-[6px] h-2.5 w-2.5 rounded-r-full border-r border-t border-b"
        style={{ borderColor: color }}
      />
      <span
        className="absolute right-[4px] top-[4px] h-3.5 w-3.5 rounded-r-full border-r border-t border-b"
        style={{ borderColor: color }}
      />
      <span
        className="absolute right-0 top-[2px] h-[18px] w-[18px] rounded-r-full border-r border-t border-b"
        style={{ borderColor: color }}
      />
    </div>
  );
}

function LuxuryPlanCard({
  plan,
  visual,
  priceLabel,
  periodLabel,
  activeLabel,
  cardTitle,
  light,
}: {
  plan: PlanLike;
  visual: PlanVisual;
  priceLabel: string;
  periodLabel: string;
  activeLabel: string;
  cardTitle: string;
  light: boolean;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, mx: 50, my: 50 });

  function handleMove(event: ReactMouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    setTilt({
      x: (px - 0.5) * 3.2,
      y: (0.5 - py) * 2.8,
      mx: px * 100,
      my: py * 100,
    });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0, mx: 50, my: 50 });
  }

  const planLetter = plan.name.trim().charAt(0).toUpperCase() || 'C';

  const shimmerColor =
    visual.key === 'premium'
      ? 'rgba(255, 239, 176, 0.72)'
      : visual.key === 'studio'
        ? 'rgba(255, 218, 136, 0.68)'
        : visual.key === 'pro'
          ? 'rgba(255, 255, 255, 0.82)'
          : 'rgba(255, 255, 255, 0.54)';

  const shimmerSoft =
    visual.key === 'premium'
      ? 'rgba(205, 180, 98, 0.22)'
      : visual.key === 'studio'
        ? 'rgba(214, 151, 38, 0.22)'
        : visual.key === 'pro'
          ? 'rgba(150, 170, 188, 0.24)'
          : 'rgba(255, 255, 255, 0.18)';

  return (
    <div className="relative" style={{ perspective: '1400px' }}>
      <style>{`
        @keyframes cb-card-full-shimmer {
          0% {
            background-position: -180% 50%;
            opacity: 0.12;
          }
          12% {
            opacity: 0.2;
          }
          42% {
            opacity: 0.62;
          }
          58% {
            opacity: 0.48;
          }
          82% {
            opacity: 0.18;
          }
          100% {
            background-position: 180% 50%;
            opacity: 0.12;
          }
        }

        @keyframes cb-card-metal-depth {
          0% {
            background-position: 0% 50%;
            opacity: 0.2;
          }
          50% {
            background-position: 100% 50%;
            opacity: 0.38;
          }
          100% {
            background-position: 0% 50%;
            opacity: 0.2;
          }
        }

        @keyframes cb-card-premium-glow {
          0%, 100% {
            opacity: 0.18;
          }
          50% {
            opacity: 0.34;
          }
        }
      `}</style>

      <div
        onMouseMove={handleMove}
        onMouseLeave={resetTilt}
        className="relative transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={cn(
            'relative overflow-hidden rounded-[22px] border px-6 py-6 md:px-7 md:py-7',
            light
              ? 'shadow-[0_28px_70px_rgba(30,24,16,0.12)]'
              : 'shadow-[0_28px_90px_rgba(0,0,0,0.42)]',
          )}
          style={{
            minHeight: 318,
            color: visual.text,
            borderColor: visual.border,
            backgroundImage: visual.cardBg,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(
                  90deg,
                  rgba(255,255,255,0.00) 0%,
                  ${shimmerSoft} 16%,
                  rgba(255,255,255,0.16) 31%,
                  rgba(255,255,255,0.00) 48%,
                  ${shimmerSoft} 66%,
                  rgba(255,255,255,0.12) 84%,
                  rgba(255,255,255,0.00) 100%
                )
              `,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '240% 100%',
              backgroundPosition: '0% 50%',
              animation: 'cb-card-metal-depth 9s ease-in-out infinite',
              mixBlendMode: 'soft-light',
            }}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(
                  105deg,
                  rgba(255,255,255,0.00) 0%,
                  rgba(255,255,255,0.00) 24%,
                  ${shimmerSoft} 36%,
                  ${shimmerColor} 48%,
                  rgba(255,255,255,0.94) 51%,
                  ${shimmerColor} 54%,
                  ${shimmerSoft} 66%,
                  rgba(255,255,255,0.00) 78%,
                  rgba(255,255,255,0.00) 100%
                )
              `,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '260% 100%',
              backgroundPosition: '-180% 50%',
              animation: 'cb-card-full-shimmer 5.8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
              mixBlendMode: 'screen',
            }}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(
                  circle at ${tilt.mx}% ${tilt.my}%,
                  rgba(255,255,255,0.38),
                  rgba(255,255,255,0.12) 18%,
                  transparent 34%
                )
              `,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              opacity: light ? 0.28 : 0.18,
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage: `
                linear-gradient(90deg, ${visual.grain} 1px, transparent 1px),
                linear-gradient(180deg, rgba(255,255,255,0.12) 1px, transparent 1px)
              `,
              backgroundRepeat: 'repeat',
              backgroundSize: '18px 18px',
              backgroundPosition: '0 0',
            }}
          />

          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              backgroundImage:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.92), transparent)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
            }}
          />

          <div
            className="relative z-10 flex min-h-[264px] flex-col justify-between"
            style={{ transform: 'translateZ(24px)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div
                  className="text-[11px] font-semibold uppercase tracking-[0.055em]"
                  style={{ color: visual.muted }}
                >
                  {cardTitle}
                </div>

                <div
                  className="mt-6 text-[26px] font-semibold leading-none tracking-[-0.025em] md:text-[32px]"
                  style={{ color: visual.text }}
                >
                  {priceLabel}
                </div>

                <div className="mt-2 text-[11px] font-medium" style={{ color: visual.muted }}>
                  {periodLabel}
                </div>
              </div>

              <ContactlessIcon color={visual.faint} />
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="grid size-11 shrink-0 place-items-center rounded-[12px] text-[17px] font-semibold"
                  style={{
                    backgroundImage: visual.chipBg,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: visual.chipText,
                    boxShadow: '0 14px 30px rgba(0,0,0,0.14)',
                  }}
                >
                  {planLetter}
                </div>

                <div className="min-w-0">
                  <div
                    className="truncate text-[15px] font-semibold tracking-[-0.04em]"
                    style={{ color: visual.text }}
                  >
                    {plan.name}
                  </div>

                  <div
                    className="mt-1 truncate text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: visual.faint }}
                  >
                    {visual.material}
                  </div>
                </div>
              </div>

              <div
                className="inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[10px] font-semibold"
                style={{
                  borderColor: visual.border,
                  backgroundColor: visual.statusBg,
                  color: visual.statusText,
                }}
              >
                {activeLabel}
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{
              animation: 'cb-card-premium-glow 6s ease-in-out infinite',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.86), inset 0 -1px 0 rgba(0,0,0,0.06), inset 0 0 42px rgba(255,255,255,0.10)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PlanRailItem({
  plan,
  active,
  current,
  popular,
  visual,
  priceLabel,
  periodLabel,
  currentLabel,
  popularLabel,
  light,
  onClick,
}: {
  plan: PlanLike;
  active: boolean;
  current: boolean;
  popular: boolean;
  visual: PlanVisual;
  priceLabel: string;
  periodLabel: string;
  currentLabel: string;
  popularLabel: string;
  light: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-[10px] border p-3 text-left transition-colors duration-150 active:scale-[0.992]',
        active
          ? light
            ? 'border-black/[0.13] bg-black/[0.035]'
            : 'border-white/[0.15] bg-white/[0.055]'
          : light
            ? 'border-black/[0.08] bg-transparent hover:bg-black/[0.025]'
            : 'border-white/[0.08] bg-transparent hover:bg-white/[0.035]',
      )}
    >
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: active ? visual.accent : 'transparent' }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                'truncate text-[14px] font-semibold tracking-[-0.045em]',
                pageText(light),
              )}
            >
              {plan.name}
            </div>

            {current ? (
              <MicroLabel light={light} active accentColor={visual.accent} className="h-6">
                {currentLabel}
              </MicroLabel>
            ) : null}

            {popular ? (
              <MicroLabel light={light} active accentColor={visual.accent} className="h-6">
                {popularLabel}
              </MicroLabel>
            ) : null}
          </div>

          <p className={cn('mt-2 line-clamp-2 text-[11px] leading-5', mutedText(light))}>
            {plan.description}
          </p>
        </div>

        {active ? (
          <CheckCircle2 className={cn('mt-0.5 size-4 shrink-0', pageText(light))} />
        ) : null}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div
          className={cn(
            'text-[18px] font-semibold tracking-[-0.055em]',
            pageText(light),
          )}
        >
          {priceLabel}
        </div>

        <div className={cn('text-[10px]', faintText(light))}>{periodLabel}</div>
      </div>
    </button>
  );
}

function ReceiptRow({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b py-3 last:border-b-0',
        borderTone(light),
      )}
    >
      <div className={cn('text-[12px]', mutedText(light))}>{label}</div>

      <div
        className={cn(
          'min-w-[86px] rounded-[8px] px-2 py-1 text-center text-[12px] font-semibold',
          light ? 'bg-black/[0.025] text-[#111111]' : 'bg-white/[0.035] text-white',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function AccessRow({
  icon: Icon,
  label,
  value,
  light,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  light: boolean;
}) {
  return (
    <Panel light={light} className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className={cn('size-4 shrink-0', mutedText(light))} />
        <span className={cn('truncate text-[12px]', pageText(light))}>{label}</span>
      </div>

      <span className={cn('shrink-0 text-[11px]', mutedText(light))}>{value}</span>
    </Panel>
  );
}

function FeatureRow({
  children,
  light,
}: {
  children: ReactNode;
  light: boolean;
}) {
  return (
    <Panel light={light} className="flex items-start gap-3 p-3">
      <div
        className={cn(
          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[8px] border',
          light
            ? 'border-black/[0.08] bg-[#ffffff]'
            : 'border-white/[0.08] bg-[#141414]',
        )}
      >
        <Check className={cn('size-3.5', pageText(light))} />
      </div>

      <div className={cn('text-[13px] leading-6', pageText(light))}>{children}</div>
    </Panel>
  );
}

function LimitRow({
  label,
  used,
  total,
  accentColor,
  light,
}: {
  label: string;
  used: number;
  total: number;
  accentColor: string;
  light: boolean;
}) {
  const progress = Math.min(100, Math.round((used / Math.max(1, total)) * 100));

  return (
    <Panel
      light={light}
      className="grid gap-3 px-4 py-3 md:grid-cols-[180px_minmax(0,1fr)_72px] md:items-center"
    >
      <div className={cn('text-[13px] font-medium', pageText(light))}>{label}</div>

      <div
        className={cn(
          'h-1.5 overflow-hidden rounded-full',
          light ? 'bg-black/[0.07]' : 'bg-white/[0.08]',
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: accentColor,
          }}
        />
      </div>

      <div className={cn('text-left text-[12px] md:text-right', mutedText(light))}>
        {used}/{total}
      </div>
    </Panel>
  );
}

function SmallInfoTile({
  label,
  value,
  icon: Icon,
  light,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  light: boolean;
}) {
  return (
    <Panel light={light} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn('text-[11px] font-medium', mutedText(light))}>{label}</div>

          <div
            className={cn(
              'mt-2 truncate text-[18px] font-semibold tracking-[-0.055em]',
              pageText(light),
            )}
          >
            {value}
          </div>
        </div>

        <Icon className={cn('size-4 shrink-0', mutedText(light))} />
      </div>
    </Panel>
  );
}

function PaymentManageDialog({
  open,
  onClose,
  light,
  locale,
  accentColor,
  planName,
  priceLabel,
  billingPeriodLabel,
  nextChargeValue,
  cardLabel,
  isSelectedCurrent,
  onConfirm,
  isBusy,
  errorMessage,
}: {
  open: boolean;
  onClose: () => void;
  light: boolean;
  locale: AppLocale;
  accentColor: string;
  planName: string;
  priceLabel: string;
  billingPeriodLabel: string;
  nextChargeValue: string;
  cardLabel: string;
  isSelectedCurrent: boolean;
  onConfirm: () => void;
  isBusy: boolean;
  errorMessage?: string | null;
}) {
  if (!open) return null;

  const copy =
    locale === 'ru'
      ? {
          title: 'Управление оплатой',
          description:
            'Проверьте тариф, способ оплаты и следующее списание перед изменением подписки.',
          selectedPlan: 'Выбранный тариф',
          price: 'Стоимость',
          period: 'Период оплаты',
          nextCharge: 'Следующее списание',
          paymentMethod: 'Способ оплаты',
          secure: 'Платежи защищены',
          secureText: 'Данные карты не хранятся в КликБук.',
          changeCard: 'Изменить карту',
          invoices: 'История платежей',
          downloadInvoice: 'Скачать счёт',
          portal: isSelectedCurrent ? 'Открыть платёжный портал' : 'Подключить тариф',
          close: 'Закрыть',
        }
      : {
          title: 'Manage payment',
          description:
            'Review your plan, payment method, and next charge before changing subscription.',
          selectedPlan: 'Selected plan',
          price: 'Price',
          period: 'Billing period',
          nextCharge: 'Next charge',
          paymentMethod: 'Payment method',
          secure: 'Secure payments',
          secureText: 'Card details are not stored in ClickBook.',
          changeCard: 'Change card',
          invoices: 'Payment history',
          downloadInvoice: 'Download invoice',
          portal: isSelectedCurrent ? 'Open billing portal' : 'Activate plan',
          close: 'Close',
        };

  function ModalRow({
    label,
    value,
  }: {
    label: string;
    value: string;
  }) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 border-b py-3 last:border-b-0',
          borderTone(light),
        )}
      >
        <div className={cn('text-[12px]', mutedText(light))}>{label}</div>

        <div
          className={cn(
            'max-w-[190px] truncate rounded-[8px] px-2.5 py-1 text-right text-[12px] font-semibold',
            light ? 'bg-black/[0.025] text-[#111111]' : 'bg-white/[0.04] text-white',
          )}
        >
          {value}
        </div>
      </div>
    );
  }

  function ModalActionButton({
    icon: Icon,
    label,
  }: {
    icon: LucideIcon;
    label: string;
  }) {
    return (
      <button
        type="button"
        className={cn(
          'flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border px-3 text-left text-[12px] font-medium transition-colors active:scale-[0.992]',
          light
            ? 'border-black/[0.08] bg-white text-black/62 hover:bg-black/[0.025] hover:text-black'
            : 'border-white/[0.08] bg-white/[0.035] text-white/58 hover:bg-white/[0.06] hover:text-white',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon className={cn('size-4 shrink-0', mutedText(light))} />
          <span className="truncate">{label}</span>
        </span>

        <ArrowRight className={cn('size-3.5 shrink-0', mutedText(light))} />
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[10px]" />

      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'relative w-full max-w-[620px] overflow-hidden rounded-[18px] border',
          light
            ? 'border-black/[0.09] bg-[var(--cb-surface)] text-[#111111] shadow-[0_34px_90px_rgba(0,0,0,0.18)]'
            : 'border-white/[0.10] bg-[#141414] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]',
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: light
              ? 'linear-gradient(90deg, transparent, rgba(0,0,0,0.16), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
          }}
        />

        <div className={cn('flex items-start justify-between gap-4 border-b p-5', borderTone(light))}>
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold leading-none tracking-[-0.02em]">
              {copy.title}
            </h2>

            <p className={cn('mt-2 max-w-[460px] text-[12.5px] leading-5', mutedText(light))}>
              {copy.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-[10px] border transition-colors',
              light
                ? 'border-black/[0.08] bg-white text-black/42 hover:bg-black/[0.035] hover:text-black'
                : 'border-white/[0.08] bg-white/[0.04] text-white/42 hover:bg-white/[0.07] hover:text-white',
            )}
            aria-label={copy.close}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-4">
            <Panel light={light} className="overflow-hidden">
              <div className={cn('border-b px-4 py-3', borderTone(light))}>
                <div className={cn('text-[11px] font-medium', mutedText(light))}>
                  {copy.paymentMethod}
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-[10px] border',
                        light
                          ? 'border-black/[0.08] bg-white'
                          : 'border-white/[0.08] bg-white/[0.045]',
                      )}
                    >
                      <CreditCard className={cn('size-4', mutedText(light))} />
                    </div>

                    <div className="min-w-0">
                      <div className={cn('truncate text-[15px] font-semibold', pageText(light))}>
                        {cardLabel}
                      </div>

                      <div className={cn('mt-0.5 text-[10px]', mutedText(light))}>
                        3DS / SSL
                      </div>
                    </div>
                  </div>

                  <div
                    className="size-2 rounded-full"
                    style={{ background: accentColor }}
                  />
                </div>
              </div>

              <div className="px-4">
                <ModalRow label={copy.selectedPlan} value={planName} />
                <ModalRow label={copy.price} value={priceLabel} />
                <ModalRow label={copy.period} value={billingPeriodLabel} />
                <ModalRow label={copy.nextCharge} value={nextChargeValue} />
              </div>
            </Panel>

            <Panel light={light} className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-[10px] border',
                    light
                      ? 'border-black/[0.08] bg-white'
                      : 'border-white/[0.08] bg-white/[0.045]',
                  )}
                >
                  <ShieldCheck className={cn('size-4', mutedText(light))} />
                </div>

                <div className="min-w-0">
                  <div className={cn('text-[13px] font-semibold', pageText(light))}>
                    {copy.secure}
                  </div>
                  <p className={cn('mt-1 text-[11.5px] leading-5', mutedText(light))}>
                    {copy.secureText}
                  </p>
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-2">
            <ModalActionButton icon={CreditCard} label={copy.changeCard} />
            <ModalActionButton icon={ReceiptText} label={copy.invoices} />
            <ModalActionButton icon={Banknote} label={copy.downloadInvoice} />

            {errorMessage ? (
              <div
                className={cn(
                  'rounded-[10px] border px-3 py-2 text-[11px] leading-4',
                  light
                    ? 'border-red-500/20 bg-red-500/[0.06] text-red-700'
                    : 'border-red-400/20 bg-red-400/[0.08] text-red-200',
                )}
              >
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onConfirm}
              disabled={isBusy}
              className={cn('mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60', buttonBase(light, true))}
            >
              {isBusy ? (locale === 'ru' ? 'Применяем...' : 'Applying...') : copy.portal}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { hasHydrated, ownedProfile, dataset, locale, refreshWorkspace } = useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();

  const appLocale: AppLocale = locale === 'ru' ? 'ru' : 'en';

  const [mounted, setMounted] = useState(false);
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState('start');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!dataset?.subscription) return;
    setSelectedPlanId(dataset.subscription.planId);
    setBilling(dataset.subscription.billingCycle);
  }, [dataset?.subscription?.billingCycle, dataset?.subscription?.planId]);

  const currentTheme: ThemeMode = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const isLight = currentTheme === 'light';
  const fallbackAccent = accentPalette[settings.accentTone].solid;

  const copy =
    appLocale === 'ru'
      ? {
          title: 'Подписка',
          description:
            'Тариф, оплата, лимиты и доступы в одном компактном финансовом экране.',
          createTitle: 'Сначала настройте профиль мастера',
          createDescription:
            'После создания профиля здесь появятся тарифы, оплата, лимиты и управление подпиской.',
          createProfile: 'Создать профиль',

          active: 'Активна',
          current: 'Текущий',
          popular: 'Популярный',
          monthly: 'Месяц',
          yearly: 'Год',
          monthlyHint: 'по месяцам',
          yearlyHint: 'один платёж',
          yearlyDiscount: '-15%',
          perMonth: 'в месяц',
          perYear: 'в год',
          free: 'Бесплатно',

          cardTitle: 'Подписка КликБук',
          currentPlan: 'Текущий тариф',
          selectedPlan: 'Выбранный тариф',
          planPrice: 'Стоимость тарифа',
          billingPeriod: 'Период оплаты',
          discount: 'Экономия',
          zeroSaving: 'Нет экономии',
          nextCharge: 'Следующее списание',
          nextChargeValue: 'Бесплатный тариф',
          paymentMethod: 'Способ оплаты',
          card: 'Не привязана',
          managePayment: 'Управлять оплатой',
          choosePlan: 'Выбрать тариф',

          included: 'В тарифе',
          includedDescription: 'Ключевые возможности выбранного тарифа.',
          limits: 'Лимиты тарифа',
          limitsDescription: 'Использование по активному рабочему пространству.',
          noLimits: 'Лимиты не настроены',

          receipt: 'Сводка',
          receiptDescription: 'Что будет применено к текущему рабочему пространству.',
          access: 'Доступ',
          workspace: 'Рабочее пространство',
          publicPage: 'Публичная страница',
          bookingEngine: 'Онлайн-запись',
          protected: 'Защищено',

          autoRenew: 'Автопродление включено',
          securePayments: 'Платежи защищены',
          liveProfile: 'Профиль доступен клиентам',
          featuresCount: 'возможностей',
          quickStatus: 'Статус доступа',

          setupCards: {
            billing: 'Оплата',
            billingText: 'После создания профиля здесь появятся способ оплаты и дата списания.',
            plans: 'Тарифы',
            plansText: 'Можно будет выбрать тариф, период оплаты и посмотреть состав.',
            limits: 'Лимиты',
            limitsText: 'Использование лимитов будет отображаться в реальном времени.',
          },
        }
      : {
          title: 'Subscription',
          description:
            'Plan, billing, limits, and access in one compact financial screen.',
          createTitle: 'Create a master profile first',
          createDescription:
            'After profile setup, plans, payment, limits, and subscription controls will appear here.',
          createProfile: 'Create profile',

          active: 'Active',
          current: 'Current',
          popular: 'Popular',
          monthly: 'Month',
          yearly: 'Year',
          monthlyHint: 'monthly billing',
          yearlyHint: 'one payment',
          yearlyDiscount: '-15%',
          perMonth: 'per month',
          perYear: 'per year',
          free: 'Free',

          cardTitle: 'ClickBook subscription',
          currentPlan: 'Current plan',
          selectedPlan: 'Selected plan',
          planPrice: 'Plan price',
          billingPeriod: 'Billing period',
          discount: 'Savings',
          zeroSaving: 'No savings',
          nextCharge: 'Next charge',
          nextChargeValue: 'Free plan',
          paymentMethod: 'Payment method',
          card: 'Not connected',
          managePayment: 'Manage payment',
          choosePlan: 'Choose plan',

          included: 'Included',
          includedDescription: 'Key features included in the selected plan.',
          limits: 'Plan limits',
          limitsDescription: 'Usage inside the active workspace.',
          noLimits: 'No limits configured',

          receipt: 'Summary',
          receiptDescription: 'What will be applied to the current workspace.',
          access: 'Access',
          workspace: 'Workspace',
          publicPage: 'Public page',
          bookingEngine: 'Online booking',
          protected: 'Protected',

          autoRenew: 'Auto-renewal enabled',
          securePayments: 'Secure payments',
          liveProfile: 'Profile is visible to clients',
          featuresCount: 'features',
          quickStatus: 'Access status',

          setupCards: {
            billing: 'Billing',
            billingText: 'After profile setup, payment method and charge date will appear here.',
            plans: 'Plans',
            plansText: 'You will be able to choose plan, billing period, and feature set.',
            limits: 'Limits',
            limitsText: 'Limit usage will be shown in real time.',
          },
        };

  const plans = (dataset?.plans ?? []) as PlanLike[];

  const currentPlan = useMemo(() => {
    if (!dataset) return undefined;

    return ((dataset.plans.find((plan) => plan.id === dataset.subscription.planId) ?? dataset.plans[0]) as
      | PlanLike
      | undefined);
  }, [dataset]);

  const selectedPlan = useMemo(() => {
    if (!dataset || !currentPlan) return undefined;

    return (
      (dataset.plans.find((plan) => plan.id === selectedPlanId) as PlanLike | undefined) ??
      (dataset.plans.find((plan) => plan.id === currentPlan.id) as PlanLike | undefined) ??
      (dataset.plans[0] as PlanLike | undefined)
    );
  }, [currentPlan, dataset, selectedPlanId]);

  async function handleApplyPlan() {
    if (!selectedPlan) return;

    setApplyingPlan(true);
    setSubscriptionError(null);

    try {
      const response = await fetch('/api/subscription', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...getTelegramAppSessionHeaders(),
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingCycle: billing,
        }),
      });

      if (!response.ok) {
        throw new Error('subscription_update_failed');
      }

      await refreshWorkspace();
      setPaymentOpen(false);
    } catch {
      setSubscriptionError(
        appLocale === 'ru'
          ? 'Не удалось применить тариф. Проверьте деплой и SQL-патч подписок.'
          : 'Could not apply the plan. Check deployment and the subscription SQL patch.',
      );
    } finally {
      setApplyingPlan(false);
    }
  }

  if (!hasHydrated || !mounted) return null;

  if (!ownedProfile || !dataset || !currentPlan || !selectedPlan) {
    return (
      <WorkspaceShell>
        <main
          className={cn(
            'min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6',
            pageBg(isLight),
          )}
        >
          <div className="mx-auto w-full max-w-[var(--page-max-width)]">
            <div className="mb-6 md:mb-7">
              <h1
                className={cn(
                  'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                  pageText(isLight),
                )}
              >
                {copy.title}
              </h1>

              <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
                {copy.description}
              </p>
            </div>

            <Card light={isLight} className="overflow-hidden">
              <div className="grid min-h-[320px] place-items-center px-5 py-12 text-center">
                <div className="mx-auto max-w-[520px]">
                  <MicroLabel light={isLight}>
                    <StatusDot light={isLight} />
                    {appLocale === 'ru' ? 'Профиль не настроен' : 'Profile missing'}
                  </MicroLabel>

                  <h2
                    className={cn(
                      'mt-5 text-[18px] font-semibold tracking-[-0.02em] md:text-[22px]',
                      pageText(isLight),
                    )}
                  >
                    {copy.createTitle}
                  </h2>

                  <p className={cn('mt-3 text-[13px] leading-5', mutedText(isLight))}>
                    {copy.createDescription}
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button asChild className={buttonBase(isLight, true)}>
                      <Link href="/create-profile">
                        <SquarePen className="size-3.5" />
                        {copy.createProfile}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <CreditCard className="size-3.5" />
                    {copy.setupCards.billing}
                  </MicroLabel>

                  <div className={cn('mt-4 text-[13px] font-semibold', pageText(isLight))}>
                    {copy.receipt}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.billingText}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <WalletCards className="size-3.5" />
                    {copy.setupCards.plans}
                  </MicroLabel>

                  <div className={cn('mt-4 text-[13px] font-semibold', pageText(isLight))}>
                    {appLocale === 'ru' ? 'Тарифы' : 'Plans'}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.plansText}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <ShieldCheck className="size-3.5" />
                    {copy.setupCards.limits}
                  </MicroLabel>

                  <div className={cn('mt-4 text-[13px] font-semibold', pageText(isLight))}>
                    {copy.limits}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.limitsText}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  const selectedVisual = getPlanVisual(selectedPlan.name, appLocale);
  const selectedAccent = selectedVisual.accent || fallbackAccent;
  const selectedPrice = billing === 'monthly' ? selectedPlan.monthly : selectedPlan.yearly;
  const yearlySavings = Math.max(0, selectedPlan.monthly * 12 - selectedPlan.yearly);
  const isSelectedCurrent = selectedPlan.id === currentPlan.id && billing === dataset.subscription.billingCycle;
  const currentSubscription = dataset.subscription;
  const nextChargeValue = currentSubscription.nextChargeLabel || copy.nextChargeValue;
  const paymentMethodValue = currentSubscription.paymentMethodLabel || copy.card;

  const priceLabel =
    selectedPrice === 0 ? copy.free : formatCurrency(selectedPrice, appLocale);

  const periodLabel = billing === 'monthly' ? copy.perMonth : copy.perYear;
  const billingPeriodLabel = billing === 'monthly' ? copy.monthly : copy.yearly;

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto w-full max-w-[var(--page-max-width)]">
          <div className="mb-6 md:mb-7">
            <h1
              className={cn(
                'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                pageText(isLight),
              )}
            >
              {copy.title}
            </h1>

            <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
              {copy.description}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_350px]">
            <Card light={isLight} className="overflow-hidden self-start xl:sticky xl:top-4">
              <div className="p-4 md:p-5">
                <div
                  className={cn(
                    'text-[22px] font-semibold leading-none tracking-[-0.025em]',
                    pageText(isLight),
                  )}
                >
                  {copy.title}
                </div>

                <p className={cn('mt-3 text-[12.5px] leading-6', mutedText(isLight))}>
                  {copy.description}
                </p>

                <div className="mt-5">
                  <BillingCycleSwitch
                    billing={billing}
                    setBilling={setBilling}
                    light={isLight}
                    accentColor={selectedAccent}
                    monthlyLabel={copy.monthly}
                    yearlyLabel={copy.yearly}
                    monthlyHint={copy.monthlyHint}
                    yearlyHint={copy.yearlyHint}
                    yearlyDiscount={copy.yearlyDiscount}
                  />
                </div>

                <div className="mt-5 space-y-2">
                  {plans.map((plan) => {
                    const visual = getPlanVisual(plan.name, appLocale);
                    const active = selectedPlan.id === plan.id;
                    const current = currentPlan.id === plan.id;
                    const planPrice = billing === 'monthly' ? plan.monthly : plan.yearly;
                    const planPriceLabel =
                      planPrice === 0 ? copy.free : formatCurrency(planPrice, appLocale);

                    return (
                      <PlanRailItem
                        key={plan.id}
                        plan={plan}
                        active={active}
                        current={current}
                        popular={Boolean(plan.popular)}
                        visual={visual}
                        priceLabel={planPriceLabel}
                        periodLabel={billing === 'monthly' ? copy.perMonth : copy.perYear}
                        currentLabel={copy.current}
                        popularLabel={copy.popular}
                        light={isLight}
                        onClick={() => setSelectedPlanId(plan.id)}
                      />
                    );
                  })}
                </div>
              </div>
            </Card>

            <section className="space-y-4">
              <Card light={isLight} className="overflow-hidden p-3 md:p-4">
                <LuxuryPlanCard
                  plan={selectedPlan}
                  visual={selectedVisual}
                  priceLabel={priceLabel}
                  periodLabel={periodLabel}
                  activeLabel={copy.active}
                  cardTitle={copy.cardTitle}
                  light={isLight}
                />

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Panel
                    light={isLight}
                    className="flex h-10 items-center justify-center gap-2 px-3 text-center"
                  >
                    <ShieldCheck className={cn('size-3.5', mutedText(isLight))} />
                    <span className={cn('truncate text-[11px] font-medium', mutedText(isLight))}>
                      {copy.autoRenew}
                    </span>
                  </Panel>

                  <Panel
                    light={isLight}
                    className="flex h-10 items-center justify-center gap-2 px-3 text-center"
                  >
                    <LockKeyhole className={cn('size-3.5', mutedText(isLight))} />
                    <span className={cn('truncate text-[11px] font-medium', mutedText(isLight))}>
                      {copy.securePayments}
                    </span>
                  </Panel>

                  <Panel
                    light={isLight}
                    className="flex h-10 items-center justify-center gap-2 px-3 text-center"
                  >
                    <BadgeCheck className={cn('size-3.5', mutedText(isLight))} />
                    <span className={cn('truncate text-[11px] font-medium', mutedText(isLight))}>
                      {copy.liveProfile}
                    </span>
                  </Panel>
                </div>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <SmallInfoTile
                  label={copy.selectedPlan}
                  value={selectedPlan.name}
                  icon={WalletCards}
                  light={isLight}
                />

                <SmallInfoTile
                  label={copy.planPrice}
                  value={priceLabel}
                  icon={Banknote}
                  light={isLight}
                />

                <SmallInfoTile
                  label={copy.nextCharge}
                  value={nextChargeValue}
                  icon={CalendarClock}
                  light={isLight}
                />
              </div>

              <Card light={isLight}>
                <CardTitle
                  title={copy.included}
                  description={copy.includedDescription}
                  light={isLight}
                  right={
                    <MicroLabel light={isLight} active accentColor={selectedAccent}>
                      {selectedPlan.features.length} {copy.featuresCount}
                    </MicroLabel>
                  }
                />

                <div className="grid gap-2 p-4 md:grid-cols-2">
                  {selectedPlan.features.map((feature) => (
                    <FeatureRow key={feature} light={isLight}>
                      {feature}
                    </FeatureRow>
                  ))}
                </div>
              </Card>

              <Card light={isLight}>
                <CardTitle
                  title={copy.limits}
                  description={copy.limitsDescription}
                  light={isLight}
                />

                <div className="grid gap-2 p-4">
                  {dataset.limits.length > 0 ? (
                    dataset.limits.map((limit) => (
                      <LimitRow
                        key={limit.id}
                        label={limit.label}
                        used={limit.used}
                        total={limit.total}
                        accentColor={selectedAccent}
                        light={isLight}
                      />
                    ))
                  ) : (
                    <Panel light={isLight} className="p-4 text-[12px]">
                      <span className={mutedText(isLight)}>{copy.noLimits}</span>
                    </Panel>
                  )}
                </div>
              </Card>
            </section>

            <aside className="space-y-4 self-start xl:sticky xl:top-4">
              <Card light={isLight}>
                <CardTitle
                  title={copy.receipt}
                  description={copy.receiptDescription}
                  light={isLight}
                  right={
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-[9px] border',
                        isLight
                          ? 'border-black/[0.07] bg-black/[0.025] text-black/38'
                          : 'border-white/[0.07] bg-white/[0.035] text-white/38',
                      )}
                    >
                      <ReceiptText className="size-4" />
                    </div>
                  }
                />

                <div className="p-4">
                  <div>
                    <ReceiptRow
                      label={copy.currentPlan}
                      value={selectedPlan.name}
                      light={isLight}
                    />

                    <ReceiptRow
                      label={copy.planPrice}
                      value={priceLabel}
                      light={isLight}
                    />

                    <ReceiptRow
                      label={copy.billingPeriod}
                      value={billingPeriodLabel}
                      light={isLight}
                    />

                    <ReceiptRow
                      label={copy.discount}
                      value={
                        billing === 'yearly' && yearlySavings > 0
                          ? formatCurrency(yearlySavings, appLocale)
                          : copy.zeroSaving
                      }
                      light={isLight}
                    />
                  </div>

                  <Panel light={isLight} className="mt-5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className={cn('text-[11px]', mutedText(isLight))}>
                        {copy.nextCharge}
                      </div>
                      <CalendarClock className={cn('size-4', mutedText(isLight))} />
                    </div>

                    <div
                      className={cn(
                        'mt-2 text-[16px] font-semibold tracking-[-0.045em]',
                        pageText(isLight),
                      )}
                    >
                      {nextChargeValue}
                    </div>
                  </Panel>

                  <Panel light={isLight} className="mt-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className={cn('text-[11px]', mutedText(isLight))}>
                        {copy.paymentMethod}
                      </div>
                      <CreditCard className={cn('size-4', mutedText(isLight))} />
                    </div>

                    <div
                      className={cn(
                        'mt-2 text-[16px] font-semibold tracking-[-0.045em]',
                        pageText(isLight),
                      )}
                    >
                      {paymentMethodValue}
                    </div>
                  </Panel>

                  <Button
                    type="button"
                    onClick={() => { setSubscriptionError(null); setPaymentOpen(true); }}
                    className={cn('mt-5 w-full', buttonBase(isLight, true))}
                  >
                    {isSelectedCurrent ? copy.managePayment : copy.choosePlan}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </Card>

              <Card light={isLight}>
                <CardTitle title={copy.access} light={isLight} />

                <div className="space-y-2 p-4">
                  <AccessRow
                    icon={WalletCards}
                    label={copy.workspace}
                    value={copy.active}
                    light={isLight}
                  />
                  <AccessRow
                    icon={Globe2}
                    label={copy.publicPage}
                    value={copy.active}
                    light={isLight}
                  />
                  <AccessRow
                    icon={Sparkles}
                    label={copy.bookingEngine}
                    value={copy.active}
                    light={isLight}
                  />
                  <AccessRow
                    icon={ShieldCheck}
                    label={copy.protected}
                    value="SSL / 3DS"
                    light={isLight}
                  />
                </div>
              </Card>

              <Card light={isLight}>
                <div className={cn('grid divide-y', divideTone(isLight))}>
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-[9px] border',
                        isLight
                          ? 'border-black/[0.07] bg-black/[0.025] text-black/38'
                          : 'border-white/[0.07] bg-white/[0.035] text-white/38',
                      )}
                    >
                      <LockKeyhole className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className={cn('text-[12.5px] font-semibold', pageText(isLight))}>
                        {copy.quickStatus}
                      </div>
                      <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>
                        {copy.securePayments}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4">
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-[9px] border',
                        isLight
                          ? 'border-black/[0.07] bg-black/[0.025] text-black/38'
                          : 'border-white/[0.07] bg-white/[0.035] text-white/38',
                      )}
                    >
                      <Sparkles className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className={cn('text-[12.5px] font-semibold', pageText(isLight))}>
                        {copy.autoRenew}
                      </div>
                      <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>
                        {copy.liveProfile}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <PaymentManageDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        light={isLight}
        locale={appLocale}
        accentColor={selectedAccent}
        planName={selectedPlan.name}
        priceLabel={priceLabel}
        billingPeriodLabel={billingPeriodLabel}
        nextChargeValue={nextChargeValue}
        cardLabel={paymentMethodValue}
        isSelectedCurrent={isSelectedCurrent}
        onConfirm={handleApplyPlan}
        isBusy={applyingPlan}
        errorMessage={subscriptionError}
      />
    </WorkspaceShell>
  );
}