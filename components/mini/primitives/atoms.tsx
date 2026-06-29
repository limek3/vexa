'use client';

import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { haptic } from '../bridge';
import { useTheme } from '../theme';

const lucideIcons = Lucide as unknown as Record<string, LucideIcon | undefined>;
const getLucideIcon = (name: string): LucideIcon => (
  lucideIcons[name] ?? lucideIcons.Circle ?? ((() => null) as unknown as LucideIcon)
);

const ICONS: Record<string, LucideIcon> = {
  'alert-circle': getLucideIcon('AlertCircle'),
  'arrow-down-left': getLucideIcon('ArrowDownLeft'),
  'arrow-down-right': getLucideIcon('ArrowDownRight'),
  'arrow-left': getLucideIcon('ArrowLeft'),
  'arrow-up-right': getLucideIcon('ArrowUpRight'),
  'badge-check': getLucideIcon('BadgeCheck'),
  'bar-chart-3': getLucideIcon('BarChart3'),
  bell: getLucideIcon('Bell'),
  'bell-check': lucideIcons.BellCheck ?? getLucideIcon('Bell'),
  'book-open': getLucideIcon('BookOpen'),
  bot: getLucideIcon('Bot'),
  calendar: getLucideIcon('Calendar'),
  'calendar-check': getLucideIcon('CalendarCheck'),
  'calendar-clock': getLucideIcon('CalendarClock'),
  'calendar-days': getLucideIcon('CalendarDays'),
  'calendar-plus': getLucideIcon('CalendarPlus'),
  'calendar-x': getLucideIcon('CalendarX'),
  check: getLucideIcon('Check'),
  'check-check': getLucideIcon('CheckCheck'),
  'check-circle': getLucideIcon('CheckCircle2'),
  'chevron-left': getLucideIcon('ChevronLeft'),
  'chevron-right': getLucideIcon('ChevronRight'),
  'circle-off': getLucideIcon('CircleOff'),
  clock: getLucideIcon('Clock3'),
  code: getLucideIcon('Code2'),
  copy: getLucideIcon('Copy'),
  'copy-plus': getLucideIcon('CopyPlus'),
  'credit-card': getLucideIcon('CreditCard'),
  'file-text': getLucideIcon('FileText'),
  gauge: getLucideIcon('Gauge'),
  home: getLucideIcon('Home'),
  info: getLucideIcon('Info'),
  instagram: getLucideIcon('Circle'),
  list: getLucideIcon('List'),
  'list-plus': getLucideIcon('ListPlus'),
  'loader-circle': getLucideIcon('LoaderCircle'),
  'log-out': getLucideIcon('LogOut'),
  'mail-question': getLucideIcon('MailQuestion'),
  'map-pin': getLucideIcon('MapPin'),
  megaphone: getLucideIcon('Megaphone'),
  menu: getLucideIcon('Menu'),
  'message-circle': getLucideIcon('MessageCircle'),
  'message-square': getLucideIcon('MessageSquare'),
  'messages-square': getLucideIcon('MessagesSquare'),
  moon: getLucideIcon('Moon'),
  'more-horizontal': getLucideIcon('MoreHorizontal'),
  palette: getLucideIcon('Palette'),
  phone: getLucideIcon('Phone'),
  plug: getLucideIcon('Plug'),
  plus: getLucideIcon('Plus'),
  'qr-code': getLucideIcon('QrCode'),
  'receipt-text': getLucideIcon('ReceiptText'),
  reply: getLucideIcon('Reply'),
  search: getLucideIcon('Search'),
  'search-x': getLucideIcon('SearchX'),
  send: getLucideIcon('Send'),
  'settings-2': getLucideIcon('Settings2'),
  'shield-check': getLucideIcon('ShieldCheck'),
  sparkles: getLucideIcon('Sparkles'),
  star: getLucideIcon('Star'),
  sun: getLucideIcon('Sun'),
  'trash-2': getLucideIcon('Trash2'),
  user: getLucideIcon('User'),
  users: getLucideIcon('Users'),
  wallet: getLucideIcon('Wallet'),
  x: getLucideIcon('X'),
  'x-circle': getLucideIcon('XCircle'),
  zap: getLucideIcon('Zap'),
};

