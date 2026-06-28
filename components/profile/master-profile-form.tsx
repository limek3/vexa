'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Globe2,
  ImagePlus,
  Link2,
  MapPin,
  MessageCircle,
  Plus,
  Quote,
  Save,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import type {
  MasterProfile,
  MasterProfileFormValues,
  WorkGalleryItem,
} from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { useLocale } from '@/lib/locale-context';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import { isDashboardDemoEnabled } from '@/lib/dashboard-demo';
import { SLOTY_DEMO_SLUG } from '@/lib/demo-data';
import { cn, parseServices, slugify } from '@/lib/utils';
import { getServiceSuggestions } from '@/lib/service-presets';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { MasterAvatar } from '@/components/profile/master-avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ThemeMode = 'light' | 'dark';

type ProfileSection =
  | 'base'
  | 'trust'
  | 'services'
  | 'portfolio'
  | 'reviews'
  | 'contacts';

type ProfileReview = {
  id: string;
  author: string;
  service?: string;
  text: string;
  rating: number;
};

type ExtendedMasterProfileFormValues = MasterProfileFormValues & {
  priceHint: string;
  experienceLabel: string;
  responseTime: string;
  workGallery: WorkGalleryItem[];
  reviews: ProfileReview[];
  rating: number;
  reviewCount: number;
};

type ProfileNavItem = {
  id: ProfileSection;
  title: string;
  shortTitle: string;
  description: string;
  icon: ReactNode;
  done: boolean;
  badge?: string | number;
  visible?: boolean;
};

type ServiceDraft = {
  title: string;
  duration: string;
  price: string;
  note: string;
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 5;
  return Math.min(5, Math.max(1, value));
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function safeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function safeWorkGallery(value: unknown): WorkGalleryItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Partial<WorkGalleryItem> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: safeString(item.id) || makeId(`work-${index}`),
      title: safeString(item.title),
      image: safeString(item.image),
      note: safeString(item.note),
    }));
}

function safeReviews(value: unknown): ProfileReview[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Partial<ProfileReview> => Boolean(item) && typeof item === 'object')
    .map((review, index) => ({
      id: safeString(review.id) || makeId(`review-${index}`),
      author: safeString(review.author),
      service: safeString(review.service),
      text: safeString(review.text),
      rating: clampRating(Number(review.rating ?? 5)),
    }));
}

function createInitialValues(
  profile?: MasterProfile | null,
): ExtendedMasterProfileFormValues {
  return {
    name: safeString(profile?.name),
    profession: safeString(profile?.profession),
    city: safeString(profile?.city),
    bio: safeString(profile?.bio),
    servicesText: safeStringArray(profile?.services).join('\n'),
    phone: safeString(profile?.phone),
    telegram: safeString(profile?.telegram),
    whatsapp: safeString(profile?.whatsapp),
    locationMode: profile?.locationMode === 'address' ? 'address' : 'online',
    address: safeString(profile?.address),
    mapUrl: safeString(profile?.mapUrl),
    hidePhone: Boolean(profile?.hidePhone),
    hideTelegram: Boolean(profile?.hideTelegram),
    hideWhatsapp: Boolean(profile?.hideWhatsapp),
    slug: safeString(profile?.slug),
    avatar: safeString(profile?.avatar),

    priceHint: safeString(profile?.priceHint),
    experienceLabel: safeString(profile?.experienceLabel),
    responseTime: safeString(profile?.responseTime),
    workGallery: safeWorkGallery(profile?.workGallery),
    reviews: safeReviews(profile?.reviews),
    rating: Number.isFinite(Number(profile?.rating)) ? Number(profile?.rating) : 4.9,
    reviewCount: Number.isFinite(Number(profile?.reviewCount))
      ? Number(profile?.reviewCount)
      : safeReviews(profile?.reviews).length,
  };
}

function uniqueServices(items: string[]) {
  return Array.from(
    new Map(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item] as const),
    ).values(),
  );
}

function stringifyServices(items: string[]) {
  return uniqueServices(items).join('\n');
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('file_read_failed'));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file: File, maxSide = 920) {
  const source = await readFileAsDataUrl(file);
  const image = new Image();

  image.src = source;
  await image.decode();

  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) return source;

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/webp', 0.9);
}

function universalServicePresets(locale: 'ru' | 'en') {
  return locale === 'ru'
    ? [
        'Маникюр',
        'Педикюр',
        'Брови',
        'Ресницы',
        'Стрижка',
        'Барбер',
        'Окрашивание',
        'Макияж',
        'Массаж',
        'Косметология',
        'Тату',
        'Перекрытие тату',
        'Пирсинг',
        'Персональная тренировка',
        'Растяжка',
        'Йога',
        'Пилатес',
        'Занятие с тренером',
        'Урок вокала',
        'Урок английского',
        'Репетитор',
        'Фотосессия',
        'Консультация стилиста',
        'Психологическая консультация',
        'Коуч-сессия',
        'Нутрициолог',
        'Консультация',
        'Индивидуальное занятие',
      ]
    : [
        'Manicure',
        'Pedicure',
        'Brows',
        'Lashes',
        'Haircut',
        'Barber',
        'Coloring',
        'Makeup',
        'Massage',
        'Cosmetology',
        'Tattoo',
        'Tattoo cover-up',
        'Piercing',
        'Personal training',
        'Stretching',
        'Yoga',
        'Pilates',
        'Training session',
        'Vocal lesson',
        'English lesson',
        'Tutor session',
        'Photoshoot',
        'Stylist consultation',
        'Psychology session',
        'Coaching session',
        'Nutrition consultation',
        'Consultation',
        'Individual lesson',
      ];
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

function cardTone(light: boolean) {
  return light
    ? 'border-[#e6e2da] bg-white shadow-[0_12px_30px_rgba(17,17,17,0.035)]'
    : 'border-white/[0.08] bg-[#141414]';
}

function insetTone(light: boolean) {
  return light
    ? 'border-[#e6e2da] bg-black/[0.015]'
    : 'border-white/[0.07] bg-white/[0.026]';
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

function inputCss(light: boolean) {
  return cn(
    'h-9 rounded-[9px] border px-3 text-[12.5px] shadow-none outline-none transition focus-visible:ring-0',
    light
      ? 'border-black/[0.08] bg-white text-black placeholder:text-black/28 focus:border-black/[0.16]'
      : 'border-white/[0.08] bg-[#141414] text-white placeholder:text-white/25 focus:border-white/[0.16]',
  );
}

function textareaCss(light: boolean) {
  return cn(
    'rounded-[9px] border px-3 py-3 text-[12.5px] leading-5 shadow-none outline-none transition focus-visible:ring-0',
    light
      ? 'border-black/[0.08] bg-white text-black placeholder:text-black/28 focus:border-black/[0.16]'
      : 'border-white/[0.08] bg-[#141414] text-white placeholder:text-white/25 focus:border-white/[0.16]',
  );
}

function accentPillStyle(
  color: string,
  light: boolean,
  strength: 'soft' | 'strong' = 'strong',
): CSSProperties {
  const bgAmount = strength === 'strong' ? (light ? 18 : 34) : light ? 10 : 22;
  const borderAmount =
    strength === 'strong' ? (light ? 34 : 48) : light ? 22 : 34;

  return {
    background: light
      ? `color-mix(in srgb, ${color} ${bgAmount}%, #ffffff)`
      : `color-mix(in srgb, ${color} ${bgAmount}%, #141414)`,
    borderColor: light
      ? `color-mix(in srgb, ${color} ${borderAmount}%, rgba(0,0,0,0.1))`
      : `color-mix(in srgb, ${color} ${borderAmount}%, rgba(255,255,255,0.1))`,
    color: light
      ? `color-mix(in srgb, ${color} 70%, #101010)`
      : `color-mix(in srgb, ${color} 18%, #ffffff)`,
    boxShadow:
      strength === 'strong'
        ? light
          ? `0 0 0 1px color-mix(in srgb, ${color} 10%, transparent)`
          : `0 0 0 1px color-mix(in srgb, ${color} 14%, transparent)`
        : undefined,
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
      style={
        active && accentColor
          ? accentPillStyle(accentColor, light, 'soft')
          : undefined
      }
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

function ActionButton({
  children,
  light,
  active,
  disabled,
  onClick,
  type = 'button',
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        buttonBase(light, active),
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}

function destructiveButtonClass(light: boolean) {
  return light
    ? 'border-red-500/20 bg-red-500/[0.08] text-red-600 hover:border-red-500/30 hover:bg-red-500/[0.12] hover:text-red-700'
    : 'border-red-500/24 bg-red-500/[0.14] text-red-200 hover:border-red-400/36 hover:bg-red-500/[0.2] hover:text-red-100';
}

function CopyIconButton({
  light,
  copied,
  onClick,
  copyLabel,
  copiedLabel,
}: {
  light: boolean;
  copied: boolean;
  onClick: () => void;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? copiedLabel : copyLabel}
      title={copied ? copiedLabel : copyLabel}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[9px] border text-[11.5px] font-medium shadow-none transition-[width,background,border-color,color,opacity,transform] duration-200 active:scale-[0.985]',
        copied ? 'w-[162px] px-3' : 'w-8 px-0',
        light
          ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
          : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
      )}
    >
      {copied ? (
        <>
          <Check className="size-3.5 shrink-0" />
          <span className="whitespace-nowrap">{copiedLabel}</span>
        </>
      ) : (
        <Copy className="size-3.5 shrink-0" />
      )}
    </button>
  );
}

function ActionLink({
  href,
  children,
  light,
  active,
  className,
}: {
  href: string;
  children: ReactNode;
  light: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonBase(light, active), className)}>
      {children}
    </Link>
  );
}

