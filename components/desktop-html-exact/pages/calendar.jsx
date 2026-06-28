import React from 'react';
import { createPortal } from 'react-dom';

/* Calendar source data */
const CAL = (() => {
  const pad = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function mondayOf(d) {
    const x = new Date(d); const day = (x.getDay() + 6) % 7;
    x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day); return x;
  }
  const TODAY = new Date();
  const WEEK_START = mondayOf(TODAY);
  const offDate = (off) => { const d = new Date(WEEK_START); d.setDate(d.getDate() + off); return d; };

  const STAFF = [
    { id: "s1", name: "Анна Котова",    role: "Стилист",  color: "#5B7FB0" },
    { id: "s2", name: "Мария Лебедева", role: "Колорист", color: "#5A9E84" },
    { id: "s3", name: "Игорь Седов",    role: "Барбер",   color: "#9B7BD4" },
  ];
  const SERVICES = [
    { id: "sv1", name: "Стрижка женская", dur: 60,  price: 2800 },
    { id: "sv2", name: "Окрашивание",     dur: 150, price: 6500 },
    { id: "sv3", name: "Укладка",         dur: 45,  price: 1900 },
    { id: "sv4", name: "Стрижка мужская", dur: 30,  price: 1500 },
    { id: "sv5", name: "Мелирование",     dur: 180, price: 8200 },
    { id: "sv6", name: "Маникюр",         dur: 90,  price: 2400 },
    { id: "sv7", name: "Уход / ботокс",   dur: 120, price: 4500 },
    { id: "sv8", name: "Борода",          dur: 30,  price: 1200 },
  ];
  const svById = (id) => SERVICES.find((s) => s.id === id);

  const A = (id, off, start, svId, staffId, client, status, phone, note) => {
    const sv = svById(svId);
    return { id, dateKey: key(offDate(off)), start, durationMin: sv.dur, serviceId: svId,
      service: sv.name, price: sv.price, staffId, client, status,
      phone: phone || "+7 (9••) •••-••-••", note: note || "" };
  };

  // curated current-week appointments
  const BASE_APPTS = [
    A("a1", 0, "09:00", "sv4", "s3", "Дмитрий Орлов",  "completed", "+7 (903) 221-04-19"),
    A("a2", 0, "10:00", "sv1", "s1", "Елена Соколова", "completed", "+7 (916) 884-12-30"),
    A("a3", 0, "11:30", "sv2", "s2", "Ольга Ким",      "confirmed", "+7 (925) 110-77-02", "Тон 7.1, без аммиака"),
    A("a4", 0, "15:00", "sv6", "s1", "Виктория Лан",   "confirmed", "+7 (909) 443-91-55"),
    A("a5", 0, "17:30", "sv8", "s3", "Артём Гусев",    "new",       "+7 (964) 200-31-88"),
    A("a6", 1, "10:00", "sv5", "s2", "Алина Жукова",   "confirmed", "+7 (903) 555-12-00", "Платиновый блонд"),
    A("a7", 1, "13:30", "sv3", "s1", "Карина Тен",     "new"),
    A("a8", 1, "15:00", "sv1", "s1", "Лариса П.",      "cancelled", "+7 (921) 008-44-19", "Перенос на след. неделю"),
    A("a9", 1, "16:00", "sv4", "s3", "Павел Минин",    "confirmed"),
    A("a10", 2, "09:30", "sv4", "s3", "Сергей Власов", "completed", "+7 (905) 771-23-45"),
    A("a11", 2, "10:30", "sv1", "s1", "Нина Краснова", "confirmed", "+7 (916) 332-90-12"),
    A("a12", 2, "12:00", "sv7", "s2", "Дарья Ким",     "confirmed", "+7 (925) 661-08-77", "Уход после окрашивания"),
    A("a13", 2, "14:30", "sv6", "s1", "Юлия Лето",     "new",       "+7 (903) 200-19-44"),
    A("a14", 2, "16:00", "sv2", "s2", "Тамара Иль",    "confirmed", "+7 (909) 100-22-31"),
    A("a15", 2, "18:30", "sv8", "s3", "Кирилл Дубов",  "new"),
    A("a16", 3, "11:00", "sv5", "s2", "Светлана Боро", "confirmed", "+7 (903) 818-44-12", "Балаяж, тёплый"),
    A("a17", 3, "14:00", "sv3", "s1", "Марина Гай",    "noshow",    "+7 (921) 553-00-19"),
    A("a18", 3, "15:30", "sv4", "s3", "Антон Лебедь",  "confirmed"),
    A("a19", 3, "16:30", "sv1", "s1", "Вера Орех",     "new"),
    A("a20", 4, "09:00", "sv1", "s1", "Галина Ц.",     "confirmed", "+7 (916) 200-77-19"),
    A("a21", 4, "10:30", "sv6", "s1", "Инна Свет",     "confirmed"),
    A("a22", 4, "12:30", "sv7", "s2", "Регина Аб.",    "new",       "+7 (905) 411-30-22"),
    A("a23", 4, "15:00", "sv2", "s2", "Лидия Ор.",     "confirmed", "+7 (903) 222-11-08", "Корни 6.0"),
    A("a24", 4, "17:00", "sv4", "s3", "Глеб Морозов",  "new"),
    A("a25", 4, "18:00", "sv8", "s3", "Назар Ив.",     "confirmed"),
    A("a26", 5, "11:00", "sv5", "s2", "Эльвира Н.",    "confirmed", "+7 (925) 700-19-03"),
    A("a27", 5, "12:00", "sv4", "s3", "Роман Тих.",    "completed"),
    A("a28", 5, "14:00", "sv1", "s1", "Алёна Бр.",     "confirmed"),
  ];

  // curated current-week specific blocks (personal / tech), lunch handled by rule
  const BASE_BLOCKS = [
    { id: "blk-p1", dateKey: key(offDate(2)), start: "17:00", end: "19:00", reason: "personal", label: "Личное время", recurring: "none" },
    { id: "blk-t1", dateKey: key(offDate(3)), start: "09:00", end: "11:00", reason: "tech",     label: "Тех. перерыв",  recurring: "none" },
  ];

  // deterministic generator for non-curated dates
  const NAMES = ["Алексей К.","Марина С.","Ольга В.","Игорь П.","Татьяна Л.","Денис М.","Юлия Р.","Виктор Н.","Софья Д.","Роман Б.","Кира А.","Наталья Ж.","Олег Т.","Полина Е.","Артур Г.","Лиза Ф.","Максим О.","Дина Ш."];
  const STATUSES = ["new", "confirmed", "confirmed", "completed", "confirmed", "new"];
  function rnd(seed) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  function genApptsForDate(date) {
    const wd = (date.getDay() + 6) % 7;
    if (wd === 6) return [];
    const seed = date.getFullYear() * 366 + (date.getMonth() + 1) * 31 + date.getDate();
    const count = 2 + Math.floor(rnd(seed) * 4); // 2..5
    const out = []; let cursor = 9 * 60 + Math.floor(rnd(seed * 2) * 3) * 30;
    for (let i = 0; i < count; i++) {
      const sv = SERVICES[Math.floor(rnd(seed * 7 + i * 11) * SERVICES.length)];
      cursor += Math.floor(rnd(seed + i * 3) * 4) * 30;
      if (cursor + sv.dur > CAL.DAY_END * 60) break;
      const staff = STAFF[Math.floor(rnd(seed * 3 + i) * STAFF.length)];
      const past = date < new Date(new Date().setHours(0, 0, 0, 0));
      out.push({
        id: `g-${key(date)}-${i}`, dateKey: key(date), start: CAL.fmtMin(cursor),
        durationMin: sv.dur, serviceId: sv.id, service: sv.name, price: sv.price,
        staffId: staff.id, client: NAMES[Math.floor(rnd(seed * 5 + i * 7) * NAMES.length)],
        status: past ? "completed" : STATUSES[Math.floor(rnd(seed + i * 13) * STATUSES.length)],
        phone: "+7 (9••) •••-••-••", note: "",
      });
      cursor += sv.dur;
    }
    return out;
  }

  const CUR_WEEK_KEYS = new Set([0, 1, 2, 3, 4, 5, 6].map((o) => key(offDate(o))));

  const REASONS = [
    { id: "personal", label: "Личное время" },
    { id: "lunch",    label: "Перерыв / обед" },
    { id: "vacation", label: "Отпуск" },
    { id: "tech",     label: "Технический перерыв" },
    { id: "other",    label: "Другое" },
  ];
  const STATUS_META = {
    new:       { label: "Новая",        varName: "--st-new" },
    confirmed: { label: "Подтверждена", varName: "--st-confirmed" },
    completed: { label: "Завершена",    varName: "--st-completed" },
    cancelled: { label: "Отменена",     varName: "--st-cancelled" },
    noshow:    { label: "Не пришёл",    varName: "--st-noshow" },
  };
  const DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const DOW_FULL = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
  const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  const MONTHS_NOM = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

  const DAY_START = 8, DAY_END = 21;
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fmtMin = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

  return {
    key, mondayOf, TODAY, WEEK_START, offDate,
    STAFF, SERVICES, svById, BASE_APPTS, BASE_BLOCKS, genApptsForDate, CUR_WEEK_KEYS,
    REASONS, STATUS_META, DOW, DOW_FULL, MONTHS, MONTHS_NOM,
    DAY_START, DAY_END, toMin, fmtMin,
  };
})();



const RU_MONTH_LOOKUP = [
  ['янв', 'january'], ['фев', 'february'], ['мар', 'march'], ['апр', 'april'],
  ['мая', 'май', 'may'], ['июн', 'june'], ['июл', 'july'], ['авг', 'august'],
  ['сен', 'september'], ['окт', 'october'], ['ноя', 'november'], ['дек', 'december'],
];

function addMinutesSafe(time, minutes) {
  const [h = 0, m = 0] = String(time || '10:00').split(':').map(Number);
  return CAL.fmtMin((Number(h) || 0) * 60 + (Number(m) || 0) + Number(minutes || 60));
}

function parsePlatformDate(value, dayOffset = 0) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const day = raw.match(/\d+/)?.[0];
  if (day) {
    const lower = raw.toLowerCase();
    const monthIndex = RU_MONTH_LOOKUP.findIndex((tokens) => tokens.some((token) => lower.includes(token)));
    const now = new Date();
    return new Date(now.getFullYear(), monthIndex >= 0 ? monthIndex : now.getMonth(), Number(day));
  }
  const monday = CAL.mondayOf(new Date());
  monday.setDate(monday.getDate() + Number(dayOffset || 0));
  return monday;
}

function platformStatusToSchedule(status) {
  if (status === 'done' || status === 'completed') return 'completed';
  if (status === 'no_show' || status === 'noshow') return 'noshow';
  if (status === 'confirmed') return 'confirmed';
  if (status === 'cancelled') return 'cancelled';
  return 'new';
}

function scheduleStatusToPlatform(status) {
  if (status === 'completed') return 'done';
  if (status === 'noshow') return 'noshow';
  return status;
}

function mapPlatformServices(services = []) {
  return (Array.isArray(services) ? services : []).map((service) => ({
    id: String(service.id || service.name || Math.random()),
    name: service.name || 'Услуга',
    dur: Number(service.dur ?? service.duration ?? 60),
    price: Number(service.price ?? 0),
  })).filter((service) => service.id && service.name);
}

function mapPlatformAppointments(platform, services, clients) {
  const appointments = Array.isArray(platform?.appointments) ? platform.appointments : [];
  return appointments.map((appt, index) => {
    const service = services.find((item) => item.id === appt.serviceId) || services[0] || CAL.SERVICES[0];
    const client = clients.find((item) => item.id === appt.clientId) || null;
    const date = parsePlatformDate(appt.date, appt.day ?? index % 6);
    const start = appt.start || appt.time || '10:00';
    const end = appt.end || addMinutesSafe(start, service?.dur || 60);
    const durationMin = Math.max(15, CAL.toMin(end) - CAL.toMin(start));
    return {
      id: String(appt.id || `platform-${index}`),
      dateKey: CAL.key(date),
      start,
      durationMin,
      serviceId: service?.id || 'sv1',
      service: service?.name || 'Услуга',
      price: Number(service?.price || appt.price || 0),
      staffId: appt.staffId || CAL.STAFF[index % CAL.STAFF.length]?.id || 's1',
      client: client?.name || appt.clientName || 'Клиент',
      status: platformStatusToSchedule(appt.status),
      phone: client?.phone || appt.clientPhone || '+7 (9••) •••-••-••',
      note: appt.notes || appt.comment || '',
      sourceAppointment: appt,
    };
  });
}

function dateLabel(date) {
  return `${date.getDate()} ${CAL.MONTHS[date.getMonth()]}`;
}

function ScheduleEmptyState({ title, body }) {
  return (
    <div className="schedule-v2 schedule-v2-empty-shell">
      <div className="schedule-v2-empty-card">
        <div className="schedule-v2-empty-icon"><Icon name="cal" size={20} /></div>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </div>
  );
}