function glassBg(mode: 'dark' | 'light', elevated = false) {
  if (mode === 'dark') {
    return elevated ? 'rgba(20,20,22,0.84)' : 'rgba(17,17,19,0.76)';
  }
  return elevated ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.84)';
}

function softBorder(mode: 'dark' | 'light') {
  return mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,10,0.06)';
}

export function Icon({
  name,
  size = 16,
  color,
  stroke = 1.85,
}: {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  const { T } = useTheme();
  const Lucide = ICONS[name] ?? getLucideIcon('Circle');
  return <Lucide size={size} color={color ?? T.text2} strokeWidth={stroke} />;
}

export function Card({
  children,
  padded = true,
  style,
  onClick,
}: {
  children: ReactNode;
  padded?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const { T } = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        boxShadow: T.cardShadow,
        padding: padded ? 16 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  const { T } = useTheme();
  return <div style={{ height: 1, background: T.border, width: '100%', ...style }} />;
}

export function FieldLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const { T } = useTheme();
  return (
    <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const { T } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>{subtitle}</div> : null}
      </div>
      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
  radius = 12,
}: {
  name: string;
  src?: string;
  size?: number;
  radius?: number;
}) {
  const { T, mode } = useTheme();
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '•';
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '•';
  }, [name]);

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      overflow: 'hidden',
      flexShrink: 0,
      background: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(10,10,10,0.05)',
      border: `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.text,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      userSelect: 'none',
    }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <span style={{ fontSize: Math.max(12, Math.round(size * 0.34)) }}>{initials}</span>
      )}
    </div>
  );
}

export function NavBtn({ icon, onClick }: { icon: string; onClick?: () => void }) {
  const { T, mode } = useTheme();
  return (
    <button
      onClick={() => { haptic('light'); onClick?.(); }}
      style={{
        width: 34,
        height: 34,
        borderRadius: 11,
        border: `1px solid ${T.border}`,
        background: mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(10,10,10,0.035)',
        color: T.text2,
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

export function NeutralBtn({
  children,
  icon,
  full,
  tone = 'default',
  style,
  onClick,
}: {
  children: ReactNode;
  icon?: string;
  full?: boolean;
  tone?: 'default' | 'danger';
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const { T, mode } = useTheme();
  const danger = tone === 'danger';
  return (
    <button
      onClick={() => { haptic(danger ? 'warning' : 'light'); onClick?.(); }}
      style={{
        width: full ? '100%' : undefined,
        minHeight: 42,
        padding: '11px 14px',
        borderRadius: 13,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.22)' : mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,10,0.07)'}`,
        background: mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(10,10,10,0.035)',
        color: danger ? T.danger : T.text,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={15} color={danger ? T.danger : T.text2} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function Toggle({
  on,
  onChange,
  size = 'md',
}: {
  on: boolean;
  onChange: (value: boolean) => void;
  size?: 'sm' | 'md';
}) {
  const { T } = useTheme();
  const width = size === 'sm' ? 34 : 40;
  const height = size === 'sm' ? 20 : 24;
  const knob = size === 'sm' ? 14 : 18;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      style={{
        width,
        height,
        borderRadius: 999,
        border: 'none',
        padding: 0,
        background: on ? T.accent : T.text3,
        opacity: on ? 1 : 0.35,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.15s ease',
      }}
    >
      <span style={{
        position: 'absolute',
        top: (height - knob) / 2,
        left: on ? width - knob - ((height - knob) / 2) : (height - knob) / 2,
        width: knob,
        height: knob,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        transition: 'left 0.16s ease',
      }} />
    </button>
  );
}

