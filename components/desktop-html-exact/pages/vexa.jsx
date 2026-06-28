import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge, Btn, Card, Icon, Metric, NumberPopIn, Segmented, Switch } from '../desktop-html-ui';

const chartDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const plans = [
  { id: 'free', name: 'Free', price: 0, searches: 1, sources: 10, messages: 50, note: 'Проверить идею' },
  { id: 'start', name: 'Start', price: 690, searches: 3, sources: 30, messages: 300, note: 'Для одного направления' },
  { id: 'pro', name: 'Pro', price: 1490, searches: 10, sources: 100, messages: 1500, note: 'Оптимальный тариф' },
  { id: 'business', name: 'Business', price: 3990, searches: 30, sources: 300, messages: 5000, note: 'Команда и много ниш' },
];

const VEXA_WORKSPACE_STORAGE_KEY = 'vexa.desktop.workspace.v3';

const initialWorkspace = {
  searches: [],
  matches: [],
  sources: [],
  contacts: [],
  invoices: [],
  notificationRules: [
    { id: 'n1', title: 'Новые совпадения', enabled: true, target: 'Приложение + Telegram, если подключен' },
    { id: 'n2', title: 'Лимит почти закончился', enabled: true, target: 'Приложение' },
    { id: 'n3', title: 'Источник отвалился', enabled: true, target: 'Приложение + Telegram, если подключен' },
    { id: 'n4', title: 'Ежедневная сводка', enabled: false, target: 'Приложение + Telegram, если подключен' },
  ],
  settings: {
    quiet: true,
    digest: false,
    autoHide: true,
    start: '00:00',
    end: '07:00',
    timezone: 'Europe/Moscow',
    telegram: '',
  },
  currentPlan: 'free',
  billing: 'month',
  activity: [],
};

function parseLines(value) {
  return String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
}

function sourceCount(search) {
  return Array.isArray(search?.sourceIds) ? search.sourceIds.length : Number(search?.sources) || 0;
}

function sourceGroups(workspace) {
  const groups = new Map();
  workspace.sources.forEach((source) => {
    const group = source.group || source.type || 'Без темы';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(source);
  });
  return Array.from(groups, ([name, sources]) => ({ name, sources }));
}

function sourceNames(workspace, ids = []) {
  const selected = workspace.sources.filter((source) => ids.includes(source.id));
  if (!selected.length) return 'Источники не выбраны';
  if (selected.length <= 2) return selected.map((source) => source.title).join(', ');
  return `${selected.slice(0, 2).map((source) => source.title).join(', ')} +${selected.length - 2}`;
}

function sourceUsage(workspace, sourceId) {
  return workspace.searches.filter((search) => Array.isArray(search.sourceIds) && search.sourceIds.includes(sourceId)).length;
}

function mergeWorkspace(value) {
  if (!value || typeof value !== 'object') return initialWorkspace;
  return {
    ...initialWorkspace,
    ...value,
    searches: Array.isArray(value.searches) ? value.searches : initialWorkspace.searches,
    matches: Array.isArray(value.matches) ? value.matches : initialWorkspace.matches,
    sources: Array.isArray(value.sources) ? value.sources : initialWorkspace.sources,
    contacts: Array.isArray(value.contacts) ? value.contacts : initialWorkspace.contacts,
    invoices: Array.isArray(value.invoices) ? value.invoices : initialWorkspace.invoices,
    notificationRules: Array.isArray(value.notificationRules) ? value.notificationRules : initialWorkspace.notificationRules,
    settings: { ...initialWorkspace.settings, ...(value.settings || {}) },
    activity: Array.isArray(value.activity) ? value.activity.slice(0, 30) : initialWorkspace.activity,
  };
}

function readWorkspace() {
  if (typeof window === 'undefined') return initialWorkspace;
  try {
    const raw = window.localStorage.getItem(VEXA_WORKSPACE_STORAGE_KEY);
    return raw ? mergeWorkspace(JSON.parse(raw)) : initialWorkspace;
  } catch {
    return initialWorkspace;
  }
}

function writeWorkspace(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VEXA_WORKSPACE_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('vexa-workspace-updated', { detail: value }));
}

function buildWorkspaceChart(workspace) {
  const visibleMatches = workspace.matches.filter((item) => !item.hidden);
  const sentMatches = workspace.matches.filter((item) => item.sent);
  const searchTotal = workspace.searches.reduce((sum, item) => sum + (Number(item.matchesToday) || 0), 0);
  const totalMatches = Math.max(searchTotal, visibleMatches.length);
  const totalSent = sentMatches.length;

  if (!totalMatches && !totalSent) {
    return chartDays.map((day) => ({ day, matches: 0, sent: 0 }));
  }

  const jsDay = typeof Date !== 'undefined' ? new Date().getDay() : 1;
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  return chartDays.map((day, index) => ({
    day,
    matches: index === todayIndex ? totalMatches : 0,
    sent: index === todayIndex ? totalSent : 0,
  }));
}

function notify(label, body = '') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('clickbook-desktop-action', {
    detail: { label: body ? `${label}: ${body}` : label },
  }));
}

function copyText(text, label = 'Скопировано') {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => notify(label),
      () => notify('Текст готов к копированию'),
    );
    return;
  }
  notify(label);
}

function downloadJson(filename, payload) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  notify('Файл экспорта подготовлен', filename);
}

function openTelegram(ref) {
  if (typeof window === 'undefined') return;
  const target = ref.startsWith('http') ? ref : `https://t.me/${ref.replace(/^@/, '')}`;
  window.open(target, '_blank', 'noopener,noreferrer');
  notify('Открыт Telegram', ref);
}

function useTelegramNotificationLink() {
  const [state, setState] = useState({
    checked: false,
    connected: false,
    username: '',
    email: '',
    pending: false,
    error: '',
    token: '',
  });

  const refresh = async () => {
    try {
      const response = await fetch('/api/auth/accounts', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      const providers = Array.isArray(payload?.user?.providers) ? payload.user.providers : [];
      const meta = payload?.user?.user_metadata || {};

      if (!response.ok) {
        setState((current) => ({ ...current, checked: true, connected: false, error: payload?.error || '' }));
        return;
      }

      setState((current) => ({
        ...current,
        checked: true,
        connected: providers.includes('telegram') || Boolean(meta.telegram_id),
        username: meta.telegram_username || '',
        email: payload?.user?.email || '',
        error: '',
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        checked: true,
        connected: false,
        error: error instanceof Error ? error.message : 'telegram_status_failed',
      }));
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!state.pending || !state.token) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/telegram/status?token=${encodeURIComponent(state.token)}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));

        if (payload?.status === 'linked' || payload?.status === 'confirmed') {
          setState((current) => ({ ...current, pending: false, token: '', connected: true, error: '' }));
          notify('Telegram подключен');
          void refresh();
        } else if (payload?.status === 'expired' || payload?.status === 'invalid' || payload?.status === 'error') {
          setState((current) => ({ ...current, pending: false, token: '', error: payload?.error || `telegram_${payload?.status || 'failed'}` }));
        }
      } catch (error) {
        setState((current) => ({
          ...current,
          pending: false,
          token: '',
          error: error instanceof Error ? error.message : 'telegram_poll_failed',
        }));
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [state.pending, state.token]);

  const connect = async () => {
    setState((current) => ({ ...current, pending: true, error: '' }));

    try {
      const response = await fetch('/api/auth/telegram/link/start', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(payload?.error || 'telegram_link_start_failed');

      setState((current) => ({ ...current, pending: true, token: payload.token || '', error: '' }));
      if (payload?.botUrl) {
        window.open(payload.botUrl, '_blank', 'noopener,noreferrer');
      }
      notify('Откройте Telegram и нажмите Start');
    } catch (error) {
      setState((current) => ({
        ...current,
        pending: false,
        token: '',
        error: error instanceof Error ? error.message : 'telegram_link_start_failed',
      }));
    }
  };

  const sendTest = async () => {
    try {
      const response = await fetch('/api/vexa/telegram/test', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'telegram_test_failed');
      notify('Тестовое уведомление отправлено');
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'telegram_test_failed';
      setState((current) => ({ ...current, error: message }));
      return { ok: false, error: message };
    }
  };

  return { ...state, refresh, connect, sendTest };
}

function activityItem(title, body = '', icon = 'check') {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    body,
    icon,
    time: 'сейчас',
  };
}