/* ---- ui.jsx ---- */
/* ============================================================
   UI atoms — иконки, кнопки, статусы, тултип
   exports to window
   ============================================================ */

const ICONS = {
  prev:  "M15 6l-6 6 6 6",
  next:  "M9 6l6 6-6 6",
  plus:  "M12 5v14M5 12h14",
  down:  "M6 9l6 6 6-6",
  x:     "M6 6l12 12M18 6L6 18",
  filter:"M3 5h18M6 12h12M10 19h4",
  sun:   "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4",
  sunC:  "M12 8a4 4 0 100 8 4 4 0 000-8z",
  moon:  "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  clock: "M12 7v5l3 2",
  user:  "M5 20a7 7 0 0114 0M12 11a4 4 0 100-8 4 4 0 000 8z",
  phone: "M5 4h3l2 5-2.5 1.5a11 11 0 005 5L14 13l5 2v3a2 2 0 01-2 2A14 14 0 013 6a2 2 0 012-2z",
  lock:  "M6 11h12v9H6zM8 11V8a4 4 0 018 0v3",
  repeat:"M4 9l3-3 3 3M5 6h9a4 4 0 014 4M20 15l-3 3-3-3M19 18h-9a4 4 0 01-4-4",
  dots:  "M5 12h.01M12 12h.01M19 12h.01",
  check: "M5 12l4 4L19 7",
  cal:   "M4 6h16v15H4zM4 9h16M8 3v4M16 3v4",
  ruble: "M8 4h4a4 4 0 010 8H8m0-8v16m0-8h7m-7 4h6",
  search:"M11 11m-7 0a7 7 0 1014 0 7 7 0 10-14 0M20 20l-3.5-3.5",
  empty: "M4 8h16v12H4zM4 8l3-4h10l3 4M9 13h6",
  alert: "M12 9v4M12 17h.01M10.3 4.3L3 17a2 2 0 002 3h14a2 2 0 002-3L13.7 4.3a2 2 0 00-3.4 0z",
  scissors:"M6 6l12 12M6 18L18 6M7 6a2 2 0 11-4 0 2 2 0 014 0zM7 18a2 2 0 11-4 0 2 2 0 014 0z",
  grid:  "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list:  "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  arrowR:"M5 12h14M13 6l6 6-6 6",
  trash: "M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13",
  chat:  "M21 11.5a8 8 0 01-11.7 7.1L4 20l1.4-4.2A8 8 0 1121 11.5z",
  pencil:"M4 20h4L18.5 9.5a2 2 0 00-3-3L5 17l-1 3zM14 6l3 3",
};

function Icon({ name, size = 16, stroke = 1.6, style, className }) {
  const d = ICONS[name];
  const extra = name === "sun" ? ICONS.sunC : null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         className={className}
         style={{ flex: "none", display: "block", ...style }}
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {extra && <path d={extra} />}
    </svg>
  );
}

/* compact ghost icon-only button (close / chat / edit) */
function IconButton({ name, title, onClick, size = 16, color = "var(--text-3)" }) {
  return (
    <button
      type="button" title={title} aria-label={title} onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, border: "none", background: "transparent",
        color, borderRadius: "var(--r-sm)", flex: "none",
        transition: "background .14s var(--schedule-ease), color .14s var(--schedule-ease)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 10%, var(--surface))"; e.currentTarget.style.color = "var(--text)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; }}
    >
      <Icon name={name} size={size} />
    </button>
  );
}

/* generic ghost / solid button */
function Btn({ children, icon, variant = "ghost", size = "m", active, onClick, title, style }) {
  const pad = size === "s" ? "0 9px" : "0 12px";
  const h = size === "s" ? 28 : 32;
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7,
    height: h, padding: children ? pad : 0, width: children ? "auto" : h,
    justifyContent: "center",
    borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600,
    border: "1px solid transparent", whiteSpace: "nowrap",
    transition: "background .16s var(--schedule-ease), border-color .16s var(--schedule-ease), color .16s var(--schedule-ease), transform .08s var(--schedule-ease), filter .16s var(--schedule-ease)",
    letterSpacing: "0.01em",
  };
  const variants = {
    ghost:   { background: "transparent", color: "var(--text-2)", borderColor: "var(--border)" },
    bare:    { background: "transparent", color: "var(--text-2)", borderColor: "transparent" },
    solid:   { background: "var(--accent)", color: "var(--accent-ink)", borderColor: "transparent" },
    accent:  { background: "var(--accent)", color: "var(--accent-ink)", borderColor: "transparent" },
  };
  const activeStyle = active
    ? { background: "color-mix(in srgb, var(--accent) 10%, var(--card))", color: "var(--text)", borderColor: "color-mix(in srgb, var(--accent) 42%, var(--border))" }
    : {};
  return (
    <button type="button" title={title} onClick={onClick}
      style={{ ...base, ...variants[variant], ...activeStyle, ...style }}
      onMouseEnter={(e) => {
        if (variant === "ghost" || variant === "bare") {
          e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 7%, var(--surface))";
          e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 26%, var(--border))";
          e.currentTarget.style.color = "var(--text)";
        } else {
          e.currentTarget.style.filter = "brightness(1.04)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "";
        const v = variants[variant]; const a = active ? activeStyle : {};
        e.currentTarget.style.background = (a.background || v.background);
        e.currentTarget.style.borderColor = (a.borderColor || v.borderColor);
        e.currentTarget.style.color = (a.color || v.color);
      }}
    >
      {icon && <Icon name={icon} size={size === "s" ? 14 : 16} />}
      {children}
    </button>
  );
}

/* status visual computation */
function statusStyle(status, mode) {
  const meta = CAL.STATUS_META[status];
  const v = meta.varName;
  const col = `var(${v})`;
  if (mode === "border") {
    return {
      card: {
        background: "var(--card)",
        borderLeft: `3px solid ${col}`,
        border: "1px solid var(--border)",
        borderLeftWidth: 3,
        borderLeftColor: col,
      },
      ink: "var(--text)", sub: "var(--text-2)", dot: col,
    };
  }
  if (mode === "minimal") {
    return {
      card: {
        background: `color-mix(in srgb, ${col} 6%, var(--card))`,
        border: "1px solid var(--border)",
      },
      ink: "var(--text)", sub: "var(--text-2)", dot: col,
    };
  }
  // soft (default)
  return {
    card: {
      background: `color-mix(in srgb, ${col} 13%, var(--card))`,
      border: `1px solid color-mix(in srgb, ${col} 34%, var(--border))`,
    },
    ink: "var(--text)", sub: "var(--text-2)", dot: col,
  };
}

function StatusDot({ status, size = 7 }) {
  const meta = CAL.STATUS_META[status];
  return <span style={{ width: size, height: size, borderRadius: "50%", background: `var(${meta.varName})`, flex: "none", display: "inline-block" }} />;
}

function StatusBadge({ status }) {
  const meta = CAL.STATUS_META[status];
  const col = `var(${meta.varName})`;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 8px 3px 7px", borderRadius: 999, fontSize: 11,
      background: `color-mix(in srgb, ${col} 14%, var(--card))`,
      border: `1px solid color-mix(in srgb, ${col} 30%, var(--border))`,
      color: "var(--text)", whiteSpace: "nowrap", letterSpacing: "0.01em",
    }}>
      <StatusDot status={status} size={6} />
      {meta.label}
    </span>
  );
}

function fmtPrice(n) {
  return n.toLocaleString("ru-RU") + " ₽";
}
function initials(name) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}
function Avatar({ name, color, size = 30 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", flex: "none",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 600, letterSpacing: "0.02em",
      background: `color-mix(in srgb, ${color || "var(--text-3)"} 16%, var(--card))`,
      color: `color-mix(in srgb, ${color || "var(--text-2)"} 75%, var(--text))`,
      border: "1px solid var(--border)",
    }}>{initials(name)}</span>
  );
}



/* ---- overlays.jsx ---- */
/* ============================================================
   Overlays — popover, side panel, фильтры, блокировка, создание
   ============================================================ */

const SCHEDULE_BACKDROP_Z = 2147481000;
const SCHEDULE_POPUP_Z = 2147482000;

function Backdrop({ onClose, dim }) {
  const [bounds, setBounds] = React.useState(null);

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return undefined;
    const resolve = () => {
      const main = document.querySelector(".cb-desktop-html .main");
      const rect = main?.getBoundingClientRect?.();
      const titlebarTop = getDesktopTitlebarHeight();
      const topbarHeight = getDesktopTopbarHeight();
      if (rect?.width > 0 && rect?.height > 0) {
        const top = Math.min(window.innerHeight, Math.max(titlebarTop, rect.top + topbarHeight));
        setBounds({
          left: rect.left,
          top,
          right: window.innerWidth - rect.right,
          bottom: window.innerHeight - rect.bottom,
        });
        return;
      }
      setBounds({ left: 0, top: titlebarTop + topbarHeight, right: 0, bottom: 0 });
    };
    resolve();
    window.addEventListener("resize", resolve);
    return () => window.removeEventListener("resize", resolve);
  }, []);

  return (
    <ScheduleOverlayPortal>
      <div
        className={dim ? "schedule-v2-page-blur-backdrop" : "schedule-v2-transparent-backdrop"}
        onMouseDown={onClose}
        style={{
          position: "fixed",
          left: bounds?.left ?? 0,
          top: bounds?.top ?? 0,
          right: bounds?.right ?? 0,
          bottom: bounds?.bottom ?? 0,
          zIndex: SCHEDULE_BACKDROP_Z,
          background: "transparent",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          animation: "fadeIn .12s ease",
          pointerEvents: "auto",
        }}
      />
    </ScheduleOverlayPortal>
  );
}

function Card({ children, style }) {
  return (
    <div data-schedule-popup="true" style={{
      background: "var(--card)", border: "1px solid var(--border-strong)",
      borderRadius: "var(--r-card)", boxShadow: "var(--shadow-pop)",
      animation: "popIn .14s cubic-bezier(.2,.7,.3,1)", ...style,
    }}>{children}</div>
  );
}

function useScheduleOverlayHost() {
  const [host, setHost] = React.useState(null);

  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return undefined;
    const resolveHost = () => (
      document.querySelector(".cb-desktop-html .main")
      || document.querySelector(".cb-desktop-html")
      || document.body
    );

    setHost(resolveHost());

    // Desktop shell can remount when switching major sections. Keep the portal
    // host fresh so floating schedule windows stay outside clipped content,
    // but still inherit the ClickBook theme variables from the desktop shell.
    const observer = new MutationObserver(() => {
      const next = resolveHost();
      setHost((current) => (current === next ? current : next));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return host;
}

function ScheduleOverlayPortal({ children }) {
  const host = useScheduleOverlayHost();
  return host ? createPortal(
    <div
      className="schedule-v2 schedule-v2-overlay-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: SCHEDULE_BACKDROP_Z,
        pointerEvents: "none",
        overflow: "visible",
        background: "transparent",
      }}
    >
      {children}
    </div>,
    host
  ) : null;
}

const POPUP_POSITION_STORAGE_KEY = "clickbook.schedule.popup.position.v3";

function readStoredPopupPosition() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POPUP_POSITION_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!Number.isFinite(value?.x) || !Number.isFinite(value?.y)) return null;
    return { x: value.x, y: value.y };
  } catch {
    return null;
  }
}

function writeStoredPopupPosition(pos) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POPUP_POSITION_STORAGE_KEY, JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) }));
  } catch {
    // localStorage can be unavailable in hardened/webview contexts; dragging must still work.
  }
}

function popupViewportSize(node, width) {
  return {
    w: node?.offsetWidth || (typeof width === "number" ? width : 320),
    h: node?.offsetHeight || 360,
  };
}

