'use client';

import React from 'react';

/* Shared icons + UI primitives for КликБук desktop */

export const Icon = ({ name, size = 16, className = '', style }) => {
  const s = { width: size, height: size, ...style };
  const stroke = "currentColor";
  const sw = 1.6;
  const common = { fill: "none", stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", className, style: s, viewBox: "0 0 24 24" };
  switch (name) {
    case 'home': return <svg {...common}><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case 'users': return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'chat': return <svg {...common}><path d="M21 12a8 8 0 0 1-12 7l-5 1 1-4a8 8 0 1 1 16-4z"/></svg>;
    case 'services': return <svg {...common}><path d="M20 7L9 18l-5-5"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10"/></svg>;
    case 'chart': return <svg {...common}><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 6-7"/></svg>;
    case 'page': return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>;
    case 'star': return <svg {...common}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>;
    case 'gear': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;
    case 'bell': return <svg {...common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus': return <svg {...common}><path d="M5 12h14"/></svg>;
    case 'x': return <svg {...common}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case 'check': return <svg {...common}><path d="M20 6L9 17l-5-5"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case 'chevron-up': return <svg {...common}><path d="M18 15l-6-6-6 6"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="M9 18l6-6-6-6"/></svg>;
    case 'chevron-left': return <svg {...common}><path d="M15 18l-9-6 9-6"/></svg>;
    case 'arrow-up': return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg {...common}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
    case 'arrow-up-right': return <svg {...common}><path d="M7 17L17 7M7 7h10v10"/></svg>;
    case 'phone': return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.967.361 1.92.7 2.84a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.92.339 1.873.573 2.84.7A2 2 0 0 1 22 16.92z"/></svg>;
    case 'mail': return <svg {...common}><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>;
    case 'send': return <svg {...common}><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>;
    case 'paperclip': return <svg {...common}><path d="M21 11.5l-9.5 9.5a5 5 0 0 1-7-7l9.5-9.5a3.5 3.5 0 0 1 5 5L10 18a2 2 0 0 1-3-3l8-8"/></svg>;
    case 'filter': return <svg {...common}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
    case 'sort': return <svg {...common}><path d="M3 6h18M6 12h12M10 18h4"/></svg>;
    case 'more': return <svg {...common}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;
    case 'more-v': return <svg {...common}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
    case 'edit': return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
    case 'trash': return <svg {...common}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    case 'copy': return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
    case 'sun': return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
    case 'moon': return <svg {...common}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'tag': return <svg {...common}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><circle cx="7" cy="7" r="1"/></svg>;
    case 'link': return <svg {...common}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>;
    case 'eye': return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off': return <svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>;
    case 'pause': return <svg {...common}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
    case 'play': return <svg {...common}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
    case 'sparkle': return <svg {...common}><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>;
    case 'zap': return <svg {...common}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'info': return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
    case 'help': return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'card': return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>;
    case 'globe': return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case 'logout': return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'camera': return <svg {...common}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
    case 'image': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
    case 'palette': return <svg {...common}><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 9.86 12c0 3-3.5 4-5 2.5-1-1-2.5-1-3 0-1 2-3 1.5-3 1.5"/></svg>;
    case 'inbox': return <svg {...common}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
    case 'crown': return <svg {...common}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7z"/></svg>;
    case 'logo': return <svg fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24" className={className} style={s}><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2.5"/></svg>;
    case 'flag': return <svg {...common}><path d="M4 22V4a2 2 0 0 1 2-2h11l-2 5 2 5H6"/></svg>;
    case 'pin': return <svg {...common}><path d="M12 17v5M5 12h14l-1.5-7h-11z"/></svg>;
    case 'list': return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
    case 'grid': return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
};

/* === avatar helpers === */
export const avatarTint = (s) => {
  const tints = ['a1','a2','a3','a4','a5','a6'];
  if (!s) return 'a1';
  let h = 0; for (let i = 0; i < s.length; i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return tints[h % tints.length];
};
export const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
};
export const Avatar = ({ name, size, src, className = '' }) => {
  const sizeClass = size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : '';
  return (
    <div className={`avatar ${sizeClass} ${avatarTint(name)} ${className}`}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
    </div>
  );
};

export const Badge = ({ children, kind, className = '' }) => (
  <span className={`badge ${kind || ''} ${className}`}>{children}</span>
);

export const Card = ({ children, className = '', hoverable, flush, ...rest }) => (
  <div className={`card ${className} ${hoverable ? 'hoverable' : ''} ${flush ? 'flush' : ''}`} {...rest}>{children}</div>
);

export const Btn = ({ children, kind = 'secondary', size, icon, onClick, className = '', ...rest }) => (
  <button onClick={onClick} className={`btn btn-${kind} ${size ? size : ''} ${className}`} {...rest}>
    {icon && <Icon name={icon} size={14} />}
    {children}
  </button>
);

export const Switch = ({ on, onChange }) => (
  <div className={`switch ${on ? 'on' : ''}`} onClick={() => onChange?.(!on)} />
);

export const Check = ({ on, onChange }) => (
  <div className={`check ${on ? 'on' : ''}`} onClick={() => onChange?.(!on)} />
);

export const Tabs = ({ value, onChange, items }) => (
  <div className="tabs">
    {items.map(it => (
      <button key={it.value} className={`tab ${value === it.value ? 'active' : ''}`} onClick={() => onChange(it.value)}>
        {it.label}
      </button>
    ))}
  </div>
);

export const Segmented = ({ value, onChange, items }) => (
  <div className="seg">
    {items.map(it => (
      <button key={it.value} className={`seg-btn ${value === it.value ? 'active' : ''}`} onClick={() => onChange(it.value)}>
        {it.label}
      </button>
    ))}
  </div>
);

export const TabsUnderline = ({ value, onChange, items }) => (
  <div className="tabs-underline">
    {items.map(it => (
      <button key={it.value} className={`tab-u ${value === it.value ? 'active' : ''}`} onClick={() => onChange(it.value)}>
        {it.label}{it.count != null && <span className="muted" style={{ marginLeft: 6 }}>{it.count}</span>}
      </button>
    ))}
  </div>
);

export const Empty = ({ icon = 'inbox', title, body, action }) => (
  <div className="empty">
    <div className="empty-icon"><Icon name={icon} size={20} /></div>
    <div className="empty-title">{title}</div>
    <div>{body}</div>
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);

export const Metric = ({ label, value, unit, delta, deltaKind, sparkline, hint }) => (
  <div className="metric">
    <div className="metric-label">{label}{hint && <span data-tip={hint}><Icon name="info" size={12} style={{ color: 'var(--text-4)' }} /></span>}</div>
    <div className="metric-value tabular">{value}{unit && <span className="unit">{unit}</span>}</div>
    {delta != null && (
      <div className={`metric-delta ${deltaKind || ''}`}>
        <Icon name={deltaKind === 'up' ? 'arrow-up' : deltaKind === 'down' ? 'arrow-down' : 'check'} size={11} />
        {delta}
      </div>
    )}
    {sparkline && <div style={{ marginTop: 12 }}>{sparkline}</div>}
  </div>
);

/* === simple inline sparkline === */
export const Spark = ({ values, color, height = 28, fill = true }) => {
  if (!values?.length) return null;
  const w = 100, h = height;
  const min = Math.min(...values), max = Math.max(...values);
  const r = max - min || 1;
  const pts = values.map((v, i) => [i * (w / (values.length - 1)), h - ((v - min) / r) * (h - 2) - 1]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${w} ${h} L0 ${h} Z`;
  const c = color || 'var(--accent)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      {fill && <path d={area} fill={c} opacity="0.10" />}
      <path d={path} stroke={c} strokeWidth="1.5" fill="none" />
    </svg>
  );
};