function ProgressLine({
  value,
  light,
  color,
}: {
  value: number;
  light: boolean;
  color: string;
}) {
  return (
    <div
      className={cn(
        'h-1.5 overflow-hidden rounded-full',
        light ? 'bg-black/[0.06]' : 'bg-white/[0.07]',
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function ControlGroup({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full shrink-0 items-center overflow-hidden rounded-[12px] border p-0',
        light
          ? 'border-black/[0.08] bg-white'
          : 'border-white/[0.08] bg-white/[0.045]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
  light,
  accentColor,
  badge,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
  light: boolean;
  accentColor: string;
  badge?: string | number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative inline-flex h-10 min-w-[86px] shrink-0 items-center justify-center gap-2 border-r px-4 text-[11px] font-semibold tracking-[-0.015em] transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
        light ? 'border-black/[0.07]' : 'border-white/[0.07]',
        active
          ? light
            ? 'text-black'
            : 'text-white'
          : light
            ? 'text-black/40 hover:text-black/70'
            : 'text-white/36 hover:text-white/70',
      )}
    >
      <span className="relative z-10 shrink-0 opacity-70">{icon}</span>
      <span className="relative z-10 truncate">{label}</span>

      {badge !== undefined && badge !== '' ? (
        <span
          className={cn(
            'relative z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-[7px] border px-1.5 text-[9.5px] font-semibold',
            active
              ? light
                ? 'border-black/[0.08] bg-black/[0.035] text-black/70'
                : 'border-white/[0.1] bg-white/[0.06] text-white/76'
              : light
                ? 'border-black/[0.06] bg-black/[0.025] text-black/36'
                : 'border-white/[0.06] bg-white/[0.035] text-white/36',
          )}
        >
          {badge}
        </span>
      ) : null}

      <span
        style={active ? { background: accentColor } : undefined}
        className={cn(
          'absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-all duration-200',
          active
            ? 'opacity-100'
            : light
              ? 'bg-black/0 opacity-0 group-hover:bg-black/18 group-hover:opacity-100'
              : 'bg-white/0 opacity-0 group-hover:bg-white/18 group-hover:opacity-100',
        )}
      />
    </button>
  );
}

function Field({
  label,
  hint,
  children,
  light,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div
        className={cn(
          'mb-1.5 text-[11.5px] font-semibold tracking-[-0.012em]',
          pageText(light),
        )}
      >
        {label}
      </div>

      {children}

      {hint ? (
        <div className={cn('mt-1.5 text-[10.5px] leading-4', faintText(light))}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function CompactStat({
  label,
  value,
  hint,
  light,
}: {
  label: string;
  value: string | number;
  hint?: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[10px] border px-3 py-2.5',
        light
          ? 'border-black/[0.07] bg-white'
          : 'border-white/[0.08] bg-[#141414]',
      )}
    >
      <div className={cn('truncate text-[10px] font-medium', mutedText(light))}>
        {label}
      </div>

      <div
        className={cn(
          'mt-1 truncate text-[15px] font-semibold leading-none tracking-[-0.045em]',
          pageText(light),
        )}
      >
        {value}
      </div>

      {hint ? (
        <div className={cn('mt-1 truncate text-[10px]', faintText(light))}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  light,
  right,
}: {
  title: string;
  description: string;
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
        <div
          className={cn(
            'truncate text-[13px] font-semibold tracking-[-0.018em]',
            pageText(light),
          )}
        >
          {title}
        </div>

        <div className={cn('mt-0.5 truncate text-[10.5px]', mutedText(light))}>
          {description}
        </div>
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function EditorBlock({
  id,
  title,
  description,
  light,
  right,
  children,
}: {
  id: string;
  title: string;
  description: string;
  light: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionHeader
        title={title}
        description={description}
        light={light}
        right={right}
      />

      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function ServiceButton({
  children,
  light,
  active,
  onClick,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[8px] border px-2.5 text-[11px] font-medium transition active:scale-[0.985]',
        active
          ? 'cb-accent-pill-active'
          : light
            ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
            : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function ContactPrivacy({
  checked,
  onToggle,
  light,
  labels,
}: {
  checked: boolean;
  onToggle: () => void;
  light: boolean;
  labels: {
    visible: string;
    hidden: string;
  };
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[8px] border px-2.5 text-[10.5px] font-medium transition active:scale-[0.985]',
        checked
          ? light
            ? 'border-black/[0.08] bg-white text-black/45'
            : 'border-white/[0.08] bg-white/[0.04] text-white/42'
          : light
            ? 'border-black/[0.12] bg-white text-black/70'
            : 'border-white/[0.12] bg-white/[0.06] text-white/72',
      )}
    >
      <StatusDot light={light} active={!checked} />
      {checked ? labels.hidden : labels.visible}
    </button>
  );
}

function PreviewCard({
  profile,
  light,
  labels,
  averageRating,
  publicPath,
  copied,
  onCopy,
}: {
  profile: MasterProfile;
  light: boolean;
  labels: Record<string, string>;
  averageRating: number;
  publicPath: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <Card light={light} className="overflow-hidden">
      <CardTitle
        title={labels.publicPreview}
        description={labels.publicLink}
        light={light}
      />

      <div className="p-4 md:p-5">
        <div className="grid gap-4">
          <Panel light={light} className="p-4">
            <div className="flex items-start gap-3">
              <MasterAvatar
                name={profile.name}
                avatar={profile.avatar}
                className="h-16 w-16 rounded-[10px]"
              />

              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    'truncate text-[18px] font-semibold leading-none tracking-[-0.055em]',
                    pageText(light),
                  )}
                >
                  {profile.name}
                </div>

                <div
                  className={cn(
                    'mt-1.5 line-clamp-2 text-[11.5px] leading-4',
                    mutedText(light),
                  )}
                >
                  {profile.profession}
                </div>

                <div
                  className={cn(
                    'mt-2 flex items-center gap-1.5 text-[10.5px]',
                    mutedText(light),
                  )}
                >
                  <MapPin className="size-3" />
                  {profile.city}
                </div>
              </div>
            </div>

            <p
              className={cn(
                'mt-4 line-clamp-3 text-[12px] leading-5',
                mutedText(light),
              )}
            >
              {profile.bio}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.services.slice(0, 6).map((service) => (
                <MicroLabel key={service} light={light}>
                  <StatusDot light={light} />
                  {service}
                </MicroLabel>
              ))}
            </div>
          </Panel>

          <div className="grid gap-2">
            <Panel light={light} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Star className={cn('size-3.5', faintText(light))} />
                  <span className={cn('text-[11px]', mutedText(light))}>
                    {labels.rating}
                  </span>
                </div>

                <span className={cn('text-[12px] font-semibold', pageText(light))}>
                  {averageRating.toFixed(1)}
                </span>
              </div>
            </Panel>

            <Panel light={light} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Clock3 className={cn('size-3.5', faintText(light))} />
                  <span className={cn('text-[11px]', mutedText(light))}>
                    {labels.responseTime}
                  </span>
                </div>

                <span
                  className={cn(
                    'truncate text-right text-[12px] font-semibold',
                    pageText(light),
                  )}
                >
                  {profile.responseTime ?? '—'}
                </span>
              </div>
            </Panel>

            <Panel light={light} className="p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Link2 className={cn('size-3.5 shrink-0', faintText(light))} />
                <span className={cn('truncate text-[12px] font-medium', pageText(light))}>
                  {publicPath}
                </span>
              </div>
            </Panel>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <ActionLink href={publicPath} light={light}>
                <ExternalLink className="size-3.5" />
                {labels.preview}
              </ActionLink>

              <CopyIconButton
                light={light}
                copied={copied}
                onClick={onCopy}
                copyLabel={labels.copy}
                copiedLabel={labels.copied}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MasterProfileForm({
  initialProfile,
  mode,
  showOverviewCards = true,
  showHeader = true,
  showPreviewPanel = true,
  showReviewSection = false,
}: {
  initialProfile?: MasterProfile | null;
  mode: 'create' | 'edit';
  showOverviewCards?: boolean;
  showHeader?: boolean;
  showPreviewPanel?: boolean;
  showReviewSection?: boolean;
}) {
  const router = useRouter();
  const searchParams = useBrowserSearchParams();
  const demoMode = isDashboardDemoEnabled(searchParams);
  const { saveProfile, getPublicPath } = useApp();
  const { settings } = useAppearance();
  const { locale } = useLocale();
  const { resolvedTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<ProfileSection>('base');
  const [values, setValues] = useState<ExtendedMasterProfileFormValues>(() =>
    createInitialValues(initialProfile),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProfile?.slug));
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reviewCopied, setReviewCopied] = useState(false);
  const [customService, setCustomService] = useState('');
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>({
    title: '',
    duration: '',
    price: '',
    note: '',
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [galleryUploadingId, setGalleryUploadingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setValues(createInitialValues(initialProfile));
    setSlugTouched(Boolean(initialProfile?.slug));
    setCustomService('');
    setServiceDraft({
      title: '',
      duration: '',
      price: '',
      note: '',
    });
    setAvatarError(null);
    setError(null);
    setSavedAt(null);
    setActiveSection('base');
  }, [initialProfile]);

  useEffect(() => {
    if (!showReviewSection && activeSection === 'reviews') {
      setActiveSection('portfolio');
    }
  }, [activeSection, showReviewSection]);

  useEffect(() => {
    if (slugTouched) return;

    setValues((current) => ({
      ...current,
      slug: slugify(current.name),
    }));
  }, [slugTouched, values.name]);

  const currentTheme: ThemeMode = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const isLight = currentTheme === 'light';

  const accentColor = accentPalette[settings.accentTone]?.solid ?? '#8b8b8b';
  const publicAccentColor = accentPalette[settings.publicAccent]?.solid ?? accentColor;

  const labels =
    locale === 'ru'
      ? {
          badge: 'Редактор профиля',
          title: 'Профиль мастера',
          description:
            'Редактируйте профиль по разделам: основа, доверие, услуги, портфолио и контакты.',
          formTitle: 'Данные профиля',
          formDescription: 'Редактируйте основную информацию, описание, услуги и контакты.',
          profile: 'Основа',
          profileShort: 'Основа',
          profileDesc: 'Фото, имя, специализация, город и ссылка',
          publicDetails: 'Доверие',
          publicDetailsShort: 'Доверие',
          publicDetailsDesc: 'Стоимость, опыт и скорость ответа',
          offer: 'Услуги',
          offerShort: 'Услуги',
          offerDesc: 'Конструктор услуг, цены, время и описание для клиента',
          gallery: 'Портфолио',
          galleryShort: 'Портфолио',
          galleryDesc: 'Компактный список работ, которые клиент увидит на странице',
          reviews: 'Отзывы',
          reviewsShort: 'Отзывы',
          reviewsDesc: 'Отзывы клиентов для доверия',
          contacts: 'Контакты',
          contactsShort: 'Контакты',
          contactsDesc: 'Телефон, Telegram, ВК и адрес для визита',
          photo: 'Фото профиля',
          photoHint: 'Если фото не загрузить, покажем инициалы.',
          uploadPhoto: 'Загрузить',
          replacePhoto: 'Заменить',
          uploading: 'Загружаем...',
          avatarReady: 'Фото загружено',
          avatarErrorInvalid: 'Нужен файл изображения: JPG, PNG или WebP.',
          avatarErrorGeneric: 'Не удалось обработать фото. Попробуйте другой файл.',
          avatarErrorTooLarge: 'Файл слишком большой. Лучше выбрать изображение до 5 МБ.',
          name: 'Имя',
          profession: 'Специализация',
          city: 'Город',
          slug: 'Ссылка',
          visitFormat: 'Формат визита',
          visitOnline: 'Онлайн',
          visitAddress: 'По адресу',
          address: 'Адрес',
          addressPlaceholder: 'Например: Калининград, ул. Мира 10, кабинет 4',
          mapUrl: 'Ссылка маршрута',
          mapUrlPlaceholder: 'Необязательно: ссылка Яндекс.Карт, если хотите задать точку вручную',
          routeHint: 'Если указан адрес, клиент получит маршрут в Яндекс.Картах в напоминании за 2 часа.',
          priceHint: 'Стоимость',
          pricePlaceholder: 'Например: от 2 500 ₽ / по запросу',
          experienceLabel: 'Опыт',
          experiencePlaceholder: 'Например: 5 лет / 300+ клиентов',
          responseTime: 'Ответ',
          responsePlaceholder: 'Например: отвечаю за 10 минут',
          bio: 'Описание страницы',
          bioPlaceholder:
            'Коротко расскажите о стиле работы, опыте, формате услуги и почему вам можно доверять.',
          selected: 'Список услуг',
          popular: 'Быстрые варианты',
          noServices: 'Пока услуг нет. Соберите первую услугу через конструктор ниже.',
          servicePlaceholder: 'Например: тату, тренировка, урок вокала',
          add: 'Добавить',
          serviceConstructor: 'Конструктор услуги',
          serviceConstructorHint:
            'Заполните поля — сервис сам соберёт понятную строку для клиента.',
          serviceName: 'Название',
          serviceNamePlaceholder: 'Маникюр + покрытие',
          serviceDuration: 'Время',
          serviceDurationPlaceholder: '90 мин',
          servicePrice: 'Цена',
          servicePricePlaceholder: 'от 2 300 ₽',
          serviceNote: 'Что входит',
          serviceNotePlaceholder: 'снятие, форма, покрытие',
          addService: 'Добавить услугу',
          quickFill: 'Быстро заполнить',
          smartBio: 'Собрать описание',
          smartBioHint:
            'Подставит аккуратный текст из специализации и услуг. Потом можно отредактировать.',
          clientPreview: 'Как увидит клиент',
          clientPreviewHint:
            'Бот и публичная страница будут показывать услуги именно в таком виде.',
          moveUp: 'Вверх',
          moveDown: 'Вниз',
          templateBeauty: 'Ногтевой сервис',
          templateExpert: 'Консультации',
          templateSport: 'Тренер',
          servicesHub: 'Связь с разделом «Услуги»',
          servicesHubText:
            'Этот список — короткая витрина для публичного профиля и бота. Подробные карточки услуг, длительность, цену, порядок и запись лучше настраивать на отдельной странице услуг.',
          servicesHubPointOne: 'Профиль показывает клиенту короткий список услуг.',
          servicesHubPointTwo:
            'Раздел «Услуги» хранит подробные карточки, цены и длительность.',
          servicesHubPointThree:
            'Бот использует названия услуг, чтобы понятнее вести клиента к записи.',
          openServicesHub: 'Открыть услуги',
          profileServicesRole: 'Витрина профиля',
          servicesPageRole: 'Каталог услуг',
          botRole: 'Ответы бота',
          bookingRole: 'Запись клиента',
          addWork: 'Добавить работу',
          workTitle: 'Название',
          workTitlePlaceholder: 'Например: Молочный розовый',
          workNote: 'Комментарий',
          workNotePlaceholder: 'Коротко о работе, стиле или результате',
          workImage: 'Фото работы',
          uploadImage: 'Загрузить',
          replaceImage: 'Заменить',
          removeWork: 'Удалить',
          emptyGallery: 'Портфолио пустое. Добавьте хотя бы 3–6 работ.',
          addReview: 'Добавить отзыв',
          reviewAuthor: 'Клиент',
          reviewAuthorPlaceholder: 'Например: Анна',
          reviewService: 'Услуга',
          reviewText: 'Текст отзыва',
          reviewTextPlaceholder: 'Короткий отзыв клиента',
          reviewRating: 'Оценка',
          emptyReviews: 'Пока отзывов нет. Можно добавить реальные отзывы вручную.',
          phone: 'Телефон',
          telegram: 'Telegram',
          whatsapp: 'ВК',
          visible: 'Виден',
          hidden: 'Скрыт',
          privacy: 'Приватность',
          privacyText: 'Можно скрыть контакт до подтверждения записи.',
          readiness: 'Готовность',
          publicLink: 'Персональная страница',
          preview: 'Открыть',
          copy: 'Копировать',
          copied: 'Скопировано',
          save: mode === 'create' ? 'Создать профиль' : 'Сохранить',
          saved: 'Сохранено',
          savedSuccess: 'Изменения сохранены',
          savedSuccessText: 'Профиль обновлён. Публичная страница и бот уже используют новые данные.',
          back: 'К кабинету',
          servicesCount: 'Услуги',
          contactsCount: 'Контакты',
          worksCount: 'Работы',
          reviewsCount: 'Отзывы',
          chars: 'симв.',
          publicPreview: 'Превью страницы',
          reviewLink: 'Для отзывов',
          rating: 'Рейтинг',
          filled: 'заполнено',
          linkReady: 'Ссылка готова',
          done: 'OK',
          empty: '—',
          next: 'Дальше',
          quickActions: 'Быстрые действия',
          quickActionsText:
            'Сохраните профиль, откройте публичную страницу или перейдите к подробным услугам.',
        }
      : {
          badge: 'Profile editor',
          title: 'Specialist profile',
          description:
            'Edit your profile by sections: base, trust, services, portfolio, and contacts.',
          formTitle: 'Profile details',
          formDescription: 'Edit main information, description, services, and contacts.',
          profile: 'Base',
          profileShort: 'Base',
          profileDesc: 'Photo, name, specialization, city, and link',
          publicDetails: 'Trust',
          publicDetailsShort: 'Trust',
          publicDetailsDesc: 'Price, experience, and response time',
          offer: 'Services',
          offerShort: 'Services',
          offerDesc: 'Service builder, prices, duration, and client-facing copy',
          gallery: 'Portfolio',
          galleryShort: 'Portfolio',
          galleryDesc: 'Compact list of works shown on the public page',
          reviews: 'Reviews',
          reviewsShort: 'Reviews',
          reviewsDesc: 'Client reviews for trust',
          contacts: 'Contacts',
          contactsShort: 'Contacts',
          contactsDesc: 'Phone, Telegram, VK, and visit address',
          photo: 'Profile photo',
          photoHint: 'If no photo is uploaded, initials will be shown.',
          uploadPhoto: 'Upload',
          replacePhoto: 'Replace',
          uploading: 'Uploading...',
          avatarReady: 'Photo uploaded',
          avatarErrorInvalid: 'Please choose an image file: JPG, PNG, or WebP.',
          avatarErrorGeneric: 'Unable to process the image. Please try another file.',
          avatarErrorTooLarge: 'The file is too large. Please choose an image up to 5 MB.',
          name: 'Name',
          profession: 'Specialization',
          city: 'City',
          slug: 'Link',
          visitFormat: 'Visit format',
          visitOnline: 'Online',
          visitAddress: 'At address',
          address: 'Address',
          addressPlaceholder: 'For example: 10 Main Street, office 4',
          mapUrl: 'Route link',
          mapUrlPlaceholder: 'Optional: custom Yandex Maps link',
          routeHint: 'If address is set, the client receives a Yandex Maps route in the 2-hour reminder.',
          priceHint: 'Price',
          pricePlaceholder: 'For example: from €50 / on request',
          experienceLabel: 'Experience',
          experiencePlaceholder: 'For example: 5 years / 300+ clients',
          responseTime: 'Response',
          responsePlaceholder: 'For example: replies within 10 minutes',
          bio: 'Page description',
          bioPlaceholder:
            'Briefly describe your work style, experience, service format, and why clients can trust you.',
          selected: 'Service list',
          popular: 'Quick options',
          noServices: 'No services yet. Build your first service below.',
          servicePlaceholder: 'For example: tattoo, training, vocal lesson',
          add: 'Add',
          serviceConstructor: 'Service builder',
          serviceConstructorHint:
            'Fill the fields and the service will be formatted clearly for clients.',
          serviceName: 'Name',
          serviceNamePlaceholder: 'Manicure + coating',
          serviceDuration: 'Time',
          serviceDurationPlaceholder: '90 min',
          servicePrice: 'Price',
          servicePricePlaceholder: 'from €50',
          serviceNote: 'Included',
          serviceNotePlaceholder: 'removal, shape, coating',
          addService: 'Add service',
          quickFill: 'Quick fill',
          smartBio: 'Build description',
          smartBioHint:
            'Creates a clean draft from specialization and services. You can edit it later.',
          clientPreview: 'Client preview',
          clientPreviewHint:
            'The bot and public page will show services in this format.',
          moveUp: 'Up',
          moveDown: 'Down',
          templateBeauty: 'Nail service',
          templateExpert: 'Consulting',
          templateSport: 'Trainer',
          servicesHub: 'Connection with Services',
          servicesHubText:
            'This list is a short storefront for the public profile and bot. Detailed service cards, duration, price, flow, and booking logic are better managed on the Services page.',
          servicesHubPointOne: 'The profile shows clients a short service list.',
          servicesHubPointTwo:
            'The Services page stores detailed cards, prices, and duration.',
          servicesHubPointThree:
            'The bot uses service names to guide clients to booking.',
          openServicesHub: 'Open services',
          profileServicesRole: 'Profile storefront',
          servicesPageRole: 'Service catalog',
          botRole: 'Bot replies',
          bookingRole: 'Client booking',
          addWork: 'Add work',
          workTitle: 'Title',
          workTitlePlaceholder: 'For example: Milky pink',
          workNote: 'Note',
          workNotePlaceholder: 'Short note about the work, style, or result',
          workImage: 'Work image',
          uploadImage: 'Upload',
          replaceImage: 'Replace',
          removeWork: 'Remove',
          emptyGallery: 'Portfolio is empty. Add at least 3–6 works.',
          addReview: 'Add review',
          reviewAuthor: 'Client',
          reviewAuthorPlaceholder: 'For example: Anna',
          reviewService: 'Service',
          reviewText: 'Review text',
          reviewTextPlaceholder: 'Short client review',
          reviewRating: 'Rating',
          emptyReviews: 'No reviews yet. You can add real reviews manually.',
          phone: 'Phone',
          telegram: 'Telegram',
          whatsapp: 'VK',
          visible: 'Visible',
          hidden: 'Hidden',
          privacy: 'Privacy',
          privacyText: 'Contact can be hidden until booking confirmation.',
          readiness: 'Readiness',
          publicLink: 'Personal page',
          preview: 'Open',
          copy: 'Copy',
          copied: 'Copied',
          save: mode === 'create' ? 'Create profile' : 'Save',
          saved: 'Saved',
          savedSuccess: 'Changes saved',
          savedSuccessText: 'The profile is updated. Public page and bot now use the new data.',
          back: 'Dashboard',
          servicesCount: 'Services',
          contactsCount: 'Contacts',
          worksCount: 'Works',
          reviewsCount: 'Reviews',
          chars: 'chars',
          publicPreview: 'Page preview',
          reviewLink: 'For reviews',
          rating: 'Rating',
          filled: 'filled',
          linkReady: 'Link ready',
          done: 'OK',
          empty: '—',
          next: 'Next',
          quickActions: 'Quick actions',
          quickActionsText:
            'Save the profile, open the public page, or manage detailed services.',
        };

  const services = useMemo(
    () => uniqueServices(parseServices(values.servicesText)),
    [values.servicesText],
  );

  const cleanWorks = useMemo(
    () => values.workGallery.filter((item) => item.title.trim() && item.image.trim()),
    [values.workGallery],
  );

  const cleanReviews = useMemo(
    () => values.reviews.filter((item) => item.author.trim() && item.text.trim()),
    [values.reviews],
  );

  const averageRating = useMemo(() => {
    if (cleanReviews.length === 0) return values.rating || 4.9;

    const total = cleanReviews.reduce(
      (sum, review) => sum + clampRating(Number(review.rating)),
      0,
    );

    return Number((total / cleanReviews.length).toFixed(1));
  }, [cleanReviews, values.rating]);

  const suggestedServices = useMemo(() => {
    const fromProfession = getServiceSuggestions(values.profession, locale);
    const universal = universalServicePresets(locale);

    return uniqueServices([...fromProfession, ...universal])
      .filter((item) => !services.includes(item))
      .slice(0, 30);
  }, [locale, services, values.profession]);

  const previewProfile = useMemo<MasterProfile>(
    () => ({
      id: initialProfile?.id ?? 'preview',
      slug: slugify(values.slug || values.name) || 'master-preview',
      name: values.name || (locale === 'ru' ? 'Имя мастера' : 'Specialist name'),
      profession:
        values.profession || (locale === 'ru' ? 'Специализация' : 'Specialization'),
      city: values.city || (locale === 'ru' ? 'Город' : 'City'),
      bio:
        values.bio ||
        (locale === 'ru'
          ? 'Краткое описание будущей публичной страницы.'
          : 'Short summary for the upcoming public page.'),
      services:
        services.length > 0 ? services : [locale === 'ru' ? 'Услуга' : 'Service'],
      phone: values.phone || undefined,
      telegram: values.telegram || undefined,
      whatsapp: values.whatsapp || undefined,
      locationMode: values.locationMode,
      address: values.address || undefined,
      mapUrl: values.mapUrl || undefined,
      hidePhone: values.hidePhone,
      hideTelegram: values.hideTelegram,
      hideWhatsapp: values.hideWhatsapp,
      avatar: values.avatar || undefined,
      priceHint:
        values.priceHint ||
        (locale === 'ru' ? 'Стоимость по запросу' : 'Price on request'),
      experienceLabel:
        values.experienceLabel ||
        (locale === 'ru' ? 'Опыт не указан' : 'Experience not set'),
      responseTime:
        values.responseTime ||
        (locale === 'ru' ? 'Обычно отвечает быстро' : 'Usually replies quickly'),
      workGallery: cleanWorks,
      reviews: cleanReviews,
      rating: averageRating,
      reviewCount: cleanReviews.length,
      createdAt: initialProfile?.createdAt ?? new Date().toISOString(),
    }),
    [
      initialProfile?.createdAt,
      initialProfile?.id,
      locale,
      services,
      values,
      cleanWorks,
      cleanReviews,
      averageRating,
    ],
  );

  const publicPath = demoMode
    ? `/demo/${SLOTY_DEMO_SLUG}`
    : getPublicPath(previewProfile.slug);

  const servicesPageHref = demoMode
    ? '/dashboard/services?demo=1&source=profile'
    : '/dashboard/services?source=profile';

  const reviewPath = `/m/${previewProfile.slug}/review`;

  const contactCount = [values.phone, values.telegram, values.whatsapp].filter((item) =>
    item.trim(),
  ).length;

  const baseDone = Boolean(values.name.trim() && values.profession.trim() && values.city.trim());
  const trustDone = Boolean(
    values.priceHint.trim() &&
      values.experienceLabel.trim() &&
      values.responseTime.trim(),
  );
  const servicesDone = Boolean(values.bio.trim() && services.length > 0);
  const portfolioDone = cleanWorks.length > 0;
  const reviewsDone = cleanReviews.length > 0;
  const contactsDone = contactCount > 0;

  const completionItems = [
    values.name.trim(),
    values.profession.trim(),
    values.city.trim(),
    values.bio.trim(),
    slugify(values.slug || values.name),
    services.length > 0 ? 'services' : '',
    values.priceHint.trim(),
    values.experienceLabel.trim(),
    values.responseTime.trim(),
    values.locationMode === 'online' || values.address.trim(),
    values.phone.trim() || values.telegram.trim() || values.whatsapp.trim(),
    cleanWorks.length > 0 ? 'works' : '',
    showReviewSection ? (cleanReviews.length > 0 ? 'reviews' : '') : 'reviews-hidden',
  ];

  const completionPercent = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  const navItems = useMemo<ProfileNavItem[]>(
    () =>
      [
        {
          id: 'base',
          title: labels.profile,
          shortTitle: labels.profileShort,
          description: labels.profileDesc,
          icon: <UserRound className="size-3.5" />,
          done: baseDone,
          badge: undefined,
        },
        {
          id: 'trust',
          title: labels.publicDetails,
          shortTitle: labels.publicDetailsShort,
          description: labels.publicDetailsDesc,
          icon: <BadgeCheck className="size-3.5" />,
          done: trustDone,
          badge: undefined,
        },
        {
          id: 'services',
          title: labels.offer,
          shortTitle: labels.offerShort,
          description: labels.offerDesc,
          icon: <Sparkles className="size-3.5" />,
          done: servicesDone,
          badge: services.length,
        },
        {
          id: 'portfolio',
          title: labels.gallery,
          shortTitle: labels.galleryShort,
          description: labels.galleryDesc,
          icon: <ImagePlus className="size-3.5" />,
          done: portfolioDone,
          badge: cleanWorks.length,
        },
        {
          id: 'reviews',
          title: labels.reviews,
          shortTitle: labels.reviewsShort,
          description: labels.reviewsDesc,
          icon: <Quote className="size-3.5" />,
          done: reviewsDone,
          badge: cleanReviews.length,
          visible: showReviewSection,
        },
        {
          id: 'contacts',
          title: labels.contacts,
          shortTitle: labels.contactsShort,
          description: labels.contactsDesc,
          icon: <MessageCircle className="size-3.5" />,
          done: contactsDone,
          badge: contactCount,
        },
      ].filter((item) => item.visible !== false),
    [
      labels,
      baseDone,
      trustDone,
      servicesDone,
      portfolioDone,
      reviewsDone,
      contactsDone,
      services.length,
      cleanWorks.length,
      cleanReviews.length,
      contactCount,
      showReviewSection,
    ],
  );

  const activeNavItem = navItems.find((item) => item.id === activeSection) ?? navItems[0];
  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => item.id === activeSection),
  );
  const nextNavItem = navItems[activeIndex + 1] ?? null;

  const switchSection = (section: ProfileSection) => {
    if (section === activeSection) return;

    const previousScrollX = typeof window !== 'undefined' ? window.scrollX : 0;
    const previousScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    setActiveSection(section);

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo(previousScrollX, previousScrollY);
      });
    }
  };

  const checklistItems: Array<{
    section: ProfileSection;
    label: string;
    hint: string;
    done: boolean;
    value: string | number;
    visible?: boolean;
  }> = [
    {
      section: 'base',
      label: labels.profile,
      hint: labels.profileDesc,
      done: baseDone,
      value: baseDone ? labels.done : labels.empty,
    },
    {
      section: 'trust',
      label: labels.publicDetails,
      hint: labels.publicDetailsDesc,
      done: trustDone,
      value: trustDone ? labels.done : labels.empty,
    },
    {
      section: 'services',
      label: labels.offer,
      hint: labels.offerDesc,
      done: servicesDone,
      value: services.length,
    },
    {
      section: 'portfolio',
      label: labels.gallery,
      hint: labels.galleryDesc,
      done: portfolioDone,
      value: cleanWorks.length,
    },
    {
      section: 'reviews',
      label: labels.reviews,
      hint: labels.reviewsDesc,
      done: reviewsDone,
      value: cleanReviews.length,
      visible: showReviewSection,
    },
    {
      section: 'contacts',
      label: labels.contacts,
      hint: labels.contactsDesc,
      done: contactsDone,
      value: contactCount,
    },
  ].filter((item) => item.visible !== false);

  const updateServices = (nextServices: string[]) => {
    setValues((current) => ({
      ...current,
      servicesText: stringifyServices(nextServices),
    }));
  };

  const addService = (service: string) => {
    const normalized = service.trim();

    if (!normalized) return;

    updateServices([...services, normalized]);
    setCustomService('');
  };

  const removeService = (service: string) => {
    updateServices(services.filter((item) => item !== service));
  };

  const updateServiceAt = (index: number, value: string) => {
    const next = services.map((item, itemIndex) =>
      itemIndex === index ? value.trimStart() : item,
    );

    updateServices(next);
  };

  const moveService = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= services.length) return;

    const next = [...services];
    const currentItem = next[index];

    next[index] = next[nextIndex];
    next[nextIndex] = currentItem;

    updateServices(next);
  };

  const buildServiceLine = (draft: ServiceDraft) => {
    const title = draft.title.trim();
    const duration = draft.duration.trim();
    const price = draft.price.trim();
    const note = draft.note.trim();

    if (!title) return '';

    return [
      title,
      duration,
      price,
      note ? `${locale === 'ru' ? 'входит' : 'includes'}: ${note}` : '',
    ]
      .filter(Boolean)
      .join(' — ');
  };

  const addServiceFromDraft = () => {
    const line = buildServiceLine(serviceDraft);

    if (!line) return;

    addService(line);
    setServiceDraft({
      title: '',
      duration: '',
      price: '',
      note: '',
    });
  };

  const applyServiceTemplate = (type: 'beauty' | 'expert' | 'sport') => {
    const template =
      locale === 'ru'
        ? type === 'beauty'
          ? [
              'Маникюр + покрытие — 90 мин — от 2 300 ₽ — входит: форма, покрытие, уход',
              'Укрепление гелем — 30 мин — от 700 ₽',
              'Педикюр полный — 100 мин — от 2 800 ₽',
              'Снятие + новый дизайн — 120 мин — от 3 000 ₽',
            ]
          : type === 'expert'
            ? [
                'Первая консультация — 60 мин — от 3 000 ₽ — входит: разбор ситуации и план действий',
                'Повторная консультация — 50 мин — от 2 500 ₽',
                'Пакет из 4 встреч — по 50 мин — по запросу',
              ]
            : [
                'Персональная тренировка — 60 мин — от 2 500 ₽',
                'Диагностика и план — 45 мин — от 1 500 ₽',
                'Абонемент 8 тренировок — по 60 мин — по запросу',
              ]
        : type === 'beauty'
          ? [
              'Manicure + coating — 90 min — from €50 — includes: shape, coating, care',
              'Gel strengthening — 30 min — from €15',
              'Full pedicure — 100 min — from €60',
              'Removal + new design — 120 min — from €65',
            ]
          : type === 'expert'
            ? [
                'First consultation — 60 min — from €70 — includes: case review and action plan',
                'Follow-up consultation — 50 min — from €60',
                'Package of 4 sessions — 50 min each — on request',
              ]
            : [
                'Personal training — 60 min — from €55',
                'Diagnostics and plan — 45 min — from €35',
                '8-session package — 60 min each — on request',
              ];

    updateServices([...services, ...template]);
  };

  const generateSmartBio = () => {
    const name = values.name.trim();
    const profession = values.profession.trim();
    const city = values.city.trim();
    const firstServices = services.slice(0, 3).join(', ');

    const ruText = [
      profession
        ? `${name ? `${name} — ` : ''}${profession.toLowerCase()}${city ? ` в городе ${city}` : ''}.`
        : `${name ? `${name}. ` : ''}Помогаю клиентам выбрать удобную услугу и записаться без долгой переписки.`,
      firstServices
        ? `Основные направления: ${firstServices}.`
        : 'Можно выбрать услугу, время и оставить заявку онлайн.',
      'Работаю аккуратно, объясняю детали до записи и помогаю подобрать подходящий формат под задачу клиента.',
    ].join(' ');

    const enText = [
      profession
        ? `${name ? `${name} — ` : ''}${profession}${city ? ` in ${city}` : ''}.`
        : `${name ? `${name}. ` : ''}I help clients choose a service and book without long messaging.`,
      firstServices
        ? `Main services: ${firstServices}.`
        : 'Clients can choose a service, time, and submit a booking request online.',
      'I explain the details before booking and help clients choose the right format for their needs.',
    ].join(' ');

    setValues((current) => ({
      ...current,
      bio: locale === 'ru' ? ruText : enText,
    }));
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError(labels.avatarErrorInvalid);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(labels.avatarErrorTooLarge);
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const optimized = await optimizeImage(file);

      setValues((current) => ({
        ...current,
        avatar: optimized,
      }));
    } catch {
      setAvatarError(labels.avatarErrorGeneric);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleWorkImageChange = async (
    workId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(labels.avatarErrorInvalid);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(labels.avatarErrorTooLarge);
      return;
    }

    setGalleryUploadingId(workId);
    setError(null);

    try {
      const optimized = await optimizeImage(file, 1200);

      setValues((current) => ({
        ...current,
        workGallery: current.workGallery.map((item) =>
          item.id === workId ? { ...item, image: optimized } : item,
        ),
      }));
    } catch {
      setError(labels.avatarErrorGeneric);
    } finally {
      setGalleryUploadingId(null);
    }
  };

  const addWork = () => {
    setValues((current) => ({
      ...current,
      workGallery: [
        ...current.workGallery,
        {
          id: makeId('work'),
          title: '',
          image: '',
          note: '',
        },
      ],
    }));
  };

  const removeWork = (workId: string) => {
    setValues((current) => ({
      ...current,
      workGallery: current.workGallery.filter((item) => item.id !== workId),
    }));
  };

  const addReview = () => {
    setValues((current) => ({
      ...current,
      reviews: [
        ...current.reviews,
        {
          id: makeId('review'),
          author: '',
          service: '',
          text: '',
          rating: 5,
        },
      ],
    }));
  };

  const removeReview = (reviewId: string) => {
    setValues((current) => ({
      ...current,
      reviews: current.reviews.filter((item) => item.id !== reviewId),
    }));
  };

  const handleCopyLink = async () => {
    try {
      const absoluteValue =
        typeof window === 'undefined'
          ? publicPath
          : `${window.location.origin}${publicPath}`;

      await navigator.clipboard.writeText(absoluteValue);

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const handleCopyReviewLink = async () => {
    try {
      const absoluteValue =
        typeof window === 'undefined'
          ? reviewPath
          : `${window.location.origin}${reviewPath}`;

      await navigator.clipboard.writeText(absoluteValue);

      setReviewCopied(true);
      window.setTimeout(() => setReviewCopied(false), 1600);
    } catch {}
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedWorks = values.workGallery
      .filter((item) => item.title.trim() && item.image.trim())
      .map((item) => ({
        id: item.id,
        title: item.title.trim(),
        image: item.image,
        note: item.note?.trim() ?? '',
      }));

    const cleanedReviews = showReviewSection
      ? values.reviews
          .filter((review) => review.author.trim() && review.text.trim())
          .map((review) => ({
            id: review.id,
            author: review.author.trim(),
            service: review.service?.trim() ?? '',
            text: review.text.trim(),
            rating: clampRating(Number(review.rating)),
          }))
      : [];

    const nextRating =
      cleanedReviews.length > 0
        ? Number(
            (
              cleanedReviews.reduce((sum, review) => sum + review.rating, 0) /
              cleanedReviews.length
            ).toFixed(1),
          )
        : values.rating || 4.9;

    const cleanedValues: ExtendedMasterProfileFormValues = {
      ...values,
      slug: demoMode ? SLOTY_DEMO_SLUG : slugify(values.slug || values.name),
      servicesText: stringifyServices(services),
      priceHint: values.priceHint.trim(),
      experienceLabel: values.experienceLabel.trim(),
      responseTime: values.responseTime.trim(),
      locationMode: values.locationMode === 'address' && values.address.trim() ? 'address' : 'online',
      address: values.address.trim(),
      mapUrl: values.mapUrl.trim(),
      workGallery: cleanedWorks,
      reviews: cleanedReviews,
      rating: nextRating,
      reviewCount: cleanedReviews.length,
    };

    setSavedAt(null);
    const result = await saveProfile(cleanedValues);

    if (!result.success || !result.profile) {
      const message = result.error || 'Unable to save profile';
      setError(message);
      toast.error(locale === 'ru' ? 'Не удалось сохранить' : 'Could not save', {
        description: message,
      });
      return;
    }

    setError(null);
    setValues(createInitialValues(result.profile));
    setSlugTouched(Boolean(result.profile.slug));
    setSavedAt(new Date().toISOString());
    toast.success(locale === 'ru' ? 'Сохранено' : 'Saved', {
      description: locale === 'ru' ? 'Изменения профиля успешно применены.' : 'Profile changes were saved successfully.',
    });

    if (mode === 'create') {
      router.push(demoMode ? '/dashboard/profile?demo=1' : '/dashboard/profile');
      return;
    }

    router.refresh();
    if (typeof window !== 'undefined') {
      window.setTimeout(() => setSavedAt(null), 2600);
    }
  };

  if (!mounted) return null;

  const renderActiveSection = () => {
    if (activeSection === 'base') {
      return (
        <EditorBlock
          id="profile-base"
          title={labels.profile}
          description={labels.profileDesc}
          light={isLight}
        >
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <Panel light={isLight} className="flex min-h-[330px] items-center justify-center p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="grid place-items-center">
                <div
                  className={cn(
                    'flex h-28 w-28 items-center justify-center overflow-hidden rounded-[16px] border',
                    isLight
                      ? 'border-black/[0.08] bg-[#ffffff]'
                      : 'border-white/[0.08] bg-white/[0.035]',
                  )}
                >
                  {values.avatar ? (
                    <img
                      src={values.avatar}
                      alt={previewProfile.name}
                      className="h-full w-full object-contain object-center p-3"
                    />
                  ) : (
                    <MasterAvatar
                      name={previewProfile.name}
                      avatar={values.avatar}
                      className="h-full w-full rounded-[14px] border-0"
                    />
                  )}
                </div>

                <div className="mt-3 text-center">
                  <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                    {labels.photo}
                  </div>

                  <div className={cn('mt-1 text-[10.5px] leading-4', mutedText(isLight))}>
                    {avatarUploading
                      ? labels.uploading
                      : values.avatar
                        ? labels.avatarReady
                        : labels.photoHint}
                  </div>

                  {avatarError ? (
                    <div className="mt-2 text-[10.5px] text-destructive">
                      {avatarError}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <ActionButton
                    light={isLight}
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="size-3.5" />
                    {values.avatar ? labels.replacePhoto : labels.uploadPhoto}
                  </ActionButton>

                  {values.avatar ? (
                    <button
                      type="button"
                      onClick={() => {
                        setValues((current) => ({ ...current, avatar: '' }));
                        setAvatarError(null);
                      }}
                      className={cn(
                        'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.985]',
                        isLight
                          ? 'border-red-500/20 bg-red-500/[0.08] text-red-600 hover:border-red-500/30 hover:bg-red-500/[0.12] hover:text-red-700'
                          : 'border-red-500/24 bg-red-500/[0.14] text-red-200 hover:border-red-400/36 hover:bg-red-500/[0.2] hover:text-red-100',
                      )}
                      aria-label={labels.delete}
                      title={labels.delete}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </Panel>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={labels.name} light={isLight}>
                <Input
                  value={values.name}
                  className={inputCss(isLight)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={labels.name}
                />
              </Field>

              <Field label={labels.profession} light={isLight}>
                <Input
                  value={values.profession}
                  className={inputCss(isLight)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      profession: event.target.value,
                    }))
                  }
                  placeholder={labels.profession}
                />
              </Field>

              <Field label={labels.city} light={isLight}>
                <Input
                  value={values.city}
                  className={inputCss(isLight)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  placeholder={labels.city}
                />
              </Field>

              <Field label={labels.slug} light={isLight}>
                <Input
                  value={values.slug}
                  className={inputCss(isLight)}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setValues((current) => ({
                      ...current,
                      slug: slugify(event.target.value),
                    }));
                  }}
                  placeholder="anna-nails"
                />
              </Field>

              <Panel light={isLight} className="p-3 sm:col-span-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Link2 className={cn('size-3.5 shrink-0', faintText(isLight))} />
                  <span className={cn('truncate text-[12px] font-medium', pageText(isLight))}>
                    {publicPath}
                  </span>
                </div>
              </Panel>

              <Panel light={isLight} className="space-y-3 p-3 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className={cn('size-3.5 shrink-0', faintText(isLight))} />
                    <span className={cn('text-[12px] font-semibold', pageText(isLight))}>
                      {labels.visitFormat}
                    </span>
                  </div>

                  <div className="flex rounded-[10px] border p-1">
                    {[
                      { value: 'online', label: labels.visitOnline },
                      { value: 'address', label: labels.visitAddress },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setValues((current) => ({
                            ...current,
                            locationMode: option.value as 'online' | 'address',
                          }))
                        }
                        className={cn(
                          'h-8 rounded-[8px] px-3 text-[11px] font-semibold transition active:scale-[0.985]',
                          values.locationMode === option.value
                            ? isLight
                              ? 'cb-neutral-primary cb-neutral-primary-light'
                              : 'cb-neutral-primary cb-neutral-primary-dark'
                            : isLight
                              ? 'text-black/46 hover:bg-black/[0.04] hover:text-black'
                              : 'text-white/42 hover:bg-white/[0.06] hover:text-white',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {values.locationMode === 'address' ? (
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <Field label={labels.address} light={isLight}>
                      <Input
                        value={values.address}
                        className={inputCss(isLight)}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        placeholder={labels.addressPlaceholder}
                      />
                    </Field>

                    <Field label={labels.mapUrl} light={isLight}>
                      <Input
                        value={values.mapUrl}
                        className={inputCss(isLight)}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            mapUrl: event.target.value,
                          }))
                        }
                        placeholder={labels.mapUrlPlaceholder}
                      />
                    </Field>
                  </div>
                ) : null}

                <p className={cn('text-[10.5px] leading-4', mutedText(isLight))}>
                  {labels.routeHint}
                </p>
              </Panel>
            </div>
          </div>
        </EditorBlock>
      );
    }

    if (activeSection === 'trust') {
      return (
        <EditorBlock
          id="profile-trust"
          title={labels.publicDetails}
          description={labels.publicDetailsDesc}
          light={isLight}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <Field label={labels.priceHint} light={isLight}>
              <Input
                value={values.priceHint}
                className={inputCss(isLight)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    priceHint: event.target.value,
                  }))
                }
                placeholder={labels.pricePlaceholder}
              />
            </Field>

            <Field label={labels.experienceLabel} light={isLight}>
              <Input
                value={values.experienceLabel}
                className={inputCss(isLight)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    experienceLabel: event.target.value,
                  }))
                }
                placeholder={labels.experiencePlaceholder}
              />
            </Field>

            <Field label={labels.responseTime} light={isLight}>
              <Input
                value={values.responseTime}
                className={inputCss(isLight)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    responseTime: event.target.value,
                  }))
                }
                placeholder={labels.responsePlaceholder}
              />
            </Field>
          </div>
        </EditorBlock>
      );
    }

    if (activeSection === 'services') {
      return (
        <EditorBlock
          id="profile-services"
          title={labels.offer}
          description={labels.offerDesc}
          light={isLight}
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="space-y-4">
              <Panel light={isLight} className="p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <Field
                    label={labels.bio}
                    hint={`${values.bio.trim().length} ${labels.chars}`}
                    light={isLight}
                    className="flex-1"
                  >
                    <Textarea
                      value={values.bio}
                      className={cn(textareaCss(isLight), 'min-h-[92px] resize-none')}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          bio: event.target.value,
                        }))
                      }
                      placeholder={labels.bioPlaceholder}
                    />
                  </Field>

                  <div className="flex shrink-0 flex-col gap-2 md:w-[190px]">
                    <ActionButton light={isLight} active onClick={generateSmartBio}>
                      <Sparkles className="size-3.5" />
                      {labels.smartBio}
                    </ActionButton>

                    <p className={cn('text-[10.5px] leading-4', mutedText(isLight))}>
                      {labels.smartBioHint}
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel light={isLight} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                      {labels.serviceConstructor}
                    </div>
                    <div className={cn('mt-1 text-[10.5px]', mutedText(isLight))}>
                      {labels.serviceConstructorHint}
                    </div>
                  </div>

                  <MicroLabel light={isLight} active accentColor={accentColor}>
                    <StatusDot light={isLight} active accentColor={accentColor} />
                    {services.length}
                  </MicroLabel>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-[1.2fr_0.7fr_0.7fr_1fr_auto]">
                  <Input
                    value={serviceDraft.title}
                    className={inputCss(isLight)}
                    onChange={(event) =>
                      setServiceDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder={labels.serviceNamePlaceholder}
                  />

                  <Input
                    value={serviceDraft.duration}
                    className={inputCss(isLight)}
                    onChange={(event) =>
                      setServiceDraft((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))
                    }
                    placeholder={labels.serviceDurationPlaceholder}
                  />

                  <Input
                    value={serviceDraft.price}
                    className={inputCss(isLight)}
                    onChange={(event) =>
                      setServiceDraft((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    placeholder={labels.servicePricePlaceholder}
                  />

                  <Input
                    value={serviceDraft.note}
                    className={inputCss(isLight)}
                    onChange={(event) =>
                      setServiceDraft((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder={labels.serviceNotePlaceholder}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addServiceFromDraft();
                      }
                    }}
                  />

                  <ActionButton light={isLight} active onClick={addServiceFromDraft}>
                    <Plus className="size-3.5" />
                    {labels.add}
                  </ActionButton>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ServiceButton light={isLight} onClick={() => applyServiceTemplate('beauty')}>
                    <Plus className="size-3" />
                    {labels.templateBeauty}
                  </ServiceButton>

                  <ServiceButton light={isLight} onClick={() => applyServiceTemplate('expert')}>
                    <Plus className="size-3" />
                    {labels.templateExpert}
                  </ServiceButton>

                  <ServiceButton light={isLight} onClick={() => applyServiceTemplate('sport')}>
                    <Plus className="size-3" />
                    {labels.templateSport}
                  </ServiceButton>
                </div>
              </Panel>

              <Panel light={isLight} className="overflow-hidden">
                <div
                  className={cn(
                    'flex items-center justify-between gap-3 border-b px-3 py-2.5',
                    borderTone(isLight),
                  )}
                >
                  <div>
                    <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                      {labels.selected}
                    </div>
                    <div className={cn('mt-0.5 text-[10.5px]', mutedText(isLight))}>
                      {labels.clientPreviewHint}
                    </div>
                  </div>

                  <MicroLabel light={isLight}>
                    <StatusDot light={isLight} />
                    {services.length}
                  </MicroLabel>
                </div>

                {services.length > 0 ? (
                  <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                    {services.map((service, index) => (
                      <div
                        key={`${service}-${index}`}
                        className="grid gap-2 px-3 py-2.5 md:grid-cols-[32px_minmax(0,1fr)_auto] md:items-center"
                      >
                        <div
                          className={cn(
                            'grid size-8 place-items-center rounded-[9px] border text-[11px] font-semibold',
                            isLight
                              ? 'border-black/[0.07] bg-white text-black/40'
                              : 'border-white/[0.07] bg-white/[0.035] text-white/40',
                          )}
                        >
                          {index + 1}
                        </div>

                        <Input
                          value={service}
                          className={inputCss(isLight)}
                          onChange={(event) => updateServiceAt(index, event.target.value)}
                        />

                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => moveService(index, -1)}
                            disabled={index === 0}
                            className={cn(
                              'inline-flex h-8 min-w-8 items-center justify-center rounded-[9px] border px-2 text-[11px] font-medium transition active:scale-[0.985] disabled:pointer-events-none disabled:opacity-30',
                              isLight
                                ? 'border-black/[0.08] bg-white text-black/50 hover:text-black'
                                : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white',
                            )}
                            title={labels.moveUp}
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() => moveService(index, 1)}
                            disabled={index === services.length - 1}
                            className={cn(
                              'inline-flex h-8 min-w-8 items-center justify-center rounded-[9px] border px-2 text-[11px] font-medium transition active:scale-[0.985] disabled:pointer-events-none disabled:opacity-30',
                              isLight
                                ? 'border-black/[0.08] bg-white text-black/50 hover:text-black'
                                : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white',
                            )}
                            title={labels.moveDown}
                          >
                            ↓
                          </button>

                          <ActionButton light={isLight} onClick={() => removeService(service)} className={destructiveButtonClass(isLight)}>
                            <Trash2 className="size-3.5" />
                          </ActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-5 text-center">
                    <div className={cn('text-[12px]', mutedText(isLight))}>
                      {labels.noServices}
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            <div className="space-y-4">
              <Panel light={isLight} className="p-3">
                <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                  {labels.servicesHub}
                </div>

                <p className={cn('mt-1.5 text-[10.5px] leading-4', mutedText(isLight))}>
                  {labels.servicesHubText}
                </p>

                <div className="mt-3 grid gap-1.5">
                  {[
                    labels.servicesHubPointOne,
                    labels.servicesHubPointTwo,
                    labels.servicesHubPointThree,
                  ].map((item) => (
                    <div
                      key={item}
                      className={cn(
                        'flex items-start gap-2 rounded-[9px] border px-2.5 py-2 text-[10.5px] leading-4',
                        isLight
                          ? 'border-black/[0.06] bg-white text-black/56'
                          : 'border-white/[0.07] bg-white/[0.035] text-white/52',
                      )}
                    >
                      <StatusDot light={isLight} active accentColor={accentColor} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MicroLabel
                    light={isLight}
                    active
                    accentColor={accentColor}
                    className="justify-center"
                  >
                    <StatusDot light={isLight} active accentColor={accentColor} />
                    {labels.profileServicesRole}
                  </MicroLabel>

                  <MicroLabel light={isLight} className="justify-center">
                    <StatusDot light={isLight} />
                    {labels.servicesPageRole}
                  </MicroLabel>

                  <MicroLabel light={isLight} className="justify-center">
                    <StatusDot light={isLight} />
                    {labels.botRole}
                  </MicroLabel>

                  <MicroLabel light={isLight} className="justify-center">
                    <StatusDot light={isLight} />
                    {labels.bookingRole}
                  </MicroLabel>
                </div>

                <div className="mt-3 grid gap-2">
                  <ActionLink href={servicesPageHref} light={isLight} active className="w-full">
                    <Sparkles className="size-3.5" />
                    {labels.openServicesHub}
                  </ActionLink>

                  <ActionButton light={isLight} type="submit" className="w-full">
                    <Save className="size-3.5" />
                    {labels.save}
                  </ActionButton>
                </div>
              </Panel>

              <Panel light={isLight} className="p-3">
                <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                  {labels.clientPreview}
                </div>

                <p className={cn('mt-1 text-[10.5px] leading-4', mutedText(isLight))}>
                  {labels.clientPreviewHint}
                </p>

                <div className="mt-3 space-y-2">
                  {services.slice(0, 6).length > 0 ? (
                    services.slice(0, 6).map((service, index) => (
                      <div
                        key={`${service}-preview-${index}`}
                        className={cn(
                          'rounded-[9px] border px-3 py-2',
                          isLight
                            ? 'border-black/[0.07] bg-white'
                            : 'border-white/[0.08] bg-[#141414]',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            style={{ background: accentColor }}
                            className="mt-1.5 size-1.5 shrink-0 rounded-full"
                          />
                          <div
                            className={cn(
                              'min-w-0 text-[11.5px] font-medium leading-4',
                              pageText(isLight),
                            )}
                          >
                            {service}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className={cn(
                        'rounded-[9px] border px-3 py-5 text-center text-[11px]',
                        isLight
                          ? 'border-black/[0.07] bg-white text-black/38'
                          : 'border-white/[0.07] bg-white/[0.035] text-white/38',
                      )}
                    >
                      {labels.noServices}
                    </div>
                  )}
                </div>
              </Panel>

              <Panel light={isLight} className="p-3">
                <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                  {labels.quickFill}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {suggestedServices.slice(0, 22).map((service) => (
                    <ServiceButton
                      key={service}
                      light={isLight}
                      onClick={() => addService(service)}
                    >
                      <Plus className="size-3" />
                      {service}
                    </ServiceButton>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <Input
                    value={customService}
                    className={inputCss(isLight)}
                    onChange={(event) => setCustomService(event.target.value)}
                    placeholder={labels.servicePlaceholder}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addService(customService);
                      }
                    }}
                  />

                  <ActionButton light={isLight} onClick={() => addService(customService)}>
                    <Plus className="size-3.5" />
                    {labels.add}
                  </ActionButton>
                </div>
              </Panel>
            </div>
          </div>
        </EditorBlock>
      );
    }

    if (activeSection === 'portfolio') {
      return (
        <EditorBlock
          id="profile-portfolio"
          title={labels.gallery}
          description={labels.galleryDesc}
          light={isLight}
          right={
            <ActionButton light={isLight} onClick={addWork}>
              <Plus className="size-3.5" />
              {labels.addWork}
            </ActionButton>
          }
        >
          <div className="space-y-2.5">
            {values.workGallery.length === 0 ? (
              <Panel light={isLight} className="p-5 text-center">
                <div className={cn('text-[12px]', mutedText(isLight))}>
                  {labels.emptyGallery}
                </div>

                <div className="mt-3 flex justify-center">
                  <ActionButton light={isLight} onClick={addWork}>
                    <Plus className="size-3.5" />
                    {labels.addWork}
                  </ActionButton>
                </div>
              </Panel>
            ) : (
              <div className="grid gap-2.5">
                {values.workGallery.map((work, index) => (
                  <Panel key={work.id} light={isLight} className="p-3">
                    <div className="grid gap-3 md:grid-cols-[76px_minmax(0,1fr)_176px] md:items-start">
                      <div
                        className={cn(
                          'relative h-[76px] w-[76px] overflow-hidden rounded-[10px] border',
                          isLight
                            ? 'border-black/[0.07] bg-white'
                            : 'border-white/[0.07] bg-black/20',
                        )}
                      >
                        {work.image ? (
                          <img
                            src={work.image}
                            alt={work.title || labels.workImage}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center">
                            <div className="text-center">
                              <ImagePlus
                                className={cn('mx-auto size-4', faintText(isLight))}
                              />
                              <div
                                className={cn(
                                  'mt-1 text-[9.5px] leading-3',
                                  mutedText(isLight),
                                )}
                              >
                                {index + 1}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <Field label={labels.workTitle} light={isLight}>
                          <Input
                            value={work.title}
                            className={inputCss(isLight)}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                workGallery: current.workGallery.map((item) =>
                                  item.id === work.id
                                    ? { ...item, title: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                            placeholder={labels.workTitlePlaceholder}
                          />
                        </Field>

                        <Field label={labels.workNote} light={isLight}>
                          <Textarea
                            value={work.note ?? ''}
                            className={cn(
                              textareaCss(isLight),
                              'min-h-[38px] resize-none py-2',
                            )}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                workGallery: current.workGallery.map((item) =>
                                  item.id === work.id
                                    ? { ...item, note: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                            placeholder={labels.workNotePlaceholder}
                          />
                        </Field>
                      </div>

                      <div className="flex flex-wrap gap-2 md:flex-col">
                        <label className={cn(buttonBase(isLight), 'cursor-pointer md:w-full')}>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            className="hidden"
                            onChange={(event) => handleWorkImageChange(work.id, event)}
                          />

                          <ImagePlus className="size-3.5" />
                          {galleryUploadingId === work.id
                            ? labels.uploading
                            : work.image
                              ? labels.replaceImage
                              : labels.uploadImage}
                        </label>

                        <ActionButton
                          light={isLight}
                          onClick={() => removeWork(work.id)}
                          className={cn('md:w-full', destructiveButtonClass(isLight))}
                        >
                          <Trash2 className="size-3.5" />
                          {labels.removeWork}
                        </ActionButton>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </EditorBlock>
      );
    }

    if (activeSection === 'reviews' && showReviewSection) {
      return (
        <EditorBlock
          id="profile-reviews"
          title={labels.reviews}
          description={labels.reviewsDesc}
          light={isLight}
          right={
            <ActionButton light={isLight} onClick={addReview}>
              <Plus className="size-3.5" />
              {labels.addReview}
            </ActionButton>
          }
        >
          <div className="space-y-3">
            {values.reviews.length === 0 ? (
              <Panel light={isLight} className="p-5 text-center">
                <div className={cn('text-[12px]', mutedText(isLight))}>
                  {labels.emptyReviews}
                </div>

                <div className="mt-3 flex justify-center">
                  <ActionButton light={isLight} onClick={addReview}>
                    <Plus className="size-3.5" />
                    {labels.addReview}
                  </ActionButton>
                </div>
              </Panel>
            ) : (
              <div className="grid gap-3">
                {values.reviews.map((review) => (
                  <Panel key={review.id} light={isLight} className="p-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto] md:items-end">
                      <Field label={labels.reviewAuthor} light={isLight}>
                        <Input
                          value={review.author}
                          className={inputCss(isLight)}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              reviews: current.reviews.map((item) =>
                                item.id === review.id
                                  ? { ...item, author: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder={labels.reviewAuthorPlaceholder}
                        />
                      </Field>

                      <Field label={labels.reviewService} light={isLight}>
                        <Input
                          value={review.service ?? ''}
                          className={inputCss(isLight)}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              reviews: current.reviews.map((item) =>
                                item.id === review.id
                                  ? { ...item, service: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder={labels.reviewService}
                        />
                      </Field>

                      <Field label={labels.reviewRating} light={isLight}>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          step={0.1}
                          value={review.rating}
                          className={inputCss(isLight)}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              reviews: current.reviews.map((item) =>
                                item.id === review.id
                                  ? {
                                      ...item,
                                      rating: clampRating(Number(event.target.value)),
                                    }
                                  : item,
                              ),
                            }))
                          }
                        />
                      </Field>

                      <ActionButton light={isLight} onClick={() => removeReview(review.id)} className={destructiveButtonClass(isLight)}>
                        <Trash2 className="size-3.5" />
                      </ActionButton>
                    </div>

                    <div className="mt-3">
                      <Field label={labels.reviewText} light={isLight}>
                        <Textarea
                          value={review.text}
                          className={cn(textareaCss(isLight), 'min-h-[82px] resize-none')}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              reviews: current.reviews.map((item) =>
                                item.id === review.id
                                  ? { ...item, text: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder={labels.reviewTextPlaceholder}
                        />
                      </Field>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </EditorBlock>
      );
    }

    return (
      <EditorBlock
        id="profile-contacts"
        title={labels.contacts}
        description={labels.contactsDesc}
        light={isLight}
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={labels.phone} light={isLight}>
              <Input
                value={values.phone}
                className={inputCss(isLight)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="+31 6 1234 5678"
              />

              <div className="mt-2">
                <ContactPrivacy
                  checked={values.hidePhone}
                  light={isLight}
                  labels={{
                    visible: labels.visible,
                    hidden: labels.hidden,
                  }}
                  onToggle={() =>
                    setValues((current) => ({
                      ...current,
                      hidePhone: !current.hidePhone,
                    }))
                  }
                />
              </div>
            </Field>

            <Field label={labels.telegram} light={isLight}>
              <Input
                value={values.telegram}
                className={inputCss(isLight)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    telegram: event.target.value,
                  }))
                }
                placeholder="@handle"
              />

              <div className="mt-2">
                <ContactPrivacy
                  checked={values.hideTelegram}
                  light={isLight}
                  labels={{
                    visible: labels.visible,
                    hidden: labels.hidden,
                  }}
                  onToggle={() =>
                    setValues((current) => ({
                      ...current,
                      hideTelegram: !current.hideTelegram,
                    }))
                  }
                />
              </div>
            </Field>

            <Field label={labels.whatsapp} light={isLight}>
              <Input
                value={values.whatsapp}
                className={inputCss(isLight)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    whatsapp: event.target.value,
                  }))
                }
                placeholder="@anna.max"
              />

              <div className="mt-2">
                <ContactPrivacy
                  checked={values.hideWhatsapp}
                  light={isLight}
                  labels={{
                    visible: labels.visible,
                    hidden: labels.hidden,
                  }}
                  onToggle={() =>
                    setValues((current) => ({
                      ...current,
                      hideWhatsapp: !current.hideWhatsapp,
                    }))
                  }
                />
              </div>
            </Field>
          </div>

          <Panel light={isLight} className="p-3">
            <div className={cn('text-[11.5px] font-semibold', pageText(isLight))}>
              {labels.privacy}
            </div>

            <p className={cn('mt-1 text-[10.5px] leading-4', mutedText(isLight))}>
              {labels.privacyText}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                values.phone
                  ? `${labels.phone}: ${values.hidePhone ? labels.hidden : labels.visible}`
                  : null,
                values.telegram
                  ? `${labels.telegram}: ${
                      values.hideTelegram ? labels.hidden : labels.visible
                    }`
                  : null,
                values.whatsapp
                  ? `${labels.whatsapp}: ${
                      values.hideWhatsapp ? labels.hidden : labels.visible
                    }`
                  : null,
              ]
                .filter(Boolean)
                .map((item) => (
                  <MicroLabel key={String(item)} light={isLight}>
                    <StatusDot light={isLight} />
                    {item}
                  </MicroLabel>
                ))}
            </div>
          </Panel>
        </div>
      </EditorBlock>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="cb-profile-editor mx-auto w-full max-w-[1320px] space-y-4 tracking-normal"
    >
      {showHeader ? (
        <Card light={isLight} className="overflow-hidden">
          <div className="p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <MicroLabel light={isLight} active accentColor={accentColor}>
                <StatusDot light={isLight} active accentColor={accentColor} />
                {labels.badge}
              </MicroLabel>

              <MicroLabel
                light={isLight}
                active={completionPercent >= 90}
                accentColor={publicAccentColor}
              >
                <StatusDot
                  light={isLight}
                  active={completionPercent >= 90}
                  accentColor={publicAccentColor}
                />
                {completionPercent}% {labels.filled}
              </MicroLabel>

              <MicroLabel light={isLight}>
                <StatusDot light={isLight} />
                {demoMode ? 'Demo' : 'Live'}
              </MicroLabel>
            </div>

            <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
              <div className="min-w-0">
                <h2
                  className={cn(
                    'max-w-[820px] text-[30px] font-semibold leading-[0.98] tracking-[-0.035em] md:text-[42px]',
                    pageText(isLight),
                  )}
                >
                  {labels.title}
                </h2>

                <p className={cn('mt-3 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
                  {labels.description}
                </p>

                <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
                  <div
                    className={cn(
                      'flex h-8 min-w-0 max-w-full items-center gap-2 rounded-[9px] border px-3',
                      isLight
                        ? 'border-black/[0.08] bg-white text-black/54'
                        : 'border-white/[0.08] bg-white/[0.04] text-white/48',
                    )}
                  >
                    <Link2 className="size-3.5 shrink-0" />
                    <span className="truncate text-[11.5px] font-medium">
                      {publicPath}
                    </span>
                  </div>

                  <CopyIconButton
                    light={isLight}
                    copied={copied}
                    onClick={handleCopyLink}
                    copyLabel={labels.copy}
                    copiedLabel={labels.copied}
                  />

                  <ActionLink href={publicPath} light={isLight}>
                    <ExternalLink className="size-3.5" />
                    {labels.preview}
                  </ActionLink>

                  <ActionLink href={reviewPath} light={isLight}>
                    <Quote className="size-3.5" />
                    {labels.reviewLink}
                  </ActionLink>

                  <CopyIconButton
                    light={isLight}
                    copied={reviewCopied}
                    onClick={handleCopyReviewLink}
                    copyLabel={labels.copy}
                    copiedLabel={labels.copied}
                  />
                </div>
              </div>

              {showOverviewCards ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <CompactStat
                    label={labels.readiness}
                    value={`${completionPercent}%`}
                    hint={labels.filled}
                    light={isLight}
                  />
                  <CompactStat
                    label={labels.servicesCount}
                    value={services.length}
                    hint={labels.offer}
                    light={isLight}
                  />
                  <CompactStat
                    label={labels.worksCount}
                    value={cleanWorks.length}
                    hint={labels.gallery}
                    light={isLight}
                  />
                  <CompactStat
                    label={labels.contactsCount}
                    value={contactCount}
                    hint={labels.contacts}
                    light={isLight}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <ProgressLine value={completionPercent} light={isLight} color={accentColor} />
            </div>
          </div>
        </Card>
      ) : null}

      <div
        className={cn(
          'grid gap-4',
          showPreviewPanel
            ? 'xl:grid-cols-[292px_minmax(0,1fr)_330px]'
            : 'xl:grid-cols-[292px_minmax(0,1fr)]',
        )}
      >
        <aside className="hidden min-w-0 self-start xl:block">
          <Card light={isLight} className="sticky top-5 max-h-[calc(100dvh-40px)] overflow-y-auto">
            <CardTitle
              title={labels.formTitle}
              description={labels.formDescription}
              light={isLight}
            />

            <div className="p-2">
              {navItems.map((item) => {
                const active = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchSection(item.id)}
                    className={cn(
                      'group relative flex w-full items-start gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition active:scale-[0.99]',
                      active
                        ? isLight
                          ? 'bg-black/[0.045] text-black'
                          : 'bg-white/[0.075] text-white'
                        : isLight
                          ? 'text-black/54 hover:bg-black/[0.03] hover:text-black'
                          : 'text-white/44 hover:bg-white/[0.055] hover:text-white',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-[9px] border transition',
                        active
                          ? isLight
                            ? 'border-black/[0.10] bg-white text-black'
                            : 'border-white/[0.12] bg-white/[0.09] text-white'
                          : isLight
                            ? 'border-black/[0.07] bg-white text-black/42'
                            : 'border-white/[0.08] bg-white/[0.04] text-white/38',
                      )}
                    >
                      {item.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                          {item.done ? (
                            <span className="inline-flex size-2 shrink-0 rounded-full animate-pulse" style={{ background: accentColor }} />
                          ) : null}
                          <span className="truncate text-[12px] font-semibold tracking-[-0.005em]">
                            {item.title}
                          </span>
                        </span>

                        {item.badge !== undefined ? (
                          <span
                            className={cn(
                              'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[7px] border px-1.5 text-[9.5px] font-semibold',
                              isLight
                                ? 'border-black/[0.07] bg-white text-black/42'
                                : 'border-white/[0.08] bg-white/[0.04] text-white/40',
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </span>

                      <span className={cn('mt-1 line-clamp-2 text-[10px] leading-4', mutedText(isLight))}>
                        {item.description}
                      </span>
                    </span>

                  </button>
                );
              })}
            </div>
          </Card>
        </aside>

        <main className="min-w-0 space-y-4">
          <Card light={isLight} className="overflow-hidden xl:hidden">
            <div className={cn('border-b p-3 md:p-4', borderTone(isLight))}>
              <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                {labels.formTitle}
              </div>
              <div className={cn('mt-1 text-[10.5px]', mutedText(isLight))}>
                {labels.formDescription}
              </div>
            </div>

            <div className="overflow-x-auto px-3 py-3">
              <ControlGroup light={isLight}>
                {navItems.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.shortTitle}
                    icon={item.icon}
                    active={activeSection === item.id}
                    onClick={() => switchSection(item.id)}
                    light={isLight}
                    accentColor={accentColor}
                    badge={item.badge}
                  />
                ))}
              </ControlGroup>
            </div>
          </Card>

          <Card light={isLight} className="overflow-hidden">
            {renderActiveSection()}

            {error ? (
              <div
                className={cn(
                  'border-t px-4 py-3 text-[12px] text-destructive',
                  borderTone(isLight),
                )}
              >
                {error}
              </div>
            ) : null}

            <div className={cn('border-t p-4', borderTone(isLight))}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-wrap gap-2">
                  <ActionLink href="/dashboard" light={isLight}>
                    <ArrowLeft className="size-3.5" />
                    {labels.back}
                  </ActionLink>

                  <ActionLink href={servicesPageHref} light={isLight}>
                    <Sparkles className="size-3.5" />
                    {labels.openServicesHub}
                  </ActionLink>
                </div>

                <div className="flex flex-wrap gap-2">
                  {nextNavItem ? (
                    <ActionButton light={isLight} onClick={() => switchSection(nextNavItem.id)}>
                      {labels.next}
                      <ChevronRight className="size-3.5" />
                    </ActionButton>
                  ) : null}

                  <ActionLink href={publicPath} light={isLight}>
                    <Globe2 className="size-3.5" />
                    {labels.preview}
                  </ActionLink>

                  <ActionButton light={isLight} active type="submit">
                    <Save className="size-3.5" />
                    {labels.save}
                  </ActionButton>
                </div>
              </div>
            </div>
          </Card>
        </main>

        {showPreviewPanel ? (
          <aside className="min-w-0 space-y-4">
            <div className="sticky top-4 space-y-4">
              <Card light={isLight} className="overflow-hidden">
                <CardTitle
                  title={labels.readiness}
                  description={`${completionPercent}% ${labels.filled}`}
                  light={isLight}
                />

                <div className="p-3">
                  <ProgressLine value={completionPercent} light={isLight} color={accentColor} />

                  <div className="mt-3 space-y-1">
                    {checklistItems.map((item) => (
                      <button
                        key={item.section}
                        type="button"
                        onClick={() => switchSection(item.section)}
                        className={cn(
                          'group flex w-full items-center justify-between gap-3 rounded-[10px] px-2.5 py-2 text-left transition active:scale-[0.99]',
                          activeSection === item.section
                            ? isLight
                              ? 'bg-black/[0.045]'
                              : 'bg-white/[0.07]'
                            : isLight
                              ? 'hover:bg-black/[0.03]'
                              : 'hover:bg-white/[0.055]',
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-[8px] border',
                              item.done
                                ? isLight
                                  ? 'border-black/[0.09] bg-black/[0.045] text-black'
                                  : 'border-white/[0.10] bg-white/[0.08] text-white'
                                : isLight
                                  ? 'border-black/[0.07] bg-white text-black/34'
                                  : 'border-white/[0.07] bg-white/[0.035] text-white/32',
                            )}
                          >
                            {item.done ? (
                              <Check className="size-3.5" />
                            ) : (
                              <span className="size-1.5 rounded-full bg-current opacity-45" />
                            )}
                          </span>

                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block truncate text-[11.5px] font-semibold tracking-[-0.005em]',
                                pageText(isLight),
                              )}
                            >
                              {item.label}
                            </span>

                            <span className={cn('mt-0.5 block truncate text-[9.5px]', mutedText(isLight))}>
                              {item.hint}
                            </span>
                          </span>
                        </span>

                        <span
                          className={cn(
                            'shrink-0 text-[10.5px] font-semibold',
                            item.done ? pageText(isLight) : faintText(isLight),
                          )}
                        >
                          {item.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <PreviewCard
                profile={previewProfile}
                light={isLight}
                labels={labels}
                averageRating={averageRating}
                publicPath={publicPath}
                copied={copied}
                onCopy={handleCopyLink}
              />

              <Card light={isLight} className="overflow-hidden">
                <div className="p-3">
                  <div className={cn('text-[12px] font-semibold', pageText(isLight))}>
                    {labels.quickActions}
                  </div>

                  <div className={cn('mt-1 text-[10.5px] leading-4', mutedText(isLight))}>
                    {labels.quickActionsText}
                  </div>

                  <div className="mt-3 grid gap-2">
                    <ActionButton light={isLight} active type="submit" className="w-full">
                      <Save className="size-3.5" />
                      {labels.save}
                    </ActionButton>

                    <ActionLink href={publicPath} light={isLight} className="w-full">
                      <Globe2 className="size-3.5" />
                      {labels.preview}
                    </ActionLink>

                    <ActionLink href={servicesPageHref} light={isLight} className="w-full">
                      <Sparkles className="size-3.5" />
                      {labels.openServicesHub}
                    </ActionLink>
                  </div>
                </div>
              </Card>
            </div>
          </aside>
        ) : null}
      </div>
    </form>
  );
}