function readPixelCssVar(name, fallback = 0) {
  if (typeof window === "undefined") return fallback;
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function getDesktopTitlebarHeight() {
  if (typeof window === "undefined") return 0;
  const titlebar = document.querySelector(".clickbook-desktop-titlebar, #clickbook-electron-fallback-titlebar");
  const rect = titlebar?.getBoundingClientRect?.();
  if (rect?.height > 0) return rect.height;
  const isDesktop = document.documentElement?.dataset?.clickbookDesktop === "true";
  return isDesktop ? readPixelCssVar("--clickbook-desktop-titlebar-height", 40) : 0;
}

function getDesktopTopbarHeight() {
  if (typeof window === "undefined") return 0;
  const topbar = document.querySelector(".cb-desktop-html .topbar");
  const rect = topbar?.getBoundingClientRect?.();
  if (rect?.height > 0) return rect.height;
  return readPixelCssVar("--topbar-h", 64);
}

function getPopupSafeRect() {
  if (typeof window === "undefined") {
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
  const titlebarH = getDesktopTitlebarHeight();
  const main = document.querySelector(".cb-desktop-html .main");
  const mainRect = main?.getBoundingClientRect?.();
  const base = mainRect?.width > 0 && mainRect?.height > 0
    ? mainRect
    : { left: 0, top: titlebarH, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: Math.max(0, window.innerHeight - titlebarH) };

  const left = Math.max(0, base.left || 0);
  const top = Math.max(titlebarH, base.top || 0);
  const right = Math.min(window.innerWidth, base.right || window.innerWidth);
  const bottom = Math.min(window.innerHeight, base.bottom || window.innerHeight);
  return {
    left,
    top,
    right: Math.max(left, right),
    bottom: Math.max(top, bottom),
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function clampPopupPosition(pos, node, width, pad) {
  if (typeof window === "undefined") return pos;
  const { w, h } = popupViewportSize(node, width);
  const safe = getPopupSafeRect();
  const minX = safe.left + pad;
  const minY = safe.top + pad;
  const maxX = Math.max(minX, safe.right - w - pad);
  const maxY = Math.max(minY, safe.bottom - h - pad);
  return {
    x: Math.min(Math.max(pos.x, minX), maxX),
    y: Math.min(Math.max(pos.y, minY), maxY),
  };
}

function getPopupSafeMaxHeight(pad) {
  if (typeof window === "undefined") return `calc(100vh - ${pad * 2}px)`;
  const safe = getPopupSafeRect();
  return Math.max(220, safe.bottom - safe.top - pad * 2);
}

function isPopupInteractiveTarget(target) {
  return Boolean(target?.closest?.("button,input,textarea,select,a,[role='button'],[role='switch'],.schedule-dropdown-menu"));
}

function CenteredOverlay({ children, width = 320, maxHeight = "calc(100vh - 48px)", pad = 16 }) {
  const nodeRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);

  const resolveDefaultPosition = React.useCallback(() => {
    if (typeof window === "undefined") return { x: pad, y: pad };
    const node = nodeRef.current;
    const { w, h } = popupViewportSize(node, width);
    const safe = getPopupSafeRect();
    return clampPopupPosition({
      x: safe.left + (safe.width - w) / 2,
      y: safe.top + Math.max(16, (safe.height - h) / 2 - 10),
    }, node, width, pad);
  }, [width, pad]);

  const clamp = React.useCallback((next) => clampPopupPosition(next, nodeRef.current, width, pad), [width, pad]);

  React.useLayoutEffect(() => {
    const stored = readStoredPopupPosition();
    window.requestAnimationFrame(() => {
      setPos(clamp(stored || resolveDefaultPosition()));
    });
  }, [clamp, resolveDefaultPosition]);

  React.useEffect(() => {
    if (!pos) return undefined;
    const onResize = () => setPos((current) => current ? clamp(current) : current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos, clamp]);

  const onMouseDownCapture = React.useCallback((event) => {
    if (event.button !== 0) return;
    const node = nodeRef.current;
    if (!node || isPopupInteractiveTarget(event.target)) return;

    const rect = node.getBoundingClientRect();
    const explicitHandle = event.target?.closest?.("[data-popup-drag-handle]");
    const implicitHeader = event.clientY - rect.top <= 56;
    if (!explicitHandle && !implicitHeader) return;

    event.preventDefault();
    event.stopPropagation();

    const initial = pos || { x: rect.left, y: rect.top };
    const start = { x: event.clientX, y: event.clientY, pos: initial };
    let latest = initial;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    const onMove = (moveEvent) => {
      latest = clamp({
        x: start.pos.x + moveEvent.clientX - start.x,
        y: start.pos.y + moveEvent.clientY - start.y,
      });
      setPos(latest);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      writeStoredPopupPosition(latest);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [pos, clamp]);

  const hidden = !pos;
  const safeMaxHeight = getPopupSafeMaxHeight(pad);
  return (
    <ScheduleOverlayPortal>
      <div style={{ position: "fixed", inset: 0, zIndex: SCHEDULE_POPUP_Z, pointerEvents: "none", padding: pad, overflow: "visible" }}>
        <div
          ref={nodeRef}
          onMouseDownCapture={onMouseDownCapture}
          style={{
            pointerEvents: "auto",
            position: "absolute",
            left: pos?.x ?? pad,
            top: pos?.y ?? pad,
            width,
            maxWidth: `calc(100vw - ${pad * 2}px)`,
            maxHeight: typeof safeMaxHeight === "number" ? Math.min(safeMaxHeight, typeof maxHeight === "number" ? maxHeight : safeMaxHeight) : maxHeight,
            display: "flex",
            flexDirection: "column",
            visibility: hidden ? "hidden" : "visible",
          }}
        >
          {children}
        </div>
      </div>
    </ScheduleOverlayPortal>
  );
}

function AnchoredOverlay({ children, anchorRect, width = 320, maxHeight = "calc(100vh - 48px)", gap = 8, pad = 12 }) {
  const nodeRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);

  const resolvePosition = React.useCallback(() => {
    if (typeof window === "undefined") return { x: pad, y: pad };
    const rect = anchorRect || {
      left: window.innerWidth - width - pad,
      right: window.innerWidth - pad,
      top: 56,
      bottom: 88,
    };
    const node = nodeRef.current;
    const { w, h } = popupViewportSize(node, width);
    const safe = getPopupSafeRect();
    const minX = safe.left + pad;
    const minY = safe.top + pad;
    const maxX = Math.max(minX, safe.right - w - pad);
    const maxY = Math.max(minY, safe.bottom - h - pad);
    const belowY = Number.isFinite(rect.bottom) ? rect.bottom + gap : minY;
    const aboveY = Number.isFinite(rect.top) ? rect.top - h - gap : belowY;

    return {
      x: Math.min(Math.max((Number.isFinite(rect.right) ? rect.right : safe.right - pad) - w, minX), maxX),
      y: Math.min(Math.max(belowY + h + pad > safe.bottom ? aboveY : belowY, minY), maxY),
    };
  }, [anchorRect, width, gap, pad]);

  React.useLayoutEffect(() => {
    window.requestAnimationFrame(() => setPos(resolvePosition()));
  }, [resolvePosition]);

  React.useEffect(() => {
    const onResize = () => setPos(resolvePosition());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resolvePosition]);

  const hidden = !pos;
  const safeMaxHeight = getPopupSafeMaxHeight(pad);
  return (
    <ScheduleOverlayPortal>
      <div style={{ position: "fixed", inset: 0, zIndex: SCHEDULE_POPUP_Z, pointerEvents: "none", padding: pad, overflow: "visible" }}>
        <div
          ref={nodeRef}
          style={{
            pointerEvents: "auto",
            position: "absolute",
            left: pos?.x ?? pad,
            top: pos?.y ?? pad,
            width,
            maxWidth: `calc(100vw - ${pad * 2}px)`,
            maxHeight: typeof safeMaxHeight === "number" ? Math.min(safeMaxHeight, typeof maxHeight === "number" ? maxHeight : safeMaxHeight) : maxHeight,
            display: "flex",
            flexDirection: "column",
            visibility: hidden ? "hidden" : "visible",
          }}
        >
          {children}
        </div>
      </div>
    </ScheduleOverlayPortal>
  );
}

function PopupCloseButton({ onClick }) {
  return (
    <button type="button" aria-label="Закрыть" onClick={onClick} style={{ marginLeft: "auto", border: "none", background: "transparent", color: "var(--text-3)", padding: 2, width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
      <Icon name="x" size={16} />
    </button>
  );
}

/* ---------- form atoms ---------- */
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span className="label-mini">{label}</span>
      {children}
    </div>
  );
}
const inputCss = {
  height: 34, padding: "0 10px", borderRadius: "var(--r-sm)",
  border: "1px solid var(--border)", background: "var(--panel)",
  color: "var(--text)", fontSize: 12.5, width: "100%", outline: "none",
  fontFamily: "var(--font)",
};
function TextInput(props) {
  return <input {...props} style={{ ...inputCss, ...props.style }}
    onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; props.onFocus && props.onFocus(e); }}
    onBlur={(e) => { e.target.style.borderColor = "var(--border)"; props.onBlur && props.onBlur(e); }} />;
}
function SelectInput({ value, onChange, options }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  React.useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: open ? 60 : 1 }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          ...inputCss,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          textAlign: "left",
          transition: "border-color .16s var(--schedule-ease), background .16s var(--schedule-ease), box-shadow .16s var(--schedule-ease)",
          borderColor: open ? "color-mix(in srgb, var(--accent) 48%, var(--border))" : "var(--border)",
          background: open ? "color-mix(in srgb, var(--accent) 6%, var(--panel))" : "var(--panel)",
          boxShadow: open ? "0 0 0 3px color-mix(in srgb, var(--accent) 11%, transparent)" : "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected?.label}</span>
        <Icon name="down" size={14} style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform .16s var(--schedule-ease)" }} />
      </button>
      {open && (
        <div
          role="listbox"
          className="schedule-dropdown-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 70,
            maxHeight: 190,
            overflowY: "auto",
            padding: 4,
            borderRadius: "var(--r-sm)",
            background: "var(--card)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-pop)",
            animation: "scheduleDropdownIn .18s var(--schedule-ease)",
          }}
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                type="button"
                key={o.value}
                role="option"
                aria-selected={on}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  width: "100%",
                  minHeight: 30,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  border: "none",
                  borderRadius: 8,
                  background: on ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "transparent",
                  color: on ? "var(--text)" : "var(--text-2)",
                  fontSize: 12.5,
                  fontWeight: on ? 700 : 500,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--surface)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                {on && <Icon name="check" size={13} stroke={2.2} style={{ color: "var(--accent)" }} />}
                {!on && <span style={{ width: 13, flex: "none" }} />}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--surface)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button type="button" key={o.value} onClick={() => onChange(o.value)}
            style={{
              flex: 1, height: 28, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: on ? "var(--card)" : "transparent",
              color: on ? "var(--text)" : "var(--text-2)",
              boxShadow: on ? "var(--shadow-card)" : "none",
              transition: "background .12s var(--schedule-ease), color .12s var(--schedule-ease)",
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}
function Toggle({ on, onChange }) {
  return (
    <span
      role="switch"
      tabIndex={0}
      aria-checked={on}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!on); }
      }}
      style={{
        width: 38, height: 22, borderRadius: 999, border: "1px solid var(--border)",
        background: on ? "var(--accent)" : "var(--surface)", position: "relative",
        transition: "background .15s var(--schedule-ease), border-color .15s var(--schedule-ease)", flex: "none", display: "inline-block", cursor: "pointer",
      }}
    >
      <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .15s var(--schedule-ease)", boxShadow: "0 1px 2px rgba(0,0,0,.3)" }} />
    </span>
  );
}

