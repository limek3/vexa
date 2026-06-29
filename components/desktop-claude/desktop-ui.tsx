'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Copy,
  Crown,
  Edit3,
  Eye,
  FileText,
  Globe2,
  Home,
  ImageIcon,
  Link2,
  LogOut,
  Mail,
  MessageCircle,
  Mic,
  Minus,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Paintbrush,
  Palette,
  Paperclip,
  Phone,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Smile,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Users,
  X,
  Zap,
  Scissors,
  Clock,
  CreditCard,
  Filter,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Pin,
  Grid3X3,
  List,
  Tag,
  Info,
} from 'lucide-react';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const icons = {
  home: Home,
  calendar: CalendarDays,
  users: Users,
  chat: MessageCircle,
  services: Scissors,
  chart: BarChart3,
  page: FileText,
  star: Star,
  gear: Settings,
  search: Search,
  bell: Bell,
  plus: Plus,
  minus: Minus,
  x: X,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-up-right': ArrowUpRight,
  phone: Phone,
  mail: Mail,
  send: Send,
  paperclip: Paperclip,
  filter: Filter,
  more: MoreHorizontal,
  'more-v': MoreVertical,
  edit: Edit3,
  trash: Trash2,
  copy: Copy,
  sun: Sun,
  moon: Moon,
  clock: Clock,
  tag: Tag,
  link: Link2,
  eye: Eye,
  play: Play,
  sparkle: Sparkles,
  zap: Zap,
  info: Info,
  help: CircleHelp,
  shield: Shield,
  card: CreditCard,
  globe: Globe2,
  logout: LogOut,
  image: ImageIcon,
  palette: Palette,
  crown: Crown,
  logo: Clock,
  pin: Pin,
  list: List,
  grid: Grid3X3,
  mic: Mic,
  smile: Smile,
} as const;

export type IconName = keyof typeof icons | string;

export function Icon({ name, size = 16, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  const Component = icons[name as keyof typeof icons] ?? CircleHelp;
  return <Component size={size} className={className} style={style} strokeWidth={1.7} />;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function avatarTint(name: string) {
  const tints = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return tints[hash % tints.length];
}

export function Avatar({ name, size, src, className }: { name: string; size?: 'lg' | 'xl'; src?: string; className?: string }) {
  return (
    <div className={cn('ckd-avatar', size, avatarTint(name), className)}>
      {src ? <img src={src} alt={name} /> : initials(name)}
    </div>
  );
}

export function Badge({ children, kind = 'plain', className }: { children: ReactNode; kind?: string; className?: string }) {
  return <span className={cn('ckd-badge', kind, className)}>{children}</span>;
}

export function Button({ variant = 'secondary', size, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger'; size?: 'sm' | 'lg' | 'icon' }) {
  return (
    <button className={cn('ckd-btn', `ckd-btn-${variant}`, size, className)} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className, hoverable = false, flush = false }: { children: ReactNode; className?: string; hoverable?: boolean; flush?: boolean }) {
  return <section className={cn('ckd-card', hoverable && 'hoverable', flush && 'flush', className)}>{children}</section>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input ref={ref} {...props} className={cn('ckd-input', props.className)} />;
});

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('ckd-textarea', props.className)} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="ckd-field">
      <span className="ckd-field-label">{label}</span>
      {children}
      {hint ? <span className="ckd-field-hint">{hint}</span> : null}
    </label>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="ckd-page-head">
      <div>
        <h1 className="ckd-page-title">{title}</h1>
        {subtitle ? <p className="ckd-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ckd-page-actions">{actions}</div> : null}
    </header>
  );
}

export function Metric({ label, value, delta, up }: { label: string; value: ReactNode; delta?: string; up?: boolean }) {
  return (
    <Card className="ckd-metric" hoverable>
      <div className="ckd-muted">{label}</div>
      <div className="ckd-metric-value">{value}</div>
      {delta ? <div className={cn('ckd-delta', up ? 'up' : 'down')}>{up ? '+' : ''}{delta}</div> : null}
    </Card>
  );
}

export function EmptyState({ icon = 'sparkle', title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <Card className="ckd-empty">
      <div className="ckd-empty-icon"><Icon name={icon} /></div>
      <div className="ckd-section-title">{title}</div>
      {text ? <p className="ckd-section-sub">{text}</p> : null}
      {action ? <div>{action}</div> : null}
    </Card>
  );
}

export function Tabs<T extends string>({ value, items, onChange }: { value: T; items: Array<{ value: T; label: string; count?: number }>; onChange: (value: T) => void }) {
  return (
    <div className="ckd-tabs">
      {items.map((item) => (
        <button key={item.value} className={cn(value === item.value && 'active')} onClick={() => onChange(item.value)} type="button">
          {item.label}
          {item.count != null ? <span>{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({ value, items, onChange }: { value: T; items: Array<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return (
    <div className="ckd-segmented">
      {items.map((item) => (
        <button key={item.value} className={cn(value === item.value && 'active')} onClick={() => onChange(item.value)} type="button">
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button className="ckd-switch" data-on={checked ? '1' : '0'} onClick={() => onChange(!checked)} type="button" aria-pressed={checked}>
      <i />
    </button>
  );
}

export function Progress({ value }: { value: number }) {
  return <div className="ckd-progress"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function Spark({ values = [22, 34, 28, 45, 42, 60, 54], tone = 'accent' }: { values?: number[]; tone?: string }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${36 - (value / max) * 30}`).join(' ');
  return (
    <svg className={cn('ckd-spark', tone)} viewBox="0 0 100 38" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