export function Pill({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const { T, mode } = useTheme();
  return (
    <button
      onClick={() => { haptic('light'); onClick?.(); }}
      style={{
        borderRadius: 999,
        padding: '9px 12px',
        border: `1px solid ${active ? T.accent : softBorder(mode)}`,
        background: active ? T.accentSoft : (mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(10,10,10,0.03)'),
        color: active ? T.accent : T.text2,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

export function StatusDot({ status }: { status?: string }) {
  const { T } = useTheme();
  let bg = T.text3;
  if (status === 'in-focus') bg = T.accent;
  else if (status === 'scheduled') bg = T.warn;
  else if (status === 'completed') bg = T.success;
  else if (status === 'cancelled' || status === 'no_show') bg = T.danger;
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: bg, flexShrink: 0 }} />;
}

export function ChannelTag({ channel }: { channel?: string }) {
  const { T } = useTheme();
  const text = channel || '—';
  const upper = text.toUpperCase();
  let bg = T.cardElev;
  let color = T.text2;
  let border = T.border;
  if (upper === 'TG' || upper.includes('TELEGRAM')) {
    bg = 'rgba(18,125,254,0.12)';
    color = '#127dfe';
    border = 'rgba(18,125,254,0.18)';
  } else if (upper === 'ВК' || upper === 'VK') {
    bg = 'rgba(39,135,245,0.10)';
    color = '#2787f5';
    border = 'rgba(39,135,245,0.16)';
  } else if (upper === 'WEB' || upper.includes('САЙТ')) {
    bg = 'rgba(16,185,129,0.10)';
    color = '#10b981';
    border = 'rgba(16,185,129,0.16)';
  } else if (upper === 'IG' || upper.includes('INST')) {
    bg = 'rgba(236,72,153,0.10)';
    color = '#ec4899';
    border = 'rgba(236,72,153,0.16)';
  } else if (upper === 'VIP') {
    bg = 'rgba(245,158,11,0.12)';
    color = '#f59e0b';
    border = 'rgba(245,158,11,0.18)';
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 20,
      padding: '0 8px',
      borderRadius: 999,
      background: bg,
      border: `1px solid ${border}`,
      color,
      fontSize: 10,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }}>{text}</span>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { T, mode } = useTheme();
  return (
    <div style={{
      height: 44,
      borderRadius: 14,
      border: `1px solid ${softBorder(mode)}`,
      background: mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.92)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 12px',
      boxShadow: mode === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.025)' : '0 1px 1px rgba(15,23,42,0.03)',
    }}>
      <Icon name="search" size={16} color={T.text3} />
      <input
        className="cb-mini-transparent cb-mini-input-reset"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: T.text,
          fontSize: 14,
          fontFamily: 'inherit',
          padding: 0,
        }}
      />
      {value ? (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.text3, display: 'flex' }}>
          <Icon name="x" size={14} color={T.text3} />
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  const { T, mode } = useTheme();
  return (
    <div style={{
      padding: '28px 18px',
      borderRadius: 18,
      border: `1px dashed ${softBorder(mode)}`,
      background: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.58)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 10,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(10,10,10,0.04)',
        border: `1px solid ${softBorder(mode)}`,
      }}>
        <Icon name={icon} size={19} color={T.text2} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{title}</div>
      {text ? <div style={{ maxWidth: 260, fontSize: 12, lineHeight: 1.55, color: T.text2 }}>{text}</div> : null}
      {action ? <div style={{ marginTop: 2 }}>{action}</div> : null}
    </div>
  );
}