/* ---------- Detail popover ---------- */
function DetailPopover({ appt, onClose, onStatus, onOpenPanel, onChat }) {
  const start = CAL.toMin(appt.start);
  const d = new Date(appt.dateKey + "T00:00:00");
  const dow = CAL.DOW_FULL[(d.getDay() + 6) % 7];
  return (
    <>
      <Backdrop onClose={onClose} dim />
      <CenteredOverlay width={320}>
        <Card style={{ overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            <StatusDot status={appt.status} size={7} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{appt.client}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{appt.service}</div>
            </div>
            <IconButton name="chat" title="Открыть чат с клиентом" onClick={() => onChat && onChat(appt)} />
            <PopupCloseButton onClick={onClose} />
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", overscrollBehavior: "contain" }}>
            <Row icon="clock" label={`${dow}, ${d.getDate()} ${CAL.MONTHS[d.getMonth()]}`} value={`${appt.start}–${CAL.fmtMin(start + appt.durationMin)} · ${appt.durationMin} мин`} />
            <Row icon="phone" label="Телефон" value={appt.phone} />
            <Row icon="ruble" label="Стоимость" value={fmtPrice(appt.price)} />
            {appt.note && <Row icon="list" label="Заметка" value={appt.note} />}
          </div>
          <div style={{ padding: "12px 16px 14px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, flex: "none" }}>
            <div className="label-mini">Изменить статус</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.keys(CAL.STATUS_META).map((k) => {
                const on = appt.status === k;
                const col = `var(${CAL.STATUS_META[k].varName})`;
                return (
                  <button key={k} type="button" onClick={() => onStatus(appt.id, k)} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11.5, padding: "5px 9px", borderRadius: 999,
                    border: on ? `1px solid ${col}` : "1px solid var(--border)",
                    background: on ? `color-mix(in srgb, ${col} 15%, var(--card))` : "var(--card)",
                    color: "var(--text)", fontWeight: on ? 700 : 500,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
                    {CAL.STATUS_META[k].label}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => { onOpenPanel(appt); onClose(); }} style={{
              marginTop: 1, height: 34, border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
              background: "var(--surface)", color: "var(--text)", fontWeight: 600, fontSize: 12.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>Открыть карточку <Icon name="arrowR" size={15} /></button>
          </div>
        </Card>
      </CenteredOverlay>
    </>
  );
}
function Row({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <Icon name={icon} size={15} style={{ color: "var(--text-3)", marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        <div className="label-mini" style={{ marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.35, textWrap: "pretty" }}>{value}</div>
      </div>
    </div>
  );
}

/* ---------- Appointment card popover ---------- */
function SidePanel({ appt, onClose, onStatus, staff, onDelete, onChat, services, onUpdateService, onAddExtra, onRemoveExtra }) {
  const [editService, setEditService] = React.useState(false);
  const [addingExtra, setAddingExtra] = React.useState(false);
  const st = staff.find((s) => s.id === appt.staffId) || staff[0];
  const start = CAL.toMin(appt.start);
  const d = new Date(appt.dateKey + "T00:00:00");
  const dow = CAL.DOW_FULL[(d.getDay() + 6) % 7];
  const svcList = services && services.length ? services : CAL.SERVICES;
  const extras = appt.extras || [];
  const total = appt.price + extras.reduce((s, e) => s + (e.price || 0), 0);
  return (
    <>
      <Backdrop onClose={onClose} dim />
      <CenteredOverlay width={392}>
        <Card style={{ overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 11, flex: "none" }}>
            <Avatar name={appt.client} color={st.color} size={36} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="label-mini" style={{ marginBottom: 2 }}>Карточка записи</div>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{appt.client}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{appt.phone}</div>
            </div>
            <IconButton name="chat" size={17} title="Открыть чат с клиентом" color="var(--text-2)" onClick={() => onChat && onChat(appt)} />
            <PopupCloseButton onClick={onClose} />
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 13, overflowY: "auto", overscrollBehavior: "contain", flex: "1 1 auto", minHeight: 0 }}>
            <StatusBadge status={appt.status} />
            <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--r-card)", padding: 13, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Icon name="scissors" size={15} style={{ color: "var(--text-3)", marginTop: 1 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="label-mini" style={{ marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span>Услуга</span>
                    {onUpdateService && (
                      <button type="button" onClick={() => setEditService((v) => !v)} title="Изменить услугу"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: editService ? "var(--accent)" : "var(--text-3)", fontSize: 10.5, fontFamily: "var(--font)", textTransform: "none", letterSpacing: 0, padding: 0 }}>
                        <Icon name="pencil" size={12.5} />{editService ? "Готово" : "Изменить"}
                      </button>
                    )}
                  </div>
                  {editService ? (
                    <SelectInput value={appt.serviceId}
                      onChange={(v) => { onUpdateService(appt.id, v); setEditService(false); }}
                      options={svcList.map((s) => ({ value: s.id, label: `${s.name} · ${s.dur} мин · ${fmtPrice(s.price)}` }))} />
                  ) : (
                    <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.35 }}>{appt.service}</div>
                  )}
                  {extras.map((e, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, color: "var(--text)" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-3)", flex: "none" }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                      <span className="tnum" style={{ color: "var(--text-2)" }}>{fmtPrice(e.price)}</span>
                      {onRemoveExtra && <IconButton name="x" size={13} title="Убрать услугу" onClick={() => onRemoveExtra(appt.id, i)} />}
                    </div>
                  ))}
                  {onAddExtra && (addingExtra ? (
                    <div style={{ marginTop: 8 }}>
                      <SelectInput value=""
                        onChange={(v) => { if (v) onAddExtra(appt.id, v); setAddingExtra(false); }}
                        options={[{ value: "", label: "Выберите услугу…" }, ...svcList.map((s) => ({ value: s.id, label: `${s.name} · ${fmtPrice(s.price)}` }))]} />
                    </div>
                  ) : (
                    <button type="button" onClick={() => setAddingExtra(true)} title="Добавить услугу"
                      style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, border: "1px dashed var(--border-strong)", background: "transparent", color: "var(--text-2)", borderRadius: "var(--r-sm)", padding: "5px 10px", fontSize: 12, fontFamily: "var(--font)" }}>
                      <Icon name="plus" size={13} />Добавить услугу
                    </button>
                  ))}
                </div>
              </div>
              <Row icon="clock" label="Дата и время" value={`${dow}, ${d.getDate()} ${CAL.MONTHS[d.getMonth()]} · ${appt.start}–${CAL.fmtMin(start + appt.durationMin)}`} />
              <Row icon="ruble" label={extras.length ? "Стоимость (итого)" : "Стоимость"} value={fmtPrice(total)} />
              {appt.note && <Row icon="list" label="Заметка" value={appt.note} />}
            </div>
            <div>
              <div className="label-mini" style={{ marginBottom: 8 }}>Статус записи</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.keys(CAL.STATUS_META).map((k) => {
                  const on = appt.status === k;
                  const col = `var(${CAL.STATUS_META[k].varName})`;
                  return (
                    <button key={k} type="button" onClick={() => onStatus(appt.id, k)} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, padding: "5px 9px", borderRadius: 999,
                      border: on ? `1px solid ${col}` : "1px solid var(--border)",
                      background: on ? `color-mix(in srgb, ${col} 15%, var(--card))` : "var(--card)",
                      color: "var(--text)", fontWeight: on ? 700 : 500,
                    }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />{CAL.STATUS_META[k].label}</button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", gap: 9, flex: "none" }}>
            <Btn variant="ghost" icon="trash" onClick={() => onDelete(appt.id)} style={{ flex: "none" }} title="Удалить" />
            <Btn variant="accent" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Сохранить</Btn>
          </div>
        </Card>
      </CenteredOverlay>
    </>
  );
}

/* ---------- Block popover (после drag-select) ---------- */
function BlockPopover({ sel, onClose, onConfirm, onRequestDayConfirm }) {
  const [reason, setReason] = React.useState("personal");
  const [scope, setScope] = React.useState("slot");
  const [recurring, setRecurring] = React.useState(false);
  const d = sel.date;
  const dowFull = CAL.DOW_FULL[(d.getDay() + 6) % 7];
  const submit = () => {
    if (scope === "day") { onRequestDayConfirm({ ...sel, reason, recurring }); return; }
    onConfirm({ date: sel.date, startMin: sel.startMin, endMin: sel.endMin, reason, recurring });
  };
  return (
    <>
      <Backdrop onClose={onClose} dim />
      <CenteredOverlay width={320}>
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="lock" size={16} style={{ color: "var(--text-2)" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Заблокировать время</span>
            <PopupCloseButton onClick={onClose} />
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
            <div className="tnum" style={{ fontSize: 12.5, color: "var(--text-2)" }}>
              {dowFull}, {d.getDate()} {CAL.MONTHS[d.getMonth()]} · <span style={{ color: "var(--text)", fontWeight: 600 }}>{scope === "day" ? "весь день" : `${CAL.fmtMin(sel.startMin)}–${CAL.fmtMin(sel.endMin)}`}</span>
            </div>
            <Field label="Причина">
              <SelectInput value={reason} onChange={setReason} options={CAL.REASONS.map((r) => ({ value: r.id, label: r.label }))} />
            </Field>
            <Field label="Объём">
              <Segmented value={scope} onChange={setScope} options={[{ value: "slot", label: "Слот" }, { value: "day", label: "Весь день" }]} />
            </Field>
            <div role="button" tabIndex={0} onClick={() => setRecurring(!recurring)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRecurring((v) => !v); } }} style={{ display: "flex", alignItems: "center", gap: 9, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
              <Toggle on={recurring} onChange={setRecurring} />
              <span style={{ fontSize: 12.5, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="repeat" size={14} style={{ color: "var(--text-3)" }} />Повторять каждый {dowFull.toLowerCase()}</span>
            </div>
          </div>
          <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 9 }}>
            <Btn variant="ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Отмена</Btn>
            <Btn variant="solid" onClick={submit} style={{ flex: 1, justifyContent: "center" }}>Заблокировать</Btn>
          </div>
        </Card>
      </CenteredOverlay>
    </>
  );
}

/* ---------- Unblock menu ---------- */
function UnblockMenu({ block, onClose, onUnblock }) {
  return (
    <>
      <Backdrop onClose={onClose} dim />
      <CenteredOverlay width={240}>
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="lock" size={16} style={{ color: "var(--text-2)" }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{block.label}</div>
              <div className="tnum" style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2 }}>
                {block.start}–{block.end}{block.recurring === "daily" ? " · ежедневно" : block.recurring === "weekly" ? " · еженедельно" : ""}
              </div>
            </div>
            <PopupCloseButton onClick={onClose} />
          </div>
          <div style={{ padding: 12 }}>
            <button type="button" onClick={() => { onUnblock(block.id); onClose(); }} style={{
              width: "100%", height: 34, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              border: "1px solid var(--border)", background: "var(--surface)", borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: 12.5, fontWeight: 600,
            }}>
              <Icon name="check" size={15} style={{ color: "var(--st-confirmed)" }} />Разблокировать
            </button>
          </div>
        </Card>
      </CenteredOverlay>
    </>
  );
}

/* ---------- Day confirm modal ---------- */
function ConfirmModal({ title, text, confirmLabel, onClose, onConfirm, danger }) {
  return (
    <>
      <Backdrop onClose={onClose} dim />
      <CenteredOverlay width={380}>
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name={danger ? "alert" : "lock"} size={16} style={{ color: danger ? "var(--st-cancelled)" : "var(--text-2)" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
            <PopupCloseButton onClick={onClose} />
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, textWrap: "pretty" }}>{text}</div>
          </div>
          <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 9 }}>
            <Btn variant="ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Отмена</Btn>
            <Btn variant="solid" onClick={onConfirm} style={{ flex: 1, justifyContent: "center" }}>{confirmLabel}</Btn>
          </div>
        </Card>
      </CenteredOverlay>
    </>
  );
}

/* ---------- Create appointment popover ---------- */
function CreatePopover({ slot, onClose, onCreate, staff, services }) {
  const [client, setClient] = React.useState("");
  const [svId, setSvId] = React.useState(services[0]?.id || "sv1");
  const [staffId] = React.useState(staff[0]?.id || "s1");
  const [time, setTime] = React.useState(CAL.fmtMin(slot.startMin));
  const d = slot.date;
  const dowFull = CAL.DOW_FULL[(d.getDay() + 6) % 7];
  const sv = services.find((s) => s.id === svId) || services[0] || CAL.SERVICES[0];
  const submit = () => {
    onCreate({ date: slot.date, start: time, serviceId: svId, staffId, client: client.trim() || "Новый клиент" });
    onClose();
  };
  return (
    <>
      <Backdrop onClose={onClose} dim />
      <CenteredOverlay width={320}>
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="plus" size={16} style={{ color: "var(--text-2)" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Новая запись</span>
            <PopupCloseButton onClick={onClose} />
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="tnum" style={{ fontSize: 12, color: "var(--text-2)" }}>{dowFull}, {d.getDate()} {CAL.MONTHS[d.getMonth()]}</div>
            <Field label="Клиент"><TextInput value={client} onChange={(e) => setClient(e.target.value)} placeholder="Имя клиента" autoFocus /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(120px, .62fr)", gap: 10 }}>
              <Field label="Услуга"><SelectInput value={svId} onChange={setSvId} options={services.map((s) => ({ value: s.id, label: `${s.name} · ${s.dur} мин` }))} /></Field>
              <Field label="Время"><TextInput value={time} onChange={(e) => setTime(e.target.value)} className="tnum" /></Field>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)", padding: "2px 2px 0" }}>
              <span>Длительность {sv.dur} мин</span><span className="tnum" style={{ color: "var(--text)" }}>{fmtPrice(sv.price)}</span>
            </div>
          </div>
          <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 9 }}>
            <Btn variant="ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Отмена</Btn>
            <Btn variant="accent" onClick={submit} style={{ flex: 1, justifyContent: "center" }}>Создать</Btn>
          </div>
        </Card>
      </CenteredOverlay>
    </>
  );
}



/* ---- filters.jsx ---- */
/* ============================================================
   Filters popover — услуга, статус, время, окна
   ============================================================ */

function Check({ on, onChange, children, dotColor }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      display: "flex", alignItems: "center", gap: 9, width: "100%",
      padding: "7px 9px", border: "none", background: "transparent",
      borderRadius: "var(--r-sm)", color: "var(--text)", fontSize: 12.5, textAlign: "left",
    }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <span style={{
        width: 17, height: 17, borderRadius: 5, flex: "none",
        border: on ? "1px solid var(--accent)" : "1px solid var(--border-strong)",
        background: on ? "var(--accent)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--accent-ink)",
      }}>{on && <Icon name="check" size={12} stroke={2.4} />}</span>
      {dotColor && <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />}
      {children}
    </button>
  );
}

