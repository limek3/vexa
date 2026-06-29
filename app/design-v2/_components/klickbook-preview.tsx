// @ts-nocheck
'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

// КликБук — icon set (lucide-style, stroke 1.5)
const Icon = ({ d, size = 16, stroke = 1.5, fill = "none", children, style, ...rest }) => (
  <svg
    {...rest}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}
  >
    {children || <path d={d} />}
  </svg>
);

const I = {
  Home: (p) => <Icon {...p}><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v4M16 3v4"/></Icon>,
  Users: (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  Chat: (p) => <Icon {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></Icon>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3v3M12 18v3M5 12H2M22 12h-3M5.6 5.6 7.7 7.7M16.3 16.3l2.1 2.1M5.6 18.4 7.7 16.3M16.3 7.7l2.1-2.1"/></Icon>,
  Scissors: (p) => <Icon {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></Icon>,
  BarChart: (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 16V10M12 16V6M17 16v-4"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>,
  Inbox: (p) => <Icon {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></Icon>,
  Phone: (p) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></Icon>,
  Paperclip: (p) => <Icon {...p}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></Icon>,
  Filter: (p) => <Icon {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></Icon>,
  Check: (p) => <Icon {...p}><path d="m20 6-11 11-5-5"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  ChevronUp: (p) => <Icon {...p}><path d="m18 15-6-6-6 6"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  ArrowUp: (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>,
  ArrowUpRight: (p) => <Icon {...p}><path d="M7 7h10v10M7 17 17 7"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  MoreHorizontal: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></Icon>,
  MoreVertical: (p) => <Icon {...p}><circle cx="12" cy="5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/></Icon>,
  Edit: (p) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>,
  Tag: (p) => <Icon {...p}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></Icon>,
  Star: (p) => <Icon {...p}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>,
  Moon: (p) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>,
  Link: (p) => <Icon {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Image: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></Icon>,
  Mic: (p) => <Icon {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 19v3"/></Icon>,
  Smile: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></Icon>,
  CreditCard: (p) => <Icon {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Icon>,
  Coffee: (p) => <Icon {...p}><path d="M17 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h14v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M6 2v3M10 2v3M14 2v3"/></Icon>,
  Layout: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></Icon>,
  Grid: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></Icon>,
  List: (p) => <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></Icon>,
  Briefcase: (p) => <Icon {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Icon>,
  MapPin: (p) => <Icon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  AlertTriangle: (p) => <Icon {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></Icon>,
  Info: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></Icon>,
  Zap: (p) => <Icon {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
  TrendingUp: (p) => <Icon {...p}><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></Icon>,
  TrendingDown: (p) => <Icon {...p}><path d="m23 18-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/></Icon>,
  Command: (p) => <Icon {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></Icon>,
  PanelLeft: (p) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></Icon>,
  CalendarPlus: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v4M16 3v4M12 13v6M9 16h6"/></Icon>,
  Banknote: (p) => <Icon {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></Icon>,
  Wallet: (p) => <Icon {...p}><path d="M20 7H5a3 3 0 0 1 0-6h14v6z"/><path d="M21 13V7H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h15a2 2 0 0 0 2-2v-3"/><path d="M17 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></Icon>,
  Repeat: (p) => <Icon {...p}><path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></Icon>,
  Lock: (p) => <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>,
  Heart: (p) => <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Icon>,
  Pin: (p) => <Icon {...p}><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></Icon>,
  Logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></Icon>,
  Help: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></Icon>,
  Click: (p) => <Icon {...p}><path d="m9 9 5 12 1.8-5.2L21 14z"/><path d="M7.2 2.2 8 5.1M5.1 8 2.2 7.2M14 4.1 12 6M6 12l-1.9 2"/></Icon>,
  GripDots: (p) => <Icon {...p}><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></Icon>,
};



// КликБук — shared UI primitives
const { useState, useMemo } = React;

// Avatar — colored monogram. Hash by name → color.
function Avatar({ name = "", size = "md", src, color, className = "", style }) {
  const colors = ["amber", "mint", "rose", "sky", "lilac", "sand", "slate"];
  const idx = useMemo(() => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return Math.abs(h) % colors.length;
  }, [name]);
  const initials = name.split(" ").slice(0, 2).map(s => s[0] || "").join("").toUpperCase();
  const sizeCls = size === "sm" ? "sm" : size === "lg" ? "lg" : size === "xl" ? "xl" : "";
  const colorCls = color || `avatar-${colors[idx]}`;
  return (
    <span className={`avatar ${sizeCls} ${colorCls} ${className}`} style={style}>
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : initials || "?"}
    </span>
  );
}

function Badge({ kind = "neutral", dot, children, style }) {
  return (
    <span className={`badge badge-${kind}`} style={style}>
      {dot && <span className="badge-dot" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}

function StatusPill({ status, label }) {
  const labels = {
    confirmed: "Подтверждена",
    completed: "Завершена",
    pending: "Ждёт подтверждения",
    canceled: "Отменена",
    noshow: "Не пришёл",
  };
  return <span className={`status-pill status-${status}`}>{label || labels[status]}</span>;
}

function Btn({ kind = "secondary", size, icon, iconRight, kbd, children, onClick, style, className = "" }) {
  const sz = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  const ic = !children && icon ? "btn-icon" : "";
  return (
    <button className={`btn btn-${kind} ${sz} ${ic} ${className}`} onClick={onClick} style={style}>
      {icon}
      {children}
      {iconRight}
      {kbd && <span className="btn-kbd">{kbd}</span>}
    </button>
  );
}

function IconBtn({ icon, tip, badge, onClick }) {
  return (
    <button className="icon-btn" onClick={onClick} title={tip}>
      {icon}
      {badge && <span className="badge-dot" />}
    </button>
  );
}

function Input({ icon, placeholder, value, onChange, suffix, kbd, style }) {
  return (
    <div className="input-wrap" style={style}>
      {icon && <span className="input-ico">{icon}</span>}
      <input className="input" placeholder={placeholder} defaultValue={value} onChange={onChange} />
      {kbd && (
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
          <span className="sb-search-kbd">{kbd}</span>
        </span>
      )}
    </div>
  );
}

function Select({ value, icon, suffix, style }) {
  return (
    <button className="select" style={style}>
      {icon}
      <span>{value}</span>
    </button>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange && onChange(o.value)}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

function Tabs({ options, value, onChange, kind = "pill" }) {
  if (kind === "line") {
    return (
      <div className="tabs-line">
        {options.map(o => (
          <button key={o.value} className={`tab-line ${value === o.value ? "active" : ""}`} onClick={() => onChange && onChange(o.value)}>
            {o.icon}{o.label}
            {o.count != null && <span className="tab-count">{o.count}</span>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="tabs">
      {options.map(o => (
        <button key={o.value} className={`tab ${value === o.value ? "active" : ""}`} onClick={() => onChange && onChange(o.value)}>
          {o.label}
          {o.count != null && <span className="tab-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Card({ title, subtitle, actions, children, foot, flush, pad, headLine = true, style, className = "", bodyStyle }) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || actions) && (
        <div className="card-head" style={!headLine ? { borderBottom: 0 } : undefined}>
          {title && (
            <div>
              <div className="card-head-title">{title}</div>
              {subtitle && <div className="card-head-sub">{subtitle}</div>}
            </div>
          )}
          {actions && <div className="card-head-actions">{actions}</div>}
        </div>
      )}
      <div className={flush ? "card-body-flush" : pad ? "card-pad" : "card-body"} style={bodyStyle}>{children}</div>
      {foot && <div className="card-foot">{foot}</div>}
    </div>
  );
}

function KPI({ label, value, delta, deltaKind = "up", sub, icon }) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{icon}{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        {delta && (
          <span className={`delta delta-${deltaKind}`}>
            {deltaKind === "up" ? <I.ArrowUp size={11} stroke={2} /> : <I.ArrowDown size={11} stroke={2} />}
            {delta}
          </span>
        )}
        <span>{sub}</span>
      </div>
    </div>
  );
}

// Sparkline (SVG line)
function Sparkline({ data, width = 120, height = 32, kind = "accent" }) {
  const max = Math.max(...data), min = Math.min(...data);
  const xStep = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const y = height - 4 - ((v - min) / (max - min || 1)) * (height - 8);
    return [i * xStep, y];
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const dArea = `${d} L${width} ${height} L0 ${height} Z`;
  const color = kind === "success" ? "var(--success)" : kind === "danger" ? "var(--danger)" : "var(--accent)";
  const grad = `spark-${React.useId().replace(/:/g, "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea} fill={`url(#${grad})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Mini bars
function MiniBars({ data, highlight = -1 }) {
  const max = Math.max(...data) || 1;
  return (
    <div className="bars">
      {data.map((v, i) => (
        <div key={i} className={`bar ${i === highlight ? "hi" : ""}`} style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

// Chip (filter pill)
function Chip({ on, onClick, children, removable }) {
  return (
    <button className={`chip ${on ? "on" : ""}`} onClick={onClick}>
      {children}
      {removable && <I.X size={11} stroke={2} className="chip-x" />}
    </button>
  );
}

// Dropdown menu (purely visual — open state)
function Dropdown({ items, label, footer }) {
  return (
    <div className="dropdown">
      {label && <div className="dropdown-label">{label}</div>}
      {items.map((it, i) =>
        it.sep ? <div key={i} className="dropdown-sep" /> :
        <div key={i} className={`dropdown-item ${it.danger ? "danger" : ""}`}>
          {it.icon}
          <span>{it.label}</span>
          {it.kbd && <span className="dropdown-kbd">{it.kbd}</span>}
        </div>
      )}
      {footer}
    </div>
  );
}



// КликБук — App shell (sidebar + topbar)

function Sidebar({ active = "dashboard", theme, onTheme, masters = [], basePath = "/design-v2" }) {
  const items = [
    { id: "dashboard", href: `${basePath}/dashboard`, icon: <I.Home size={15} />, label: "Главная", kbd: "G D" },
    { id: "schedule", href: `${basePath}/schedule`, icon: <I.Calendar size={15} />, label: "Расписание", count: 14 },
    { id: "clients", href: `${basePath}/clients`, icon: <I.Users size={15} />, label: "Клиенты", count: "1.2k" },
    { id: "chats", href: `${basePath}/chats`, icon: <I.Chat size={15} />, label: "Чаты", dot: true },
    { id: "services", icon: <I.Sparkles size={15} />, label: "Услуги" },
    { id: "analytics", icon: <I.BarChart size={15} />, label: "Аналитика" },
  ];
  const settings = [
    { id: "settings", icon: <I.Settings size={15} />, label: "Настройки" },
    { id: "help", icon: <I.Help size={15} />, label: "Поддержка" },
  ];

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <span className="sb-brand-mark">
          <img src="/brand/clickbook-mark-dark-64.png" alt="" />
        </span>
        <span className="sb-brand-name">КликБук</span>
        <I.ChevronDown size={13} className="sb-brand-caret" />
      </div>

      <div className="sb-search">
        <I.Search size={13} />
        <span>Поиск</span>
        <span className="sb-search-kbd">⌘K</span>
      </div>

      <div className="sb-section-title">Рабочее место</div>
      <nav className="sb-nav">
        {items.map(it => (
          <a key={it.id} href={it.href || "#"} className={`sb-item ${active === it.id ? "active" : ""}`}>
            <span className="sb-ico">{it.icon}</span>
            <span>{it.label}</span>
            {it.count != null && <span className="sb-count">{it.count}</span>}
            {it.dot && <span className="sb-dot" />}
          </a>
        ))}
      </nav>

      <div className="sb-section-title">Команда</div>
      <nav className="sb-nav">
        {masters.map(m => (
          <div key={m.name} className="sb-item">
            <Avatar name={m.name} size="sm" style={{ width: 18, height: 18, fontSize: 9 }} />
            <span>{m.name}</span>
            <span className="sb-count" style={{ color: m.status === "online" ? "var(--success)" : "var(--text-3)" }}>
              {m.status === "online" ? "●" : "○"}
            </span>
          </div>
        ))}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <nav className="sb-nav">
          {settings.map(it => (
            <div key={it.id} className="sb-item">
              <span className="sb-ico">{it.icon}</span>
              <span>{it.label}</span>
            </div>
          ))}
        </nav>

        <div className="theme-switch">
          <button className={theme === "light" ? "on" : ""} onClick={() => onTheme && onTheme("light")}>
            <I.Sun size={11} /> Light
          </button>
          <button className={theme === "dark" ? "on" : ""} onClick={() => onTheme && onTheme("dark")}>
            <I.Moon size={11} /> Dark
          </button>
        </div>

        <div className="sb-foot-row">
          <Avatar name="Анна Носова" size="sm" />
          <div className="sb-foot-text">
            <div className="sb-foot-name">Анна Носова</div>
            <div className="sb-foot-sub">Студия «Контур»</div>
          </div>
          <I.ChevronUp size={13} style={{ color: "var(--text-3)" }} />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ crumbs = [], children, actions }) {
  return (
    <header className="topbar">
      <div className="topbar-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="topbar-crumb-sep">/</span>}
            <span className={i === crumbs.length - 1 ? "topbar-crumb-active" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      {children}
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        {actions || (
          <>
            <IconBtn icon={<I.Refresh size={15} />} tip="Обновить" />
            <IconBtn icon={<I.Inbox size={15} />} tip="Уведомления" badge />
            <Btn kind="primary" size="sm" icon={<I.Plus size={13} stroke={2} />} kbd="N">Новая запись</Btn>
          </>
        )}
      </div>
    </header>
  );
}

function AppShell({ children, active, theme, onTheme, crumbs, topbarActions, masters, basePath = "/design-v2" }) {
  return (
    <div className="kb-root" data-theme={theme}>
      <div className="app-shell">
        <Sidebar active={active} theme={theme} onTheme={onTheme} masters={masters} basePath={basePath} />
        <main className="main">
          <Topbar crumbs={crumbs} actions={topbarActions} />
          <div className="page">{children}</div>
        </main>
      </div>
    </div>
  );
}

const MASTERS = [
  { name: "Анна Н.", status: "online" },
  { name: "Кира В.", status: "online" },
  { name: "Лида М.", status: "offline" },
  { name: "Соня К.", status: "online" },
];



// КликБук — Dashboard

const BOOKINGS_TODAY = [
  { time: "09:00", duration: 45, client: "Марина Соколова", service: "Окрашивание корней", master: "Кира В.", status: "completed", price: 4200 },
  { time: "10:15", duration: 60, client: "Алина Петрова", service: "Маникюр · покрытие гель-лак", master: "Лида М.", status: "completed", price: 2800 },
  { time: "11:30", duration: 90, client: "Ольга Васнецова", service: "Стрижка + укладка", master: "Анна Н.", status: "confirmed", price: 3500, current: true },
  { time: "13:30", duration: 30, client: "Дарья Климова", service: "Брови · коррекция", master: "Соня К.", status: "confirmed", price: 1500 },
  { time: "14:30", duration: 120, client: "Юлия Беляева", service: "Тонирование + уход", master: "Кира В.", status: "pending", price: 5800 },
  { time: "17:00", duration: 60, client: "Ирина Мазур", service: "Маникюр · классический", master: "Лида М.", status: "confirmed", price: 2400 },
  { time: "18:30", duration: 45, client: "Анна Тимохина", service: "Укладка вечерняя", master: "Анна Н.", status: "confirmed", price: 2200 },
];

function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div className="page-eyebrow">Вторник · 14 января</div>
          <h1 className="page-title">Доброе утро, Анна 👋</h1>
          <div className="page-sub">7 записей сегодня · следующая через <span className="text-strong">38 минут</span> · 2 окна свободно</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn kind="secondary" size="sm" icon={<I.CalendarPlus size={13} />}>Перерыв</Btn>
          <Btn kind="secondary" size="sm" icon={<I.Link size={13} />}>Скопировать ссылку</Btn>
          <Btn kind="primary" size="sm" icon={<I.Plus size={13} stroke={2} />}>Новая запись</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        <KPI
          label="Выручка за сегодня"
          icon={<I.Wallet size={13} />}
          value={<>22 400 <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>₽</span></>}
          delta="+12%"
          deltaKind="up"
          sub="vs прошлый вторник"
        />
        <KPI
          label="Записей"
          icon={<I.Calendar size={13} />}
          value="7 / 9"
          sub="загрузка 78%"
        />
        <KPI
          label="Новых клиентов"
          icon={<I.Users size={13} />}
          value="3"
          delta="+50%"
          deltaKind="up"
          sub="за неделю"
        />
        <KPI
          label="Средний чек"
          icon={<I.TrendingUp size={13} />}
          value={<>3 200 <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>₽</span></>}
          delta="-4%"
          deltaKind="down"
          sub="vs декабрь"
        />
      </div>

      {/* Main grid: today / sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16 }}>
        {/* Today list */}
        <Card
          title="Сегодня"
          subtitle="7 записей · 5ч 30м работы"
          actions={
            <>
              <Segmented options={[
                { value: "list", icon: <I.List size={12} />, label: "Список" },
                { value: "tl", icon: <I.Layout size={12} />, label: "Таймлайн" },
              ]} value="list" />
              <IconBtn icon={<I.MoreHorizontal size={15} />} />
            </>
          }
          flush
        >
          <div>
            {BOOKINGS_TODAY.map((b, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr auto auto",
                gap: 14,
                padding: "12px 16px",
                borderBottom: i < BOOKINGS_TODAY.length - 1 ? "1px solid var(--divider)" : "none",
                alignItems: "center",
                background: b.current ? "var(--accent-soft)" : "transparent",
                position: "relative",
              }}>
                {b.current && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "var(--accent)" }} />}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="text-num" style={{ fontSize: 14, fontWeight: 600, color: b.current ? "var(--accent)" : "var(--text)" }}>{b.time}</span>
                  <span className="text-num" style={{ fontSize: 11, color: "var(--text-3)" }}>{b.duration} мин</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={b.client} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{b.client}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", gap: 6, alignItems: "center" }}>
                      <span>{b.service}</span>
                      <span style={{ color: "var(--text-4)" }}>·</span>
                      <span>{b.master}</span>
                    </div>
                  </div>
                </div>
                <StatusPill status={b.status} />
                <span className="text-num" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                  {b.price.toLocaleString("ru-RU")} <span style={{ color: "var(--text-3)" }}>₽</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Next up */}
          <div className="card" style={{ padding: 18, borderColor: "var(--accent-border)", background: "var(--accent-soft)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 24%, transparent), transparent 70%)", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              <I.Clock size={12} /> Через 38 минут
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar name="Ольга Васнецова" size="lg" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text)" }}>Ольга Васнецова</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 1 }}>Стрижка + укладка · 90 мин</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                  <Badge kind="accent">Постоянная</Badge>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>17-й визит</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <Btn kind="primary" size="sm" icon={<I.Check size={13} stroke={2} />}>Начать</Btn>
              <Btn kind="secondary" size="sm" icon={<I.Chat size={13} />}>Написать</Btn>
              <Btn kind="ghost" size="sm" icon={<I.MoreHorizontal size={13} />} />
            </div>
          </div>

          {/* Alerts */}
          <Card
            title="Требует внимания"
            actions={<Badge kind="warning">3</Badge>}
            flush
          >
            <div>
              <AlertRow
                icon={<I.AlertTriangle size={14} />}
                kind="warning"
                title="Юлия Беляева"
                sub="Ждёт подтверждения с 09:12 · 14:30"
                action="Подтвердить"
              />
              <AlertRow
                icon={<I.Clock size={14} />}
                kind="danger"
                title="Анна Тимохина"
                sub="Не оплачен залог · 18:30"
                action="Запросить"
                border
              />
              <AlertRow
                icon={<I.Repeat size={14} />}
                kind="info"
                title="Дарья Климова"
                sub="Повторная запись просрочена на 3 нед."
                action="Написать"
                border
              />
            </div>
          </Card>

          {/* Messages */}
          <Card
            title="Новые сообщения"
            subtitle="за последние 2 часа"
            actions={<a style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500, cursor: "pointer" }}>Все →</a>}
            flush
          >
            <MessageRow name="Светлана Х." time="9 мин" preview="Можно ли перенести на четверг утром?" unread />
            <MessageRow name="Карина З." time="34 мин" preview="Записалась — оплата прошла, жду :)" border />
            <MessageRow name="Елизавета М." time="1 ч" preview="Спасибо! До завтра ❤" border />
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16 }}>
        <Card
          title="Загрузка по часам"
          subtitle="Сегодня · 09:00 — 21:00"
          actions={
            <Segmented options={[
              { value: "d", label: "День" },
              { value: "w", label: "Неделя" },
            ]} value="d" />
          }
        >
          <DayLoadChart />
        </Card>

        <Card
          title="Свободные окна"
          subtitle="2 окна сегодня · 4 завтра"
          actions={<Btn kind="ghost" size="sm" icon={<I.ArrowRight size={13} />} />}
          flush
        >
          <div>
            <SlotRow time="15:30 — 16:30" duration="60 мин" between="между Дарья и Юлия" master="Соня К." />
            <SlotRow time="16:30 — 17:00" duration="30 мин" between="перед Ирина" master="Лида М." border />
            <div style={{ padding: 12, borderTop: "1px solid var(--divider)", display: "flex", justifyContent: "center" }}>
              <Btn kind="ghost" size="sm" icon={<I.Link size={13} />}>Поделиться ссылкой</Btn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AlertRow({ icon, kind, title, sub, action, border }) {
  const color = kind === "warning" ? "var(--warning)" : kind === "danger" ? "var(--danger)" : "var(--info)";
  const bg = kind === "warning" ? "var(--warning-soft)" : kind === "danger" ? "var(--danger-soft)" : "var(--info-soft)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: border ? "1px solid var(--divider)" : "none" }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.005em" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</div>
      </div>
      <Btn kind="ghost" size="sm">{action}</Btn>
    </div>
  );
}

function MessageRow({ name, time, preview, unread, border }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: border ? "1px solid var(--divider)" : "none", cursor: "pointer" }}>
      <Avatar name={name} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.005em" }}>{name}</span>
          {unread && <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent)" }} />}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)" }}>{time}</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
      </div>
    </div>
  );
}

function SlotRow({ time, duration, between, master, border }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: border ? "1px solid var(--divider)" : "none" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, border: "1px dashed var(--accent-border)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "color-mix(in oklab, var(--accent) 6%, transparent)" }}>
        <I.Plus size={15} stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-num" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{time}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{duration} · {master}</div>
      </div>
      <Btn kind="ghost" size="sm">Записать</Btn>
    </div>
  );
}

function DayLoadChart() {
  // Hours 9..20, capacity = max 4 simul. bookings, value = booked count
  const data = [2, 2, 3, 3, 1, 0, 2, 4, 3, 3, 2, 1];
  const max = 4;
  const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, paddingTop: 8, position: "relative" }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ position: "absolute", left: 0, right: 0, bottom: `${(n / max) * 100}%`, height: 1, background: "var(--divider)", pointerEvents: "none" }} />
        ))}
        {data.map((v, i) => {
          const isNow = i === 2;
          const ratio = v / max;
          const color = v === 0 ? "var(--neutral-soft)" : ratio >= 0.75 ? "var(--accent)" : ratio >= 0.5 ? "color-mix(in oklab, var(--accent) 60%, var(--surface-2))" : "var(--accent-soft-2)";
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
              <div style={{
                width: "100%", height: `${Math.max(4, ratio * 100)}%`,
                background: color,
                borderRadius: "4px 4px 0 0",
                border: isNow ? "1.5px solid var(--accent)" : "none",
                position: "relative",
              }}>
                {isNow && <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Сейчас</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {hours.map((h, i) => (
          <span key={i} className="text-num" style={{ flex: 1, textAlign: "center", fontSize: 10, color: i === 2 ? "var(--accent)" : "var(--text-3)" }}>{h}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)" }} />Полная загрузка</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent-soft-2)" }} />Свободно</span>
        <span style={{ marginLeft: "auto" }}>Средняя загрузка <span className="text-num text-strong">78%</span></span>
      </div>
    </div>
  );
}



// КликБук — Schedule (week view)

const WEEK_EVENTS = [
  // Monday
  { day: 0, start: 9.0, end: 10.0, title: "Маникюр класс.", client: "А. Журавлёва", master: "Лида", status: "confirmed" },
  { day: 0, start: 10.5, end: 12.0, title: "Окрашивание", client: "Е. Линник", master: "Кира", status: "completed" },
  { day: 0, start: 13.0, end: 13.75, title: "Брови", client: "Н. Чердинцева", master: "Соня", status: "completed" },
  { day: 0, start: 14.5, end: 16.0, title: "Стрижка + укладка", client: "Я. Громова", master: "Анна", status: "completed" },
  { day: 0, start: 17.0, end: 18.0, title: "Маникюр гель", client: "С. Ивашина", master: "Лида", status: "confirmed" },

  // Tuesday — today (col 1)
  { day: 1, start: 9.0, end: 9.75, title: "Окрашивание корней", client: "М. Соколова", master: "Кира", status: "completed" },
  { day: 1, start: 10.25, end: 11.25, title: "Маникюр гель-лак", client: "А. Петрова", master: "Лида", status: "completed" },
  { day: 1, start: 11.5, end: 13.0, title: "Стрижка + укладка", client: "О. Васнецова", master: "Анна", status: "confirmed", focus: true },
  { day: 1, start: 13.0, end: 13.75, title: "Обед", master: "—", break: true },
  { day: 1, start: 13.5, end: 14.0, title: "Брови", client: "Д. Климова", master: "Соня", status: "confirmed" },
  { day: 1, start: 14.5, end: 16.5, title: "Тонирование + уход", client: "Ю. Беляева", master: "Кира", status: "pending" },
  { day: 1, start: 17.0, end: 18.0, title: "Маникюр класс.", client: "И. Мазур", master: "Лида", status: "confirmed" },
  { day: 1, start: 18.5, end: 19.25, title: "Укладка вечерняя", client: "А. Тимохина", master: "Анна", status: "confirmed" },

  // Wed
  { day: 2, start: 10.0, end: 11.5, title: "Окрашивание", client: "В. Лозовая", master: "Кира", status: "confirmed" },
  { day: 2, start: 11.0, end: 12.0, title: "Маникюр гель", client: "К. Шумилова", master: "Лида", status: "confirmed" },
  { day: 2, start: 13.0, end: 14.5, title: "Стрижка муж.", client: "Д. Орлов", master: "Анна", status: "confirmed" },
  { day: 2, start: 15.0, end: 16.5, title: "Тонирование", client: "Т. Емельянова", master: "Кира", status: "pending" },
  { day: 2, start: 17.0, end: 17.75, title: "Брови + ресницы", client: "Г. Сафина", master: "Соня", status: "confirmed" },

  // Thu
  { day: 3, start: 9.5, end: 10.5, title: "Маникюр", client: "Р. Бакаева", master: "Лида", status: "confirmed" },
  { day: 3, start: 11.0, end: 12.5, title: "Окрашивание", client: "С. Хохлова", master: "Кира", status: "pending" },
  { day: 3, start: 13.5, end: 14.5, title: "Стрижка", client: "Е. Журавель", master: "Анна", status: "confirmed" },
  { day: 3, start: 16.0, end: 17.0, title: "Брови", client: "А. Старченко", master: "Соня", status: "canceled" },
  { day: 3, start: 18.0, end: 19.5, title: "Колорирование", client: "М. Краева", master: "Кира", status: "confirmed" },

  // Fri
  { day: 4, start: 9.0, end: 10.0, title: "Стрижка", client: "Л. Кошель", master: "Анна", status: "confirmed" },
  { day: 4, start: 10.5, end: 11.5, title: "Маникюр гель", client: "О. Терентьева", master: "Лида", status: "confirmed" },
  { day: 4, start: 12.0, end: 13.5, title: "Окрашивание", client: "П. Бородина", master: "Кира", status: "confirmed" },
  { day: 4, start: 14.0, end: 15.5, title: "Тонирование + укладка", client: "Е. Громова", master: "Анна", status: "confirmed" },
  { day: 4, start: 16.0, end: 17.0, title: "Брови", client: "К. Ливень", master: "Соня", status: "confirmed" },
  { day: 4, start: 18.0, end: 19.5, title: "Окрашивание корней", client: "Н. Чернова", master: "Кира", status: "confirmed" },

  // Sat
  { day: 5, start: 10.0, end: 11.0, title: "Маникюр", client: "Я. Лещ", master: "Лида", status: "confirmed" },
  { day: 5, start: 11.5, end: 13.5, title: "Колорирование", client: "Ю. Маркова", master: "Кира", status: "confirmed" },
  { day: 5, start: 14.0, end: 15.0, title: "Стрижка + укладка", client: "С. Дёмина", master: "Анна", status: "confirmed" },
  { day: 5, start: 15.5, end: 16.5, title: "Брови + ресницы", client: "В. Сахновская", master: "Соня", status: "confirmed" },
  { day: 5, start: 17.0, end: 19.0, title: "Окрашивание + уход", client: "А. Зимина", master: "Кира", status: "pending" },

  // Sun
  { day: 6, start: 11.0, end: 12.0, title: "Маникюр", client: "Е. Корнеева", master: "Лида", status: "confirmed" },
  { day: 6, start: 13.0, end: 14.0, title: "Стрижка", client: "О. Зикеева", master: "Анна", status: "confirmed" },
];

const MASTER_COLORS = {
  "Анна": "var(--accent)",
  "Кира": "oklch(0.65 0.16 290)",
  "Лида": "oklch(0.62 0.14 150)",
  "Соня": "oklch(0.70 0.14 60)",
};

function SchedulePage() {
  const days = ["Пн 13", "Вт 14", "Ср 15", "Чт 16", "Пт 17", "Сб 18", "Вс 19"];
  const todayIdx = 1;
  const hours = [];
  for (let h = 9; h <= 20; h++) hours.push(h);

  const HOUR_PX = 56;
  const TIME_COL = 56;
  const DAY_HEAD = 56;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header with controls */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-title-block">
          <div className="page-eyebrow">Январь · Неделя 3</div>
          <h1 className="page-title">Расписание</h1>
        </div>
        <div className="page-toolbar">
          <div className="segmented">
            <button><I.ChevronLeft size={13} /></button>
            <button>Сегодня</button>
            <button><I.ChevronRight size={13} /></button>
          </div>
          <Segmented options={[
            { value: "d", label: "День" },
            { value: "w", label: "Неделя" },
            { value: "m", label: "Месяц" },
          ]} value="w" />
          <Segmented options={[
            { value: "c", icon: <I.List size={12} />, label: "Компактно" },
            { value: "d", icon: <I.Layout size={12} />, label: "Детально" },
          ]} value="d" />
          <Btn kind="primary" size="sm" icon={<I.Plus size={13} stroke={2} />} kbd="N">Новая запись</Btn>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)" }}>
        <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginRight: 4 }}>Мастера</span>
        {[
          { name: "Анна Н.", color: "var(--accent)" },
          { name: "Кира В.", color: "oklch(0.65 0.16 290)" },
          { name: "Лида М.", color: "oklch(0.62 0.14 150)" },
          { name: "Соня К.", color: "oklch(0.70 0.14 60)" },
        ].map(m => (
          <span key={m.name} className="chip on" style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
            {m.name}
          </span>
        ))}
        <span className="chip" style={{ marginLeft: 4 }}><I.Plus size={11} stroke={2} /> Все</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Статусы:</span>
          <StatusPill status="confirmed" />
          <StatusPill status="pending" />
          <StatusPill status="canceled" />
          <span className="divider-v" style={{ height: 18, margin: "0 4px" }} />
          <Btn kind="ghost" size="sm" icon={<I.Filter size={13} />}>Фильтры</Btn>
        </div>
      </div>

      {/* Grid */}
      <div className="card" style={{ overflow: "hidden", padding: 0, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {/* Day header */}
        <div style={{ display: "grid", gridTemplateColumns: `${TIME_COL}px repeat(7, 1fr)`, borderBottom: "1px solid var(--divider)" }}>
          <div style={{ height: DAY_HEAD, borderRight: "1px solid var(--divider)" }} />
          {days.map((d, i) => {
            const [name, num] = d.split(" ");
            const today = i === todayIdx;
            return (
              <div key={i} className={`cal-head ${today ? "today" : ""}`} style={{ borderRight: i < 6 ? "1px solid var(--divider)" : "0", borderBottom: 0, height: DAY_HEAD }}>
                <span>{name}</span>
                <span className="cal-head-num">{num}</span>
              </div>
            );
          })}
        </div>

        {/* Timeline body */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: `${TIME_COL}px repeat(7, 1fr)`, position: "relative" }}>
            {/* Hour rows for time col + cells */}
            <div style={{ borderRight: "1px solid var(--divider)" }}>
              {hours.map(h => (
                <div key={h} style={{ height: HOUR_PX, borderTop: "1px solid var(--divider)", padding: "2px 8px 0 0", textAlign: "right", fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {/* Day columns */}
            {days.map((_, dayIdx) => (
              <div key={dayIdx} style={{
                position: "relative",
                borderRight: dayIdx < 6 ? "1px solid var(--divider)" : "0",
                background: dayIdx === todayIdx ? "color-mix(in oklab, var(--accent) 2%, transparent)" : "transparent",
              }}>
                {hours.map(h => (
                  <div key={h} style={{ height: HOUR_PX, borderTop: "1px solid var(--divider)", position: "relative" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, borderTop: "1px dashed var(--divider)" }} />
                  </div>
                ))}
                {/* Now line on today */}
                {dayIdx === todayIdx && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: ((11.65 - 9) * HOUR_PX) + "px", height: 1.5, background: "var(--accent)", zIndex: 3, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: -4, top: -4, width: 9, height: 9, background: "var(--accent)", borderRadius: "50%", boxShadow: "0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent)" }} />
                    <div className="text-num" style={{ position: "absolute", right: 4, top: -16, fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "var(--bg)", padding: "0 4px", borderRadius: 3 }}>11:39</div>
                  </div>
                )}
                {/* Events */}
                {WEEK_EVENTS.filter(e => e.day === dayIdx).map((e, i) => {
                  const top = (e.start - 9) * HOUR_PX;
                  const height = (e.end - e.start) * HOUR_PX - 2;
                  const fmtTime = (t) => `${String(Math.floor(t)).padStart(2,"0")}:${String(Math.round((t%1)*60)).padStart(2,"0")}`;
                  const cls = e.break ? "ev-break" : `ev-${e.status}`;
                  const masterColor = MASTER_COLORS[e.master] || "var(--accent)";
                  return (
                    <div key={i} className={`event ${cls}`} style={{
                      top: top + 1, height,
                      left: 3, right: 3,
                      ...(e.focus ? { boxShadow: "0 0 0 2px var(--accent), 0 6px 16px -4px color-mix(in oklab, var(--accent) 30%, transparent)", zIndex: 2 } : {}),
                      ...(e.break ? {} : { borderLeftColor: masterColor }),
                    }}>
                      <div className="event-time">{fmtTime(e.start)}–{fmtTime(e.end)}</div>
                      <div className="event-title">{e.title}</div>
                      {!e.break && <div className="event-sub"><Avatar name={e.client || ""} size="sm" style={{ width: 14, height: 14, fontSize: 8 }} />{e.client}</div>}
                    </div>
                  );
                })}
                {/* Free slot indicator on today */}
                {dayIdx === todayIdx && (
                  <div className="free-slot" style={{ position: "absolute", top: (15.5 - 9) * HOUR_PX + 2, height: HOUR_PX - 4, left: 3, right: 3, flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><I.Plus size={11} stroke={2} /><span style={{ fontWeight: 600 }}>Свободно</span></div>
                    <div className="text-num" style={{ fontSize: 10, opacity: 0.7 }}>15:30 — 16:30 · 60 мин</div>
                  </div>
                )}
                {dayIdx === todayIdx && (
                  <div className="free-slot" style={{ position: "absolute", top: (16.5 - 9) * HOUR_PX + 2, height: HOUR_PX/2 - 4, left: 3, right: 3 }}>
                    <I.Plus size={11} stroke={2} /><span style={{ fontWeight: 600 }}>30 мин</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer summary */}
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-3)", padding: "0 4px" }}>
        <span><span className="text-strong text-num">42</span> записи на неделе</span>
        <span><span className="text-strong text-num">6</span> свободных окон</span>
        <span><span className="text-strong text-num">3</span> ожидают подтверждения</span>
        <span style={{ marginLeft: "auto" }}>Загрузка недели <span className="text-strong text-num">81%</span></span>
      </div>
    </div>
  );
}



// КликБук — Clients

const CLIENTS = [
  { name: "Ольга Васнецова", phone: "+7 916 308-12-04", visits: 17, lastVisit: "сегодня", ltv: 58200, tags: ["VIP", "Окрашивание"], segment: "loyal", next: "Сегодня · 11:30", upcoming: true, fav: true },
  { name: "Марина Соколова", phone: "+7 905 421-77-12", visits: 9, lastVisit: "сегодня", ltv: 28400, tags: ["Регулярный"], segment: "loyal", next: "20 янв · 10:00" },
  { name: "Юлия Беляева", phone: "+7 925 113-88-45", visits: 4, lastVisit: "12 янв", ltv: 14600, tags: ["Окрашивание"], segment: "active", next: "Сегодня · 14:30", warning: true },
  { name: "Алина Петрова", phone: "+7 977 502-34-09", visits: 12, lastVisit: "сегодня", ltv: 31200, tags: ["Маникюр"], segment: "loyal", next: "—" },
  { name: "Дарья Климова", phone: "+7 903 707-65-22", visits: 2, lastVisit: "8 дек", ltv: 4800, tags: ["Новый"], segment: "risk", next: "Сегодня · 13:30", warning: true },
  { name: "Светлана Хохлова", phone: "+7 919 244-19-78", visits: 22, lastVisit: "9 янв", ltv: 71400, tags: ["VIP", "Окрашивание"], segment: "loyal", next: "—", fav: true },
  { name: "Ирина Мазур", phone: "+7 962 871-33-50", visits: 6, lastVisit: "сегодня", ltv: 16200, tags: ["Маникюр"], segment: "active", next: "Сегодня · 17:00" },
  { name: "Анна Тимохина", phone: "+7 985 290-46-11", visits: 1, lastVisit: "—", ltv: 0, tags: ["Новый"], segment: "new", next: "Сегодня · 18:30" },
  { name: "Карина Зимина", phone: "+7 916 615-02-77", visits: 8, lastVisit: "5 янв", ltv: 22100, tags: ["Регулярный"], segment: "active", next: "—" },
  { name: "Елизавета Мирная", phone: "+7 968 318-91-23", visits: 5, lastVisit: "12 янв", ltv: 12800, tags: ["Маникюр"], segment: "active", next: "—" },
  { name: "Татьяна Емельянова", phone: "+7 925 047-88-19", visits: 14, lastVisit: "30 дек", ltv: 47200, tags: ["VIP"], segment: "loyal", next: "—", fav: true },
  { name: "Полина Бородина", phone: "+7 916 992-44-08", visits: 3, lastVisit: "—", ltv: 8400, tags: ["Новый"], segment: "new", next: "—" },
];

const VISIT_HISTORY = [
  { date: "сегодня", time: "11:30", service: "Стрижка + укладка", master: "Анна Н.", price: 3500, status: "confirmed" },
  { date: "23 дек", time: "12:00", service: "Окрашивание + уход", master: "Кира В.", price: 6800, status: "completed" },
  { date: "2 дек", time: "11:30", service: "Стрижка + укладка", master: "Анна Н.", price: 3500, status: "completed" },
  { date: "14 ноя", time: "13:00", service: "Окрашивание корней", master: "Кира В.", price: 4200, status: "completed" },
  { date: "28 окт", time: "11:30", service: "Стрижка + укладка", master: "Анна Н.", price: 3500, status: "completed" },
  { date: "5 окт", time: "12:30", service: "Тонирование", master: "Кира В.", price: 5200, status: "completed" },
];

function ClientsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-title-block">
          <div className="page-eyebrow">База клиентов</div>
          <h1 className="page-title">Клиенты <span className="text-num" style={{ fontSize: 18, color: "var(--text-3)", fontWeight: 500, marginLeft: 8 }}>1 247</span></h1>
        </div>
        <div className="page-toolbar">
          <Btn kind="secondary" size="sm" icon={<I.ArrowUpRight size={13} />}>Экспорт</Btn>
          <Btn kind="primary" size="sm" icon={<I.Plus size={13} stroke={2} />}>Добавить клиента</Btn>
        </div>
      </div>

      {/* Segment chips */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Tabs
          kind="line"
          options={[
            { value: "all", label: "Все", count: "1 247" },
            { value: "loyal", label: "Постоянные", count: 412 },
            { value: "active", label: "Активные", count: 308 },
            { value: "new", label: "Новые", count: 47 },
            { value: "risk", label: "Уходят", count: 124 },
            { value: "fav", label: "Избранные", count: 28, icon: <I.Star size={12} fill="currentColor" /> },
          ]}
          value="all"
        />
      </div>

      {/* Main: list + profile */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, flex: 1, minHeight: 0 }}>
        {/* List card */}
        <Card flush style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Filter bar */}
          <div style={{ padding: 12, borderBottom: "1px solid var(--divider)", display: "flex", gap: 8, alignItems: "center" }}>
            <Input icon={<I.Search size={13} />} placeholder="Имя, телефон, email…" kbd="/" style={{ flex: 1 }} />
            <Select value="Все услуги" />
            <Select value="Все мастера" />
            <IconBtn icon={<I.Filter size={15} />} tip="Фильтры" />
          </div>
          {/* Active filters */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--divider)", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>3 фильтра:</span>
            <Chip on removable>Сегмент: VIP</Chip>
            <Chip on removable>Услуги: Окрашивание</Chip>
            <Chip on removable>LTV ≥ 20 000 ₽</Chip>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
              Показано <span className="text-strong">{CLIENTS.length}</span> из 1 247
            </span>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}><input type="checkbox" /></th>
                  <th>Клиент</th>
                  <th>Сегмент</th>
                  <th style={{ textAlign: "right" }}>Визитов</th>
                  <th style={{ textAlign: "right" }}>LTV</th>
                  <th>Последний</th>
                  <th>Следующая</th>
                  <th style={{ width: 28 }}></th>
                </tr>
              </thead>
              <tbody>
                {CLIENTS.map((c, i) => (
                  <tr key={i} style={i === 0 ? { background: "var(--accent-soft)" } : undefined}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={c.name} size="sm" />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
                            {c.name}
                            {c.fav && <I.Star size={10} fill="currentColor" style={{ color: "var(--warning)" }} />}
                          </div>
                          <div className="text-num" style={{ fontSize: 11, color: "var(--text-3)" }}>{c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.segment === "loyal" && <Badge kind="success">Постоянный</Badge>}
                      {c.segment === "active" && <Badge kind="neutral">Активный</Badge>}
                      {c.segment === "new" && <Badge kind="info">Новый</Badge>}
                      {c.segment === "risk" && <Badge kind="warning">Уходит</Badge>}
                    </td>
                    <td className="col-num">{c.visits}</td>
                    <td className="col-num"><span className="text-strong">{c.ltv.toLocaleString("ru-RU")}</span> <span className="text-muted">₽</span></td>
                    <td className="col-muted">{c.lastVisit}</td>
                    <td>
                      {c.next === "—"
                        ? <span className="text-muted">—</span>
                        : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: c.warning ? "var(--warning)" : "var(--accent)" }} />
                            <span style={{ fontSize: 12 }}>{c.next}</span>
                          </span>
                      }
                    </td>
                    <td><IconBtn icon={<I.MoreHorizontal size={14} />} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer pagination */}
          <div style={{ padding: 10, borderTop: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-3)" }}>
            <span>Страница <span className="text-strong text-num">1</span> из <span className="text-num">104</span></span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              <Btn kind="ghost" size="sm" icon={<I.ChevronLeft size={13} />} />
              <Btn kind="ghost" size="sm">1</Btn>
              <Btn kind="secondary" size="sm">2</Btn>
              <Btn kind="ghost" size="sm">3</Btn>
              <span style={{ alignSelf: "center", color: "var(--text-4)" }}>…</span>
              <Btn kind="ghost" size="sm">104</Btn>
              <Btn kind="ghost" size="sm" icon={<I.ChevronRight size={13} />} />
            </div>
          </div>
        </Card>

        {/* Profile card */}
        <Card flush style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Profile header */}
          <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <Avatar name="Ольга Васнецова" size="xl" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", margin: 0, color: "var(--text)" }}>Ольга Васнецова</h2>
                  <I.Star size={14} fill="currentColor" style={{ color: "var(--warning)" }} />
                </div>
                <div className="text-num" style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>+7 916 308-12-04 · olga.v@gmail.com</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <Badge kind="success" dot>Постоянный</Badge>
                  <Badge kind="accent">VIP</Badge>
                  <Badge kind="neutral">Окрашивание</Badge>
                  <Chip><I.Plus size={11} stroke={2} /></Chip>
                </div>
              </div>
              <IconBtn icon={<I.MoreHorizontal size={15} />} />
            </div>

            {/* Quick actions */}
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <Btn kind="primary" size="sm" icon={<I.CalendarPlus size={13} />}>Записать</Btn>
              <Btn kind="secondary" size="sm" icon={<I.Chat size={13} />}>Написать</Btn>
              <Btn kind="secondary" size="sm" icon={<I.Phone size={13} />}>Позвонить</Btn>
              <Btn kind="ghost" size="sm" icon={<I.Edit size={13} />} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, borderBottom: "1px solid var(--divider)" }}>
            <StatBox label="LTV" value="58 200 ₽" />
            <StatBox label="Визитов" value="17" />
            <StatBox label="Ср. чек" value="3 424 ₽" />
            <StatBox label="С нами" value="14 мес" />
          </div>

          {/* Tabs */}
          <div style={{ padding: "10px 18px 0" }}>
            <Tabs kind="line" value="history" options={[
              { value: "history", label: "История", count: 17 },
              { value: "notes", label: "Заметки", count: 3 },
              { value: "files", label: "Файлы" },
              { value: "prefs", label: "Предпочтения" },
            ]} />
          </div>

          {/* History list */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {VISIT_HISTORY.map((v, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "76px 1fr auto",
                gap: 12,
                padding: "12px 18px",
                alignItems: "center",
                borderBottom: i < VISIT_HISTORY.length - 1 ? "1px solid var(--divider)" : "none",
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: v.status === "confirmed" ? "var(--accent)" : "var(--text)" }}>{v.date}</div>
                  <div className="text-num" style={{ fontSize: 11, color: "var(--text-3)" }}>{v.time}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{v.service}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{v.master}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className="text-num" style={{ fontSize: 13, fontWeight: 500 }}>{v.price.toLocaleString("ru-RU")} ₽</span>
                  <StatusPill status={v.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Note pinned */}
          <div style={{ padding: "12px 18px", borderTop: "1px solid var(--divider)", display: "flex", gap: 10, background: "var(--surface-2)" }}>
            <I.Pin size={13} style={{ color: "var(--warning)", marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Закреплено · Анна Н.</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45 }}>
                Краска Wella 6/7 + 5/0, оксид 6%. Чувствительная кожа головы — не использовать осветлитель. Любит крепкий кофе ☕
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
      <div className="text-num" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", marginTop: 2 }}>{value}</div>
    </div>
  );
}



// КликБук — Chats

const CONVERSATIONS = [
  { name: "Светлана Хохлова", channel: "tg", preview: "Можно ли перенести на четверг утром?", time: "9 мин", unread: 2, active: true, status: "online" },
  { name: "Карина Зимина", channel: "wa", preview: "Записалась — оплата прошла, жду :)", time: "34 мин", unread: 0 },
  { name: "Елизавета Мирная", channel: "tg", preview: "Спасибо! До завтра ❤", time: "1 ч", unread: 0 },
  { name: "Татьяна Емельянова", channel: "wa", preview: "А есть свободные окна на субботу?", time: "2 ч", unread: 1 },
  { name: "Полина Бородина", channel: "tg", preview: "Подскажите, сколько по времени окрашивание корней?", time: "3 ч", unread: 1 },
  { name: "Юлия Беляева", channel: "site", preview: "Хочу записаться к Кире на тонирование", time: "4 ч", unread: 0 },
  { name: "Дарья Климова", channel: "tg", preview: "Привет! Давно не была, можно записаться?", time: "вчера", unread: 0 },
  { name: "Анна Тимохина", channel: "wa", preview: "Скиньте, пожалуйста, адрес ещё раз", time: "вчера", unread: 0 },
  { name: "Марина Соколова", channel: "tg", preview: "Спасибо, всё супер!", time: "12 янв", unread: 0 },
  { name: "Алина Петрова", channel: "site", preview: "Можете напомнить за день?", time: "11 янв", unread: 0 },
];

const channelLabels = {
  tg: { name: "Telegram", color: "oklch(0.62 0.14 230)" },
  wa: { name: "WhatsApp", color: "oklch(0.62 0.14 145)" },
  site: { name: "Сайт", color: "var(--text-3)" },
};

function ChatsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%", margin: "-24px -28px -32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 320px", height: "100%", borderTop: "1px solid var(--border)" }}>
        {/* Conversations */}
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
          <div style={{ padding: "14px 14px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Чаты <span className="text-num" style={{ color: "var(--text-3)", fontWeight: 500 }}>· 4 непрочитанных</span></h2>
              <IconBtn icon={<I.Edit size={14} />} tip="Новый чат" />
            </div>
            <Input icon={<I.Search size={13} />} placeholder="Поиск по чатам и клиентам" />
            <Tabs kind="pill" value="all" options={[
              { value: "all", label: "Все", count: 12 },
              { value: "unread", label: "Новые", count: 4 },
              { value: "mine", label: "Мои" },
            ]} />
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {CONVERSATIONS.map((c, i) => {
              const ch = channelLabels[c.channel];
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  borderLeft: c.active ? "2px solid var(--accent)" : "2px solid transparent",
                  background: c.active ? "var(--surface-2)" : "transparent",
                  cursor: "pointer",
                  position: "relative",
                }}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={c.name} size="md" />
                    {c.status === "online" && (
                      <span style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%", background: "var(--success)", border: "2px solid var(--bg)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: c.unread ? 600 : 500, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{c.time}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ width: 4, height: 4, borderRadius: 2, background: ch.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: c.unread ? "var(--text-2)" : "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.preview}</span>
                      {c.unread > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          background: "var(--accent)", color: "var(--accent-fg)",
                          padding: "0 5px", borderRadius: 8, minWidth: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}>{c.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active chat */}
        <div style={{ display: "flex", flexDirection: "column", background: "var(--bg)", minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, height: 56 }}>
            <Avatar name="Светлана Хохлова" size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>Светлана Хохлова</span>
                <Badge kind="accent">VIP</Badge>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 4, height: 4, borderRadius: 2, background: channelLabels.tg.color }} />
                Telegram · @s.khokhlova · был онлайн 3 мин назад
              </div>
            </div>
            <Btn kind="secondary" size="sm" icon={<I.CalendarPlus size={13} />}>Записать</Btn>
            <IconBtn icon={<I.Phone size={15} />} />
            <IconBtn icon={<I.MoreHorizontal size={15} />} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 18px", display: "flex", flexDirection: "column" }}>
            <div className="chat-system">Сегодня · 09:12</div>

            <div className="chat-row them">
              <Avatar name="Светлана Хохлова" size="sm" />
              <div>
                <div className="chat-bubble">
                  Здравствуйте! Я записана на четверг в 18:00 — можно ли перенести на утро?
                </div>
                <div className="chat-meta">09:12</div>
              </div>
            </div>

            <div className="chat-row them">
              <div style={{ width: 22 }} />
              <div>
                <div className="chat-bubble">Утром удобнее. И ещё — окрашивание корней + укладка, как обычно 🙂</div>
                <div className="chat-meta">09:13</div>
              </div>
            </div>

            <div className="chat-row me">
              <div>
                <div className="chat-bubble">Привет, Света! Сейчас гляну, что есть на четверг с утра 👀</div>
                <div className="chat-meta" style={{ justifyContent: "flex-end" }}>09:18 · <I.Check size={11} stroke={2} style={{ color: "var(--accent)" }} /> прочитано</div>
              </div>
            </div>

            {/* Inline schedule preview — auteur detail */}
            <div className="chat-row me">
              <div style={{ width: 320, maxWidth: "72%" }}>
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 12,
                  borderTopRightRadius: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <I.Calendar size={13} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Свободные окна · Чт 16 янв</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {["09:00", "10:30", "11:00"].map((t, i) => (
                      <button key={t} className="btn btn-secondary btn-sm" style={{ justifyContent: "center", ...(i === 1 ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-soft)" } : {}) }}>
                        <span className="text-num">{t}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <I.Info size={11} /> Окрашивание корней + укладка · ~135 мин · Кира В.
                  </div>
                </div>
                <div className="chat-meta" style={{ justifyContent: "flex-end" }}>09:21 · <I.Check size={11} stroke={2} style={{ color: "var(--accent)" }} /> прочитано</div>
              </div>
            </div>

            <div className="chat-row them">
              <Avatar name="Светлана Хохлова" size="sm" />
              <div>
                <div className="chat-bubble">10:30 — отлично! Запишите, пожалуйста 🙏</div>
                <div className="chat-meta">09:24</div>
              </div>
            </div>

            <div className="chat-system">
              <I.Check size={11} stroke={2} style={{ display: "inline-block", marginRight: 4, verticalAlign: "-2px", color: "var(--success)" }} />
              Запись создана · Чт 16 янв, 10:30 · Окрашивание корней + укладка
            </div>

            <div className="chat-row me">
              <div>
                <div className="chat-bubble">Готово! Отправила подтверждение. Жду в четверг ✨</div>
                <div className="chat-meta" style={{ justifyContent: "flex-end" }}>09:25 · <I.Check size={11} stroke={2} style={{ color: "var(--text-3)" }} /></div>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border-input)",
              borderRadius: 12,
              padding: "8px 8px 8px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "var(--sh-sm)",
            }}>
              <div style={{ fontSize: 13, color: "var(--text-3)", padding: "4px 0" }}>Написать сообщение…</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IconBtn icon={<I.Paperclip size={14} />} tip="Файл" />
                <IconBtn icon={<I.Image size={14} />} tip="Фото" />
                <IconBtn icon={<I.Smile size={14} />} tip="Эмодзи" />
                <span className="divider-v" style={{ height: 18, margin: "0 2px" }} />
                <Btn kind="ghost" size="sm" icon={<I.CalendarPlus size={13} />}>Окна</Btn>
                <Btn kind="ghost" size="sm" icon={<I.Link size={13} />}>Ссылка</Btn>
                <Btn kind="ghost" size="sm" icon={<I.Zap size={13} />}>Шаблон</Btn>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>⌘↵</span>
                  <Btn kind="primary" size="sm" icon={<I.Send size={13} />}>Отправить</Btn>
                </div>
              </div>
            </div>
            {/* Quick replies */}
            <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>Быстрые ответы:</span>
              <Chip>👋 Здравствуйте!</Chip>
              <Chip>Подтверждаю запись</Chip>
              <Chip>До встречи ✨</Chip>
              <Chip>Какое время удобно?</Chip>
            </div>
          </div>
        </div>

        {/* Client side panel */}
        <div style={{ borderLeft: "1px solid var(--border)", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
              <Avatar name="Светлана Хохлова" size="xl" />
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", marginTop: 4 }}>Светлана Хохлова</div>
              <div className="text-num" style={{ fontSize: 12, color: "var(--text-3)" }}>+7 919 244-19-78</div>
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <Badge kind="accent">VIP</Badge>
                <Badge kind="success">Постоянный</Badge>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              <Btn kind="secondary" size="sm" icon={<I.Phone size={13} />} style={{ flex: 1, justifyContent: "center" }}>Позвонить</Btn>
              <Btn kind="secondary" size="sm" icon={<I.Eye size={13} />} style={{ flex: 1, justifyContent: "center" }}>Профиль</Btn>
            </div>
          </div>

          {/* Stats compact */}
          <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, borderBottom: "1px solid var(--divider)" }}>
            <SidePanelStat label="Визитов" value="22" />
            <SidePanelStat label="LTV" value="71 400 ₽" />
            <SidePanelStat label="Ср. чек" value="3 245 ₽" />
          </div>

          {/* Upcoming */}
          <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Ближайшая запись</div>
            <div style={{ background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <I.Calendar size={12} style={{ color: "var(--accent)" }} />
                <span className="text-num" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>Чт 16 янв · 10:30</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text)", marginTop: 4, fontWeight: 500 }}>Окрашивание корней + укладка</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>~135 мин · Кира В. · ≈ 6 800 ₽</div>
            </div>
          </div>

          {/* History */}
          <div style={{ flex: 1, overflow: "auto", padding: "8px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "8px 0" }}>Последние визиты</div>
            {[
              { date: "9 янв", svc: "Окрашивание + уход", price: 6800 },
              { date: "23 дек", svc: "Окрашивание корней", price: 4200 },
              { date: "4 дек", svc: "Тонирование", price: 5200 },
              { date: "14 ноя", svc: "Окрашивание + укладка", price: 6500 },
            ].map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < 3 ? "1px dashed var(--divider)" : "none" }}>
                <div style={{ width: 4, height: 28, background: "var(--accent-border)", borderRadius: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{v.svc}</div>
                  <div className="text-num" style={{ fontSize: 11, color: "var(--text-3)" }}>{v.date}</div>
                </div>
                <span className="text-num" style={{ fontSize: 12, color: "var(--text-2)" }}>{v.price.toLocaleString("ru-RU")} ₽</span>
              </div>
            ))}
          </div>

          {/* Note */}
          <div style={{ padding: "10px 16px 14px", background: "var(--surface-2)", borderTop: "1px solid var(--divider)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <I.Pin size={11} style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-2)" }}>Закреплено</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45 }}>
              Аллергия на аммиак. Использовать безаммиачные краски. Любит заваривать чай сама — есть свой набор.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidePanelStat({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="text-num" style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 1 }}>{label}</div>
    </div>
  );
}



// КликБук — Design System artboards

function Swatch({ color, name, code, big }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: big ? 40 : 28, height: big ? 40 : 28, borderRadius: 8, background: color, border: "1px solid var(--border)" }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{name}</div>
        <div className="text-num" style={{ fontSize: 11, color: "var(--text-3)" }}>{code}</div>
      </div>
    </div>
  );
}

function ColorBlock({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {items.map(it => <Swatch key={it.name} {...it} />)}
      </div>
    </div>
  );
}

function SystemFoundationArtboard({ theme }) {
  return (
    <div className="kb-root" data-theme={theme} style={{ padding: 40, height: "100%", overflow: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Brand */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{
              width: 56, height: 56, borderRadius: 14,
              background: "linear-gradient(135deg, var(--accent) 0%, #7B5BFF 100%)",
              position: "relative",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18), 0 4px 16px -4px rgba(91,108,255,.4)",
            }}>
              <span style={{ position: "absolute", top: "50%", left: "50%", width: 14, height: 14, background: "white", borderRadius: "50%", transform: "translate(-50%, -50%)", boxShadow: "0 0 0 4px rgba(255,255,255,0.25)" }} />
            </span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>КликБук</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>Booking SaaS · Design System v1.0</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", borderLeft: "1px solid var(--divider)", paddingLeft: 28 }}>
            <Principle title="Тихий" body="Один акцент, всё остальное — нейтрали" />
            <Principle title="Плотный" body="Comfortable density, всё на виду" />
            <Principle title="Числовой" body="Tabular numbers по умолчанию" />
            <Principle title="Системный" body="6 радиусов · 4 тени · 3 размера inputs" />
          </div>
        </div>

        {/* Palette */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <ColorBlock title="Surfaces & text" items={[
            { name: "bg", code: "var(--bg)", color: "var(--bg)" },
            { name: "surface", code: "var(--surface)", color: "var(--surface)" },
            { name: "surface-2", code: "var(--surface-2)", color: "var(--surface-2)" },
            { name: "border", code: "var(--border)", color: "var(--border)" },
            { name: "text", code: "var(--text)", color: "var(--text)" },
            { name: "text-2", code: "var(--text-2)", color: "var(--text-2)" },
            { name: "text-3", code: "var(--text-3)", color: "var(--text-3)" },
            { name: "text-4", code: "var(--text-4)", color: "var(--text-4)" },
          ]} />

          <ColorBlock title="Accent & semantic" items={[
            { name: "accent", code: "var(--accent)", color: "var(--accent)" },
            { name: "accent-soft", code: "var(--accent-soft)", color: "var(--accent-soft)" },
            { name: "success", code: "var(--success)", color: "var(--success)" },
            { name: "success-soft", code: "var(--success-soft)", color: "var(--success-soft)" },
            { name: "warning", code: "var(--warning)", color: "var(--warning)" },
            { name: "warning-soft", code: "var(--warning-soft)", color: "var(--warning-soft)" },
            { name: "danger", code: "var(--danger)", color: "var(--danger)" },
            { name: "info", code: "var(--info)", color: "var(--info)" },
          ]} />
        </div>

        {/* Booking statuses */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Статусы записей</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatusPill status="confirmed" />
            <StatusPill status="pending" />
            <StatusPill status="completed" />
            <StatusPill status="canceled" />
            <StatusPill status="noshow" />
          </div>
        </div>

        {/* Type */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 16 }}>Типографика — Geist Sans · Geist Mono</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TypeRow label="Display / 36 · 600" sample="Доброе утро, Анна" style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }} />
            <TypeRow label="H1 / 24 · 600" sample="Расписание · 14 января" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em" }} />
            <TypeRow label="H2 / 18 · 600" sample="Сегодня · 7 записей" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }} />
            <TypeRow label="Body / 14 · 400" sample="Стрижка + укладка вечером, 90 мин у мастера Анны" style={{ fontSize: 14 }} />
            <TypeRow label="Caption / 12 · 400" sample="за неделю · vs прошлый период" style={{ fontSize: 12, color: "var(--text-3)" }} />
            <TypeRow label="Mono / numeric" sample="22 400 ₽ · 09:00–10:30 · +12.4%" style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 14 }} />
          </div>
        </div>

        {/* Radii & shadows */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Радиусы</div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              {[
                { r: 4, n: "xs" }, { r: 6, n: "sm" }, { r: 8, n: "md" }, { r: 10, n: "lg" }, { r: 14, n: "xl" }, { r: 18, n: "2xl" },
              ].map(({ r, n }) => (
                <div key={n} style={{ textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, background: "var(--accent-soft)", border: "1px solid var(--accent-border)", borderRadius: r }} />
                  <div className="text-num" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{r}</div>
                  <div style={{ fontSize: 10, color: "var(--text-4)" }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Тени</div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
              {["xs", "sm", "md", "lg", "pop"].map(s => (
                <div key={s} style={{ textAlign: "center" }}>
                  <div style={{ width: 56, height: 44, background: "var(--surface)", borderRadius: 8, boxShadow: `var(--sh-${s})` }} />
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Principle({ title, body }) {
  return (
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>· {title}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.4, marginTop: 2 }}>{body}</div>
    </div>
  );
}

function TypeRow({ label, sample, style }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 24, alignItems: "baseline", borderTop: "1px dashed var(--border-strong)", paddingTop: 12 }}>
      <div className="text-num" style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
      <div style={style}>{sample}</div>
    </div>
  );
}

function SystemComponentsArtboard({ theme }) {
  return (
    <div className="kb-root" data-theme={theme} style={{ padding: 36, height: "100%", overflow: "auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Buttons */}
        <Block title="Buttons">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn kind="primary" icon={<I.Plus size={13} stroke={2} />}>Новая запись</Btn>
            <Btn kind="primary" size="sm" icon={<I.Check size={13} stroke={2} />}>Подтвердить</Btn>
            <Btn kind="secondary" icon={<I.Calendar size={13} />}>Расписание</Btn>
            <Btn kind="secondary" size="sm">Отменить</Btn>
            <Btn kind="ghost" icon={<I.MoreHorizontal size={14} />} />
            <Btn kind="ghost" size="sm" icon={<I.Filter size={13} />}>Фильтры</Btn>
            <Btn kind="primary" size="sm" icon={<I.Plus size={13} stroke={2} />} kbd="N">С хоткеем</Btn>
          </div>
        </Block>

        {/* Inputs */}
        <Block title="Inputs & selects">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Input icon={<I.Search size={13} />} placeholder="Поиск клиента…" kbd="/" />
            <Input placeholder="example@mail.ru" />
            <Select value="Все мастера" />
          </div>
        </Block>

        {/* Tabs */}
        <Block title="Tabs">
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <Tabs kind="pill" value="b" options={[{value:"a",label:"День"},{value:"b",label:"Неделя"},{value:"c",label:"Месяц"}]} />
            <Tabs kind="line" value="b" options={[
              { value: "a", label: "Все", count: 1247 },
              { value: "b", label: "Постоянные", count: 412 },
              { value: "c", label: "Новые", count: 47 },
            ]} />
          </div>
        </Block>

        {/* Badges & statuses */}
        <Block title="Badges & статусы">
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Badge kind="neutral">Neutral</Badge>
            <Badge kind="accent">Accent</Badge>
            <Badge kind="success">Success</Badge>
            <Badge kind="warning">Warning</Badge>
            <Badge kind="danger">Danger</Badge>
            <Badge kind="info">Info</Badge>
            <span className="divider-v" style={{ height: 18, margin: "0 6px" }} />
            <StatusPill status="confirmed" />
            <StatusPill status="pending" />
            <StatusPill status="completed" />
            <StatusPill status="canceled" />
          </div>
        </Block>

        {/* Avatars & stacks */}
        <Block title="Avatars">
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Avatar name="Анна Носова" size="sm" />
            <Avatar name="Кира Васнецова" />
            <Avatar name="Лида Михайлова" size="lg" />
            <Avatar name="Соня Климова" size="xl" />
            <span className="divider-v" style={{ height: 18, margin: "0 6px" }} />
            <div className="avatar-stack">
              <Avatar name="Анна Носова" size="sm" />
              <Avatar name="Кира Васнецова" size="sm" />
              <Avatar name="Лида Михайлова" size="sm" />
              <span className="avatar sm" style={{ background: "var(--surface-2)", color: "var(--text-2)", fontSize: 9 }}>+5</span>
            </div>
          </div>
        </Block>

        {/* Sample composite cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <KPI label="Выручка" value={<>184 200 <span style={{ fontSize: 13, color: "var(--text-3)" }}>₽</span></>} delta="+12.4%" deltaKind="up" sub="за месяц" icon={<I.Wallet size={13} />} />
          <Card title="Сегодня · 11:30" subtitle="Стрижка + укладка · 90 мин" actions={<StatusPill status="confirmed" />}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name="Ольга Васнецова" size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Ольга Васнецова</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>17-й визит · VIP · Анна Н.</div>
              </div>
              <Btn kind="primary" size="sm">Начать</Btn>
            </div>
          </Card>
        </div>

        {/* Chart + chat */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card title="Загрузка" subtitle="Пн—Вс">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {[64, 70, 88, 60, 92, 76, 30].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: i === 4 ? "var(--accent)" : "var(--accent-soft-2)", borderRadius: "3px 3px 0 0" }} />
              ))}
            </div>
            <div style={{ display: "flex", marginTop: 4, fontSize: 10, color: "var(--text-3)", gap: 4 }}>
              {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => <span key={d} style={{ flex: 1, textAlign: "center" }}>{d}</span>)}
            </div>
          </Card>
          <Card title="Чат-сэмпл" subtitle="bubbles, system, composer">
            <div className="chat-row them"><Avatar name="Светлана Х." size="sm" /><div><div className="chat-bubble">Перенести на четверг?</div><div className="chat-meta">09:12</div></div></div>
            <div className="chat-row me"><div><div className="chat-bubble">Конечно, есть 10:30</div><div className="chat-meta" style={{ justifyContent: "flex-end" }}>09:18</div></div></div>
            <div className="chat-system">Запись создана · Чт 16, 10:30</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}




const PREVIEW_CONFIG = {
  dashboard: {
    active: "dashboard",
    crumbs: ["Студия «Контур»", "Главная"],
    title: "Главная",
    component: DashboardPage,
  },
  schedule: {
    active: "schedule",
    crumbs: ["Студия «Контур»", "Расписание"],
    title: "Расписание",
    component: SchedulePage,
  },
  clients: {
    active: "clients",
    crumbs: ["Студия «Контур»", "Клиенты"],
    title: "Клиенты",
    component: ClientsPage,
  },
  chats: {
    active: "chats",
    crumbs: ["Студия «Контур»", "Чаты"],
    title: "Чаты",
    component: ChatsPage,
  },
};

function PreviewTopLinks({ active, theme, onTheme }) {
  const links = [
    ["dashboard", "Dashboard"],
    ["schedule", "Schedule"],
    ["clients", "Clients"],
    ["chats", "Chats"],
    ["system", "System"],
  ];

  return (
    <div className="kbv2-top-links">
      <div className="kbv2-top-links__brand">
        <span className="kbv2-top-links__dot" />
        <span>КликБук Design V2</span>
      </div>
      <nav>
        {links.map(([id, label]) => (
          <a key={id} href={`/design-v2/${id === "dashboard" ? "dashboard" : id}`} className={active === id ? "is-active" : ""}>
            {label}
          </a>
        ))}
      </nav>
      <div className="kbv2-top-links__theme">
        <button type="button" className={theme === "light" ? "is-active" : ""} onClick={() => onTheme("light")}>Light</button>
        <button type="button" className={theme === "dark" ? "is-active" : ""} onClick={() => onTheme("dark")}>Dark</button>
      </div>
    </div>
  );
}

export function DesignPreviewScreen({ screen = "dashboard" }) {
  const [theme, setTheme] = useState("light");
  const config = PREVIEW_CONFIG[screen] || PREVIEW_CONFIG.dashboard;
  const Page = config.component;

  return (
    <div className="kbv2-preview" data-preview-theme={theme}>
      <PreviewTopLinks active={config.active} theme={theme} onTheme={setTheme} />
      <div className="kbv2-frame">
        <AppShell
          theme={theme}
          onTheme={setTheme}
          active={config.active}
          crumbs={config.crumbs}
          masters={MASTERS}
        >
          <Page />
        </AppShell>
      </div>
    </div>
  );
}

export function DesktopProductScreen({ screen = "dashboard" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const config = PREVIEW_CONFIG[screen] || PREVIEW_CONFIG.dashboard;
  const Page = config.component;

  return (
    <div className="kbv2-preview kbv2-desktop-app" data-preview-theme={theme}>
      <div className="kbv2-desktop-frame">
        <AppShell
          theme={theme}
          onTheme={(nextTheme) => setTheme(nextTheme)}
          active={config.active}
          crumbs={config.crumbs}
          masters={MASTERS}
          basePath="/desktop"
        >
          <Page />
        </AppShell>
      </div>
    </div>
  );
}

export function DesignPreviewSystem() {
  const [theme, setTheme] = useState("light");

  return (
    <div className="kbv2-preview" data-preview-theme={theme}>
      <PreviewTopLinks active="system" theme={theme} onTheme={setTheme} />
      <div className="kbv2-system-page kb-root" data-theme={theme}>
        <div className="kbv2-system-grid">
          <SystemFoundationArtboard theme={theme} />
          <SystemComponentsArtboard theme={theme} />
        </div>
      </div>
    </div>
  );
}