function useVexaWorkspace() {
  const [workspace, setWorkspace] = useState(readWorkspace);

  useEffect(() => {
    const handleUpdate = (event) => setWorkspace(mergeWorkspace(event.detail));
    window.addEventListener('vexa-workspace-updated', handleUpdate);
    return () => window.removeEventListener('vexa-workspace-updated', handleUpdate);
  }, []);

  const commit = (updater, activity) => {
    setWorkspace((current) => {
      const base = mergeWorkspace(current);
      const nextValue = typeof updater === 'function' ? updater(base) : updater;
      const next = mergeWorkspace(nextValue);
      if (activity) {
        next.activity = [activityItem(activity.title, activity.body, activity.icon), ...(next.activity || [])].slice(0, 30);
      }
      writeWorkspace(next);
      return next;
    });
  };

  const actions = useMemo(() => ({
    resetWorkspace() {
      commit(initialWorkspace, { title: 'Workspace сброшен', body: 'Вернули стартовые данные', icon: 'refresh' });
      notify('Workspace сброшен');
    },
    upsertSearch(search, activity) {
      commit((current) => ({
        ...current,
        searches: current.searches.some((item) => item.id === search.id)
          ? current.searches.map((item) => item.id === search.id ? search : item)
          : [search, ...current.searches],
      }), activity || { title: 'Поиск сохранен', body: search.title, icon: 'search' });
    },
    toggleSearch(id) {
      commit((current) => ({
        ...current,
        searches: current.searches.map((item) => item.id === id ? {
          ...item,
          status: item.status === 'active' ? 'paused' : 'active',
          lastRun: item.status === 'active' ? 'на паузе' : 'только что',
        } : item),
      }), { title: 'Статус поиска обновлен', icon: 'play' });
    },
    deleteSearch(id) {
      commit((current) => ({
        ...current,
        searches: current.searches.filter((item) => item.id !== id),
      }), { title: 'Поиск удален', icon: 'trash' });
    },
    duplicateSearch(search) {
      const copy = { ...search, id: `search-${Date.now()}`, title: `${search.title} - копия`, status: 'paused', matchesToday: 0, lastRun: 'еще не запускался' };
      commit((current) => ({ ...current, searches: [copy, ...current.searches] }), { title: 'Копия поиска создана', body: search.title, icon: 'copy' });
      return copy;
    },
    addMatch(match) {
      commit((current) => ({ ...current, matches: [match, ...current.matches] }), { title: 'Новое совпадение', body: match.search, icon: 'inbox' });
    },
    updateMatch(id, patch, activity) {
      commit((current) => ({
        ...current,
        matches: current.matches.map((item) => item.id === id ? { ...item, ...patch } : item),
      }), activity);
    },
    addOrUpdateContact(contact) {
      commit((current) => {
        const existing = current.contacts.find((item) => item.name === contact.name);
        const nextContact = existing ? { ...existing, ...contact } : { id: `contact-${Date.now()}`, ...contact };
        return {
          ...current,
          contacts: existing
            ? current.contacts.map((item) => item.id === existing.id ? nextContact : item)
            : [nextContact, ...current.contacts],
        };
      }, { title: 'Контакт обновлен', body: contact.name, icon: 'users' });
    },
    updateSource(id, patch, activity) {
      commit((current) => ({
        ...current,
        sources: current.sources.map((item) => item.id === id ? { ...item, ...patch } : item),
      }), activity || { title: 'Источник обновлен', icon: 'filter' });
    },
    addSource(source) {
      commit((current) => ({ ...current, sources: [source, ...current.sources] }), { title: 'Источник добавлен', body: source.ref, icon: 'filter' });
    },
    deleteSource(id) {
      commit((current) => ({ ...current, sources: current.sources.filter((item) => item.id !== id) }), { title: 'Источник удален', icon: 'trash' });
    },
    checkSources() {
      commit((current) => ({
        ...current,
        sources: current.sources.map((item) => ({
          ...item,
          checked: 'только что',
          status: item.status === 'blocked' ? 'limited' : 'online',
          errors: item.status === 'blocked' ? 1 : 0,
          speed: item.status === 'blocked' ? 'требует доступа' : 'норма',
        })),
      }), { title: 'Источники проверены', body: 'Статусы обновлены', icon: 'refresh' });
    },
    choosePlan(planId) {
      const plan = plans.find((item) => item.id === planId);
      commit((current) => ({ ...current, currentPlan: planId }), { title: 'Тариф выбран', body: plan?.name || planId, icon: 'crown' });
    },
    setBilling(billing) {
      commit((current) => ({ ...current, billing }), { title: 'Период оплаты изменен', body: billing === 'year' ? 'год' : 'месяц', icon: 'card' });
    },
    createInvoice(planId, amount) {
      const plan = plans.find((item) => item.id === planId);
      const invoice = { id: `inv-${Date.now().toString().slice(-5)}`, plan: plan?.name || planId, amount, status: 'черновик', date: 'сейчас' };
      commit((current) => ({ ...current, invoices: [invoice, ...current.invoices] }), { title: 'Счет создан', body: invoice.id, icon: 'card' });
      return invoice;
    },
    markInvoicePaid(id) {
      commit((current) => ({
        ...current,
        invoices: current.invoices.map((item) => item.id === id ? { ...item, status: 'оплачен' } : item),
      }), { title: 'Счет отмечен оплаченным', body: id, icon: 'check' });
    },
    updateSettings(patch) {
      commit((current) => ({ ...current, settings: { ...current.settings, ...patch } }), { title: 'Настройки сохранены', icon: 'gear' });
    },
    updateNotificationRule(id, patch) {
      commit((current) => ({
        ...current,
        notificationRules: current.notificationRules.map((item) => item.id === id ? { ...item, ...patch } : item),
      }), { title: 'Правило уведомлений обновлено', icon: 'bell' });
    },
    enableAllNotifications() {
      commit((current) => ({
        ...current,
        notificationRules: current.notificationRules.map((item) => ({ ...item, enabled: true })),
      }), { title: 'Все уведомления включены', icon: 'bell' });
    },
  }), []);

  const stats = useMemo(() => {
    const currentPlan = plans.find((plan) => plan.id === workspace.currentPlan) || plans[0];
    const visibleMatches = workspace.matches.filter((item) => !item.hidden);
    const today = workspace.searches.reduce((sum, item) => sum + item.matchesToday, 0);
    const sent = workspace.matches.filter((item) => item.sent).length;
    const onlineSources = workspace.sources.filter((item) => item.status === 'online').length;
    const chartData = buildWorkspaceChart(workspace);
    return {
      plan: currentPlan,
      chartData,
      visibleMatches,
      activeSearches: workspace.searches.filter((item) => item.status === 'active').length,
      today,
      sent,
      onlineSources,
      sourceWarnings: workspace.sources.filter((item) => item.status !== 'online').length,
      messagesUsed: sent + today,
      conversion: visibleMatches.length ? Math.round((sent / visibleMatches.length) * 100) : 0,
    };
  }, [workspace]);

  return { workspace, actions, stats };
}

function statusBadge(status) {
  if (status === 'active' || status === 'online') return <Badge kind="success">активен</Badge>;
  if (status === 'good') return <Badge kind="success">подходит</Badge>;
  if (status === 'contacted') return <Badge kind="success">написали</Badge>;
  if (status === 'paused' || status === 'limited') return <Badge kind="warn">на паузе</Badge>;
  if (status === 'blocked' || status === 'bad') return <Badge kind="danger">ошибка</Badge>;
  return <Badge kind="info">новое</Badge>;
}

function UsageBar({ label, used, total }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div className="vexa-usage">
      <div className="vexa-usage-head">
        <span>{label}</span>
        <span className="tabular">{used} / {total}</span>
      </div>
      <div className="progress"><span style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function VexaChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vexa-chart-tooltip">
      <div className="vexa-chart-tooltip-title">{label}</div>
      {payload.map((item) => {
        const color = String(item.color || '').startsWith('url') ? '#8B6CFF' : item.color;
        return (
          <div className="vexa-chart-tooltip-row" key={item.dataKey}>
            <span style={{ background: color }} />
            <strong>{item.name || item.dataKey}</strong>
            <b className="tabular">{item.value}</b>
          </div>
        );
      })}
    </div>
  );
}