function FiltersPopover({ anchorRect, filters, setFilters, onClose, services }) {
  const f = filters;
  const upd = (patch) => setFilters({ ...f, ...patch });
  const toggleStatus = (k) => {
    const set = new Set(f.statuses);
    set.has(k) ? set.delete(k) : set.add(k);
    upd({ statuses: [...set] });
  };
  const reset = () => setFilters({ staffId: "all", serviceId: "all", statuses: [], from: "08:00", to: "21:00", onlyFree: false, onlyBlocked: false });
  return (
    <>
      <Backdrop onClose={onClose} />
      <AnchoredOverlay anchorRect={anchorRect} width={320}>
        <Card style={{ overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 48px)" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
            <Icon name="filter" size={16} style={{ color: "var(--text-2)" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Фильтры</span>
            <button type="button" onClick={reset} style={{ marginLeft: "auto", border: "none", background: "transparent", color: "var(--text-2)", fontSize: 11.5, fontFamily: "var(--font)", padding: "3px 0" }}>Сбросить</button>
            <PopupCloseButton onClick={onClose} />
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 13, overflowY: "auto", overscrollBehavior: "contain" }}>
            <Field label="Услуга">
              <SelectInput value={f.serviceId} onChange={(v) => upd({ serviceId: v })} options={[{ value: "all", label: "Все услуги" }, ...services.map((s) => ({ value: s.id, label: s.name }))]} />
            </Field>
            <div>
              <div className="label-mini" style={{ marginBottom: 6 }}>Статус</div>
              <div style={{ display: "grid", gap: 4 }}>
                {Object.keys(CAL.STATUS_META).map((k) => (
                  <Check key={k} on={f.statuses.includes(k)} onChange={() => toggleStatus(k)} dotColor={`var(${CAL.STATUS_META[k].varName})`}>
                    {CAL.STATUS_META[k].label}
                  </Check>
                ))}
              </div>
            </div>
            <Field label="Диапазон времени">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TextInput value={f.from} onChange={(e) => upd({ from: e.target.value })} className="tnum" style={{ textAlign: "center" }} />
                <span style={{ color: "var(--text-3)" }}>—</span>
                <TextInput value={f.to} onChange={(e) => upd({ to: e.target.value })} className="tnum" style={{ textAlign: "center" }} />
              </div>
            </Field>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 12.5 }}>Только свободные окна</span>
                <Toggle on={f.onlyFree} onChange={(v) => upd({ onlyFree: v, onlyBlocked: v ? false : f.onlyBlocked })} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 12.5 }}>Только заблокированные</span>
                <Toggle on={f.onlyBlocked} onChange={(v) => upd({ onlyBlocked: v, onlyFree: v ? false : f.onlyFree })} />
              </div>
            </div>
          </div>
          <div style={{ padding: 16, borderTop: "1px solid var(--border)", flex: "none" }}>
            <Btn variant="solid" onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>Применить</Btn>
          </div>
        </Card>
      </AnchoredOverlay>
    </>
  );
}



/* ---- grid.jsx ---- */
/* ============================================================
   TimeGrid — общая сетка времени (Неделя = 7 дней, День = 1 день)
   date-based
   ============================================================ */

function layoutLanes(items) {
  const sorted = items.slice().sort((a, b) => a.s - b.s || a.e - b.e);
  const out = [];
  let cluster = [], clusterEnd = -1;
  const flush = () => {
    const cols = [];
    cluster.forEach((it) => {
      let placed = false;
      for (let i = 0; i < cols.length; i++) {
        if (it.s >= cols[i]) { it.col = i; cols[i] = it.e; placed = true; break; }
      }
      if (!placed) { it.col = cols.length; cols.push(it.e); }
    });
    cluster.forEach((it) => { it.lanes = cols.length; });
    out.push(...cluster);
    cluster = []; clusterEnd = -1;
  };
  sorted.forEach((it) => {
    if (cluster.length && it.s >= clusterEnd) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.e);
  });
  flush();
  return out;
}