export function ListRow({
  icon,
  label,
  sub,
  danger,
  accent,
  onClick,
}: {
  icon?: string;
  label: string;
  sub?: string;
  danger?: boolean;
  accent?: boolean;
  onClick?: () => void;
}) {
  const { T, mode } = useTheme();
  return (
    <div
      onClick={() => { haptic(danger ? 'warning' : 'light'); onClick?.(); }}
      style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: onClick ? 'pointer' : 'default' }}
    >
      {icon ? (
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          border: `1px solid ${softBorder(mode)}`,
          background: danger
            ? 'rgba(239,68,68,0.08)'
            : accent
              ? T.accentSoft
              : (mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(10,10,10,0.035)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: danger ? T.danger : accent ? T.accent : T.text2,
          flexShrink: 0,
        }}>
          <Icon name={icon} size={15} color={danger ? T.danger : accent ? T.accent : T.text2} />
        </div>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: danger ? T.danger : T.text }}>{label}</div>
        {sub ? <div style={{ fontSize: 11, color: T.text3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div> : null}
      </div>
      <Icon name="chevron-right" size={15} color={T.text3} />
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const { T } = useTheme();
  return (
    <div style={{ padding: '16px 16px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {onBack ? <NavBtn icon="chevron-left" onClick={onBack} /> : null}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 13, color: T.text2, marginTop: 2 }}>{subtitle}</div> : null}
      </div>
    </div>
  );
}

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  maxHeight?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  maxHeight = 'min(78vh, calc(100dvh - 112px))',
}: BottomSheetProps) {
  const { T, mode } = useTheme();

  const panelBg = glassBg(mode, true);
  const border = softBorder(mode);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 240,
              background: mode === 'dark' ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
            }}
          />

          <div
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 0,
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 390,
              padding: '0 8px calc(8px + var(--miniapp-safe-bottom, var(--tg-safe-bottom, env(safe-area-inset-bottom, 0px))))',
              zIndex: 260,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.99 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 22, opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.23, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                borderRadius: 26,
                border: `1px solid ${border}`,
                background: panelBg,
                backdropFilter: 'blur(22px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
                boxShadow: mode === 'dark'
                  ? '0 -12px 42px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.06)'
                  : '0 -10px 36px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.86)',
                overflow: 'hidden',
                transform: 'translateZ(0)',
                willChange: 'transform, opacity',
              }}
            >
              <div style={{ padding: '10px 16px 12px', borderBottom: title || subtitle ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ width: 40, height: 4, borderRadius: 999, background: T.text3, opacity: 0.35, margin: '0 auto 10px' }} />
                {(title || subtitle) ? (
                  <div style={{ textAlign: 'center', padding: '0 12px' }}>
                    {title ? <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>{title}</div> : null}
                    {subtitle ? <div style={{ fontSize: 12, lineHeight: 1.45, color: T.text2, marginTop: 5 }}>{subtitle}</div> : null}
                  </div>
                ) : null}
              </div>

              <div style={{ maxHeight, overflowY: 'auto', overflowX: 'hidden', padding: '16px 0 10px' }}>{children}</div>

              {footer ? (
                <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${T.border}`, background: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)' }}>
                  {footer}
                </div>
              ) : null}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

interface ActionItem {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  tone?: 'primary' | 'danger';
  onClick: () => void;
}

export function ActionSheet({
  open,
  onClose,
  title,
  subtitle,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions: ActionItem[];
}) {
  const { T, mode } = useTheme();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxHeight="min(58vh, calc(100dvh - 140px))"
      footer={<NeutralBtn full onClick={onClose}>Отмена</NeutralBtn>}
    >
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {actions.map((action) => {
          const danger = action.tone === 'danger';
          const primary = action.tone === 'primary';
          return (
            <button
              key={action.id}
              onClick={() => { haptic(danger ? 'warning' : 'medium'); action.onClick(); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 14px',
                borderRadius: 16,
                border: `1px solid ${danger ? 'rgba(239,68,68,0.18)' : primary ? T.accentSoft : softBorder(mode)}`,
                background: danger
                  ? 'rgba(239,68,68,0.07)'
                  : primary
                    ? T.accentSoft
                    : (mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.72)'),
                color: danger ? T.danger : primary ? T.accent : T.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: danger
                  ? 'rgba(239,68,68,0.10)'
                  : primary
                    ? 'rgba(18,125,254,0.10)'
                    : (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(10,10,10,0.04)'),
                border: `1px solid ${danger ? 'rgba(239,68,68,0.16)' : primary ? 'rgba(18,125,254,0.16)' : softBorder(mode)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {action.icon ? <Icon name={action.icon} size={16} color={danger ? T.danger : primary ? T.accent : T.text2} /> : <Icon name="check" size={16} color={danger ? T.danger : primary ? T.accent : T.text2} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{action.label}</div>
                {action.sub ? <div style={{ fontSize: 11, color: danger ? `${T.danger}cc` : T.text3, marginTop: 3, lineHeight: 1.45 }}>{action.sub}</div> : null}
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
