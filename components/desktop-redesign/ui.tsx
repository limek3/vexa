'use client';

import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import { Check as CheckIcon, Inbox, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? '?'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

const avatarTints = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];

export function avatarTint(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return avatarTints[hash % avatarTints.length];
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  kind?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
};

export function Button({
  children,
  icon: Icon,
  kind = 'secondary',
  size = 'md',
  iconOnly,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('pora-btn', `pora-btn-${kind}`, `pora-btn-${size}`, iconOnly && 'is-icon', className)}
      {...props}
    >
      {Icon ? <Icon size={size === 'lg' ? 16 : 14} aria-hidden="true" /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  hasDot?: boolean;
};

export function IconButton({ icon: Icon, label, active, hasDot, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn('pora-icon-btn', active && 'is-active', className)}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={16} aria-hidden="true" />
      {hasDot ? <span className="pora-dot-alert" /> : null}
    </button>
  );
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return <span className={cn('pora-avatar', `pora-avatar-${size}`, avatarTint(name), className)}>{initials(name)}</span>;
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return <span className={cn('pora-badge', `is-${tone}`, className)}>{children}</span>;
}

export function Card({
  children,
  title,
  subtitle,
  actions,
  flush,
  className,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('pora-card', flush && 'is-flush', className)}>
      {title || subtitle || actions ? (
        <header className="pora-card-head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="pora-card-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="pora-card-body">{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="pora-page-head">
      <div>
        {eyebrow ? <p className="pora-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <div className="pora-page-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="pora-page-actions">{actions}</div> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  unit,
  delta,
  deltaKind,
  sparkline,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaKind?: 'up' | 'down' | 'neutral';
  sparkline?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="pora-metric">
      <div className="pora-metric-label">
        <span>{label}</span>
        {hint ? (
          <span title={hint}>
            <Info size={12} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="pora-metric-value">
        {value}
        {unit ? <span>{unit}</span> : null}
      </div>
      {delta ? <div className={cn('pora-metric-delta', deltaKind && `is-${deltaKind}`)}>{delta}</div> : null}
      {sparkline ? <div className="pora-metric-spark">{sparkline}</div> : null}
    </div>
  );
}

export function Spark({
  values,
  color = 'var(--p-accent)',
  height = 28,
  fill = true,
}: {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  if (values.length < 2) return null;
  const width = 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => [
    index * (width / (values.length - 1)),
    height - ((value - min) / range) * (height - 2) - 1,
  ]);
  const path = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const area = `${path} L${width} ${height} L0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="pora-spark">
      {fill ? <path d={area} fill={color} opacity="0.12" /> : null}
      <path d={path} stroke={color} strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: string; count?: number }>;
  className?: string;
}) {
  return (
    <div className={cn('pora-segmented', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={value === item.value ? 'is-active' : undefined}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined ? <span>{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: string; count?: number }>;
}) {
  return (
    <div className="pora-tabs">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={value === item.value ? 'is-active' : undefined}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined ? <span>{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" className={cn('pora-switch', checked && 'is-on')} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function Check({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" className={cn('pora-check', checked && 'is-on')} onClick={() => onChange(!checked)}>
      {checked ? <CheckIcon size={12} aria-hidden="true" /> : null}
    </button>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="pora-empty">
      <span>
        <Icon size={20} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('pora-field', className)}>
      <span>{label}</span>
      {children}
      {hint ? <em>{hint}</em> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('pora-input', className)} {...props} />;
}

export function Progress({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'success' | 'warning' | 'danger' }) {
  return (
    <span className={cn('pora-progress', `is-${tone}`)}>
      <span style={{ '--p-progress': `${Math.max(0, Math.min(value, 100))}%` } as CSSProperties} />
    </span>
  );
}

export function formatMoney(value: number) {
  return value === 0 ? 'бесплатно' : `${value.toLocaleString('ru-RU')} ₽`;
}

export function pluralize(value: number, one: string, few: string, many: string) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}