function ApptBlock({ a, ph, cardStyle, onClick, onHover, dim }) {
  const start = CAL.toMin(a.start);
  const top = (start - CAL.DAY_START * 60) / 60 * ph;
  const height = Math.max(a.durationMin / 60 * ph, 20);
  const ss = statusStyle(a.status, cardStyle);
  const compact = height < 46;
  const tiny = height < 30;
  const cancelled = a.status === "cancelled";
  const widthPct = 100 / a.lanes;
  const leftPct = a.col * widthPct;
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onClick(a, e); }}
      onMouseEnter={(e) => { onHover && onHover(a, { x: e.clientX, y: e.clientY }); e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-card)"; e.currentTarget.style.zIndex = 6; }}
      onMouseMove={(e) => { onHover && onHover(a, { x: e.clientX, y: e.clientY }); }}
      onMouseLeave={(e) => { onHover && onHover(null); e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.zIndex = ""; }}
      style={{
        position: "absolute",
        top, height: height - 3,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        borderRadius: "var(--r-xs)",
        padding: tiny ? "1px 7px" : compact ? "4px 8px" : "6px 9px",
        overflow: "hidden", cursor: "pointer",
        transition: "transform .1s, box-shadow .12s, opacity .12s",
        opacity: dim ? 0.32 : (cancelled ? 0.7 : 1),
        display: "flex", flexDirection: "column",
        gap: tiny ? 0 : 2,
        ...ss.card,
      }}
    >
      {tiny ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
          <StatusDot status={a.status} size={5} />
          <span style={{ fontSize: 11, fontWeight: 600, color: ss.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: cancelled ? "line-through" : "none" }}>{a.client}</span>
          <span className="tnum" style={{ fontSize: 10.5, color: ss.sub, marginLeft: "auto", whiteSpace: "nowrap" }}>{a.start}</span>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <StatusDot status={a.status} size={6} />
            <span style={{ fontSize: 12, fontWeight: 600, color: ss.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em", textDecoration: cancelled ? "line-through" : "none" }}>{a.client}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: ss.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.service}</span>
          </div>
          {!compact && (
            <span className="tnum" style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: "auto", letterSpacing: "0.01em" }}>
              {a.start}–{CAL.fmtMin(start + a.durationMin)}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function BlockZone({ b, ph, onClick }) {
  const s = CAL.toMin(b.start), e = CAL.toMin(b.end);
  const top = (s - CAL.DAY_START * 60) / 60 * ph;
  const height = (e - s) / 60 * ph;
  const isLunch = b.reason === "lunch";
  return (
    <div
      className="hatch"
      onMouseDown={(ev) => ev.stopPropagation()}
      onClick={(ev) => { ev.stopPropagation(); onClick(b, ev); }}
      title={`${b.label} · ${b.start}–${b.end}`}
      style={{
        position: "absolute", top, height: height - 2,
        left: 2, right: 2, borderRadius: "var(--r-xs)",
        background: isLunch ? "color-mix(in srgb, var(--text-3) 7%, transparent)" : undefined,
        border: "1px solid var(--border)",
        cursor: "pointer", overflow: "hidden",
        display: "flex", alignItems: height > 34 ? "flex-start" : "center",
        padding: "5px 8px",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-2)", background: "var(--card)", padding: "2px 6px", borderRadius: 5, border: "1px solid var(--border)" }}>
        <Icon name="lock" size={11} />{b.label}
      </span>
    </div>
  );
}

function TimeGrid({ days, ph: basePh, getAppts, getBlocks, isClosed, isToday, nowMin,
                    cardStyle, hoveredId, onApptClick, onEmptyClick,
                    onBlockSelect, onBlockClick, onHover, fullNames }) {
  // ---- single source of truth for the time axis ----
  const START = CAL.DAY_START;
  const END = CAL.DAY_END;
  const hoursSpan = Math.max(1, END - START);
  const hours = [];
  for (let h = START; h <= END; h++) hours.push(h);

  const bodyRef = React.useRef(null);
  const headerRef = React.useRef(null);
  const [fitPh, setFitPh] = React.useState(basePh);

  // Fit the hour-height so the grid ends exactly on the last hour line with no
  // dead-zone below it. Applies to BOTH day and week views: the body height
  // (minus the sticky header) is divided across the hour span, never going
  // below basePh (so short viewports scroll instead of squashing).
  React.useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const update = () => {
      const headerH = headerRef.current ? headerRef.current.offsetHeight : 0;
      const usable = Math.max(0, el.clientHeight - headerH);
      const next = Math.max(basePh, usable / hoursSpan);
      setFitPh((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    if (headerRef.current) ro?.observe(headerRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [basePh, days.length, fullNames, hoursSpan]);

  const ph = fitPh || basePh;
  const gridHeight = hoursSpan * ph; // exact: last hour line == bottom edge
  const [drag, setDrag] = React.useState(null);
  const dragRef = React.useRef(null);
  const tmpl = `var(--time-col) repeat(${days.length}, minmax(0,1fr))`;

  const minuteAtY = (y) => {
    let m = START * 60 + (y / ph) * 60;
    m = Math.round(m / 15) * 15;
    return Math.max(START * 60, Math.min(END * 60, m));
  };

  const startDrag = (e, dayIdx, date) => {
    if (isClosed(date)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y0 = e.clientY - rect.top;
    const m0 = minuteAtY(y0);
    dragRef.current = { dayIdx, date, m0, moved: false };
    setDrag({ dayIdx, s: m0, e: m0 + 15 });
    const move = (ev) => {
      const y = ev.clientY - rect.top;
      const m = minuteAtY(y);
      if (Math.abs(m - m0) >= 15) dragRef.current.moved = true;
      setDrag({ dayIdx, s: Math.min(m0, m), e: Math.max(m0, m) });
    };
    const up = (ev) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      const d = dragRef.current;
      const m = minuteAtY(ev.clientY - rect.top);
      const s = Math.min(d.m0, m), en = Math.max(d.m0, m);
      setDrag(null);
      if (d.moved && en - s >= 15) {
        onBlockSelect({ date, startMin: s, endMin: en }, { x: ev.clientX, y: ev.clientY });
      } else {
        const slot = Math.floor(d.m0 / 60) * 60;
        onEmptyClick({ date, startMin: Math.max(START * 60, slot) }, { x: ev.clientX, y: ev.clientY });
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // Header cells (shared with the scroll body so the day columns, hour lines,
  // appointment cards and blocked slots all live in one coordinate system).
  const headerRow = (
    <div ref={headerRef} style={{ display: "grid", gridTemplateColumns: tmpl, borderBottom: "1px solid var(--border)", background: "var(--panel)", position: "sticky", top: 0, zIndex: 8 }}>
      <div style={{ borderRight: "1px solid var(--border)" }} />
      {days.map((date, i) => {
        const today = isToday(date);
        const dowIdx = (date.getDay() + 6) % 7;
        const closed = isClosed(date);
        return (
          <div key={i} style={{
            padding: fullNames ? "14px 16px" : "10px 12px",
            borderRight: i === days.length - 1 ? "none" : "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 9,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span className="label-mini" style={{ color: today ? "var(--accent)" : "var(--text-3)" }}>
                {fullNames ? CAL.DOW_FULL[dowIdx] : CAL.DOW[dowIdx]}
              </span>
              <span className="tnum" style={{ fontSize: fullNames ? 15 : 14, fontWeight: 600, color: closed ? "var(--text-3)" : "var(--text)" }}>
                {fullNames ? `${date.getDate()} ${CAL.MONTHS[date.getMonth()]}` : date.getDate()}
              </span>
            </div>
            {today && (
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "var(--accent-ink)", background: "var(--accent)", padding: "2px 7px", borderRadius: 999, letterSpacing: "0.02em" }}>
                Сегодня
              </span>
            )}
            {closed && !today && <span style={{ marginLeft: "auto" }} className="label-mini">Выходной</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="schedule-timegrid" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header + content share one scroll container => columns stay aligned
          even when a scrollbar appears (no header/body width drift). */}
      <div ref={bodyRef} className="schedule-timegrid-body" style={{ overflowY: "auto", overflowX: "hidden", flex: 1, minHeight: 0 }}>
        {headerRow}
        <div style={{ display: "grid", gridTemplateColumns: tmpl, position: "relative" }}>
          {/* gutter */}
          <div style={{ position: "relative", height: gridHeight, borderRight: "1px solid var(--border)" }}>
            {hours.map((h, i) => (
              <div key={h} className="tnum label-mini" style={{
                position: "absolute", top: i * ph, right: 10,
                transform: i === 0 ? "none" : i === hours.length - 1 ? "translateY(-100%)" : "translateY(-50%)",
                color: "var(--text-3)", fontSize: 10.5,
              }}>{String(h).padStart(2, "0")}:00</div>
            ))}
          </div>

          {/* day columns */}
          {days.map((date, dayIdx) => {
            const closed = isClosed(date);
            const dayAppts = getAppts(date);
            const laid = layoutLanes(dayAppts.map((a) => ({ ...a, s: CAL.toMin(a.start), e: CAL.toMin(a.start) + a.durationMin })));
            const dayBlocks = getBlocks(date);
            const showNow = isToday(date);
            const nowTopMin = Math.max(START * 60, Math.min(END * 60, nowMin));
            return (
              <div key={dayIdx}
                onMouseDown={(e) => startDrag(e, dayIdx, date)}
                className={closed ? "hatch" : ""}
                style={{
                  position: "relative", height: gridHeight,
                  borderRight: dayIdx === days.length - 1 ? "none" : "1px solid var(--border)",
                  backgroundImage: closed ? undefined : `repeating-linear-gradient(var(--border) 0 1px, transparent 1px ${ph}px), repeating-linear-gradient(color-mix(in srgb, var(--border) 45%, transparent) 0 1px, transparent 1px ${ph / 2}px)`,
                  cursor: closed ? "default" : "cell",
                }}
              >
                {closed && (
                  <div style={{ position: "sticky", top: 0, display: "flex", justifyContent: "center", paddingTop: 22 }}>
                    <span className="label-mini" style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 999 }}>Нерабочий день</span>
                  </div>
                )}
                {dayBlocks.map((b) => <BlockZone key={b.id} b={b} ph={ph} onClick={onBlockClick} />)}
                {laid.map((a) => (
                  <ApptBlock key={a.id} a={a} ph={ph} cardStyle={cardStyle}
                    onClick={onApptClick} onHover={onHover}
                    dim={hoveredId && hoveredId !== a.id} />
                ))}
                {drag && drag.dayIdx === dayIdx && (
                  <div style={{
                    position: "absolute", left: 2, right: 2,
                    top: (drag.s - CAL.DAY_START * 60) / 60 * ph,
                    height: Math.max((drag.e - drag.s) / 60 * ph, 4),
                    background: "color-mix(in srgb, var(--accent) 16%, transparent)",
                    border: "1px solid var(--accent)", borderRadius: "var(--r-xs)",
                    pointerEvents: "none", zIndex: 7,
                    display: "flex", alignItems: "flex-start", padding: "4px 7px",
                  }}>
                    <span className="tnum" style={{ fontSize: 10.5, color: "var(--accent)", fontWeight: 600 }}>
                      {CAL.fmtMin(drag.s)}–{CAL.fmtMin(drag.e)}
                    </span>
                  </div>
                )}
                {showNow && (
                  <div style={{ position: "absolute", left: 0, right: 0, top: (nowTopMin - CAL.DAY_START * 60) / 60 * ph, zIndex: 7, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: -4, top: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                    <div style={{ height: 1.5, background: "var(--accent)", opacity: 0.9 }} />
                    <span className="tnum" style={{ position: "absolute", right: 6, top: -10, fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "var(--panel)", padding: "1px 5px", borderRadius: 999, border: "1px solid color-mix(in srgb, var(--accent) 35%, var(--border))" }}>{CAL.fmtMin(nowMin)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



/* ---- states.jsx ---- */
/* ============================================================
   Состояния — tooltip, skeleton, empty, side panel дня (месяц)
   ============================================================ */

/* ---------- Hover tooltip над карточкой ---------- */
function ApptTooltip({ h }) {
  const a = h.appt;
  const start = CAL.toMin(a.start);
  const W = 210;
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ left: -9999, top: -9999, ready: false });
  // Follow the cursor: sit just below-right of the pointer, and only flip to
  // the other side / above when it would otherwise spill off the viewport.
  React.useLayoutEffect(() => {
    const el = ref.current;
    const hgt = el ? el.offsetHeight : 120;
    const vw = window.innerWidth, vh = window.innerHeight;
    const off = 14;
    let left = h.x + off;
    if (left + W > vw - 12) left = h.x - W - off; // flip to the left of cursor
    if (left < 12) left = 12;
    let top = h.y + off;
    if (top + hgt > vh - 12) top = h.y - hgt - off; // flip above cursor
    if (top < 12) top = 12;
    setPos({ left, top, ready: true });
  }, [h.x, h.y]);
  return (
    <div ref={ref} style={{
      position: "fixed", left: pos.left, top: pos.top, zIndex: 60, width: W, pointerEvents: "none",
      opacity: pos.ready ? 1 : 0,
      background: "var(--card)", border: "1px solid var(--border-strong)",
      borderRadius: "var(--r-sm)", boxShadow: "var(--shadow-pop)", padding: "10px 12px",
      animation: "fadeIn .1s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
        <StatusDot status={a.status} size={7} />
        <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.client}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-2)", marginBottom: 7 }}>{a.service}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-2)" }}>
          <Icon name="clock" size={12} style={{ color: "var(--text-3)" }} />
          <span className="tnum">{a.start}–{CAL.fmtMin(start + a.durationMin)} · {a.durationMin} мин</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-2)" }}>
          <Icon name="ruble" size={12} style={{ color: "var(--text-3)" }} />
          <span className="tnum" style={{ color: "var(--text)" }}>{fmtPrice(a.price)}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Skeleton сетки (loading) ---------- */
function SkeletonGrid({ view }) {
  if (view === "month") {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)" }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRight: i === 6 ? "none" : "1px solid var(--border)" }}>
              <div className="skel" style={{ width: 22, height: 9 }} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateRows: "repeat(6,1fr)" }}>
          {Array.from({ length: 6 }).map((_, w) => (
            <div key={w} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: w === 5 ? "none" : "1px solid var(--border)" }}>
              {Array.from({ length: 7 }).map((_, d) => (
                <div key={d} style={{ borderRight: d === 6 ? "none" : "1px solid var(--border)", padding: "8px 9px", display: "flex", flexDirection: "column", gap: 5 }}>
                  <div className="skel" style={{ width: 18, height: 14, borderRadius: "50%" }} />
                  {(w * 7 + d) % 3 !== 0 && <div className="skel" style={{ width: "85%", height: 14 }} />}
                  {(w * 7 + d) % 2 === 0 && <div className="skel" style={{ width: "70%", height: 14 }} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  const cols = view === "day" ? 1 : 7;
  const ph = 64;
  const placeholders = [
    [1, "10%", "30%"], [3, "32%", "26%"], [2, "60%", "22%"],
    [1.5, "18%", "55%"], [2.5, "48%", "60%"], [1, "72%", "40%"],
    [2, "8%", "78%"], [1.5, "55%", "82%"],
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "grid", gridTemplateColumns: `var(--time-col) repeat(${cols},1fr)`, borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
        <div style={{ borderRight: "1px solid var(--border)" }} />
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} style={{ padding: "10px 12px", borderRight: i === cols - 1 ? "none" : "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 5 }}>
            <div className="skel" style={{ width: 24, height: 8 }} />
            <div className="skel" style={{ width: 18, height: 15 }} />
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "grid", gridTemplateColumns: `var(--time-col) repeat(${cols},1fr)` }}>
        <div style={{ borderRight: "1px solid var(--border)", paddingTop: 6 }}>
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} style={{ height: ph, display: "flex", justifyContent: "flex-end", paddingRight: 10 }}>
              <div className="skel" style={{ width: 30, height: 8 }} />
            </div>
          ))}
        </div>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} style={{ position: "relative", borderRight: c === cols - 1 ? "none" : "1px solid var(--border)", backgroundImage: `repeating-linear-gradient(var(--border) 0 1px, transparent 1px ${ph}px)` }}>
            {placeholders.filter((_, i) => (i + c) % 2 === 0 || cols === 1).map((p, i) => (
              <div key={i} className="skel" style={{ position: "absolute", top: `calc(${p[2]} + ${c * 17}px)`, left: "5%", width: "90%", height: p[0] * 46, borderRadius: "var(--r-xs)" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
function EmptyState({ onClear, blocked, free }) {
  const title = blocked ? "Заблокированных зон нет" : free ? "Свободных окон не найдено" : "Записей не найдено";
  const text = blocked
    ? "В этом периоде нет заблокированного времени. Выделите диапазон в сетке, чтобы заблокировать слот."
    : free
    ? "По выбранным условиям свободных окон нет. Измените диапазон времени или фильтры."
    : "Нет записей, удовлетворяющих фильтрам. Сбросьте условия или измените период.";
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center",
      padding: 40, background: "color-mix(in srgb, var(--panel) 80%, transparent)",
      backdropFilter: "blur(1px)", animation: "fadeIn .15s ease", pointerEvents: "none",
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
        <Icon name={blocked ? "lock" : free ? "clock" : "search"} size={24} stroke={1.4} />
      </div>
      <div style={{ maxWidth: 320 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, textWrap: "pretty" }}>{text}</div>
      </div>
      <div style={{ pointerEvents: "auto" }}>
        <Btn variant="ghost" icon="x" onClick={onClear}>Сбросить фильтры</Btn>
      </div>
    </div>
  );
}

/* ---------- Side panel дня (из режима Месяц) ---------- */
function DayListPanel({ date, appts, blocks, staff, onClose, onApptClick, onOpenDay }) {
  const dow = CAL.DOW_FULL[(date.getDay() + 6) % 7];
  const realBlocks = blocks.filter((b) => b.reason !== "lunch");
  const revenue = appts.filter((a) => a.status === "completed" || a.status === "confirmed").reduce((s, a) => s + a.price, 0);
  return (
    <>
      <div onMouseDown={onClose} style={{
        position: "absolute", inset: 0, zIndex: 40,
        background: "color-mix(in srgb, var(--canvas) 40%, transparent)",
        animation: "fadeIn .12s ease",
      }} />
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: "min(380px, 100%)", zIndex: 50,
        background: "var(--panel)", borderLeft: "1px solid var(--border-strong)",
        boxShadow: "var(--shadow-pop)", animation: "slideIn .2s cubic-bezier(.2,.7,.3,1)",
        display: "flex", flexDirection: "column", minHeight: 0,
      }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span className="label-mini">{dow}</span>
            <div className="tnum" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginTop: 1 }}>
              {date.getDate()} {CAL.MONTHS[date.getMonth()]}
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", color: "var(--text-2)", padding: 4 }}><Icon name="x" size={18} /></button>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1 }}>
            <div className="label-mini" style={{ marginBottom: 4 }}>Записей</div>
            <div className="tnum" style={{ fontSize: 18, fontWeight: 600 }}>{appts.length}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="label-mini" style={{ marginBottom: 4 }}>Выручка</div>
            <div className="tnum" style={{ fontSize: 18, fontWeight: 600, color: "var(--accent)" }}>{fmtPrice(revenue)}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {appts.length === 0 && realBlocks.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 12.5, padding: "40px 0" }}>
              <Icon name="empty" size={28} stroke={1.3} style={{ margin: "0 auto 10px", color: "var(--text-3)" }} />
              На этот день записей нет
            </div>
          )}
          {appts.map((a) => {
            const start = CAL.toMin(a.start);
            const col = `var(${CAL.STATUS_META[a.status].varName})`;
            return (
              <div role="button" tabIndex={0} key={a.id} onClick={() => onApptClick(a)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onApptClick(a); } }}
                style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
                padding: "11px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)",
                background: "var(--card)", borderLeft: `3px solid ${col}`, transition: "background .12s",
              }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"} onMouseLeave={(e) => e.currentTarget.style.background = "var(--card)"}>
                <div className="tnum" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: "none", width: 42 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{a.start}</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{CAL.fmtMin(start + a.durationMin)}</span>
                </div>
                <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: a.status === "cancelled" ? "line-through" : "none" }}>{a.client}</div>
                  <div style={{ fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.service}</div>
                </div>
                <Icon name="arrowR" size={15} style={{ color: "var(--text-3)", flex: "none" }} />
              </div>
            );
          })}

          {realBlocks.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div className="label-mini" style={{ marginBottom: 7 }}>Заблокировано</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {realBlocks.map((b) => (
                  <div key={b.id} className="hatch" style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
                    <Icon name="lock" size={14} style={{ color: "var(--text-2)" }} />
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{b.label}</span>
                    <span className="tnum" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-2)" }}>{b.start}–{b.end}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
          <Btn variant="solid" onClick={onOpenDay} style={{ width: "100%", justifyContent: "center" }}>
            Открыть день <Icon name="arrowR" size={15} />
          </Btn>
        </div>
      </div>
    </>
  );
}



/* ---- views.jsx ---- */
/* ============================================================
   DayView (со сводкой) + MonthView
   ============================================================ */

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-card)", padding: "13px 16px", minWidth: 0 }}>
      <div className="label-mini" style={{ marginBottom: 7 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: accent ? "var(--accent)" : "var(--text)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
    </div>
  );
}

function DayView({ date, getAppts, getBlocks, isClosed, isToday, nowMin, cardStyle, hoveredId, onApptClick, onEmptyClick, onBlockSelect, onBlockClick, onHover }) {
  const allDay = getAppts(date);
  const dayAppts = allDay.filter((a) => a.status !== "cancelled");
  const total = allDay.length;
  const revenue = dayAppts.filter((a) => a.status === "completed" || a.status === "confirmed").reduce((s, a) => s + a.price, 0);
  const busy = [...dayAppts.map((a) => ({ s: CAL.toMin(a.start), e: CAL.toMin(a.start) + a.durationMin })),
                ...getBlocks(date).map((b) => ({ s: CAL.toMin(b.start), e: CAL.toMin(b.end) }))]
                .sort((a, b) => a.s - b.s);
  let cursor = CAL.DAY_START * 60, freeWindows = 0;
  busy.forEach((b) => { if (b.s - cursor >= 30) freeWindows++; cursor = Math.max(cursor, b.e); });
  if (CAL.DAY_END * 60 - cursor >= 30) freeWindows++;
  const ref = isToday(date) ? nowMin : 0;
  const upcoming = dayAppts.filter((a) => CAL.toMin(a.start) >= ref).sort((a, b) => CAL.toMin(a.start) - CAL.toMin(b.start))[0];
  const ph = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--hour-h-day")) || 92;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)", flex: "none" }}>
        <StatCard label="Всего записей" value={total} sub={`${dayAppts.length} активных`} />
        <StatCard label="Свободных окон" value={freeWindows} sub="≥ 30 минут" />
        <StatCard label="Выручка дня" value={fmtPrice(revenue)} sub="подтв. + завершено" accent />
        <StatCard label="Ближайшая запись" value={upcoming ? upcoming.start : "—"} sub={upcoming ? upcoming.client : "нет записей"} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <TimeGrid days={[date]} ph={ph}
          getAppts={getAppts} getBlocks={getBlocks} isClosed={isClosed} isToday={isToday} nowMin={nowMin}
          cardStyle={cardStyle} hoveredId={hoveredId}
          onApptClick={onApptClick} onEmptyClick={onEmptyClick} onBlockSelect={onBlockSelect} onBlockClick={onBlockClick} onHover={onHover}
          fullNames />
      </div>
    </div>
  );
}

/* ---------- Month ---------- */
function MonthView({ monthRef, getDayAppts, dayHasBlock, onDayClick, todayDate }) {
  const first = new Date(monthRef.getFullYear(), monthRef.getMonth(), 1);
  const startDow = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(1 - startDow);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      row.push(date);
    }
    weeks.push(row);
  }
  const isToday = (d) => d.toDateString() === todayDate.toDateString();
  const inMonth = (d) => d.getMonth() === monthRef.getMonth();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)", flex: "none", background: "var(--panel)" }}>
        {CAL.DOW.map((d, i) => (
          <div key={d} className="label-mini" style={{ padding: "10px 14px", borderRight: i === 6 ? "none" : "1px solid var(--border)", color: i === 6 ? "var(--text-3)" : "var(--text-2)" }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateRows: "repeat(6,1fr)", overflow: "hidden" }}>
        {weeks.map((row, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: wi === 5 ? "none" : "1px solid var(--border)", minHeight: 0 }}>
            {row.map((date, di) => {
              const list = getDayAppts(date);
              const closed = ((date.getDay() + 6) % 7) === 6;
              const hasBlock = dayHasBlock(date);
              const today = isToday(date);
              const muted = !inMonth(date);
              const shown = list.slice(0, 3);
              return (
                <div role="button" tabIndex={0} key={di} onClick={() => onDayClick(date)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDayClick(date); } }}
                  className={closed && !muted ? "hatch" : ""}
                  style={{
                    textAlign: "left", border: "none", borderRight: di === 6 ? "none" : "1px solid var(--border)",
                    background: today ? "color-mix(in srgb, var(--accent) 7%, var(--card))" : "transparent",
                    padding: "8px 9px", display: "flex", flexDirection: "column", gap: 4, minHeight: 0, overflow: "hidden",
                    cursor: "pointer", opacity: muted ? 0.4 : 1, position: "relative",
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) => { if (!today) e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={(e) => { if (!today) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="tnum" style={{
                      fontSize: 12.5, fontWeight: today ? 700 : 500,
                      color: today ? "var(--accent-ink)" : "var(--text)",
                      background: today ? "var(--accent)" : "transparent",
                      width: today ? 22 : "auto", height: today ? 22 : "auto", borderRadius: "50%",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>{date.getDate()}</span>
                    {hasBlock && <span className="hatch" style={{ width: 13, height: 9, borderRadius: 3, border: "1px solid var(--border)", marginLeft: 1 }} title="Есть блокировки" />}
                    {list.length > 0 && <span className="tnum" style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--text-3)" }}>{list.length}</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 0, overflow: "hidden" }}>
                    {shown.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: "var(--surface)", borderRadius: 4, padding: "2px 5px" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: `var(${CAL.STATUS_META[a.status].varName})`, flex: "none" }} />
                        <span className="tnum" style={{ color: "var(--text-3)", flex: "none" }}>{a.start}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", color: "var(--text)" }}>{a.client}</span>
                      </div>
                    ))}
                    {list.length > 3 && <span style={{ fontSize: 10.5, color: "var(--text-2)", padding: "0 2px" }}>+ ещё {list.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}



/* ---- app ---- */
/* ============================================================
   App — оркестратор: шапка, навигация, фильтры, оверлеи, Tweaks
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C26E72",
  "dark": false,
  "cardStyle": "Заливка",
  "density": "Обычно"
}/*EDITMODE-END*/;

const CARD_MODE = { "Заливка": "soft", "Контур": "border", "Минимал": "minimal" };
const DENSITY_H = { "Плотно": 38, "Обычно": 42, "Просторно": 50 };
const ACCENTS = ["#C26E72", "#6E8BFF", "#5BAE8E", "#C28A5E", "#9B7BD4"];
const PILLS = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "confirmed", label: "Подтверждены" },
  { id: "completed", label: "Завершены" },
  { id: "cancelled", label: "Отменены" },
];

function startOfWeek(d) { const x = CAL.mondayOf(d); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a, b) { return a.toDateString() === b.toDateString(); }

export function CalendarPage({ onCreate, platform, setPage }) {
  const [calendarPrefs, setCalendarPrefs] = React.useState({ cardStyle: 'Заливка', density: 'Обычно' });
  const setTweak = React.useCallback((key, value) => setCalendarPrefs((prev) => ({ ...prev, [key]: value })), []);
  const t = { ...TWEAK_DEFAULTS, ...calendarPrefs };
  const liveMode = platform?.demoMode === false;
  const platformServices = React.useMemo(() => mapPlatformServices(platform?.services), [platform?.services]);
  const platformClients = Array.isArray(platform?.clients) ? platform.clients : [];
  const scheduleServices = liveMode && platformServices.length ? platformServices : CAL.SERVICES;
  const scheduleStaff = CAL.STAFF;
  const platformAppts = React.useMemo(() => mapPlatformAppointments(platform, scheduleServices, platformClients), [platform, scheduleServices, platformClients]);
  const [view, setView] = React.useState("week");
  const [refDate, setRefDate] = React.useState(new Date());
  const [loading, setLoading] = React.useState(true);
  const [nowMin, setNowMin] = React.useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });

  // live data mutations
  const [userAppts, setUserAppts] = React.useState([]);
  const [apptOv, setApptOv] = React.useState({});
  const [removed, setRemoved] = React.useState(() => new Set());
  const [userBlocks, setUserBlocks] = React.useState([]);
  const [removedBlocks, setRemovedBlocks] = React.useState(() => new Set());

  const [filters, setFilters] = React.useState({ staffId: "all", serviceId: "all", statuses: [], from: "08:00", to: "21:00", onlyFree: false, onlyBlocked: false });
  const [pill, setPill] = React.useState("all");

  const [detail, setDetail] = React.useState(null);   // {appt, anchor}
  const [panel, setPanel] = React.useState(null);     // {appt}
  const [blockSel, setBlockSel] = React.useState(null);
  const [unblock, setUnblock] = React.useState(null);
  const [dayConfirm, setDayConfirm] = React.useState(null);
  const [create, setCreate] = React.useState(null);
  const [filtersOpen, setFiltersOpen] = React.useState(null);
  const [dayPanel, setDayPanel] = React.useState(null); // date for month day list
  const [hover, setHover] = React.useState(null);

  const today = new Date();


  // initial skeleton + clock
  React.useEffect(() => { const id = setTimeout(() => setLoading(false), 850); return () => clearTimeout(id); }, []);
  React.useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 30000);
    return () => clearInterval(id);
  }, []);

  const cardMode = CARD_MODE[t.cardStyle] || "soft";

  // ---- data resolution ----
  const baseFor = (date) => {
    const k = CAL.key(date);
    if (liveMode) return platformAppts.filter((a) => a.dateKey === k);
    if (CAL.CUR_WEEK_KEYS.has(k)) return CAL.BASE_APPTS.filter((a) => a.dateKey === k);
    return CAL.genApptsForDate(date);
  };
  const resolvedFor = (date) => {
    const k = CAL.key(date);
    let list = baseFor(date).filter((a) => !removed.has(a.id)).map((a) => (apptOv[a.id] ? { ...a, ...apptOv[a.id] } : a));
    return list.concat(userAppts.filter((a) => a.dateKey === k && !removed.has(a.id)));
  };
  const effStatuses = filters.statuses.length ? filters.statuses : (pill === "all" ? null : [pill]);
  const applyFilters = (list) => {
    if (filters.onlyFree || filters.onlyBlocked) return [];
    let r = list;
    if (effStatuses) r = r.filter((a) => effStatuses.includes(a.status));
    if (filters.staffId !== "all") r = r.filter((a) => a.staffId === filters.staffId);
    if (filters.serviceId !== "all") r = r.filter((a) => a.serviceId === filters.serviceId);
    const fm = CAL.toMin(filters.from), tm = CAL.toMin(filters.to);
    r = r.filter((a) => CAL.toMin(a.start) >= fm && CAL.toMin(a.start) < tm);
    return r;
  };
  const getAppts = (date) => applyFilters(resolvedFor(date));
  const blocksFor = (date) => {
    const k = CAL.key(date), wd = (date.getDay() + 6) % 7;
    const out = [];
    if (wd <= 4) out.push({ id: "lunch-" + k, start: "13:00", end: "14:00", reason: "lunch", label: "Обед", recurring: "daily" });
    CAL.BASE_BLOCKS.filter((b) => b.dateKey === k).forEach((b) => out.push(b));
    userBlocks.forEach((b) => {
      if (b.dateKey === k) out.push(b);
      else if (b.recurring === "weekly" && b.weekday === wd) out.push({ ...b, id: b.id + "-" + k });
    });
    return out.filter((b) => !removedBlocks.has(b.id));
  };
  const getBlocks = (date) => blocksFor(date);
  const isClosed = (date) => ((date.getDay() + 6) % 7) === 6;
  const isToday = (date) => sameDay(date, today);

  // ---- visible days & counts ----
  const weekDays = React.useMemo(() => { const s = startOfWeek(refDate); return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(s, i)); }, [refDate]);
  const visibleDays = view === "week" ? weekDays : view === "day" ? [refDate] : (() => {
    const f = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const arr = []; for (let d = 1; d <= new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate(); d++) arr.push(new Date(refDate.getFullYear(), refDate.getMonth(), d)); return arr;
  })();
  const counts = React.useMemo(() => {
    const c = { all: 0, new: 0, confirmed: 0, completed: 0, cancelled: 0, noshow: 0 };
    visibleDays.forEach((date) => resolvedFor(date).forEach((a) => { c.all++; if (c[a.status] != null) c[a.status]++; }));
    return c;
  }, [visibleDays, userAppts, apptOv, removed]);

  const visibleApptCount = React.useMemo(() => visibleDays.reduce((s, d) => s + getAppts(d).length, 0), [visibleDays, userAppts, apptOv, removed, filters, pill]);

  // ---- actions ----
  const onApptClick = (a, e) => setDetail({ appt: a, anchor: { rect: e.currentTarget.getBoundingClientRect() } });
  const onHover = (a, pt) => { if (a && pt) setHover({ id: a.id, appt: a, x: pt.x, y: pt.y }); else setHover(null); };
  const onEmptyClick = (slot, anchor) => setCreate({ slot, anchor });
  const onBlockSelect = (sel, anchor) => setBlockSel({ sel, anchor });
  const onBlockClick = (b, e) => { const anchor = { rect: e.currentTarget.getBoundingClientRect() }; if (b.reason === "lunch" && b.recurring === "daily") return setUnblock({ block: b, anchor }); setUnblock({ block: b, anchor }); };

  const setStatus = (id, status) => {
    if (liveMode && platform?.isLive && platform?.updateBookingStatus) platform.updateBookingStatus(id, scheduleStatusToPlatform(status));
    if (userAppts.some((a) => a.id === id)) setUserAppts((p) => p.map((a) => a.id === id ? { ...a, status } : a));
    else setApptOv((p) => ({ ...p, [id]: { ...p[id], status } }));
    setDetail((d) => d && d.appt.id === id ? { ...d, appt: { ...d.appt, status } } : d);
    setPanel((d) => d && d.appt.id === id ? { ...d, appt: { ...d.appt, status } } : d);
  };
  const deleteAppt = (id) => { setRemoved((p) => new Set(p).add(id)); setUserAppts((p) => p.filter((a) => a.id !== id)); setPanel(null); setDetail(null); };

  // generic field patch for an appointment (base override or user-created)
  const patchAppt = (id, patch) => {
    if (userAppts.some((a) => a.id === id)) setUserAppts((p) => p.map((a) => a.id === id ? { ...a, ...patch } : a));
    else setApptOv((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
    setDetail((d) => d && d.appt.id === id ? { ...d, appt: { ...d.appt, ...patch } } : d);
    setPanel((d) => d && d.appt.id === id ? { ...d, appt: { ...d.appt, ...patch } } : d);
  };
  const updateApptService = (id, serviceId) => {
    const sv = scheduleServices.find((s) => s.id === serviceId) || CAL.svById(serviceId);
    if (!sv) return;
    patchAppt(id, { serviceId, service: sv.name, price: sv.price, durationMin: sv.dur });
  };
  const currentApptById = (id) => (panel && panel.appt.id === id ? panel.appt : null) || (detail && detail.appt.id === id ? detail.appt : null);
  const addApptExtra = (id, serviceId) => {
    const sv = scheduleServices.find((s) => s.id === serviceId) || CAL.svById(serviceId);
    if (!sv) return;
    const cur = currentApptById(id);
    const extras = [...((cur && cur.extras) || []), { serviceId, name: sv.name, price: sv.price, dur: sv.dur }];
    patchAppt(id, { extras });
  };
  const removeApptExtra = (id, idx) => {
    const cur = currentApptById(id);
    const extras = ((cur && cur.extras) || []).filter((_, i) => i !== idx);
    patchAppt(id, { extras });
  };

  // route to the client's chat (deep-link via sessionStorage, matched by id/name)
  const openClientChat = (appt) => {
    try {
      const cid = appt?.sourceAppointment?.clientId
        || platformClients.find((c) => c.name === appt.client || c.phone === appt.phone)?.id
        || '';
      if (cid && typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('clickbook-active-chat-client', cid);
      }
    } catch (err) { /* no-op */ }
    setDetail(null); setPanel(null);
    if (setPage) setPage('chats');
  };
  const createAppt = ({ date, start, serviceId, staffId, client }) => {
    const sv = scheduleServices.find((item) => item.id === serviceId) || CAL.svById(serviceId) || scheduleServices[0] || CAL.SERVICES[0];
    if (liveMode && platform?.isLive && platform?.createBooking) {
      void platform.createBooking({
        date: dateLabel(date),
        time: start,
        serviceId,
        clientName: client,
        status: 'new',
      });
    }
    const a = { id: "u" + Date.now(), dateKey: CAL.key(date), start, durationMin: sv.dur, serviceId, service: sv.name, price: sv.price, staffId, client, status: "new", phone: "+7 (9••) •••-••-••", note: "" };
    setUserAppts((p) => [...p, a]);
  };
  const confirmBlock = ({ date, startMin, endMin, reason, recurring }) => {
    const label = CAL.REASONS.find((r) => r.id === reason)?.label || "Блокировка";
    const b = { id: "ub" + Date.now(), dateKey: CAL.key(date), start: CAL.fmtMin(startMin), end: CAL.fmtMin(endMin), reason, label, recurring: recurring ? "weekly" : "none", weekday: (date.getDay() + 6) % 7 };
    setUserBlocks((p) => [...p, b]);
    setBlockSel(null); setDayConfirm(null);
  };
  const unblockId = (id) => setRemovedBlocks((p) => new Set(p).add(id));

  const nav = (dir) => {
    if (view === "month") setRefDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    else setRefDate((d) => addDays(d, dir * (view === "week" ? 7 : 1)));
  };
  const goToday = () => setRefDate(new Date());

  // ---- period label ----
  const periodLabel = () => {
    if (view === "day") { const d = refDate; return `${CAL.DOW_FULL[(d.getDay() + 6) % 7]}, ${d.getDate()} ${CAL.MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
    if (view === "month") return `${CAL.MONTHS_NOM[refDate.getMonth()]} ${refDate.getFullYear()}`;
    const a = weekDays[0], b = weekDays[6];
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${CAL.MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()} ${CAL.MONTHS[a.getMonth()]} – ${b.getDate()} ${CAL.MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  };

  const filtersActive = filters.staffId !== "all" || filters.serviceId !== "all" || filters.statuses.length > 0 || filters.onlyFree || filters.onlyBlocked || filters.from !== "08:00" || filters.to !== "21:00";

  if (liveMode && platform?.workspaceReady === false) {
    return <ScheduleEmptyState title="Подключаем рабочий кабинет" body="Проверяем авторизацию и загружаем реальные записи." />;
  }
  if (liveMode && !platform?.isLive) {
    return <ScheduleEmptyState title="Войдите в рабочий кабинет" body="В рабочем режиме демо-записи не показываются. После входа здесь появится реальный график." />;
  }

  return (
    <div className="schedule-v2" style={{ position: "relative", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", background: "var(--canvas)", ["--hour-h"]: `${DENSITY_H[t.density] || 42}px` }}>
      <div style={{ width: "100%", maxWidth: "none", margin: "0 auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "0 16px" }}>

        {/* ===== Header ===== */}
        <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0 12px", flex: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Btn variant="ghost" icon="prev" size="s" onClick={() => nav(-1)} title="Назад" />
            <Btn variant="ghost" icon="next" size="s" onClick={() => nav(1)} title="Вперёд" />
            <Btn variant="ghost" size="s" onClick={goToday} style={{ marginLeft: 2 }}>Сегодня</Btn>
          </div>

          <div className="tnum" style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", minWidth: 200 }}>{periodLabel()}</div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: 3, background: "var(--surface)", borderRadius: "var(--r-sm)", border: "1px solid var(--border)" }}>
            {[["day", "День"], ["week", "Неделя"], ["month", "Месяц"]].map(([v, lbl]) => (
              <button type="button" key={v} onClick={() => setView(v)} style={{
                height: 28, padding: "0 14px", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                background: view === v ? "var(--card)" : "transparent",
                color: view === v ? "var(--text)" : "var(--text-2)",
                boxShadow: view === v ? "var(--shadow-card)" : "none", transition: "background .12s, color .12s",
              }}>{lbl}</button>
            ))}
          </div>

          <Btn variant="ghost" icon="filter" size="s" active={filtersActive}
            onClick={(e) => setFiltersOpen({ rect: e.currentTarget.getBoundingClientRect() })}>
            Фильтры{filtersActive ? " ·" : ""}
          </Btn>
          <Btn variant="accent" icon="plus" size="s"
            onClick={(e) => setCreate({ slot: { date: view === "month" ? new Date() : refDate, startMin: 10 * 60 }, anchor: { rect: e.currentTarget.getBoundingClientRect() } })}>
            Запись
          </Btn>
        </header>

        {/* ===== Filter pills ===== */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 0 12px", flex: "none", overflowX: "auto", scrollbarWidth: "none" }}>
          {PILLS.map((p) => {
            const on = pill === p.id;
            const n = counts[p.id] ?? 0;
            return (
              <button type="button" key={p.id} className={`schedule-status-chip ${on ? 'is-active' : ''}`} onClick={() => setPill(p.id)}>
                {p.id !== "all" && <span className="schedule-status-dot" style={{ background: `var(${CAL.STATUS_META[p.id].varName})` }} />}
                <span>{p.label}</span>
                <span className="tnum schedule-status-count">{n}</span>
              </button>
            );
          })}
          {(filtersActive || pill !== "all") && (
            <button type="button" onClick={() => { setPill("all"); setFilters({ staffId: "all", serviceId: "all", statuses: [], from: "08:00", to: "21:00", onlyFree: false, onlyBlocked: false }); }}
              style={{ marginLeft: 4, height: 30, padding: "0 10px", border: "none", background: "transparent", color: "var(--text-3)", fontSize: 11.5, fontFamily: "var(--font)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="x" size={13} />Сбросить
            </button>
          )}
        </div>

        {/* ===== Content ===== */}
        <div className="schedule-v2-grid-shell" style={{ flex: 1, minHeight: 0, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--r-card)", overflow: "hidden", position: "relative", marginBottom: 0 }}>
          {loading ? <SkeletonGrid view={view} /> : (
            <>
              {view === "week" && (
                <TimeGrid days={weekDays} ph={DENSITY_H[t.density] || 42}
                  getAppts={getAppts} getBlocks={getBlocks} isClosed={isClosed} isToday={isToday} nowMin={nowMin}
                  cardStyle={cardMode} hoveredId={hover?.id}
                  onApptClick={onApptClick} onEmptyClick={onEmptyClick} onBlockSelect={onBlockSelect} onBlockClick={onBlockClick} onHover={onHover} />
              )}
              {view === "day" && (
                <DayView date={refDate} getAppts={getAppts} getBlocks={getBlocks} isClosed={isClosed} isToday={isToday} nowMin={nowMin}
                  cardStyle={cardMode} hoveredId={hover?.id}
                  onApptClick={onApptClick} onEmptyClick={onEmptyClick} onBlockSelect={onBlockSelect} onBlockClick={onBlockClick} onHover={onHover} />
              )}
              {view === "month" && (
                <MonthView monthRef={refDate} todayDate={today}
                  getDayAppts={(date) => resolvedFor(date).sort((a, b) => CAL.toMin(a.start) - CAL.toMin(b.start))}
                  dayHasBlock={(date) => getBlocks(date).some((b) => b.reason !== "lunch")}
                  onDayClick={(date) => setDayPanel(date)} />
              )}
              {visibleApptCount === 0 && view !== "month" && (
                <EmptyState onClear={() => { setPill("all"); setFilters({ staffId: "all", serviceId: "all", statuses: [], from: "08:00", to: "21:00", onlyFree: false, onlyBlocked: false }); }}
                  blocked={filters.onlyBlocked} free={filters.onlyFree} />
              )}
              {/* Day drawer lives inside the calendar area so it docks cleanly to
                  the right of the grid (not over the header/toolbar). */}
              {view === "month" && dayPanel && (
                <DayListPanel date={dayPanel} appts={resolvedFor(dayPanel).sort((a, b) => CAL.toMin(a.start) - CAL.toMin(b.start))}
                  blocks={getBlocks(dayPanel)} staff={scheduleStaff} onClose={() => setDayPanel(null)}
                  onApptClick={(a) => { setDayPanel(null); setPanel({ appt: a, anchor: { x: window.innerWidth / 2, y: 180 } }); }}
                  onOpenDay={() => { setRefDate(dayPanel); setView("day"); setDayPanel(null); }} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== Overlays ===== */}
      {hover && hover.appt && <ApptTooltip h={hover} />}
      {detail && <DetailPopover appt={detail.appt} anchor={detail.anchor} staff={scheduleStaff}
        onClose={() => setDetail(null)} onStatus={setStatus} onChat={openClientChat}
        onOpenPanel={(a) => setPanel({ appt: a, anchor: detail.anchor })} />}
      {panel && <SidePanel appt={panel.appt} anchor={panel.anchor} staff={scheduleStaff} onClose={() => setPanel(null)}
        onStatus={setStatus} onDelete={deleteAppt} onChat={openClientChat}
        services={scheduleServices} onUpdateService={updateApptService} onAddExtra={addApptExtra} onRemoveExtra={removeApptExtra} />}
      {blockSel && <BlockPopover sel={blockSel.sel} anchor={blockSel.anchor} onClose={() => setBlockSel(null)}
        onConfirm={confirmBlock} onRequestDayConfirm={(sel) => { setBlockSel(null); setDayConfirm(sel); }} />}
      {unblock && <UnblockMenu block={unblock.block} anchor={unblock.anchor} onClose={() => setUnblock(null)} onUnblock={unblockId} />}
      {dayConfirm && <ConfirmModal title="Заблокировать весь день?"
        text={`${CAL.DOW_FULL[(dayConfirm.date.getDay() + 6) % 7]}, ${dayConfirm.date.getDate()} ${CAL.MONTHS[dayConfirm.date.getMonth()]} будет недоступен для записи${dayConfirm.recurring ? `, повтор каждый ${CAL.DOW_FULL[(dayConfirm.date.getDay() + 6) % 7].toLowerCase()}` : ""}. Существующие записи останутся.`}
        confirmLabel="Заблокировать день" onClose={() => setDayConfirm(null)}
        onConfirm={() => confirmBlock({ date: dayConfirm.date, startMin: CAL.DAY_START * 60, endMin: CAL.DAY_END * 60, reason: dayConfirm.reason, recurring: dayConfirm.recurring })} />}
      {create && <CreatePopover slot={create.slot} anchor={create.anchor} staff={scheduleStaff} services={scheduleServices}
        onClose={() => setCreate(null)} onCreate={createAppt} />}
      {filtersOpen && <FiltersPopover anchorRect={filtersOpen.rect} filters={filters} setFilters={setFilters}
        onClose={() => setFiltersOpen(null)} staff={scheduleStaff} services={scheduleServices} />}


    </div>
  );
}