function VexaGlowChart({ data, conversion = 0, compact = false }) {
  return (
    <div className={`vexa-chart-shell minimal ${compact ? 'compact' : ''}`}>
      <div className="vexa-chart-stats">
        <span><b>{conversion}%</b> конверсия</span>
        <span><b>{data.reduce((sum, item) => sum + item.matches, 0)}</b> найдено</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 18, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id="vexaMatchesGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6E59E8" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#6E59E8" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="vexaSentGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B9AAFF" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#B9AAFF" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 8" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis tickLine={false} axisLine={false} width={34} />
          <Tooltip content={<VexaChartTooltip />} cursor={{ stroke: '#6E59E8', strokeOpacity: 0.18, strokeWidth: 1 }} />
          <ReferenceLine y={Math.max(1, Math.round(data.reduce((sum, item) => sum + item.matches, 0) / 7))} stroke="#6E59E8" strokeOpacity={0.14} strokeDasharray="5 6" />
          <Area name="Найдено" type="monotone" dataKey="matches" stroke="#8B6CFF" strokeWidth={2.2} fill="url(#vexaMatchesGlow)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
          <Area name="Отправлено" type="monotone" dataKey="sent" stroke="#B9AAFF" strokeWidth={2} fill="url(#vexaSentGlow)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function VexaAnalyticsChart({ data, conversion = 0 }) {
  return (
    <div className="vexa-chart-shell minimal analytics">
      <div className="vexa-chart-stats">
        <span><b>{conversion}%</b> конверсия</span>
        <span><b>{data.reduce((sum, item) => sum + item.sent, 0)}</b> отправлено</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 28, right: 18, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id="vexaBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6E59E8" stopOpacity={0.64} />
              <stop offset="100%" stopColor="#6E59E8" stopOpacity={0.14} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 8" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis tickLine={false} axisLine={false} width={34} />
          <Tooltip content={<VexaChartTooltip />} cursor={{ fill: 'rgba(110, 89, 232, .055)' }} />
          <Bar name="Найдено" dataKey="matches" fill="url(#vexaBarGradient)" radius={[7, 7, 2, 2]} barSize={30} />
          <Line name="Отправлено" type="monotone" dataKey="sent" stroke="#B9AAFF" strokeWidth={2.4} dot={{ r: 3, strokeWidth: 1.5, fill: 'var(--surface)' }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function PageShell({ title, subtitle, actions, children }) {
  return (
    <div className="vexa-page" data-screen-label={`Vexa ${title}`}>
      <div className="page-head vexa-page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        {actions && <div className="vexa-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function InnerCard({ title, subtitle, action, children, className = '' }) {
  return (
    <Card className={`vexa-card ${className}`}>
      {(title || action) && (
        <div className="card-head vexa-card-head">
          <div>
            {title && <div className="section-title">{title}</div>}
            {subtitle && <div className="section-sub">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

function Notice({ children }) {
  if (!children) return null;
  return (
    <div className="vexa-notice">
      <Icon name="check" size={14} />
      <span>{children}</span>
    </div>
  );
}

function SmartInsights({ workspace, stats, go, actions }) {
  const recommendations = [];
  const newMatches = workspace.matches.filter((item) => item.status === 'new' && !item.hidden).length;
  const messagePct = Math.round((stats.messagesUsed / stats.plan.messages) * 100);
  if (newMatches) {
    recommendations.push({
      id: 'matches',
      icon: 'inbox',
      title: `${newMatches} новых совпадений`,
      body: 'Оцените их, чтобы AI-фильтр стал точнее.',
      action: 'Открыть ленту',
      run: () => go?.('matches'),
    });
  }
  if (stats.sourceWarnings) {
    recommendations.push({
      id: 'sources',
      icon: 'filter',
      title: `${stats.sourceWarnings} источника требуют внимания`,
      body: 'Есть ограничения доступа или ошибки проверки.',
      action: 'Проверить',
      run: actions.checkSources,
    });
  }
  if (messagePct >= 75) {
    recommendations.push({
      id: 'limits',
      icon: 'crown',
      title: `Лимит сообщений использован на ${messagePct}%`,
      body: 'Стоит заранее поднять тариф или уменьшить шумные поиски.',
      action: 'Тарифы',
      run: () => go?.('subscription'),
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      id: 'ok',
      icon: 'check',
      title: workspace.searches.length ? 'Критичных событий нет' : 'Настройте первый поиск',
      body: workspace.searches.length ? 'Новых совпадений пока нет. Можно проверить источники или открыть аналитику.' : 'Добавьте ключевые слова и выберите источники для мониторинга.',
      action: workspace.searches.length ? 'Проверить' : 'Создать',
      run: workspace.searches.length ? actions.checkSources : () => go?.('searches'),
    });
  }

  return (
    <Card flush className="vexa-card vexa-insights">
      <div className="card-head vexa-card-head">
        <div>
          <div className="section-title">Умные подсказки</div>
          <div className="section-sub">Что сейчас даст максимум пользы</div>
        </div>
        <Badge kind="info">{recommendations.length}</Badge>
      </div>
      <div className="vexa-insight-grid">
        {recommendations.slice(0, 3).map((item) => (
          <div className="vexa-insight-card" key={item.id}>
            <div className="vexa-row-icon"><Icon name={item.icon} size={15} /></div>
            <div className="vexa-row-main">
              <strong>{item.title}</strong>
              <span className="section-sub">{item.body}</span>
            </div>
            <Btn size="sm" kind="secondary" onClick={item.run}>{item.action}</Btn>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SearchRow({ item, workspace, onOpen, onToggle, onDuplicate, onDelete }) {
  const selectedSources = sourceNames(workspace, item.sourceIds || []);
  const keywords = item.keywords?.length ? item.keywords.slice(0, 3) : ['без ключей'];

  return (
    <div className="vexa-search-row">
      <button type="button" className="vexa-search-row-open" onClick={() => onOpen(item)}>
        <span className="vexa-row-icon">
          <Icon name="search" size={15} />
        </span>
        <span className="vexa-search-row-body">
          <span className="vexa-search-row-title">
            <strong>{item.title}</strong>
            <span className="vexa-chipline">
              {statusBadge(item.status)}
              <Badge kind="info">{item.priority}</Badge>
            </span>
          </span>
          <span className="vexa-keyword-line">
            {keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
          </span>
          <span className="section-sub vexa-ellipsis">{selectedSources}</span>
        </span>
      </button>
      <div className="vexa-search-row-stats">
        <div>
          <strong className="tabular">{sourceCount(item)}</strong>
          <span>источн.</span>
        </div>
        <div>
          <strong className="tabular">{item.matchesToday}</strong>
          <span>сегодня</span>
        </div>
      </div>
      <div className="vexa-row-actions">
        <Btn size="sm" kind="secondary" icon="edit" onClick={() => onOpen(item)}>Открыть</Btn>
        <Btn size="sm" kind="secondary" icon={item.status === 'active' ? 'pause' : 'play'} onClick={() => onToggle(item.id)}>
          {item.status === 'active' ? 'Пауза' : 'Запуск'}
        </Btn>
        <Btn size="sm" kind="secondary" icon="copy" onClick={() => onDuplicate(item)}>Копия</Btn>
        <Btn size="sm" kind="danger" icon="trash" onClick={() => onDelete(item.id)}>Удалить</Btn>
      </div>
    </div>
  );
}

function VexaSelect({ value, options, onChange, placeholder = 'Выбрать' }) {
  const normalized = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));
  const selected = normalized.find((option) => option.value === value);

  return (
    <details className="vexa-select">
      <summary className="vexa-select-trigger">
        <span>{selected?.label || placeholder}</span>
        <Icon name="chevron-down" size={14} />
      </summary>
      <div className="vexa-select-menu">
        {normalized.map((option) => (
          <button
            type="button"
            key={option.value}
            className={`vexa-select-option ${option.value === value ? 'active' : ''}`}
            onClick={(event) => {
              onChange?.(option.value);
              event.currentTarget.closest('details')?.removeAttribute('open');
            }}
          >
            <span>{option.label}</span>
            {option.value === value && <Icon name="check" size={14} />}
          </button>
        ))}
      </div>
    </details>
  );
}

function SourcePicker({ workspace, value = [], onChange }) {
  const groups = sourceGroups(workspace);
  const selected = Array.isArray(value) ? value : [];

  const toggle = (id) => {
    onChange?.(selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id]);
  };

  return (
    <details className="vexa-source-picker">
      <summary>
        <span>
          <strong>{selected.length ? `${selected.length} выбрано` : 'Выбрать источники'}</strong>
          <small>{sourceNames(workspace, selected)}</small>
        </span>
        <Icon name="chevron-down" size={14} />
      </summary>
      <div className="vexa-source-picker-menu">
        {groups.length ? groups.map((group) => (
          <div className="vexa-source-picker-group" key={group.name}>
            <div className="vexa-source-picker-title">{group.name}</div>
            {group.sources.map((source) => (
              <button type="button" key={source.id} className="vexa-source-option" onClick={() => toggle(source.id)}>
                <span className={`check ${selected.includes(source.id) ? 'on' : ''}`} aria-hidden="true" />
                <span>
                  <strong>{source.title}</strong>
                  <small>{source.ref}</small>
                </span>
                {statusBadge(source.status)}
              </button>
            ))}
          </div>
        )) : (
          <div className="vexa-source-picker-empty">Сначала добавьте источники или темы</div>
        )}
      </div>
    </details>
  );
}

const blankSearch = {
  id: 'draft',
  title: '',
  status: 'paused',
  priority: 'Средний',
  sources: 0,
  matchesToday: 0,
  dailyLimit: 100,
  quality: 0,
  lastRun: 'еще не запускался',
  keywords: [],
  minus: [],
  sourceIds: [],
};

function MatchList({ items, onPick, selectedId, filter, setFilter }) {
  return (
    <Card flush className="vexa-card">
      <div className="card-head vexa-card-head">
        <div>
          <div className="section-title">Лента совпадений</div>
          <div className="section-sub">Новые сообщения из Telegram по активным поискам</div>
        </div>
        <Segmented value={filter} onChange={setFilter} items={[
          { value: 'all', label: 'Все' },
          { value: 'new', label: 'Новые' },
          { value: 'good', label: 'Подходят' },
          { value: 'bad', label: 'Отклонены' },
        ]} />
      </div>
      <div className="divider" />
      {items.length ? items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`li-row vexa-row vexa-row-button ${selectedId === item.id ? 'active' : ''}`}
          onClick={() => onPick(item)}
        >
          <div className="metric-delta up vexa-score">{item.score}%</div>
          <div className="vexa-row-main">
            <div className="vexa-row-title">
              <strong>{item.keyword}</strong>
              {statusBadge(item.status)}
              {item.sent && <Badge kind="success">отправлено</Badge>}
            </div>
            <div className="section-sub vexa-ellipsis">{item.text}</div>
          </div>
          <div className="vexa-row-meta">{item.source}</div>
          <div className="vexa-row-time">{item.time}</div>
        </button>
      )) : (
        <div className="vexa-empty">
          <Icon name="inbox" size={20} />
          <strong>Совпадений по фильтру нет</strong>
          <span>Смените фильтр или обновите ленту.</span>
        </div>
      )}
    </Card>
  );
}

function extractPhone(text = '') {
  const match = String(text).match(/(?:\+?\d[\d\s().-]{7,}\d)/);
  return match ? match[0].trim() : 'не найден';
}

function telegramRef(match) {
  const candidates = [match?.author, match?.source].filter(Boolean);
  return candidates.find((item) => String(item).startsWith('@')) || 'не найден';
}

function matchReason(match) {
  if (!match?.keyword) return 'сообщение похоже на активный запрос и прошло фильтр';
  return `ключ “${match.keyword}” найден в сообщении, минус-слова не сработали`;
}

function MatchBrief({ match }) {
  return (
    <div className="vexa-match-brief">
      <div className="vexa-match-heading">Найдено совпадение</div>

      <div className="vexa-match-section">
        <span>Данные</span>
        <div className="vexa-match-quote">
          <div>Поиск: {match.search}</div>
          <div>Источник: {match.source}</div>
          <div>Telegram: {telegramRef(match)}</div>
          <div>Телефон: {extractPhone(match.text)}</div>
          <div>Автор: {match.author}</div>
        </div>
      </div>

      <div className="vexa-match-section">
        <span>Совпадение</span>
        <div className="vexa-match-quote">
          <div>Оценка: {match.score}%</div>
          <div>Ключ: {match.keyword}</div>
          <div>Причина: {matchReason(match)}</div>
        </div>
      </div>

      <div className="vexa-match-section">
        <span>Сообщение</span>
        <div className="vexa-match-quote">{match.text}</div>
      </div>
    </div>
  );
}

export function VexaDashboardPage({ go }) {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [notice, setNotice] = useState('');

  const runCheck = () => {
    actions.checkSources();
    setNotice(`${workspace.sources.length} источников проверены, статусы обновлены`);
    notify('Проверка источников запущена');
  };

  return (
    <PageShell
      title="Главная"
      subtitle="Мониторинг Telegram: поиски, источники, совпадения и лимиты тарифа."
      actions={(
        <>
          <Btn icon="plus" kind="primary" onClick={() => go?.('searches')}>Новый поиск</Btn>
          <Btn icon="arrow-up-right" kind="secondary" onClick={() => go?.('matches')}>Открыть ленту</Btn>
          <Btn icon="refresh" kind="secondary" onClick={runCheck}>Проверить</Btn>
        </>
      )}
    >
      <Notice>{notice}</Notice>
      <SmartInsights workspace={workspace} stats={stats} go={go} actions={actions} />

      <div className="grid-4 vexa-metrics">
        <Metric label="Совпадений сегодня" value={stats.today} delta={stats.today ? 'по активным поискам' : 'пока нет данных'} deltaKind={stats.today ? 'up' : undefined} />
        <Metric label="Активных поисков" value={stats.activeSearches} delta={`${workspace.searches.length} всего`} />
        <Metric label="Источников онлайн" value={stats.onlineSources} delta={`${stats.sourceWarnings} требуют внимания`} deltaKind={stats.sourceWarnings ? 'down' : 'up'} />
        <Metric label="Лимит сегодня" value={stats.messagesUsed} unit={`/ ${stats.plan.messages}`} delta={`${Math.round((stats.messagesUsed / stats.plan.messages) * 100)}% использовано`} />
      </div>

      <div className="grid-cols-2-1 vexa-grid-gap">
        <InnerCard
          title="Динамика совпадений"
          subtitle="Найдено и отправлено за неделю"
          action={<Badge kind="info">7 дней</Badge>}
        >
          <div className="vexa-chart">
            <VexaGlowChart data={stats.chartData} conversion={stats.conversion} />
          </div>
        </InnerCard>

        <InnerCard
          title="Текущий тариф"
          subtitle={`${stats.plan.name} · до 18.07.2026`}
          action={<Btn size="sm" kind="secondary" onClick={() => go?.('subscription')}>Управлять</Btn>}
        >
          <div className="col vexa-card-body">
            <UsageBar label="Сообщения сегодня" used={stats.messagesUsed} total={stats.plan.messages} />
            <UsageBar label="Источники" used={workspace.sources.length} total={stats.plan.sources} />
            <UsageBar label="Поиски" used={workspace.searches.length} total={stats.plan.searches} />
            <Btn kind="secondary" icon="copy" onClick={() => copyText(`${stats.messagesUsed}/${stats.plan.messages} сообщений · ${workspace.sources.length}/${stats.plan.sources} источников · ${workspace.searches.length}/${stats.plan.searches} поисков`, 'Сводка лимитов скопирована')}>
              Скопировать сводку
            </Btn>
          </div>
        </InnerCard>
      </div>

      <div className="vexa-dashboard-wide">
        <Card flush className="vexa-card vexa-section-card">
          <div className="card-head vexa-card-head">
            <div>
              <div className="section-title">Активные поиски</div>
              <div className="section-sub">Самые свежие кампании и их нагрузка</div>
            </div>
            <Btn size="sm" kind="secondary" onClick={() => go?.('searches')}>Все поиски</Btn>
          </div>
          <div className="divider" />
          {workspace.searches.length ? (
            workspace.searches.slice(0, 3).map((item) => (
              <SearchRow
                key={item.id}
                item={item}
                workspace={workspace}
                onOpen={() => go?.('searches')}
                onToggle={actions.toggleSearch}
                onDuplicate={actions.duplicateSearch}
                onDelete={actions.deleteSearch}
              />
            ))
          ) : (
            <div className="vexa-empty">
              <Icon name="search" />
              <strong>Нет активных поисков</strong>
              <span>Создайте первый мониторинг и подключите источники.</span>
              <Btn kind="primary" icon="plus" onClick={() => go?.('searches')}>Создать поиск</Btn>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function toSearchDraft(item = blankSearch) {
  return {
    title: item.title,
    keywords: item.keywords.join('\n'),
    minus: item.minus.join('\n'),
    priority: item.priority,
    dailyLimit: item.dailyLimit,
    sourceIds: Array.isArray(item.sourceIds) ? item.sourceIds : [],
    smart: true,
  };
}

export function VexaSearchesPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [selectedId, setSelectedId] = useState(workspace.searches[0]?.id || '');
  const [draft, setDraft] = useState(toSearchDraft(workspace.searches[0] || blankSearch));
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const selected = workspace.searches.find((item) => item.id === selectedId) || workspace.searches[0];

  useEffect(() => {
    if (!selected && workspace.searches[0]) {
      setSelectedId(workspace.searches[0].id);
      setDraft(toSearchDraft(workspace.searches[0]));
    }
  }, [selected, workspace.searches]);

  const visible = useMemo(() => workspace.searches.filter((item) => {
    const text = `${item.title} ${item.keywords.join(' ')}`.toLowerCase();
    const filterOk = filter === 'all' || item.status === filter;
    return filterOk && text.includes(query.toLowerCase());
  }), [workspace.searches, query, filter]);

  const selectSearch = (item) => {
    setSelectedId(item.id);
    setDraft(toSearchDraft(item));
    setNotice('');
  };

  const createSearch = () => {
    const item = {
      id: `search-${Date.now()}`,
      title: 'Новый поиск',
      status: 'paused',
      priority: 'Средний',
      sources: 0,
      matchesToday: 0,
      dailyLimit: 100,
      quality: 0,
      lastRun: 'еще не запускался',
      keywords: ['новый запрос'],
      minus: [],
      sourceIds: workspace.sources.slice(0, Math.min(3, workspace.sources.length)).map((source) => source.id),
    };
    item.sources = item.sourceIds.length;
    actions.upsertSearch(item, { title: 'Создан черновик поиска', body: item.title, icon: 'plus' });
    selectSearch(item);
    setNotice('Создан черновик поиска. Заполните поля и нажмите “Сохранить”.');
    notify('Создан новый поиск');
  };

  const saveSearch = () => {
    const keywords = parseLines(draft.keywords);
    const minus = parseLines(draft.minus);
    const sourceIds = Array.isArray(draft.sourceIds) ? draft.sourceIds : [];
    const next = {
      ...selected,
      title: draft.title.trim() || 'Без названия',
      keywords: keywords.length ? keywords : ['новый запрос'],
      minus,
      sourceIds,
      sources: sourceIds.length,
      priority: draft.priority,
      dailyLimit: Number(draft.dailyLimit) || selected.dailyLimit,
      quality: Math.max(selected.quality, 78),
      lastRun: selected.status === 'active' ? 'только что' : selected.lastRun,
    };
    actions.upsertSearch(next, { title: 'Поиск сохранен', body: next.title, icon: 'search' });
    setNotice(`Поиск “${next.title}” сохранен`);
    notify('Поиск сохранен', next.title);
  };

  const toggleSearch = (id) => {
    actions.toggleSearch(id);
    setNotice('Статус поиска обновлен');
    notify('Статус поиска обновлен');
  };

  const duplicateSearch = (item) => {
    const copy = actions.duplicateSearch(item);
    selectSearch(copy);
    setNotice('Копия поиска создана');
    notify('Копия поиска создана', item.title);
  };

  const deleteSearch = (id) => {
    const next = workspace.searches.filter((item) => item.id !== id);
    const fallback = next[0];
    actions.deleteSearch(id);
    if (fallback) {
      setSelectedId(fallback.id);
      setDraft(toSearchDraft(fallback));
    }
    setNotice('Поиск удален из списка');
    notify('Поиск удален');
  };

  return (
    <PageShell
      title="Поиски"
      subtitle="Кампании мониторинга: ключевые слова, минус-слова, источники, лимиты и качество фильтра."
      actions={<Btn icon="plus" kind="primary" onClick={createSearch}>Новый поиск</Btn>}
    >
      <Notice>{notice}</Notice>
      <div className="grid-4 vexa-metrics">
        <Metric label="Поисков" value={workspace.searches.length} delta={`${stats.plan.searches} доступно`} />
        <Metric label="Активных" value={stats.activeSearches} delta="работают сейчас" deltaKind="up" />
        <Metric label="Лимит поиска" value={`${Math.round((workspace.searches.length / stats.plan.searches) * 100)}%`} delta={stats.plan.name} />
        <Metric label="Среднее качество" value={`${Math.round(workspace.searches.reduce((sum, item) => sum + item.quality, 0) / Math.max(1, workspace.searches.length))}%`} delta="AI-фильтр" deltaKind="up" />
      </div>
      <div className="vexa-split">
        <Card flush className="vexa-card">
          <div className="card-head vexa-card-head">
            <div className="input-with-icon vexa-search-input">
              <Icon name="search" />
              <input className="input" placeholder="Поиск по кампаниям" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Segmented value={filter} onChange={setFilter} items={[
              { value: 'all', label: 'Все' },
              { value: 'active', label: 'Активные' },
              { value: 'paused', label: 'Пауза' },
            ]} />
          </div>
          <div className="divider" />
          {visible.map((item) => (
            <SearchRow
              key={item.id}
              item={item}
              workspace={workspace}
              onOpen={selectSearch}
              onToggle={toggleSearch}
              onDuplicate={duplicateSearch}
              onDelete={deleteSearch}
            />
          ))}
          {!visible.length && <div className="vexa-empty"><Icon name="search" /><strong>Ничего не найдено</strong><span>Попробуйте другой запрос или фильтр.</span></div>}
        </Card>

        {selected ? (
          <InnerCard
            title="Редактор поиска"
            subtitle="Ключевые слова, минус-слова, источники и лимит проверки"
            action={statusBadge(selected.status)}
          >
            <div className="col vexa-card-body">
              <label className="field">
                <span>Название</span>
                <input className="input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </label>
              <label className="field">
                <span>Ключевые слова</span>
                <textarea className="input" rows={4} value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} />
              </label>
              <label className="field">
                <span>Минус-слова</span>
                <textarea className="input" rows={3} value={draft.minus} onChange={(event) => setDraft({ ...draft, minus: event.target.value })} />
              </label>
              <label className="field">
                <span>Источники</span>
                <SourcePicker workspace={workspace} value={draft.sourceIds} onChange={(sourceIds) => setDraft({ ...draft, sourceIds })} />
              </label>
              <div className="grid-2">
                <label className="field">
                  <span>Приоритет</span>
                  <VexaSelect
                    value={draft.priority}
                    options={['Высокий', 'Средний', 'Низкий']}
                    onChange={(priority) => setDraft({ ...draft, priority })}
                  />
                </label>
                <label className="field">
                  <span>Лимит в день</span>
                  <input className="input" type="number" value={draft.dailyLimit} onChange={(event) => setDraft({ ...draft, dailyLimit: event.target.value })} />
                </label>
              </div>
              <div className="li-row vexa-row compact">
                <div>
                  <strong>Умное сопоставление</strong>
                  <div className="section-sub">Формы слов, похожие формулировки и смысловые совпадения</div>
                </div>
                <Switch on={draft.smart} onChange={(smart) => setDraft({ ...draft, smart })} />
              </div>
              <div className="vexa-detail-grid">
                <UsageBar label="Качество фильтра" used={selected.quality} total={100} />
                <UsageBar label="Лимит поиска" used={selected.matchesToday} total={selected.dailyLimit} />
              </div>
              <div className="vexa-form-actions">
                <Btn kind="secondary" onClick={() => { setDraft(toSearchDraft(selected)); setNotice('Изменения отменены'); }}>Отмена</Btn>
                <Btn kind="secondary" icon="refresh" onClick={() => { notify('Тестовый прогон запущен', selected.title); setNotice('Тестовый прогон запущен. Результат появится в ленте совпадений.'); }}>Тест</Btn>
                <Btn kind="primary" onClick={saveSearch}>Сохранить</Btn>
              </div>
            </div>
          </InnerCard>
        ) : (
          <InnerCard title="Редактор поиска" subtitle="Создайте первый поиск, чтобы настроить ключи и источники">
            <div className="vexa-empty">
              <Icon name="search" />
              <strong>Поисков пока нет</strong>
              <span>Нажмите “Новый поиск”, задайте ключевые слова и подключите источники.</span>
              <Btn kind="primary" icon="plus" onClick={createSearch}>Создать поиск</Btn>
            </div>
          </InnerCard>
        )}
      </div>
    </PageShell>
  );
}

export function VexaMatchesPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [selectedId, setSelectedId] = useState(workspace.matches[0]?.id || '');
  const [filter, setFilter] = useState('all');
  const [reply, setReply] = useState('Здравствуйте! Увидел ваш запрос, могу помочь. Напишите, пожалуйста, детали.');
  const [notice, setNotice] = useState('');
  const visible = workspace.matches.filter((item) => !item.hidden && (filter === 'all' || item.status === filter));
  const selected = workspace.matches.find((item) => item.id === selectedId && !item.hidden) || visible[0];

  useEffect(() => {
    if (!selected && visible[0]) setSelectedId(visible[0].id);
  }, [selected, visible]);

  const refresh = () => {
    setNotice('Свежие совпадения появятся после подключения серверного сборщика Telegram-сообщений.');
    notify('Ожидается подключение сборщика совпадений');
  };

  const sendReply = () => {
    if (!selected) return;
    actions.updateMatch(selected.id, { sent: true, status: 'contacted' }, { title: 'Сообщение подготовлено', body: selected.author, icon: 'send' });
    actions.addOrUpdateContact({
      name: selected.author,
      source: selected.search,
      status: 'написали',
      last: 'сейчас',
      note: selected.text,
    });
    copyText(reply, 'Сообщение скопировано');
    openTelegram(selected.author);
    setNotice(`Сообщение для ${selected.author} подготовлено`);
  };

  const mark = (status) => {
    if (!selected) return;
    actions.updateMatch(selected.id, { status }, { title: status === 'good' ? 'Совпадение подходит' : 'Совпадение отклонено', body: selected.keyword, icon: status === 'good' ? 'check' : 'x' });
    setNotice(status === 'good' ? 'Совпадение отмечено как подходящее' : 'Совпадение отправлено в отклоненные');
    notify(status === 'good' ? 'Фильтр обучен: подходит' : 'Фильтр обучен: не подходит');
  };

  const hide = () => {
    if (!selected) return;
    actions.updateMatch(selected.id, { hidden: true }, { title: 'Совпадение скрыто', body: selected.keyword, icon: 'eye-off' });
    setSelectedId(visible.find((item) => item.id !== selected.id)?.id || '');
    setNotice('Совпадение скрыто из ленты');
    notify('Совпадение скрыто');
  };

  return (
    <PageShell
      title="Совпадения"
      subtitle="Лента найденных сообщений с быстрыми действиями и обучением фильтра."
      actions={<Btn icon="refresh" kind="secondary" onClick={refresh}>Обновить</Btn>}
    >
      <Notice>{notice}</Notice>
      <div className="grid-4 vexa-metrics">
        <Metric label="В ленте" value={stats.visibleMatches.length} delta={`${workspace.matches.length} всего`} />
        <Metric label="Новых" value={workspace.matches.filter((item) => item.status === 'new' && !item.hidden).length} delta="ждут оценки" />
        <Metric label="Написали" value={workspace.matches.filter((item) => item.sent).length} delta={`${stats.conversion}% конверсия`} deltaKind="up" />
        <Metric label="Скрыто" value={workspace.matches.filter((item) => item.hidden).length} delta="не мешают ленте" />
      </div>
      <div className="vexa-split matches">
        <MatchList items={visible} selectedId={selected?.id} onPick={(item) => setSelectedId(item.id)} filter={filter} setFilter={setFilter} />
        <InnerCard
          title="Детали совпадения"
          subtitle={selected ? `${selected.search} · ${selected.source}` : 'Выберите сообщение'}
          action={selected && <Badge kind={selected.score > 85 ? 'success' : 'warn'}>{selected.score}%</Badge>}
        >
          {selected ? (
            <div className="col vexa-card-body">
              <MatchBrief match={selected} />
              <label className="field">
                <span>Текст быстрого ответа</span>
                <textarea className="input" rows={4} value={reply} onChange={(event) => setReply(event.target.value)} />
              </label>
              <div className="vexa-button-grid">
                <Btn kind="primary" icon="send" onClick={sendReply}>Написать</Btn>
                <Btn kind="primary" icon="check" onClick={() => mark('good')}>Подходит</Btn>
                <Btn kind="danger" icon="x" onClick={() => mark('bad')}>Не подходит</Btn>
                <Btn kind="secondary" icon="eye-off" onClick={hide}>Скрыть</Btn>
                <Btn kind="secondary" icon="arrow-up-right" onClick={() => openTelegram(selected.source)}>Источник</Btn>
                <Btn kind="secondary" icon="copy" onClick={() => copyText(selected.text, 'Текст совпадения скопирован')}>Копировать</Btn>
              </div>
            </div>
          ) : (
            <div className="vexa-empty"><Icon name="inbox" /><strong>Лента пуста</strong><span>Обновите совпадения или измените фильтр.</span></div>
          )}
        </InnerCard>
      </div>
    </PageShell>
  );
}

const blankSource = {
  id: 'source-draft',
  title: '',
  ref: '',
  type: 'Канал',
  group: 'Основные',
  status: 'limited',
  searches: 0,
  checked: 'не проверялся',
  speed: 'ожидает',
  errors: 0,
};

function toSourceDraft(source = blankSource) {
  return {
    title: source.title,
    ref: source.ref,
    type: source.type,
    group: source.group || 'Основные',
    searches: source.searches,
  };
}

export function VexaSourcesPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [selectedId, setSelectedId] = useState(workspace.sources[0]?.id || '');
  const [draft, setDraft] = useState(toSourceDraft(workspace.sources[0] || blankSource));
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const selected = workspace.sources.find((item) => item.id === selectedId) || workspace.sources[0];
  const visible = workspace.sources.filter((source) => filter === 'all' || source.status === filter);
  const groupOptions = Array.from(new Set(['Основные', ...sourceGroups(workspace).map((group) => group.name), draft.group].filter(Boolean)));

  useEffect(() => {
    if (!selected && workspace.sources[0]) {
      setSelectedId(workspace.sources[0].id);
      setDraft(toSourceDraft(workspace.sources[0]));
    }
  }, [selected, workspace.sources]);

  const selectSource = (source) => {
    setSelectedId(source.id);
    setDraft(toSourceDraft(source));
  };

  const addSource = () => {
    const source = { id: `source-${Date.now()}`, title: 'Новый источник', ref: '@new_source', type: 'Канал', group: 'Основные', status: 'limited', searches: 0, checked: 'не проверялся', speed: 'ожидает', errors: 0 };
    actions.addSource(source);
    selectSource(source);
    setNotice('Источник добавлен как черновик');
    notify('Добавлен источник');
  };

  const saveSource = () => {
    const next = { ...selected, ...draft, group: draft.group.trim() || 'Основные', searches: sourceUsage(workspace, selected.id), status: selected.status === 'blocked' ? 'limited' : selected.status };
    actions.updateSource(selected.id, next, { title: 'Источник сохранен', body: next.ref, icon: 'filter' });
    setNotice(`Источник “${next.title}” сохранен`);
    notify('Источник сохранен', next.ref);
  };

  const checkAll = () => {
    actions.checkSources();
    setNotice('Проверка источников завершена');
    notify('Источники проверены');
  };

  const reconnect = (id) => {
    actions.updateSource(id, { status: 'online', checked: 'только что', errors: 0, speed: 'норма' }, { title: 'Источник переподключен', icon: 'refresh' });
    setNotice('Доступ к источнику восстановлен');
    notify('Источник переподключен');
  };

  const deleteSource = (id) => {
    const next = workspace.sources.filter((item) => item.id !== id);
    actions.deleteSource(id);
    if (next[0]) {
      setSelectedId(next[0].id);
      setDraft(toSourceDraft(next[0]));
    }
    setNotice('Источник удален');
    notify('Источник удален');
  };

  return (
    <PageShell
      title="Источники"
      subtitle="Библиотека Telegram-каналов и тем. В поиске можно выбрать несколько источников галочками."
      actions={(
        <>
          <Btn icon="refresh" kind="secondary" onClick={checkAll}>Проверить все</Btn>
          <Btn icon="plus" kind="primary" onClick={addSource}>Добавить источник</Btn>
        </>
      )}
    >
      <Notice>{notice}</Notice>
      <div className="grid-4 vexa-metrics">
        <Metric label="Источников" value={workspace.sources.length} delta={`${stats.plan.sources} доступно`} />
        <Metric label="Онлайн" value={stats.onlineSources} delta="готовы к мониторингу" deltaKind="up" />
        <Metric label="Требуют внимания" value={stats.sourceWarnings} delta="доступ или лимиты" deltaKind={stats.sourceWarnings ? 'down' : 'up'} />
        <Metric label="Ошибок доступа" value={workspace.sources.reduce((sum, item) => sum + item.errors, 0)} delta="последняя проверка" />
      </div>
      <div className="vexa-split sources">
        <Card flush className="vexa-card">
          <div className="card-head vexa-card-head">
            <div>
              <div className="section-title">Состояние источников</div>
              <div className="section-sub">{workspace.sources.length} всего · {stats.onlineSources} онлайн</div>
            </div>
            <Segmented value={filter} onChange={setFilter} items={[
              { value: 'all', label: 'Все' },
              { value: 'online', label: 'Онлайн' },
              { value: 'limited', label: 'Внимание' },
              { value: 'blocked', label: 'Ошибка' },
            ]} />
          </div>
          <div className="divider" />
          {visible.map((source) => (
            <div className={`li-row vexa-row ${selected?.id === source.id ? 'active' : ''}`} key={source.id}>
              <button type="button" className="vexa-row-open" onClick={() => selectSource(source)} aria-label={`Открыть ${source.title}`}>
                <span className="vexa-row-icon"><Icon name={source.type === 'Канал' ? 'page' : 'chat'} size={15} /></span>
                <span className="vexa-row-main">
                  <strong>{source.title}</strong>
                  <span className="section-sub">{source.group || source.type} · {source.ref}</span>
                </span>
              </button>
              <div className="vexa-row-meta">{source.type}</div>
              <div className="vexa-row-meta">{statusBadge(source.status)}</div>
              <div className="vexa-row-meta tabular">{source.errors} ошибок</div>
              <div className="vexa-row-actions">
                <Btn size="sm" kind="secondary" icon="arrow-up-right" onClick={() => openTelegram(source.ref)}>Открыть</Btn>
                <Btn size="sm" kind="secondary" icon="refresh" onClick={() => reconnect(source.id)}>Проверить</Btn>
                <Btn size="sm" kind="danger" icon="trash" onClick={() => deleteSource(source.id)}>Удалить</Btn>
              </div>
            </div>
          ))}
        </Card>

        {selected ? (
          <InnerCard
            title="Настройка источника"
            subtitle={`${selected.checked} · скорость: ${selected.speed}`}
            action={statusBadge(selected.status)}
          >
            <div className="col vexa-card-body">
              <label className="field">
                <span>Название</span>
                <input className="input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </label>
              <label className="field">
                <span>Ссылка или @username</span>
                <input className="input" value={draft.ref} onChange={(event) => setDraft({ ...draft, ref: event.target.value })} />
              </label>
              <div className="grid-2">
                <label className="field">
                  <span>Тип</span>
                  <VexaSelect
                    value={draft.type}
                    options={['Канал', 'Группа', 'Инвайт']}
                    onChange={(type) => setDraft({ ...draft, type })}
                  />
                </label>
                <label className="field">
                  <span>Тема / список</span>
                  <VexaSelect
                    value={draft.group}
                    options={groupOptions}
                    onChange={(group) => setDraft({ ...draft, group })}
                  />
                </label>
              </div>
              <div className="vexa-detail-grid">
                <UsageBar label="Ошибки доступа" used={selected.errors} total={5} />
                <UsageBar label="Привязка к поискам" used={sourceUsage(workspace, selected.id)} total={Math.max(1, workspace.searches.length)} />
              </div>
              <div className="vexa-form-actions">
                <Btn kind="secondary" onClick={() => setDraft(toSourceDraft(selected))}>Отмена</Btn>
                <Btn kind="secondary" icon="arrow-up-right" onClick={() => openTelegram(selected.ref)}>Открыть источник</Btn>
                <Btn kind="primary" onClick={saveSource}>Сохранить</Btn>
              </div>
            </div>
          </InnerCard>
        ) : (
          <InnerCard title="Настройка источника" subtitle="Подключите Telegram-канал, группу или invite-ссылку">
            <div className="vexa-empty">
              <Icon name="filter" />
              <strong>Источников пока нет</strong>
              <span>Добавьте первый Telegram-источник, чтобы мониторинг начал собирать совпадения.</span>
              <Btn kind="primary" icon="plus" onClick={addSource}>Добавить источник</Btn>
            </div>
          </InnerCard>
        )}
      </div>
    </PageShell>
  );
}

export function VexaSubscriptionPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [promo, setPromo] = useState('');
  const [notice, setNotice] = useState('');
  const selectedPlan = stats.plan;
  const multiplier = workspace.billing === 'year' ? 10 : 1;

  const choosePlan = (plan) => {
    actions.choosePlan(plan.id);
    setNotice(plan.id === 'free' ? 'Включен бесплатный тариф' : `Подготовлен счет на тариф ${plan.name}`);
    notify('Тариф выбран', plan.name);
  };

  const pay = () => {
    const total = selectedPlan.price * multiplier;
    if (total) actions.createInvoice(selectedPlan.id, total);
    setNotice(total ? `Счет на ${total.toLocaleString('ru-RU')} ₽ создан и готов к оплате` : 'Free включен без оплаты');
    notify('Счет создан', selectedPlan.name);
  };

  return (
    <PageShell
      title="Подписка и лимиты"
      subtitle="Тарифы в рублях, ограничения аккаунта и история оплат."
      actions={(
        <>
          <Segmented value={workspace.billing} onChange={actions.setBilling} items={[
            { value: 'month', label: 'Месяц' },
            { value: 'year', label: 'Год -2 мес' },
          ]} />
          <Btn icon="card" kind="primary" onClick={pay}>Оплатить {selectedPlan.name}</Btn>
        </>
      )}
    >
      <Notice>{notice}</Notice>
      <div className="grid-4 vexa-metrics">
        {plans.map((plan) => {
          const price = plan.price * multiplier;
          return (
            <Card key={plan.id} className={`vexa-card vexa-plan ${plan.id === workspace.currentPlan ? 'accent-card active' : ''}`}>
              <div className="card-head vexa-card-head">
                <div>
                  <div className="section-title">{plan.name}</div>
                  <div className="section-sub">{plan.note}</div>
                </div>
              {plan.id === workspace.currentPlan && <Badge kind="success">текущий</Badge>}
              </div>
              <div className="metric-value tabular vexa-price">
                <NumberPopIn value={`${price.toLocaleString('ru-RU')} ₽`} />
              </div>
              <div className="col vexa-plan-list">
                <span>{plan.searches} поисков</span>
                <span>{plan.sources} источников</span>
                <span>{plan.messages} сообщений в день</span>
              </div>
              <Btn kind={plan.id === workspace.currentPlan ? 'secondary' : 'primary'} onClick={() => choosePlan(plan)} style={{ width: '100%' }}>
                {plan.id === workspace.currentPlan ? 'Текущий план' : 'Выбрать'}
              </Btn>
            </Card>
          );
        })}
      </div>
      <div className="vexa-split subscription">
        <InnerCard title="Использование Pro" subtitle="Обновится завтра в 00:00 по вашему часовому поясу">
          <div className="grid-3">
            <UsageBar label="Сообщения сегодня" used={stats.messagesUsed} total={stats.plan.messages} />
            <UsageBar label="Источники" used={workspace.sources.length} total={stats.plan.sources} />
            <UsageBar label="Поиски" used={workspace.searches.length} total={stats.plan.searches} />
          </div>
        </InnerCard>
        <InnerCard title="Оплата" subtitle="Прототип счета для интеграции с YooKassa/CloudPayments">
          <div className="col vexa-card-body">
            <label className="field">
              <span>Промокод</span>
              <input className="input" value={promo} placeholder="VEXA10" onChange={(event) => setPromo(event.target.value.toUpperCase())} />
            </label>
            <div className="vexa-mini">
              <div className="metric-label">К оплате</div>
              <strong className="tabular">{(selectedPlan.price * multiplier).toLocaleString('ru-RU')} ₽</strong>
              {promo && <div className="section-sub">Промокод применится на стороне платежки</div>}
            </div>
            <div className="vexa-form-actions">
              <Btn kind="secondary" icon="copy" onClick={() => copyText(`Счет Vexa ${selectedPlan.name}`, 'Данные счета скопированы')}>Копировать счет</Btn>
              <Btn kind="primary" icon="card" onClick={pay}>Создать счет</Btn>
            </div>
          </div>
        </InnerCard>
      </div>
    </PageShell>
  );
}

export function VexaSettingsPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const telegram = useTelegramNotificationLink();
  const [settings, setSettings] = useState(workspace.settings);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setSettings(workspace.settings);
  }, [workspace.settings]);

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }));
  const save = () => {
    actions.updateSettings(settings);
    setNotice('Настройки сохранены локально и готовы к синхронизации');
    notify('Настройки Vexa сохранены');
  };

  const sendTelegramTest = async () => {
    if (!telegram.connected) {
      setNotice('Telegram еще не подключен. Сначала нажмите “Подключить Telegram”.');
      return;
    }

    const result = await telegram.sendTest();
    setNotice(result.ok ? 'Тестовое уведомление отправлено в Telegram' : `Не удалось отправить Telegram: ${result.error}`);
  };

  return (
    <PageShell
      title="Настройки"
      subtitle="Уведомления, тихие часы, аккаунт и экспорт данных."
      actions={<Btn icon="check" kind="primary" onClick={save}>Сохранить</Btn>}
    >
      <Notice>{notice}</Notice>
      <div className="grid-4 vexa-metrics">
        <Metric label="Тариф" value={stats.plan.name} delta={`${stats.plan.searches} поисков`} />
        <Metric label="Тихие часы" value={settings.quiet ? 'on' : 'off'} delta={`${settings.start}-${settings.end}`} />
        <Metric label="Telegram" value={telegram.connected ? 'on' : 'off'} delta={telegram.connected ? 'уведомления' : 'не подключен'} />
        <Metric label="Сводка" value={settings.digest ? 'on' : 'off'} delta="ежедневный отчет" />
      </div>
      <div className="vexa-split settings">
        <InnerCard title="Уведомления" subtitle="Правила доставки внутри приложения и во внешние каналы">
          <div className="col vexa-card-body">
            <div className="li-row vexa-row compact">
              <div>
                <strong>Тихие часы</strong>
                <div className="section-sub">Не присылать уведомления ночью</div>
              </div>
              <Switch on={settings.quiet} onChange={(quiet) => update({ quiet })} />
            </div>
            <div className="li-row vexa-row compact">
              <div>
                <strong>Ежедневная сводка</strong>
                <div className="section-sub">Отчет по совпадениям и лимитам в конце дня</div>
              </div>
              <Switch on={settings.digest} onChange={(digest) => update({ digest })} />
            </div>
            <div className="li-row vexa-row compact">
              <div>
                <strong>Автоскрытие отклоненных</strong>
                <div className="section-sub">Убирать “не подходит” из основной ленты</div>
              </div>
              <Switch on={settings.autoHide} onChange={(autoHide) => update({ autoHide })} />
            </div>
            <div className="grid-2">
              <label className="field">
                <span>Начало</span>
                <input className="input" value={settings.start} onChange={(event) => update({ start: event.target.value })} />
              </label>
              <label className="field">
                <span>Конец</span>
                <input className="input" value={settings.end} onChange={(event) => update({ end: event.target.value })} />
              </label>
            </div>
          </div>
        </InnerCard>
        <InnerCard title="Telegram-уведомления" subtitle="Необязательный канал для быстрых пушей о совпадениях">
          <div className="col vexa-card-body">
            <div className="vexa-mini telegram-connect">
              <div className="metric-label">Статус</div>
              <strong>{telegram.connected ? 'Telegram подключен' : telegram.pending ? 'Ждем подтверждение в Telegram' : 'Telegram не подключен'}</strong>
              <div className="section-sub">
                {telegram.connected
                  ? `Бот будет присылать уведомления${telegram.username ? ` на @${telegram.username}` : ''}. Все настройки остаются в приложении.`
                  : 'Поиск и совпадения работают без Telegram. Подключение нужно только для уведомлений, когда приложение закрыто.'}
              </div>
            </div>
            {telegram.error ? <Notice>{telegram.error}</Notice> : null}
            <div className="vexa-form-actions">
              <Btn kind={telegram.connected ? 'secondary' : 'primary'} icon="send" onClick={telegram.connect} disabled={telegram.pending}>
                {telegram.pending ? 'Ожидаем Start' : telegram.connected ? 'Переподключить' : 'Подключить Telegram'}
              </Btn>
              <Btn kind="secondary" icon="bell" onClick={sendTelegramTest} disabled={!telegram.connected}>Тест</Btn>
              <Btn kind="secondary" icon="refresh" onClick={telegram.refresh}>Проверить</Btn>
            </div>
          </div>
        </InnerCard>
        <InnerCard title="Аккаунт" subtitle="Профиль, экспорт и технические действия">
          <div className="col vexa-card-body">
            <label className="field">
              <span>Часовой пояс</span>
              <input className="input" value={settings.timezone} onChange={(event) => update({ timezone: event.target.value })} />
            </label>
            <div className="vexa-mini">
              <div className="metric-label">Тариф</div>
              <strong>{stats.plan.name}</strong>
              <div className="section-sub">{stats.plan.searches} поисков · {stats.plan.sources} источников · {stats.plan.messages} сообщений в день</div>
            </div>
            <div className="vexa-form-actions">
              <Btn kind="secondary" icon="arrow-up-right" onClick={() => downloadJson('vexa-settings.json', settings)}>Экспорт</Btn>
              <Btn kind="primary" onClick={save}>Сохранить</Btn>
            </div>
          </div>
        </InnerCard>
      </div>
    </PageShell>
  );
}

export function VexaSimplePage({ id = 'help', go }) {
  if (id === 'contacts') return <VexaSearchesPage />;
  if (id === 'analytics') return <AnalyticsPage />;
  if (id === 'payments') return <PaymentsPage go={go} />;
  if (id === 'notifications') return <NotificationsPage />;
  return <HelpPage />;
}

function ContactsPage() {
  const { workspace, actions } = useVexaWorkspace();
  const [selectedId, setSelectedId] = useState(workspace.contacts[0]?.id || '');
  const [note, setNote] = useState(workspace.contacts[0]?.note || '');
  const selected = workspace.contacts.find((item) => item.id === selectedId) || workspace.contacts[0];

  useEffect(() => {
    if (!selected && workspace.contacts[0]) {
      setSelectedId(workspace.contacts[0].id);
      setNote(workspace.contacts[0].note);
    }
  }, [selected, workspace.contacts]);

  const select = (item) => {
    setSelectedId(item.id);
    setNote(item.note);
  };

  const save = () => {
    if (!selected) return;
    actions.addOrUpdateContact({ ...selected, note, status: 'в работе', last: 'сейчас' });
    notify('Контакт обновлен', selected.name);
  };

  const addContact = () => {
    const contact = { name: '@new_contact', source: 'Ручное добавление', status: 'новый', last: 'сейчас', note: 'Новый контакт' };
    actions.addOrUpdateContact(contact);
    notify('Контакт добавлен');
  };

  return (
    <PageShell
      title="Контакты"
      subtitle="Лиды, которым уже написали или которые требуют ручной обработки."
      actions={<Btn icon="plus" kind="primary" onClick={addContact}>Добавить контакт</Btn>}
    >
      <div className="vexa-split">
        <Card flush className="vexa-card">
          <div className="card-head vexa-card-head">
            <div>
              <div className="section-title">Список контактов</div>
              <div className="section-sub">{workspace.contacts.length} активных диалогов</div>
            </div>
            <Btn size="sm" kind="secondary" icon="arrow-up-right" onClick={() => downloadJson('vexa-contacts.json', workspace.contacts)}>Экспорт</Btn>
          </div>
          <div className="divider" />
          {workspace.contacts.map((item) => (
            <button key={item.id} type="button" className={`li-row vexa-row vexa-row-button ${selected?.id === item.id ? 'active' : ''}`} onClick={() => select(item)}>
              <span className="vexa-row-icon"><Icon name="users" size={15} /></span>
              <span className="vexa-row-main">
                <strong>{item.name}</strong>
                <span className="section-sub">{item.source} · {item.note}</span>
              </span>
              <span className="vexa-row-meta">{item.status}</span>
              <span className="vexa-row-time">{item.last}</span>
            </button>
          ))}
        </Card>
        <InnerCard title="Карточка контакта" subtitle={selected?.source}>
          {selected ? <div className="col vexa-card-body">
            <div className="vexa-mini">
              <div className="metric-label">Telegram</div>
              <strong>{selected?.name}</strong>
            </div>
            <label className="field">
              <span>Заметка</span>
              <textarea className="input" rows={5} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <div className="vexa-form-actions">
              <Btn kind="secondary" icon="copy" onClick={() => copyText(selected.name, 'Telegram скопирован')}>Скопировать</Btn>
              <Btn kind="secondary" icon="send" onClick={() => openTelegram(selected.name)}>Написать</Btn>
              <Btn kind="primary" onClick={save}>Сохранить</Btn>
            </div>
          </div> : <div className="vexa-empty"><Icon name="users" /><strong>Контактов нет</strong><span>Напишите по совпадению или добавьте контакт вручную.</span></div>}
        </InnerCard>
      </div>
    </PageShell>
  );
}

function AnalyticsPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [period, setPeriod] = useState('week');
  const [sourcePage, setSourcePage] = useState(1);
  const [notice, setNotice] = useState('');
  const multiplier = period === 'month' ? 4 : 1;
  const pageSize = 5;
  const sourcePages = Math.max(1, Math.ceil(workspace.sources.length / pageSize));
  const currentSourcePage = Math.min(sourcePage, sourcePages);
  const sourceStart = (currentSourcePage - 1) * pageSize;
  const visibleSources = workspace.sources.slice(sourceStart, sourceStart + pageSize);

  return (
    <PageShell
      title="Аналитика"
      subtitle="Эффективность поисков, источников и AI-фильтра."
      actions={(
        <>
          <Segmented value={period} onChange={setPeriod} items={[
            { value: 'week', label: 'Неделя' },
            { value: 'month', label: 'Месяц' },
          ]} />
          <Btn icon="arrow-up-right" kind="secondary" onClick={() => downloadJson('vexa-analytics.json', { chart: stats.chartData, stats, searches: workspace.searches, sources: workspace.sources })}>Экспорт</Btn>
        </>
      )}
    >
      <Notice>{notice}</Notice>
      <div className="grid-4 vexa-metrics">
        <Metric label="Найдено" value={stats.chartData.reduce((sum, item) => sum + item.matches, 0) * multiplier} delta={stats.today ? 'по кабинету' : 'нет данных'} deltaKind={stats.today ? 'up' : undefined} />
        <Metric label="Отправлено" value={stats.sent * multiplier} delta={`${stats.conversion}% конверсия`} />
        <Metric label="Точность AI" value={workspace.searches.length ? `${Math.round(workspace.searches.reduce((sum, item) => sum + item.quality, 0) / Math.max(1, workspace.searches.length))}%` : '—'} delta={workspace.searches.length ? 'по поискам' : 'нет данных'} />
        <Metric label="Среднее время" value="—" delta="появится после первых совпадений" />
      </div>
      <div className="vexa-split analytics">
        <InnerCard title="Воронка мониторинга" subtitle="От найденного сообщения до контакта">
          <div className="vexa-chart">
            <VexaAnalyticsChart data={stats.chartData} conversion={stats.conversion} />
          </div>
        </InnerCard>
        <InnerCard title="Лучшие источники" subtitle="Где больше подходящих лидов">
          <div className="col vexa-card-body">
            {visibleSources.map((source, index) => (
              <div key={source.id} className="vexa-mini">
                <div className="vexa-row-title">
                  <strong>{source.title}</strong>
                  <Badge kind="info">#{sourceStart + index + 1}</Badge>
                </div>
                <UsageBar label={source.ref} used={sourceUsage(workspace, source.id)} total={Math.max(1, workspace.searches.length)} />
              </div>
            ))}
            {workspace.sources.length > pageSize && (
              <div className="vexa-pagination" aria-label="Страницы источников">
                {Array.from({ length: sourcePages }, (_, index) => index + 1).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`vexa-page-number ${page === currentSourcePage ? 'active' : ''}`}
                    onClick={() => setSourcePage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
            {!workspace.sources.length && (
              <div className="vexa-empty">
                <Icon name="filter" />
                <strong>Источников пока нет</strong>
                <span>Создайте темы источников и привяжите их к поискам.</span>
              </div>
            )}
            <Btn kind="secondary" icon="refresh" onClick={() => { actions.checkSources(); setNotice('Аналитика пересчитана'); notify('Аналитика пересчитана'); }}>Пересчитать</Btn>
          </div>
        </InnerCard>
      </div>
    </PageShell>
  );
}

function PaymentsPage({ go }) {
  const { workspace, actions, stats } = useVexaWorkspace();

  const createInvoice = () => {
    const invoice = actions.createInvoice(stats.plan.id, stats.plan.price || 0);
    notify('Создан новый счет', invoice.id);
  };

  const markPaid = (id) => {
    actions.markInvoicePaid(id);
    notify('Счет отмечен оплаченным', id);
  };

  return (
    <PageShell
      title="Платежи"
      subtitle="Счета, способы оплаты и подготовка интеграции оплаты в рублях."
      actions={(
        <>
          <Btn icon="crown" kind="secondary" onClick={() => go?.('subscription')}>Тарифы</Btn>
          <Btn icon="plus" kind="primary" onClick={createInvoice}>Создать счет</Btn>
        </>
      )}
    >
      <Card flush className="vexa-card">
        <div className="card-head vexa-card-head">
          <div>
            <div className="section-title">История счетов</div>
            <div className="section-sub">Макет под YooKassa/CloudPayments или ручную оплату</div>
          </div>
          <Btn size="sm" kind="secondary" icon="arrow-up-right" onClick={() => downloadJson('vexa-invoices.json', workspace.invoices)}>Экспорт</Btn>
        </div>
        <div className="divider" />
        {workspace.invoices.map((invoice) => (
          <div className="li-row vexa-row" key={invoice.id}>
            <div className="vexa-row-icon"><Icon name="card" size={15} /></div>
            <div className="vexa-row-main">
              <strong>{invoice.id} · {invoice.plan}</strong>
              <div className="section-sub">{invoice.date}</div>
            </div>
            <div className="vexa-row-meta tabular">{invoice.amount.toLocaleString('ru-RU')} ₽</div>
            <div className="vexa-row-meta">{invoice.status === 'оплачен' ? <Badge kind="success">оплачен</Badge> : <Badge kind="warn">черновик</Badge>}</div>
            <div className="vexa-row-actions">
              <Btn size="sm" kind="secondary" icon="copy" onClick={() => copyText(`Vexa ${invoice.id}: ${invoice.amount} ₽`, 'Счет скопирован')}>Копия</Btn>
              <Btn size="sm" kind="primary" disabled={invoice.status === 'оплачен'} onClick={() => markPaid(invoice.id)}>Оплачено</Btn>
            </div>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

function NotificationsPage() {
  const { workspace, actions } = useVexaWorkspace();
  const telegram = useTelegramNotificationLink();
  const [notice, setNotice] = useState('');

  const toggle = (id) => {
    const current = workspace.notificationRules.find((item) => item.id === id);
    actions.updateNotificationRule(id, { enabled: !current?.enabled });
    notify('Правило уведомлений обновлено');
  };

  const sendTest = async () => {
    if (!telegram.connected) {
      setNotice('Telegram не подключен. Внутренние уведомления работают, внешние пуши включатся после подключения.');
      return;
    }

    const result = await telegram.sendTest();
    setNotice(result.ok ? 'Тестовое уведомление отправлено в Telegram' : `Не удалось отправить Telegram: ${result.error}`);
  };

  return (
    <PageShell
      title="Уведомления"
      subtitle="Правила, каналы доставки и тестовые сообщения."
      actions={<Btn icon="send" kind="primary" onClick={sendTest}>Отправить тест</Btn>}
    >
      <Notice>{notice}</Notice>
      <div className="grid-4 vexa-metrics">
        <Metric label="Правил" value={workspace.notificationRules.length} delta="в приложении" />
        <Metric label="Включено" value={workspace.notificationRules.filter((item) => item.enabled).length} delta="активные события" deltaKind="up" />
        <Metric label="Telegram" value={telegram.connected ? 'on' : 'off'} delta={telegram.connected ? 'подключен' : 'не подключен'} />
        <Metric label="Тихие часы" value={workspace.settings.quiet ? 'on' : 'off'} delta={`${workspace.settings.start}-${workspace.settings.end}`} />
      </div>
      <div className="vexa-split notifications">
        <InnerCard title="Каналы доставки" subtitle="Приложение работает всегда, Telegram нужен только для push-сообщений">
          <div className="col vexa-card-body">
            <div className="vexa-mini">
              <div className="metric-label">Приложение</div>
              <strong>Включено</strong>
              <div className="section-sub">Совпадения и системные события отображаются в кабинете Vexa.</div>
            </div>
            <div className="vexa-mini telegram-connect">
              <div className="metric-label">Telegram</div>
              <strong>{telegram.connected ? 'Подключен' : telegram.pending ? 'Ожидает подтверждение' : 'Не подключен'}</strong>
              <div className="section-sub">
                {telegram.connected
                  ? `Уведомления будут уходить${telegram.username ? ` на @${telegram.username}` : ' в подключенный аккаунт'}.`
                  : 'Подключите Telegram, если нужны уведомления вне приложения.'}
              </div>
            </div>
            <div className="vexa-form-actions">
              <Btn kind={telegram.connected ? 'secondary' : 'primary'} icon="send" onClick={telegram.connect} disabled={telegram.pending}>
                {telegram.pending ? 'Ожидаем Start' : telegram.connected ? 'Переподключить' : 'Подключить Telegram'}
              </Btn>
              <Btn kind="secondary" icon="refresh" onClick={telegram.refresh}>Проверить</Btn>
            </div>
          </div>
        </InnerCard>
        <Card flush className="vexa-card">
        <div className="card-head vexa-card-head">
          <div>
            <div className="section-title">Правила уведомлений</div>
            <div className="section-sub">{workspace.notificationRules.filter((item) => item.enabled).length} включено</div>
          </div>
          <Btn size="sm" kind="secondary" onClick={() => { actions.enableAllNotifications(); notify('Все уведомления включены'); }}>Включить все</Btn>
        </div>
        <div className="divider" />
        {workspace.notificationRules.map((item) => (
          <div className="li-row vexa-row" key={item.id}>
            <div className="vexa-row-icon"><Icon name="bell" size={15} /></div>
            <div className="vexa-row-main">
              <strong>{item.title}</strong>
              <div className="section-sub">{item.target}</div>
            </div>
            <Badge kind={item.enabled ? 'success' : 'warn'}>{item.enabled ? 'включено' : 'выключено'}</Badge>
            <Switch on={item.enabled} onChange={() => toggle(item.id)} />
          </div>
        ))}
        </Card>
      </div>
    </PageShell>
  );
}

function HelpPage() {
  const [feedback, setFeedback] = useState('');
  const [notice, setNotice] = useState('');
  const faq = [
    ['Зачем подключать Telegram?', 'Только для push-уведомлений о совпадениях. Поиски, источники и настройки работают в приложении.'],
    ['Где настраивать поиски?', 'На странице “Поиски”: ключевые слова, минус-слова, лимит и выбранные источники.'],
    ['Что такое источники?', 'Это библиотека каналов/групп, разложенная по темам. В каждом поиске можно выбрать несколько источников.'],
    ['Почему нет совпадений?', 'Нужны активный поиск, выбранные источники и подключенный сборщик Telegram-сообщений.'],
  ];
  const sendFeedback = () => {
    const text = feedback.trim();
    if (!text) {
      setNotice('Напишите текст обращения.');
      return;
    }
    copyText(`Vexa feedback:\n${text}`, 'Обращение скопировано');
    setNotice('Обращение скопировано. Можно отправить его в Telegram @olenchuk_b.');
  };

  return (
    <PageShell
      title="Помощь"
      subtitle="FAQ, связь с поддержкой и форма обратной связи."
      actions={<Btn icon="send" kind="primary" onClick={() => openTelegram('@olenchuk_b')}>Написать @olenchuk_b</Btn>}
    >
      <Notice>{notice}</Notice>
      <div className="vexa-split help">
        <Card flush className="vexa-card">
          <div className="card-head vexa-card-head">
            <div>
              <div className="section-title">Вопросы и ответы</div>
              <div className="section-sub">Быстрые ответы по логике Vexa</div>
            </div>
          </div>
          <div className="divider" />
          {faq.map(([question, answer]) => (
            <div className="li-row vexa-row" key={question}>
              <div className="vexa-row-icon"><Icon name="help" size={15} /></div>
              <div className="vexa-row-main">
                <strong>{question}</strong>
                <span className="section-sub">{answer}</span>
              </div>
            </div>
          ))}
        </Card>
        <InnerCard title="Связь и обратная связь" subtitle="Поддержка: Telegram @olenchuk_b">
          <div className="col vexa-card-body">
            <div className="vexa-mini">
              <div className="metric-label">Telegram</div>
              <strong>@olenchuk_b</strong>
              <div className="section-sub">Пишите сюда по багам, оплате, интеграции и доступу к Telegram-источникам.</div>
            </div>
            <label className="field">
              <span>Форма обратной связи</span>
              <textarea className="input" rows={5} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Опишите вопрос, ошибку или идею..." />
            </label>
            <div className="vexa-form-actions">
              <Btn kind="secondary" icon="copy" onClick={sendFeedback}>Скопировать</Btn>
              <Btn kind="primary" icon="send" onClick={() => openTelegram('@olenchuk_b')}>Написать в Telegram</Btn>
            </div>
          </div>
        </InnerCard>
      </div>
    </PageShell>
  );
}
