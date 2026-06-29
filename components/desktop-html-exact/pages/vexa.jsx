import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Badge, Btn, Card, Icon, Metric, Segmented, Switch } from '../desktop-html-ui';

const VEXA_WORKSPACE_STORAGE_KEY = 'vexa.telegram.monitoring.workspace.v9';
const VEXA_PROFILE_STORAGE_KEY = 'vexa.profile.v1';

const SOURCE_TYPES = ['Канал', 'Группа', 'Комментарии', 'Invite-ссылка'];
const SOURCE_STATUSES = ['online', 'limited', 'pending', 'blocked'];
const SEARCH_GOALS = [
  'Заявки и лиды',
  'Вакансии',
  'Кандидаты',
  'Упоминания бренда',
  'Запросы на услуги',
  'Объявления',
  'Нишевые обсуждения',
];

const SEARCH_TEMPLATES = [
  {
    id: 'tpl-service-leads',
    icon: 'inbox',
    title: 'Заявки на услуги',
    goal: 'Заявки и лиды',
    description: 'Ловит сообщения, где человеку нужен подрядчик, консультация или исполнитель.',
    priority: 'Высокий',
    mode: 'phrase',
    minScore: 72,
    keywords: ['нужен подрядчик', 'ищу специалиста', 'кто может сделать', 'нужна консультация', 'посоветуйте исполнителя', 'ищу команду'],
    minus: ['бесплатно', 'розыгрыш', 'без бюджета', 'стажировка', 'бартер'],
  },
  {
    id: 'tpl-jobs',
    icon: 'users',
    title: 'Вакансии и кандидаты',
    goal: 'Вакансии',
    description: 'Разделяет запросы найма и сообщения кандидатов, которые открыты к проектам.',
    priority: 'Средний',
    mode: 'phrase',
    minScore: 68,
    keywords: ['ищем дизайнера', 'ищем разработчика', 'открыта вакансия', 'ищу работу', 'готов взять проект', 'ищу проект'],
    minus: ['junior без опыта', 'только офис', 'релокация обязательна', 'без оплаты'],
  },
  {
    id: 'tpl-brand',
    icon: 'bell',
    title: 'Бренд и конкуренты',
    goal: 'Упоминания бренда',
    description: 'Отслеживает название продукта, альтернативы, жалобы, отзывы и сравнения.',
    priority: 'Средний',
    mode: 'contains',
    minScore: 64,
    keywords: ['vexa', 'clickbook', 'альтернатива vexa', 'мониторинг telegram', 'сервис мониторинга'],
    minus: ['накрутка', 'слив базы', 'спам-бот', 'парсер старой истории'],
  },
  {
    id: 'tpl-comments',
    icon: 'chat',
    title: 'Комментарии под постами',
    goal: 'Нишевые обсуждения',
    description: 'Подходит для поиска запросов и болей в комментариях под каналами и медиа.',
    priority: 'Высокий',
    mode: 'phrase',
    minScore: 70,
    keywords: ['а кто может', 'подскажите сервис', 'как решить', 'есть ли инструмент', 'нужна помощь'],
    minus: ['мем', 'шутка', 'реклама', 'скидка', 'промокод'],
  },
];

const starterSources = [
  {
    id: 'src-service-chats',
    title: 'Чаты с заявками на услуги',
    ref: '@service_requests_demo',
    type: 'Группа',
    group: 'Лиды и услуги',
    status: 'online',
    access: 'доступ есть',
    connectedAt: 'подключен сегодня',
    lastSeen: '2 минуты назад',
    coverage: 'новые сообщения',
    trust: 92,
    cadence: 'постоянно',
    language: 'RU',
    note: 'Подходит для фраз “кто может сделать”, “нужен специалист”, “ищу подрядчика”.',
  },
  {
    id: 'src-product-jobs',
    title: 'Product / Design Jobs',
    ref: '@product_design_jobs_demo',
    type: 'Канал',
    group: 'Работа и найм',
    status: 'online',
    access: 'доступ есть',
    connectedAt: 'подключен вчера',
    lastSeen: '6 минут назад',
    coverage: 'новые посты',
    trust: 87,
    cadence: 'постоянно',
    language: 'RU/EN',
    note: 'Канал с вакансиями, part-time задачами и поиском специалистов.',
  },
  {
    id: 'src-brand-comments',
    title: 'Комментарии под нишевыми постами',
    ref: 'https://t.me/c/demo_comments',
    type: 'Комментарии',
    group: 'Бренд и конкуренты',
    status: 'limited',
    access: 'нужна проверка доступа',
    connectedAt: 'ожидает подключения',
    lastSeen: 'не проверялся',
    coverage: 'после подключения',
    trust: 64,
    cadence: 'после проверки',
    language: 'RU',
    note: 'Комментарии часто дают запросы, жалобы, упоминания конкурентов и реальные боли аудитории.',
  },
  {
    id: 'src-candidates',
    title: 'Кандидаты и резюме',
    ref: '@candidate_pool_demo',
    type: 'Группа',
    group: 'Работа и найм',
    status: 'online',
    access: 'доступ есть',
    connectedAt: 'подключен сегодня',
    lastSeen: '11 минут назад',
    coverage: 'новые сообщения',
    trust: 82,
    cadence: 'постоянно',
    language: 'RU',
    note: 'Люди пишут “ищу проект”, “готов взять задачу”, “открыт к предложениям”.',
  },
  {
    id: 'src-market-invites',
    title: 'Invite-чаты маркетинга',
    ref: 'https://t.me/+invite_demo_marketing',
    type: 'Invite-ссылка',
    group: 'Маркетинг и SaaS',
    status: 'pending',
    access: 'ожидает подтверждения',
    connectedAt: 'ожидает подключения',
    lastSeen: 'не проверялся',
    coverage: 'после подключения',
    trust: 58,
    cadence: 'после проверки',
    language: 'RU',
    note: 'Черновой источник для пилота. Нужно проверить доступ и правила чата.',
  },
];

const starterSearches = [
  {
    id: 'srch-service-leads',
    title: 'Заявки на услуги',
    goal: 'Заявки и лиды',
    status: 'active',
    priority: 'Высокий',
    delivery: 'telegram',
    dailyLimit: 80,
    minScore: 72,
    mode: 'phrase',
    matchesToday: 4,
    quality: 94,
    lastRun: 'ждет новые сообщения',
    botChannel: 'личный чат Vexa-бота',
    keywords: ['нужен подрядчик', 'ищу специалиста', 'кто может сделать', 'нужна консультация', 'посоветуйте исполнителя'],
    minus: ['бесплатно', 'розыгрыш', 'стажировка', 'без бюджета'],
    sourceIds: ['src-service-chats', 'src-brand-comments'],
  },
  {
    id: 'srch-hiring',
    title: 'Вакансии и кандидаты',
    goal: 'Вакансии',
    status: 'active',
    priority: 'Средний',
    delivery: 'telegram',
    dailyLimit: 60,
    minScore: 68,
    mode: 'phrase',
    matchesToday: 2,
    quality: 86,
    lastRun: 'ждет новые публикации',
    botChannel: 'личный чат Vexa-бота',
    keywords: ['ищем дизайнера', 'ищем разработчика', 'открыта вакансия', 'ищу работу', 'готов взять проект'],
    minus: ['junior без опыта', 'релокация обязательна', 'только офис'],
    sourceIds: ['src-product-jobs', 'src-candidates'],
  },
  {
    id: 'srch-brand',
    title: 'Упоминания бренда и конкурентов',
    goal: 'Упоминания бренда',
    status: 'paused',
    priority: 'Низкий',
    delivery: 'digest',
    dailyLimit: 40,
    minScore: 64,
    mode: 'contains',
    matchesToday: 0,
    quality: 76,
    lastRun: 'на паузе',
    botChannel: 'сводка',
    keywords: ['vexa', 'clickbook', 'альтернатива vexa', 'мониторинг телеграм'],
    minus: ['боты накрутки', 'слив базы'],
    sourceIds: ['src-brand-comments'],
  },
];

const starterMatches = [
  {
    id: 'mtch-landing',
    searchId: 'srch-service-leads',
    search: 'Заявки на услуги',
    sourceId: 'src-service-chats',
    source: '@service_requests_demo',
    sourceType: 'Группа',
    author: '@demo_client',
    keyword: 'нужен подрядчик',
    score: 92,
    priority: 'Высокий',
    intent: 'лид',
    status: 'new',
    sent: false,
    hidden: false,
    time: 'сейчас',
    text: 'Нужен подрядчик на лендинг и Telegram-воронку. Желательно с опытом в нишевых сервисах. Кто может взяться на этой неделе?',
    reason: 'Совпала точная фраза “нужен подрядчик”; минус-слова не найдены; источник входит в поиск “Заявки на услуги”.',
    nextStep: 'Открыть источник, проверить контекст и отправить в личку через Vexa-бота.',
  },
  {
    id: 'mtch-designer',
    searchId: 'srch-hiring',
    search: 'Вакансии и кандидаты',
    sourceId: 'src-product-jobs',
    source: '@product_design_jobs_demo',
    sourceType: 'Канал',
    author: '@hr_demo',
    keyword: 'ищем дизайнера',
    score: 86,
    priority: 'Средний',
    intent: 'вакансия',
    status: 'qualified',
    sent: true,
    hidden: false,
    time: '7 минут назад',
    text: 'Ищем продуктового дизайнера на part-time. Нужен человек, который быстро собирает интерфейсы и проверяет гипотезы.',
    reason: 'Найдена фраза “ищем дизайнера”, сообщение новое, источник онлайн.',
    nextStep: 'Уже отправлено пользователю через нашего Vexa-бота. Можно отметить итог после обработки.',
  },
  {
    id: 'mtch-consulting',
    searchId: 'srch-service-leads',
    search: 'Заявки на услуги',
    sourceId: 'src-brand-comments',
    source: 'Комментарии под постом',
    sourceType: 'Комментарии',
    author: '@founder_demo',
    keyword: 'нужна консультация',
    score: 78,
    priority: 'Высокий',
    intent: 'запрос на консультацию',
    status: 'new',
    sent: false,
    hidden: false,
    time: '18 минут назад',
    text: 'Нужна консультация по мониторингу Telegram-комментариев: хотим не пропускать запросы под постами конкурентов и партнеров.',
    reason: 'Совпала фраза “нужна консультация”; источник отмечен как комментарии, поэтому нужна проверка доступа.',
    nextStep: 'Проверить доступ к комментариям и отправить через Vexa-бота, если контекст релевантен.',
  },
  {
    id: 'mtch-candidate',
    searchId: 'srch-hiring',
    search: 'Вакансии и кандидаты',
    sourceId: 'src-candidates',
    source: '@candidate_pool_demo',
    sourceType: 'Группа',
    author: '@candidate_demo',
    keyword: 'готов взять проект',
    score: 81,
    priority: 'Средний',
    intent: 'кандидат',
    status: 'new',
    sent: false,
    hidden: false,
    time: '24 минуты назад',
    text: 'Готов взять проект по React/Next.js на 2–3 недели. Есть опыт с Telegram Mini Apps и кабинетами для сервисов.',
    reason: 'Сообщение похоже на кандидата: совпала фраза “готов взять проект”.',
    nextStep: 'Отправить в личку через Vexa-бота или отметить как подходящее для обучения фильтра.',
  },
];

const initialWorkspace = {
  searches: starterSearches,
  sources: starterSources,
  matches: starterMatches,
  notificationRules: [
    { id: 'rule-high', title: 'Высокий скоринг', target: 'Личное сообщение в нашем боте сразу', threshold: 80, enabled: true },
    { id: 'rule-new', title: 'Все новые совпадения', target: 'Лента приложения + личный бот', threshold: 65, enabled: true },
    { id: 'rule-source', title: 'Источник требует доступа', target: 'Кабинет + системное уведомление', threshold: 0, enabled: true },
    { id: 'rule-digest', title: 'Ежедневная сводка', target: 'Личное сообщение в Vexa-боте в 09:30', threshold: 0, enabled: false },
  ],
  settings: {
    botConnected: false,
    telegramLinked: false,
    telegramUser: '',
    botUsername: '@vexa_monitor_bot',
    workspaceName: 'Пилотный мониторинг',
    notifyInApp: true,
    notifyTelegram: true,
    weeklyReport: true,
    sourceWatchMode: 'new-only',
    quiet: true,
    quietFrom: '00:00',
    quietTo: '07:00',
    digestTime: '09:30',
    timezone: 'Europe/Moscow',
    deliveryMode: 'smart',
    retention: '30 дней',
    owner: 'Пилот Vexa',
    accountRole: 'Владелец',
  },
  activity: [
    { id: 'act-1', title: 'Запущен пилот Vexa', body: '2 активных поиска ждут новые публикации', icon: 'play', time: 'сейчас' },
  ],
};

const blankSearchDraft = {
  id: '',
  title: '',
  goal: 'Заявки и лиды',
  status: 'active',
  priority: 'Средний',
  delivery: 'telegram',
  dailyLimit: 50,
  minScore: 70,
  mode: 'phrase',
  botChannel: 'личный чат Vexa-бота',
  keywordsText: '',
  minusText: '',
  sourceIds: [],
};

const blankSourceDraft = {
  id: '',
  title: '',
  ref: '',
  type: 'Канал',
  group: 'Основные',
  status: 'limited',
  trust: 70,
  language: 'RU',
  cadence: 'постоянно',
  note: '',
};

const blockedInputPattern = /(<\/?[a-z][\s\S]*?>|```|;\s*(select|insert|update|delete|drop|alter|truncate|create|grant|revoke)\b|\b(select|insert|update|delete|drop|alter|truncate|create|union|exec|execute|script|iframe|onerror|onload|javascript:)\b|--|\/\*|\*\/|\${|=>|function\s*\(|import\s+|require\s*\()/i;

function safeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function parseLines(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanText(value, max = 120) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function validateSafeText(label, value) {
  if (blockedInputPattern.test(String(value || ''))) {
    return `${label}: оставьте обычный текст без кода, HTML или SQL-команд.`;
  }
  return '';
}

function sanitizeLines(value, maxLines = 32, maxLen = 96) {
  const unique = new Set();
  return parseLines(value)
    .slice(0, maxLines)
    .map((item) => cleanText(item, maxLen))
    .filter((item) => {
      const key = item.toLowerCase();
      if (!key || unique.has(key)) return false;
      unique.add(key);
      return true;
    });
}

function normalizeRef(value) {
  return cleanText(value, 180);
}

function telegramTarget(ref) {
  const value = String(ref || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://t.me/${value.replace(/^@/, '')}`;
}

function openTelegram(ref) {
  const target = telegramTarget(ref);
  if (!target || typeof window === 'undefined') return;
  window.open(target, '_blank', 'noopener,noreferrer');
  notify('Открыт Telegram', ref);
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

function downloadJson(filename, value) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
  notify('Экспорт Vexa подготовлен');
}

function requestSignOut() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('vexa-auth-signout'));
  notify('Выход из Vexa');
}

function sourceNames(workspace, ids = []) {
  const selected = workspace.sources.filter((source) => ids.includes(source.id));
  if (!selected.length) return 'источники не выбраны';
  if (selected.length <= 2) return selected.map((source) => source.title).join(', ');
  return `${selected.slice(0, 2).map((source) => source.title).join(', ')} +${selected.length - 2}`;
}

function sourceUsage(workspace, sourceId) {
  return workspace.searches.filter((search) => Array.isArray(search.sourceIds) && search.sourceIds.includes(sourceId)).length;
}

function isBotAuthorized(workspace) {
  return Boolean(workspace?.settings?.telegramLinked || workspace?.settings?.botConnected);
}

function botDisplayName(workspace) {
  return workspace?.settings?.botUsername || '@vexa_monitor_bot';
}

function statusLabel(status) {
  if (status === 'active') return 'активен';
  if (status === 'online') return 'онлайн';
  if (status === 'qualified') return 'подходит';
  if (status === 'paused') return 'пауза';
  if (status === 'limited') return 'нужен доступ';
  if (status === 'pending') return 'проверка';
  if (status === 'rejected') return 'отклонено';
  if (status === 'blocked') return 'нет доступа';
  return 'новое';
}

function statusBadge(status) {
  if (status === 'active' || status === 'online' || status === 'qualified') return <Badge kind="success">{statusLabel(status)}</Badge>;
  if (status === 'paused' || status === 'limited' || status === 'pending') return <Badge kind="warn">{statusLabel(status)}</Badge>;
  if (status === 'rejected' || status === 'blocked') return <Badge kind="danger">{statusLabel(status)}</Badge>;
  return <Badge kind="info">{statusLabel(status)}</Badge>;
}

function priorityBadge(priority) {
  if (priority === 'Высокий') return <Badge kind="danger">высокий</Badge>;
  if (priority === 'Средний') return <Badge kind="warn">средний</Badge>;
  return <Badge kind="info">низкий</Badge>;
}

function sourceIcon(type) {
  if (type === 'Канал') return 'page';
  if (type === 'Комментарии') return 'chat';
  if (type === 'Invite-ссылка') return 'link';
  return 'users';
}

function estimateQuality({ keywords = [], minus = [], sourceIds = [], minScore = 70, mode = 'phrase' }) {
  const keywordScore = Math.min(36, keywords.length * 6);
  const sourceScore = Math.min(26, sourceIds.length * 9);
  const minusScore = Math.min(18, minus.length * 4);
  const modeScore = mode === 'phrase' ? 8 : mode === 'strict' ? 6 : 4;
  const thresholdScore = minScore >= 70 && minScore <= 84 ? 8 : 4;
  return Math.max(24, Math.min(98, 8 + keywordScore + sourceScore + minusScore + modeScore + thresholdScore));
}

function scoreMessageAgainstSearch(message, search, source) {
  const text = String(message || '').toLowerCase();
  const keywords = search?.keywords || [];
  const minus = search?.minus || [];
  const matched = keywords.filter((phrase) => text.includes(String(phrase).toLowerCase()));
  const blocked = minus.filter((phrase) => text.includes(String(phrase).toLowerCase()));
  const base = matched.length ? 52 + Math.min(28, matched.length * 7) : 18;
  const priorityBonus = search?.priority === 'Высокий' ? 6 : search?.priority === 'Средний' ? 3 : 0;
  const sourceBonus = source?.status === 'online' ? 7 : source?.status === 'limited' ? 2 : 0;
  const penalty = blocked.length * 24;
  const score = Math.max(0, Math.min(99, base + priorityBonus + sourceBonus - penalty));
  return { score, matched, blocked, passed: score >= (Number(search?.minScore) || 70) && !blocked.length };
}

function activityItem(title, body = '', icon = 'check') {
  return { id: safeId('activity'), title, body, icon, time: 'сейчас' };
}

function mergeWorkspace(value) {
  if (!value || typeof value !== 'object') return initialWorkspace;
  return {
    ...initialWorkspace,
    ...value,
    searches: Array.isArray(value.searches) ? value.searches : initialWorkspace.searches,
    sources: Array.isArray(value.sources) ? value.sources : initialWorkspace.sources,
    matches: Array.isArray(value.matches) ? value.matches : initialWorkspace.matches,
    notificationRules: Array.isArray(value.notificationRules) ? value.notificationRules : initialWorkspace.notificationRules,
    settings: { ...initialWorkspace.settings, ...(value.settings || {}) },
    activity: Array.isArray(value.activity) ? value.activity.slice(0, 40) : initialWorkspace.activity,
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

function useVexaProfile() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(VEXA_PROFILE_STORAGE_KEY);
        setProfile(raw ? JSON.parse(raw) : null);
      } catch {
        setProfile(null);
      }
    };
    read();
    window.addEventListener('vexa-profile-updated', read);
    return () => window.removeEventListener('vexa-profile-updated', read);
  }, []);
  return profile;
}

function workspaceChecks(workspace) {
  const activeSearches = workspace.searches.filter((item) => item.status === 'active');
  const onlineSources = workspace.sources.filter((item) => item.status === 'online');
  const attachedSourceIds = new Set(workspace.searches.flatMap((item) => item.sourceIds || []));
  const checks = [
    { ok: activeSearches.length > 0, title: 'Есть активный поиск', body: activeSearches.length ? `${activeSearches.length} сценария запущено` : 'Запустите хотя бы один поиск' },
    { ok: onlineSources.length > 0, title: 'Есть доступные источники', body: onlineSources.length ? `${onlineSources.length} источника онлайн` : 'Проверьте доступ к каналам или группам' },
    { ok: attachedSourceIds.size > 0, title: 'Источники привязаны', body: attachedSourceIds.size ? `${attachedSourceIds.size} привязок к поискам` : 'Выберите источники в настройке поиска' },
    { ok: isBotAuthorized(workspace), title: 'Пользователь авторизован в Vexa-боте', body: isBotAuthorized(workspace) ? `${botDisplayName(workspace)} · личные уведомления активны` : 'Откройте нашего бота и подтвердите получение уведомлений' },
  ];
  const score = Math.round((checks.filter((item) => item.ok).length / checks.length) * 100);
  return { checks, score };
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
      const nextRaw = typeof updater === 'function' ? updater(base) : updater;
      const next = mergeWorkspace(nextRaw);
      if (activity) {
        next.activity = [activityItem(activity.title, activity.body, activity.icon), ...(next.activity || [])].slice(0, 40);
      }
      writeWorkspace(next);
      return next;
    });
  };

  const actions = useMemo(() => ({
    resetDemo() {
      commit(initialWorkspace, { title: 'Демо Vexa восстановлено', body: 'Поиски, источники, совпадения и правила вернулись к стартовому состоянию', icon: 'refresh' });
      notify('Демо Vexa восстановлено');
    },
    importWorkspace(value) {
      const next = mergeWorkspace(value);
      commit(next, { title: 'Рабочее пространство импортировано', body: 'Данные Vexa обновлены из JSON', icon: 'arrow-up' });
    },
    upsertSearch(search) {
      commit((current) => ({
        ...current,
        searches: current.searches.some((item) => item.id === search.id)
          ? current.searches.map((item) => (item.id === search.id ? search : item))
          : [search, ...current.searches],
      }), { title: 'Поиск сохранен', body: search.title, icon: 'search' });
    },
    toggleSearch(id) {
      commit((current) => ({
        ...current,
        searches: current.searches.map((item) => (item.id === id ? {
          ...item,
          status: item.status === 'active' ? 'paused' : 'active',
          lastRun: item.status === 'active' ? 'на паузе' : 'ждет новые публикации',
        } : item)),
      }), { title: 'Статус поиска изменен', icon: 'play' });
    },
    duplicateSearch(search) {
      const copy = {
        ...search,
        id: safeId('srch'),
        title: `${search.title} — копия`,
        status: 'paused',
        matchesToday: 0,
        lastRun: 'на паузе',
      };
      commit((current) => ({ ...current, searches: [copy, ...current.searches] }), { title: 'Копия поиска создана', body: search.title, icon: 'copy' });
      return copy;
    },
    deleteSearch(id) {
      commit((current) => ({ ...current, searches: current.searches.filter((item) => item.id !== id) }), { title: 'Поиск удален', icon: 'trash' });
    },
    addPhraseToSearch(searchId, type, phrase) {
      const safe = cleanText(phrase, 72);
      if (!safe) return;
      commit((current) => ({
        ...current,
        searches: current.searches.map((search) => {
          if (search.id !== searchId) return search;
          const field = type === 'minus' ? 'minus' : 'keywords';
          const nextItems = Array.from(new Set([...(search[field] || []), safe]));
          return { ...search, [field]: nextItems, quality: estimateQuality({ ...search, [field]: nextItems }) };
        }),
      }), { title: type === 'minus' ? 'Минус-слово добавлено' : 'Ключевая фраза добавлена', body: safe, icon: type === 'minus' ? 'minus' : 'plus' });
    },
    createTestMatch(search, message = '') {
      let created = null;
      commit((current) => {
        const source = current.sources.find((item) => search.sourceIds?.includes(item.id)) || current.sources[0];
        const scoring = scoreMessageAgainstSearch(message || `Новое Telegram-сообщение после подключения источника. Найдена фраза “${search.keywords?.[0] || 'ключевая фраза'}”.`, search, source);
        const keyword = scoring.matched[0] || search.keywords?.[0] || 'ключевая фраза';
        created = {
          id: safeId('mtch'),
          searchId: search.id,
          search: search.title,
          sourceId: source?.id || '',
          source: source?.ref || '@demo_source',
          sourceType: source?.type || 'Группа',
          author: '@new_message',
          keyword,
          score: scoring.score || estimateQuality(search),
          priority: search.priority || 'Средний',
          intent: search.goal || 'сигнал',
          status: scoring.passed ? 'new' : 'rejected',
          sent: false,
          hidden: false,
          time: 'сейчас',
          text: message || `Новое Telegram-сообщение после подключения источника. Найдена фраза “${keyword}”. Старую историю Vexa не загружает.`,
          reason: scoring.blocked.length
            ? `Найдены минус-слова: ${scoring.blocked.join(', ')}. Сообщение оставлено в ленте как пример шума.`
            : `Совпала фраза “${keyword}”; источник был подключен до появления сообщения; минус-слова не сработали.`,
          nextStep: scoring.passed ? 'Проверить контекст и отправить пользователю в личку через Vexa-бота.' : 'Добавить точные минус-слова или скорректировать ключевые фразы.',
        };
        return {
          ...current,
          matches: [created, ...current.matches],
          searches: current.searches.map((item) => (item.id === search.id ? { ...item, matchesToday: (Number(item.matchesToday) || 0) + 1 } : item)),
        };
      }, { title: 'Тестовое совпадение создано', body: search.title, icon: 'inbox' });
      return created;
    },
    updateMatch(id, patch, activity) {
      commit((current) => ({
        ...current,
        matches: current.matches.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }), activity);
    },
    addSource(source) {
      commit((current) => ({ ...current, sources: [source, ...current.sources] }), { title: 'Источник добавлен', body: source.ref, icon: 'filter' });
    },
    addManySources(items) {
      if (!items.length) return;
      commit((current) => ({ ...current, sources: [...items, ...current.sources] }), { title: 'Источники добавлены', body: `${items.length} шт.`, icon: 'filter' });
    },
    updateSource(id, patch) {
      commit((current) => ({
        ...current,
        sources: current.sources.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }), { title: 'Источник сохранен', body: patch.ref || patch.title, icon: 'filter' });
    },
    deleteSource(id) {
      commit((current) => ({
        ...current,
        sources: current.sources.filter((item) => item.id !== id),
        searches: current.searches.map((search) => ({
          ...search,
          sourceIds: (search.sourceIds || []).filter((sourceId) => sourceId !== id),
        })),
      }), { title: 'Источник удален', icon: 'trash' });
    },
    checkSources() {
      commit((current) => ({
        ...current,
        sources: current.sources.map((source) => ({
          ...source,
          lastSeen: 'только что',
          status: source.status === 'blocked' ? 'limited' : source.status === 'pending' ? 'limited' : source.status,
          access: source.status === 'online' ? 'доступ есть' : 'нужна проверка доступа',
          trust: Math.max(48, Math.min(98, Number(source.trust) || 70)),
        })),
      }), { title: 'Источники проверены', body: 'Статусы и время проверки обновлены', icon: 'refresh' });
    },
    updateSettings(patch) {
      commit((current) => ({ ...current, settings: { ...current.settings, ...patch } }), { title: 'Настройки Vexa сохранены', icon: 'gear' });
    },
    updateNotificationRule(id, patch) {
      commit((current) => ({
        ...current,
        notificationRules: current.notificationRules.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }), { title: 'Правило уведомлений обновлено', icon: 'bell' });
    },
  }), []);

  const stats = useMemo(() => {
    const visibleMatches = workspace.matches.filter((item) => !item.hidden);
    const activeSearches = workspace.searches.filter((item) => item.status === 'active').length;
    const pausedSearches = workspace.searches.filter((item) => item.status !== 'active').length;
    const onlineSources = workspace.sources.filter((item) => item.status === 'online').length;
    const sourceWarnings = workspace.sources.filter((item) => item.status !== 'online').length;
    const newMatches = visibleMatches.filter((item) => item.status === 'new' && !item.sent).length;
    const sent = visibleMatches.filter((item) => item.sent).length;
    const rejected = visibleMatches.filter((item) => item.status === 'rejected').length;
    const highScore = visibleMatches.filter((item) => Number(item.score) >= 80 && !item.sent && item.status !== 'rejected').length;
    const totalKeywords = workspace.searches.reduce((sum, item) => sum + (item.keywords?.length || 0), 0);
    const totalMinus = workspace.searches.reduce((sum, item) => sum + (item.minus?.length || 0), 0);
    const attachedSources = workspace.searches.reduce((sum, item) => sum + (item.sourceIds?.length || 0), 0);
    const health = workspaceChecks(workspace);
    return { visibleMatches, activeSearches, pausedSearches, onlineSources, sourceWarnings, newMatches, sent, rejected, highScore, totalKeywords, totalMinus, attachedSources, healthScore: health.score, checks: health.checks };
  }, [workspace]);

  return { workspace, actions, stats };
}

function PageShell({ title, subtitle, actions, children }) {
  void subtitle;
  return (
    <div className="vexa3-page" data-screen-label={`Vexa ${title}`}>
      {actions ? <div className="vexa3-page-actionbar"><div aria-hidden="true" /><div className="vexa3-actions">{actions}</div></div> : null}
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="vexa3-section-head">
      <div>
        <div className="section-title">{title}</div>
        {subtitle ? <div className="section-sub">{subtitle}</div> : null}
      </div>
      {right ? <div className="vexa3-actions">{right}</div> : null}
    </div>
  );
}

function ImportantNote({ compact = false }) {
  return (
    <div className={`vexa3-note ${compact ? 'compact' : ''}`}>
      <Icon name="shield" size={18} />
      <div>
        <strong>Vexa не загружает старую историю Telegram.</strong>
        <span>Мониторинг начинается только с новых публикаций после подключения источника. Это ограничение заложено в интерфейс, тестирование и подсказки.</span>
      </div>
    </div>
  );
}


function ProductHero({ profile, workspace, stats, onNewSearch, onSources, onExport }) {
  void profile;
  const summary = [
    { label: 'Активные поиски', value: workspace.searches.length, meta: `${stats.activeSearches} запущено` },
    { label: 'Ключевые фразы', value: stats.totalKeywords, meta: `${stats.totalMinus} минус-слов` },
    { label: 'Подключенные источники', value: workspace.sources.length, meta: `${stats.onlineSources} онлайн` },
    { label: 'Доставка ботом', value: isBotAuthorized(workspace) ? 'OK' : 'Ждет', meta: isBotAuthorized(workspace) ? 'личные уведомления активны' : 'нужна авторизация в боте' },
  ];
  const priorities = [
    stats.sourceWarnings ? `${stats.sourceWarnings} источника требуют проверки доступа.` : 'Все подключенные источники в рабочем статусе.',
    stats.newMatches ? `${stats.newMatches} новых совпадения ждут разбора.` : 'Новых совпадений пока нет — фильтры готовы к новым публикациям.',
    isBotAuthorized(workspace) ? 'Пользователь авторизован в Vexa-боте и получит уведомления в личку.' : 'Следующий шаг — открыть Vexa-бота и подтвердить получение уведомлений.',
  ];
  return (
    <Card className="vexa3-hero">
      <div className="vexa3-hero-main">
        <div className="vexa3-hero-brand"><img src="/vexa-logo.png" alt="" /><span>vexa</span></div>
        <div className="vexa3-badges"><Badge kind="info">рабочий контур</Badge><Badge kind="warn">только новые сообщения</Badge><Badge kind="success">доставка в Vexa-бота</Badge></div>
        <h2>Профессиональный центр мониторинга Telegram</h2>
        <p>Настраивайте поисковые сценарии по ключевым фразам, подключайте каналы, группы и комментарии, фильтруйте шум через минус-слова и получайте только новые релевантные совпадения в приложение и в личные сообщения через нашего Telegram-бота.</p>
        <div className="vexa3-hero-actions">
          <Btn kind="primary" icon="plus" onClick={onNewSearch}>Создать поиск</Btn>
          <Btn kind="secondary" icon="filter" onClick={onSources}>Настроить источники</Btn>
          <Btn kind="secondary" icon="arrow-down" onClick={onExport}>Экспорт JSON</Btn>
        </div>
      </div>
      <div className="vexa3-hero-side">
        <div className="vexa3-hero-summary-grid">
          {summary.map((item) => (
            <div className="vexa3-hero-summary" key={item.label}>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
              <span>{item.meta}</span>
            </div>
          ))}
        </div>
        <div className="vexa3-hero-brief">
          <SectionTitle title="Сегодня в фокусе" subtitle="Контроль рабочего контура мониторинга." right={<Badge kind={stats.healthScore >= 75 ? 'success' : 'warn'}>{stats.healthScore}%</Badge>} />
          <div className="vexa3-hero-brief-list">
            {priorities.map((item) => (
              <div key={item}><Icon name="check" size={14} /><span>{item}</span></div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MetricGrid({ workspace, stats }) {
  return (
    <div className="grid-4 vexa3-metrics">
      <Metric label="Активных поисков" value={stats.activeSearches} delta={`${stats.pausedSearches} на паузе`} deltaKind="up" />
      <Metric label="Источников онлайн" value={stats.onlineSources} delta={`${stats.sourceWarnings} требуют доступа`} deltaKind={stats.sourceWarnings ? 'down' : 'up'} />
      <Metric label="Новых совпадений" value={stats.newMatches} delta={`${stats.highScore} с высоким скорингом`} deltaKind={stats.newMatches ? 'up' : undefined} />
      <Metric label="Готовность контура" value={`${stats.healthScore}%`} delta={isBotAuthorized(workspace) ? 'бот авторизован' : 'бот ждет авторизацию'} deltaKind={stats.healthScore >= 75 ? 'up' : 'down'} />
    </div>
  );
}

function HealthPanel({ stats }) {
  return (
    <Card className="vexa3-card vexa3-health">
      <SectionTitle title="Готовность пилота" subtitle="Проверка минимального рабочего контура: поиск, источник, доставка, ограничения." right={<Badge kind={stats.healthScore >= 75 ? 'success' : 'warn'}>{stats.healthScore}%</Badge>} />
      <div className="vexa3-health-grid">
        {stats.checks.map((check) => (
          <div className={check.ok ? 'ok' : ''} key={check.title}>
            <Icon name={check.ok ? 'check' : 'info'} size={15} />
            <span><strong>{check.title}</strong><small>{check.body}</small></span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityRail({ activity }) {
  return (
    <Card flush className="vexa3-card vexa3-activity">
      <SectionTitle title="Журнал" subtitle="Последние действия в Vexa." />
      <div className="divider" />
      {(activity || []).slice(0, 8).map((item) => (
        <div className="vexa3-activity-row" key={item.id}>
          <span><Icon name={item.icon || 'check'} size={14} /></span>
          <div><strong>{item.title}</strong><small>{item.body || item.time}</small></div>
        </div>
      ))}
    </Card>
  );
}


function MonitoringOpsPanel({ workspace, stats, selected }) {
  const blockers = stats.checks.filter((item) => !item.ok).slice(0, 3);
  const focusSearch = selected || workspace.searches[0];
  const focusSource = workspace.sources.find((item) => focusSearch?.sourceIds?.includes(item.id)) || workspace.sources[0];
  const tasks = blockers.length
    ? blockers.map((item) => ({ title: item.title, body: item.body }))
    : [
      { title: 'Контур готов к масштабированию', body: 'Поиски, источники и доставка настроены. Можно расширять набор сценариев и источников.' },
      { title: 'Контролируйте качество фильтра', body: 'Используйте тест сообщения и аналитику, чтобы оперативно обновлять минус-слова и пороги скоринга.' },
      { title: 'Поддерживайте доставку в бота', body: 'Убедитесь, что личный чат Vexa-бота остается основным каналом уведомлений для пользователей.' },
    ];

  return (
    <Card className="vexa3-card">
      <SectionTitle title="Контроль запуска" subtitle="Ключевые действия и состояние текущего рабочего сценария." />
      <div className="vexa3-roadmap">
        {tasks.map((task, index) => (
          <div key={task.title}>
            <span>{index + 1}</span>
            <small><strong>{task.title}</strong>{task.body}</small>
          </div>
        ))}
      </div>
      <div className="divider" />
      <div className="vexa3-simple-row">
        <span className="vexa3-row-icon"><Icon name="search" /></span>
        <span><strong>{focusSearch?.title || 'Выберите сценарий'}</strong><small>{focusSearch ? `${focusSearch.keywords?.length || 0} фраз · порог ${focusSearch.minScore}% · ${focusSearch.delivery === 'feed' ? 'только лента' : 'доставка в бота'}` : 'Создайте первый поиск, чтобы начать мониторинг.'}</small></span>
      </div>
      <div className="vexa3-simple-row">
        <span className="vexa3-row-icon"><Icon name={sourceIcon(focusSource?.type || 'Канал')} /></span>
        <span><strong>{focusSource?.title || 'Источник не выбран'}</strong><small>{focusSource ? `${focusSource.ref} · ${statusLabel(focusSource.status)} · доверие ${focusSource.trust || 0}%` : 'Подключите источник, чтобы получать новые публикации.'}</small></span>
      </div>
      <div className="vexa3-simple-row">
        <span className="vexa3-row-icon"><Icon name="send" /></span>
        <span><strong>{isBotAuthorized(workspace) ? 'Личные уведомления готовы' : 'Требуется авторизация в Vexa-боте'}</strong><small>{isBotAuthorized(workspace) ? 'Новые релевантные совпадения будут отправляться в личный чат пользователя.' : 'Попросите пользователя открыть нашего бота и подтвердить получение уведомлений.'}</small></span>
      </div>
    </Card>
  );
}

function TemplateCard({ template, onApply }) {
  return (
    <button type="button" className="vexa3-template" onClick={() => onApply(template)}>
      <span><Icon name={template.icon} size={18} /></span>
      <strong>{template.title}</strong>
      <small>{template.description}</small>
      <em>{template.keywords.slice(0, 3).join(' · ')}</em>
    </button>
  );
}

function TemplatesPanel({ onApply }) {
  return (
    <Card className="vexa3-card">
      <SectionTitle title="Готовые сценарии" subtitle="Шаблоны не заменяют настройку, но дают хорошую стартовую структуру фраз и минус-слов." />
      <div className="vexa3-templates">
        {SEARCH_TEMPLATES.map((template) => <TemplateCard key={template.id} template={template} onApply={onApply} />)}
      </div>
    </Card>
  );
}

function SourcePicker({ workspace, value = [], onChange }) {
  const selected = workspace.sources.filter((source) => value.includes(source.id));
  const toggle = (sourceId) => {
    const next = value.includes(sourceId) ? value.filter((item) => item !== sourceId) : [...value, sourceId];
    onChange(next);
  };

  return (
    <details className="vexa3-picker">
      <summary>
        <span>{selected.length ? `${selected.length} источника выбрано` : 'Выберите Telegram-источники'}</span>
        <Icon name="chevron-down" size={14} />
      </summary>
      <div className="vexa3-picker-menu">
        {workspace.sources.map((source) => (
          <button type="button" key={source.id} onClick={() => toggle(source.id)}>
            <span className={`check ${value.includes(source.id) ? 'on' : ''}`} aria-hidden="true" />
            <span>
              <strong>{source.title}</strong>
              <small>{source.type} · {source.ref}</small>
            </span>
            {statusBadge(source.status)}
          </button>
        ))}
        {!workspace.sources.length ? <div className="vexa3-empty-line">Сначала добавьте канал, группу или комментарии.</div> : null}
      </div>
    </details>
  );
}


function SearchPagination({ page, pages, total, onChange }) {
  if (pages <= 1) {
    return <div className="vexa3-pagination compact"><span>{total} сценария</span></div>;
  }
  const items = Array.from({ length: pages }, (_, index) => index + 1);
  return (
    <div className="vexa3-pagination">
      <span>{total} сценария · страница {page} из {pages}</span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Предыдущая страница"><Icon name="chevron-left" size={13} /></button>
        {items.map((item) => (
          <button type="button" key={item} className={item === page ? 'active' : ''} onClick={() => onChange(item)}>{item}</button>
        ))}
        <button type="button" onClick={() => onChange(Math.min(pages, page + 1))} disabled={page >= pages} aria-label="Следующая страница"><Icon name="chevron-right" size={13} /></button>
      </div>
    </div>
  );
}

function PhraseEditor({ label, value, onChange, placeholder, kind = 'keyword' }) {
  const lines = sanitizeLines(value, 40, 96);
  return (
    <label className={`field vexa3-token-field ${kind}`}>
      <span>{label}</span>
      <div className="vexa3-token-editor">
        <div className="vexa3-token-cloud" aria-hidden={lines.length ? 'false' : 'true'}>
          {lines.length ? lines.map((line) => <i key={line}>{line}</i>) : <em>Добавляйте каждую фразу с новой строки</em>}
        </div>
        <textarea
          className="input vexa3-token-textarea"
          rows={kind === 'minus' ? 4 : 5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function toSearchDraft(search) {
  if (!search) return { ...blankSearchDraft };
  return {
    ...blankSearchDraft,
    ...search,
    keywordsText: (search.keywords || []).join('\n'),
    minusText: (search.minus || []).join('\n'),
    sourceIds: Array.isArray(search.sourceIds) ? search.sourceIds : [],
  };
}

function SearchQuality({ draft }) {
  const keywords = sanitizeLines(draft.keywordsText, 32, 96);
  const minus = sanitizeLines(draft.minusText, 32, 96);
  const quality = estimateQuality({ keywords, minus, sourceIds: draft.sourceIds || [], minScore: Number(draft.minScore) || 70, mode: draft.mode });
  const checks = [
    [keywords.length >= 3, '3+ ключевые фразы'],
    [(draft.sourceIds || []).length >= 1, 'есть источник'],
    [minus.length >= 2, 'есть минус-слова'],
    [Number(draft.minScore) >= 60, 'задан порог скоринга'],
    [draft.delivery !== 'feed', 'есть доставка через Vexa-бота или сводку'],
  ];

  return (
    <div className="vexa3-quality">
      <div className="vexa3-quality-head"><span>Качество фильтра</span><strong>{quality}%</strong></div>
      <div className="progress"><span style={{ width: `${quality}%` }} /></div>
      <div className="vexa3-checklist">
        {checks.map(([ok, label]) => (
          <div key={label} className={ok ? 'ok' : ''}><Icon name={ok ? 'check' : 'minus'} size={13} />{label}</div>
        ))}
      </div>
    </div>
  );
}


function SearchRow({ search, workspace, active, onOpen, onToggle, onDuplicate, onDelete, onTest }) {
  const sourcesLabel = sourceNames(workspace, search.sourceIds || []);
  const minusCount = search.minus?.length || 0;
  return (
    <div className={`vexa3-search-row ${active ? 'active' : ''}`}>
      <button type="button" className="vexa3-row-mainbutton" onClick={() => onOpen(search)}>
        <span className="vexa3-row-icon"><Icon name="search" size={15} /></span>
        <span className="vexa3-row-content">
          <span className="vexa3-row-title"><strong>{search.title}</strong>{statusBadge(search.status)}</span>
          <span className="vexa3-keywords">{(search.keywords || []).slice(0, 4).map((item) => <i key={item}>{item}</i>)}{(search.keywords || []).length > 4 ? <i>+{search.keywords.length - 4}</i> : null}</span>
          <small>{sourcesLabel}</small>
        </span>
      </button>
      <div className="vexa3-row-summary">
        <span><strong>{search.dailyLimit || 50}</strong><small>лимит в день</small></span>
        <span><strong>{(search.sourceIds || []).length}</strong><small>источника</small></span>
        <span><strong>{minusCount}</strong><small>минус-слов</small></span>
      </div>
      <div className="vexa3-row-actions">
        <Btn size="sm" kind="secondary" icon={search.status === 'active' ? 'pause' : 'play'} onClick={() => onToggle(search.id)}>{search.status === 'active' ? 'Пауза' : 'Старт'}</Btn>
        <Btn size="sm" kind="secondary" icon="inbox" onClick={() => onTest(search)}>Тест</Btn>
        <Btn size="sm" kind="secondary" icon="copy" onClick={() => onDuplicate(search)}>Копия</Btn>
        <Btn size="sm" kind="danger" icon="trash" onClick={() => onDelete(search.id)}>Удалить</Btn>
      </div>
    </div>
  );
}

function SearchAnalyzer({ workspace, selected, onCreateMatch }) {
  const [text, setText] = useState('Нужен подрядчик на мониторинг Telegram-комментариев и заявок. Кто может помочь на этой неделе?');
  const source = workspace.sources.find((item) => selected?.sourceIds?.includes(item.id));
  const result = selected ? scoreMessageAgainstSearch(text, selected, source) : null;
  return (
    <Card className="vexa3-card vexa3-analyzer">
      <SectionTitle title="Тест сообщения" subtitle="Проверьте, как фильтр поведет себя на новом Telegram-сообщении до запуска." right={result ? <Badge kind={result.passed ? 'success' : 'warn'}>{result.score}%</Badge> : null} />
      <label className="field">
        <span>Текст нового сообщения</span>
        <textarea className="input" rows={5} value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      {selected ? (
        <div className="vexa3-analyzer-result">
          <div><span>Совпали</span><strong>{result.matched.length ? result.matched.join(', ') : 'нет точных совпадений'}</strong></div>
          <div><span>Минус-слова</span><strong>{result.blocked.length ? result.blocked.join(', ') : 'не найдены'}</strong></div>
          <div><span>Решение</span><strong>{result.passed ? 'попадет в ленту' : 'не пройдет фильтр'}</strong></div>
        </div>
      ) : <div className="vexa3-empty-line">Выберите поиск для теста.</div>}
      <div className="vexa3-form-actions">
        <Btn kind="secondary" icon="copy" onClick={() => copyText(text, 'Тестовое сообщение скопировано')}>Скопировать</Btn>
        <Btn kind="primary" icon="inbox" disabled={!selected} onClick={() => onCreateMatch(selected, text)}>Создать совпадение</Btn>
      </div>
    </Card>
  );
}

export function VexaSearchesPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const profile = useVexaProfile();
  const [selectedId, setSelectedId] = useState(workspace.searches[0]?.id || '');
  const selected = workspace.searches.find((item) => item.id === selectedId) || workspace.searches[0];
  const [draft, setDraft] = useState(() => toSearchDraft(selected));
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchPage, setSearchPage] = useState(1);

  useEffect(() => {
    if (!selected && workspace.searches[0]) {
      setSelectedId(workspace.searches[0].id);
      setDraft(toSearchDraft(workspace.searches[0]));
    }
  }, [selected, workspace.searches]);

  const filteredSearches = workspace.searches.filter((search) => {
    if (statusFilter !== 'all' && search.status !== statusFilter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [search.title, search.goal, ...(search.keywords || []), ...(search.minus || [])].some((value) => String(value || '').toLowerCase().includes(needle));
  });

  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(filteredSearches.length / pageSize));
  const safePage = Math.min(searchPage, pageCount);
  const pagedSearches = filteredSearches.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setSearchPage(1);
  }, [query, statusFilter, workspace.searches.length]);

  const openSearch = (search) => {
    setSelectedId(search.id);
    setDraft(toSearchDraft(search));
    setNotice('');
  };

  const createBlank = () => {
    setSelectedId('');
    setDraft({
      ...blankSearchDraft,
      id: safeId('srch'),
      title: 'Новый мониторинг',
      sourceIds: workspace.sources.filter((source) => source.status === 'online').slice(0, 1).map((source) => source.id),
    });
    setNotice('Заполните фразы, минус-слова и источники. Vexa начнет видеть только новые сообщения после подключения источника.');
  };

  const applyTemplate = (template) => {
    const next = {
      ...blankSearchDraft,
      id: safeId('srch'),
      title: template.title,
      goal: template.goal,
      priority: template.priority,
      mode: template.mode,
      minScore: template.minScore,
      keywordsText: template.keywords.join('\n'),
      minusText: template.minus.join('\n'),
      sourceIds: workspace.sources.filter((source) => source.status === 'online').slice(0, 2).map((source) => source.id),
    };
    setSelectedId('');
    setDraft(next);
    setNotice(`Шаблон “${template.title}” применен. Проверьте источники и сохраните поиск.`);
  };

  const saveSearch = (status = draft.status || 'active') => {
    const unsafe = [
      validateSafeText('Название поиска', draft.title),
      validateSafeText('Ключевые фразы', draft.keywordsText),
      validateSafeText('Минус-слова', draft.minusText),
    ].find(Boolean);
    if (unsafe) return setNotice(unsafe);

    const title = cleanText(draft.title, 88);
    const keywords = sanitizeLines(draft.keywordsText, 32, 96);
    const minus = sanitizeLines(draft.minusText, 32, 96);
    const sourceIds = Array.isArray(draft.sourceIds) ? draft.sourceIds : [];
    const minScore = 70;

    if (!title) return setNotice('Назовите поиск: например “Заявки на услуги”, “Вакансии”, “Упоминания бренда”.');
    if (!keywords.length) return setNotice('Добавьте хотя бы одну ключевую фразу. Рабочий минимум для пилота — 3–7 фраз.');
    if (!sourceIds.length) return setNotice('Выберите хотя бы один Telegram-источник. Старые сообщения не подтягиваются.');

    const next = {
      id: draft.id || selected?.id || safeId('srch'),
      title,
      goal: 'Мониторинг Telegram',
      status,
      priority: 'Средний',
      delivery: 'telegram',
      dailyLimit: Math.max(10, Math.min(500, Number(draft.dailyLimit) || 50)),
      minScore,
      mode: 'phrase',
      botChannel: 'личный чат Vexa-бота',
      keywords,
      minus,
      sourceIds,
      matchesToday: Number(selected?.matchesToday) || 0,
      quality: estimateQuality({ keywords, minus, sourceIds, minScore, mode: 'phrase' }),
      lastRun: status === 'active' ? 'ждет новые публикации' : 'на паузе',
    };

    actions.upsertSearch(next);
    setSelectedId(next.id);
    setDraft(toSearchDraft(next));
    setNotice(`Поиск “${next.title}” сохранен. Новые совпадения будут появляться в разделе “Совпадения”.`);
  };

  const duplicate = (search) => {
    const copy = actions.duplicateSearch(search);
    setSelectedId(copy.id);
    setDraft(toSearchDraft(copy));
    setNotice('Создана копия на паузе. Можно адаптировать фразы и источники под другой сценарий.');
  };

  const deleteSearch = (id) => {
    actions.deleteSearch(id);
    const next = workspace.searches.find((item) => item.id !== id);
    setSelectedId(next?.id || '');
    setDraft(toSearchDraft(next));
    setNotice('Поиск удален. Источники остались в библиотеке.');
  };

  const createTestMatch = (search, message) => {
    const match = actions.createTestMatch(search, message);
    setNotice(`Создано тестовое совпадение по фразе “${match?.keyword || 'ключевая фраза'}”. Откройте раздел “Совпадения”.`);
  };

  return (
    <PageShell
      title="Vexa · Мониторинг Telegram"
      subtitle="Командный центр: поиски, фразы, минус-слова, источники, скоринг и доставка новых совпадений через Vexa-бота."
      actions={(<><Btn icon="refresh" kind="secondary" onClick={actions.resetDemo}>Сбросить демо</Btn><Btn icon="plus" kind="primary" onClick={createBlank}>Новый поиск</Btn></>)}
    >
      <ProductHero profile={profile} workspace={workspace} stats={stats} onNewSearch={createBlank} onSources={() => notify('Откройте раздел “Источники” в меню Vexa')} onExport={() => downloadJson('vexa-workspace-export.json', workspace)} />
      <ImportantNote />
      {notice ? <div className={`vexa3-inline-notice ${notice.includes('тестовое') || notice.includes('тестовое совпадение') ? 'vexa3-test-notice' : ''}`}><Icon name={notice.includes('тестовое') ? 'inbox' : 'info'} size={14} />{notice}</div> : null}
      <MetricGrid workspace={workspace} stats={stats} />
      <div className="vexa3-layout vexa3-layout-searches">
        <Card flush className="vexa3-card">
          <SectionTitle
            title="Сценарии мониторинга"
            subtitle="Один поиск = одна задача. Так проще управлять шумом, лимитами и доставкой."
            right={<Segmented value={statusFilter} onChange={setStatusFilter} items={[{ value: 'all', label: 'Все' }, { value: 'active', label: 'Активные' }, { value: 'paused', label: 'Пауза' }]} />}
          />
          <div className="vexa3-toolbar">
            <div className="input-with-icon vexa3-search-input"><Icon name="search" /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию, фразам или минус-словам" /></div>
          </div>
          <div className="divider" />
          <div className="vexa3-search-list">
            {pagedSearches.map((search) => (
              <SearchRow
                key={search.id}
                search={search}
                workspace={workspace}
                active={selected?.id === search.id}
                onOpen={openSearch}
                onToggle={actions.toggleSearch}
                onDuplicate={duplicate}
                onDelete={deleteSearch}
                onTest={(item) => createTestMatch(item)}
              />
            ))}
          </div>
          {!filteredSearches.length ? (
            <div className="vexa3-empty"><Icon name="search" size={22} /><strong>Поисков по фильтру нет</strong><span>Создайте новый сценарий или сбросьте фильтр.</span><Btn kind="primary" icon="plus" onClick={createBlank}>Создать поиск</Btn></div>
          ) : null}
          {filteredSearches.length ? <SearchPagination page={safePage} pages={pageCount} total={filteredSearches.length} onChange={setSearchPage} /> : null}
        </Card>

        <Card className="vexa3-card vexa3-editor">
          
          <SectionTitle title="Конструктор поиска" subtitle="Название, статус, источники, ключевые фразы, минус-слова и дневной лимит." />
          <div className="vexa3-editor-body vexa3-search-form-clean">
            <label className="field"><span>Название</span><input className="input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Например: заявки на услуги" /></label>
            <div className="grid-2">
              <label className="field"><span>Статус</span><select className="input" value={draft.status || 'active'} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="active">Активен</option><option value="paused">Пауза</option></select></label>
              <label className="field"><span>Лимит в день</span><input className="input" type="number" min="10" max="500" value={draft.dailyLimit} onChange={(event) => setDraft({ ...draft, dailyLimit: event.target.value })} /></label>
            </div>
            <label className="field"><span>Telegram-источники</span><SourcePicker workspace={workspace} value={draft.sourceIds} onChange={(sourceIds) => setDraft({ ...draft, sourceIds })} /></label>
            <PhraseEditor label="Ключевые слова и фразы" value={draft.keywordsText} onChange={(keywordsText) => setDraft({ ...draft, keywordsText })} placeholder={'нужен подрядчик\nищу специалиста\nкто может сделать\nнужна консультация'} />
            <PhraseEditor label="Минус-слова" kind="minus" value={draft.minusText} onChange={(minusText) => setDraft({ ...draft, minusText })} placeholder={'бесплатно\nрозыгрыш\nстажировка\nбез бюджета'} />
            <div className="vexa3-form-actions"><Btn kind="secondary" onClick={() => setDraft(toSearchDraft(selected))}>Отмена</Btn><Btn kind="secondary" icon="pause" onClick={() => saveSearch('paused')}>Сохранить на паузе</Btn><Btn kind="primary" icon="check" onClick={() => saveSearch('active')}>Сохранить и запустить</Btn></div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function matchStatusBadge(match) {
  if (match.hidden) return <Badge kind="danger">скрыто</Badge>;
  if (match.sent) return <Badge kind="success">доставлено</Badge>;
  return statusBadge(match.status);
}

function MatchRow({ match, active, onOpen }) {
  return (
    <button type="button" className={`vexa3-match-row ${active ? 'active' : ''}`} onClick={() => onOpen(match)}>
      <span className="vexa3-score">{match.score}%</span>
      <span className="vexa3-match-row-main">
        <span><strong>{match.keyword}</strong>{matchStatusBadge(match)}{priorityBadge(match.priority)}</span>
        <small>{match.text}</small>
      </span>
      <span className="vexa3-match-source">{match.source}</span>
      <span className="vexa3-match-time">{match.time}</span>
    </button>
  );
}


function matchTelegram(match) {
  if (match?.telegram) return match.telegram;
  if (String(match?.author || '').startsWith('@')) return match.author;
  return 'не указан';
}

function matchPhone(match) {
  return match?.phone || 'не указан';
}

export function VexaMatchesPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [notice, setNotice] = useState('');

  const visibleMatches = workspace.matches.filter((match) => !match.hidden);
  const filtered = visibleMatches.filter((match) => {
    if (filter === 'new' && (match.status !== 'new' || match.sent)) return false;
    if (filter === 'high' && Number(match.score) < 80) return false;
    if (filter === 'qualified' && match.status !== 'qualified') return false;
    if (filter === 'sent' && !match.sent) return false;
    if (filter === 'rejected' && match.status !== 'rejected') return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [match.text, match.keyword, match.source, match.search, match.author, match.intent].some((value) => String(value || '').toLowerCase().includes(needle));
  }).sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

  const selected = visibleMatches.find((match) => match.id === selectedId) || filtered[0] || visibleMatches[0];

  useEffect(() => {
    if (!selected && visibleMatches[0]) setSelectedId(visibleMatches[0].id);
  }, [selected, visibleMatches]);

  const sendToBot = (match) => {
    if (!match) return;
    actions.updateMatch(match.id, { sent: true, status: 'qualified' }, { title: 'Совпадение отправлено через Vexa-бота', body: match.keyword, icon: 'send' });
    setNotice('В демо совпадение отмечено как отправленное. В рабочей версии здесь вызывается реальная отправка через Vexa-бота.');
  };

  const qualify = (match) => {
    actions.updateMatch(match.id, { status: 'qualified' }, { title: 'Совпадение отмечено подходящим', body: match.keyword, icon: 'check' });
    setNotice('Совпадение отмечено подходящим. Оно останется в аналитике качества источников.');
  };

  const reject = (match) => {
    actions.updateMatch(match.id, { status: 'rejected' }, { title: 'Совпадение отклонено', body: match.keyword, icon: 'x' });
    setNotice('Совпадение отклонено и помечено как шум.');
  };

  const hide = (match) => {
    actions.updateMatch(match.id, { hidden: true }, { title: 'Совпадение скрыто', body: match.keyword, icon: 'trash' });
    setSelectedId(filtered.find((item) => item.id !== match.id)?.id || '');
    setNotice('Сообщение скрыто из рабочей ленты.');
  };

  return (
    <PageShell title="Vexa · Совпадения" subtitle="Triage-лента новых Telegram-сообщений: разбор, отправка через Vexa-бота, обучение фильтров и работа с шумом." actions={selected ? <Btn kind="primary" icon="send" onClick={() => sendToBot(selected)} disabled={selected.sent}>Отправить через Vexa-бота</Btn> : null}>
      <ImportantNote compact />
      {notice ? <div className="vexa3-inline-notice"><Icon name="info" size={14} />{notice}</div> : null}
      <div className="grid-4 vexa3-metrics">
        <Metric label="В ленте" value={visibleMatches.length} delta="не скрытые" />
        <Metric label="Новые" value={stats.newMatches} delta="требуют разбора" deltaKind={stats.newMatches ? 'up' : undefined} />
        <Metric label="Высокий скоринг" value={stats.highScore} delta="80% и выше" deltaKind={stats.highScore ? 'up' : undefined} />
        <Metric label="Доставлено" value={stats.sent} delta={`${stats.rejected} отклонено`} deltaKind="up" />
      </div>

      <div className="vexa3-layout vexa3-layout-matches">
        <Card flush className="vexa3-card">
          <SectionTitle title="Рабочая очередь" subtitle="Сначала разбирайте высокий скоринг и новые сообщения." right={<Segmented value={filter} onChange={setFilter} items={[{ value: 'all', label: 'Все' }, { value: 'new', label: 'Новые' }, { value: 'high', label: '80%+' }, { value: 'qualified', label: 'Подходят' }, { value: 'sent', label: 'Доставлено' }, { value: 'rejected', label: 'Шум' }]} />} />
          <div className="vexa3-toolbar"><div className="input-with-icon vexa3-search-input"><Icon name="search" /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по тексту, источнику, автору, ключевой фразе" /></div></div>
          <div className="divider" />
          {filtered.map((match) => <MatchRow key={match.id} match={match} active={selected?.id === match.id} onOpen={(item) => setSelectedId(item.id)} />)}
          {!filtered.length ? <div className="vexa3-empty"><Icon name="inbox" size={22} /><strong>Совпадений нет</strong><span>Новые сообщения появятся только после запуска поисков и подключения источников.</span></div> : null}
        </Card>

        <Card className="vexa3-card vexa3-editor">
          <SectionTitle title="Карточка сообщения" subtitle={selected ? `${selected.search} · ${selected.source}` : 'Выберите совпадение'} right={selected ? matchStatusBadge(selected) : null} />
          {selected ? (
            <div className="vexa3-match-detail">
              <div className="vexa3-message">
                <div className="vexa3-message-head"><span className="vexa3-score big">{selected.score}%</span><div><strong>{selected.keyword}</strong><small>{selected.intent} · {selected.time}</small></div></div>
                <p>{selected.text}</p>
              </div>
<div className="vexa3-detail-grid vexa3-match-fields">
  <div><span>Поиск</span><strong>{selected.search}</strong></div>
  <div><span>Источник</span><strong>{selected.sourceType} · {selected.source}</strong></div>
  <div><span>Telegram</span><strong>{matchTelegram(selected)}</strong></div>
  <div><span>Телефон</span><strong>{matchPhone(selected)}</strong></div>
  <div><span>Автор</span><strong>{selected.author || 'не указан'}</strong></div>
  <div><span>Ключевая фраза</span><strong>{selected.keyword}</strong></div>
</div>
<div className="vexa3-message-meta">
  <div><span>Почему попало</span><strong>{selected.reason}</strong></div>
  <div><span>Что сделать</span><strong>{selected.nextStep}</strong></div>
</div>
<div className="vexa3-form-actions">
  <Btn kind="secondary" icon="copy" onClick={() => copyText(selected.text, 'Текст совпадения скопирован')}>Скопировать</Btn>
  <Btn kind="secondary" icon="arrow-up-right" onClick={() => openTelegram(selected.source)}>Открыть источник</Btn>
  <Btn kind="secondary" icon="check" onClick={() => qualify(selected)}>Подходит</Btn>
  <Btn kind="secondary" icon="x" onClick={() => reject(selected)}>Отклонить</Btn>
  <Btn kind="primary" icon="send" onClick={() => sendToBot(selected)} disabled={selected.sent}>В личку</Btn>
  <Btn kind="danger" icon="trash" onClick={() => hide(selected)}>Скрыть</Btn>
</div>
            </div>
          ) : <div className="vexa3-empty"><Icon name="inbox" /><strong>Выберите сообщение</strong><span>Здесь будет причина попадания и быстрые действия.</span></div>}
        </Card>
      </div>
    </PageShell>
  );
}

function toSourceDraft(source) {
  return source ? { ...blankSourceDraft, ...source } : { ...blankSourceDraft };
}

function SourceRow({ source, active, usage, onOpen, onDelete }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(source);
    }
  };

  return (
    <div
      className={`vexa3-source-row ${active ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(source)}
      onKeyDown={handleKeyDown}
      aria-label={`Открыть источник ${source.title}`}
    >
      <div className="vexa3-row-mainbutton">
        <span className="vexa3-row-icon"><Icon name={sourceIcon(source.type)} size={15} /></span>
        <span className="vexa3-row-content">
          <span className="vexa3-row-title"><strong>{source.title}</strong>{statusBadge(source.status)}</span>
          <small>{source.group} · {source.ref}</small>
        </span>
      </div>
      <span className="vexa3-source-meta">{source.type}</span>
      <span className="vexa3-source-meta">{source.lastSeen}</span>
      <span className="vexa3-source-meta">{usage} поисков</span>
      <span className="vexa3-source-trust"><i style={{ width: `${Number(source.trust) || 0}%` }} />{source.trust || 0}%</span>
      <div className="vexa3-row-actions inline" onClick={(event) => event.stopPropagation()}><Btn size="sm" kind="secondary" icon="arrow-up-right" onClick={() => openTelegram(source.ref)}>Открыть</Btn><Btn size="sm" kind="danger" icon="trash" onClick={() => onDelete(source)}>Удалить</Btn></div>
    </div>
  );
}

function parseBulkSources(text) {
  return parseLines(text).map((line) => {
    const parts = line.split('|').map((item) => cleanText(item, 120));
    const ref = parts[0] || '';
    const title = parts[1] || ref.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') || 'Telegram-источник';
    const type = SOURCE_TYPES.includes(parts[2]) ? parts[2] : (ref.includes('+') ? 'Invite-ссылка' : ref.includes('/c/') ? 'Комментарии' : 'Канал');
    return {
      id: safeId('src'),
      title,
      ref,
      type,
      group: parts[3] || 'Импорт',
      status: 'limited',
      access: 'нужна проверка доступа',
      connectedAt: 'ожидает подключения',
      lastSeen: 'не проверялся',
      coverage: 'после подключения',
      trust: 65,
      cadence: 'после проверки',
      language: 'RU',
      note: 'Добавлен через массовый импорт. Проверьте доступ перед запуском.',
    };
  }).filter((item) => item.ref);
}

function SourceTopicBar({ topics = [], value, onChange, onCreate }) {
  return (
    <Card className="vexa3-card vexa3-topic-card">
      <div className="vexa3-topic-bar">
        <div>
          <strong>Темы источников</strong>
          <small>Разделяйте источники по нишам, проектам и типам сигналов, чтобы они не смешивались.</small>
        </div>
        <div className="vexa3-topic-tabs">
          <button type="button" className={value === 'all' ? 'active' : ''} onClick={() => onChange('all')}>Все</button>
          {topics.map((topic) => (
            <button type="button" key={topic} className={value === topic ? 'active' : ''} onClick={() => onChange(topic)}>{topic}</button>
          ))}
          <button type="button" className="create" onClick={onCreate}><Icon name="plus" size={13} />Тема</button>
        </div>
      </div>
    </Card>
  );
}

export function VexaSourcesPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(workspace.sources[0]?.id || '');
  const selected = workspace.sources.find((source) => source.id === selectedId) || workspace.sources[0];
  const [draft, setDraft] = useState(() => toSourceDraft(selected));
  const [notice, setNotice] = useState('');
  const [bulkText] = useState('@new_channel | Новый канал | Канал | Лиды\nhttps://t.me/+invite_hash | Закрытый чат | Invite-ссылка | Пилот');

  useEffect(() => {
    if (!selected && workspace.sources[0]) {
      setSelectedId(workspace.sources[0].id);
      setDraft(toSourceDraft(workspace.sources[0]));
    }
  }, [selected, workspace.sources]);

  const sourceTopics = Array.from(new Set([
    ...(Array.isArray(workspace.settings?.sourceTopics) ? workspace.settings?.sourceTopics : []),
    ...workspace.sources.map((source) => source.group || 'Основные'),
  ].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ru'));

  const sources = workspace.sources.filter((source) => {
    if (topicFilter !== 'all' && (source.group || 'Основные') !== topicFilter) return false;
    if (filter !== 'all' && source.status !== filter && source.type !== filter) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return [source.title, source.ref, source.group, source.note].some((value) => String(value || '').toLowerCase().includes(needle));
  });

  const openSource = (source) => { setSelectedId(source.id); setDraft(toSourceDraft(source)); setNotice(''); };

  const createTopic = () => {
    if (typeof window === 'undefined') return;
    const raw = window.prompt('Название темы источников', topicFilter !== 'all' ? topicFilter : 'Новая тема');
    const topic = cleanText(raw, 56);
    if (!topic) return;
    const nextTopics = Array.from(new Set([...(Array.isArray(workspace.settings?.sourceTopics) ? workspace.settings?.sourceTopics : []), topic]));
    actions.updateSettings({ sourceTopics: nextTopics });
    setTopicFilter(topic);
    setDraft((current) => ({ ...current, group: topic }));
    setNotice(`Тема “${topic}” создана. Новые источники можно сразу добавлять в эту тему.`);
  };

  const addSource = () => {
    const targetTopic = topicFilter !== 'all' ? topicFilter : (sourceTopics[0] || 'Основные');
    const next = { ...blankSourceDraft, id: safeId('src'), title: 'Новый Telegram-источник', ref: '@new_source', group: targetTopic, access: 'нужна проверка доступа', connectedAt: 'ожидает подключения', lastSeen: 'не проверялся', coverage: 'после подключения', note: 'Добавьте реальную ссылку, @username или invite. Наш мониторинг будет читать оттуда только новые публикации и искать совпадения по вашим правилам.' };
    actions.addSource(next);
    setSelectedId(next.id);
    setDraft(toSourceDraft(next));
    setNotice('Источник добавлен как черновик. После проверки доступа наш мониторинг Vexa будет читать из него новые сообщения и искать совпадения по вашим поискам.');
  };

  const saveSource = () => {
    const unsafe = [validateSafeText('Название источника', draft.title), validateSafeText('Ссылка источника', draft.ref), validateSafeText('Заметка', draft.note)].find(Boolean);
    if (unsafe) return setNotice(unsafe);
    const title = cleanText(draft.title, 88);
    const ref = normalizeRef(draft.ref);
    if (!title || !ref) return setNotice('Заполните название и ссылку / @username Telegram-источника.');
    const next = {
      ...(selected || {}),
      ...draft,
      id: draft.id || selected?.id || safeId('src'),
      title,
      ref,
      type: draft.type || 'Канал',
      group: topicFilter !== 'all' ? topicFilter : (selected?.group || draft.group || 'Основные'),
      status: draft.status || 'limited',
      trust: Math.max(0, Math.min(100, Number(draft.trust) || 70)),
      language: selected?.language || 'RU',
      cadence: selected?.cadence || 'автоматически',
      access: draft.status === 'online' ? 'доступ есть' : draft.status === 'blocked' ? 'нет доступа' : 'нужна проверка доступа',
      connectedAt: draft.status === 'online' ? 'подключен сейчас' : 'ожидает подключения',
      lastSeen: draft.status === 'online' ? 'только что' : 'не проверялся',
      coverage: draft.status === 'online' ? 'новые сообщения' : 'после подключения',
      note: cleanText(draft.note, 260),
    };
    if (selected?.id) actions.updateSource(selected.id, next); else actions.addSource(next);
    setSelectedId(next.id);
    setDraft(toSourceDraft(next));
    setNotice(`Источник “${next.title}” сохранен. Наш бот/мониторинг будет брать оттуда только новые публикации после подключения.`);
  };

  const deleteSource = (source) => {
    actions.deleteSource(source.id);
    const next = workspace.sources.find((item) => item.id !== source.id);
    setSelectedId(next?.id || '');
    setDraft(toSourceDraft(next));
    setNotice('Источник удален и отвязан от поисков.');
  };

  const importBulk = () => {
    const items = parseBulkSources(bulkText);
    if (!items.length) return setNotice('Добавьте строки формата: @channel | Название | Канал | Группа.');
    actions.addManySources(items);
    setNotice(`Импортировано источников: ${items.length}. Проверьте доступ перед запуском.`);
  };

  return (
    <PageShell title="Vexa · Источники" subtitle="Библиотека Telegram-каналов, групп, комментариев и invite-ссылок для мониторинга новых публикаций." actions={(<><Btn icon="refresh" kind="secondary" onClick={() => { actions.checkSources(); setNotice('Проверка источников выполнена.'); }}>Проверить все</Btn><Btn icon="plus" kind="primary" onClick={addSource}>Добавить источник</Btn></>)}>
      <ImportantNote compact />
      {notice ? <div className="vexa3-inline-notice"><Icon name="info" size={14} />{notice}</div> : null}
      <div className="grid-4 vexa3-metrics"><Metric label="Источников" value={workspace.sources.length} delta="каналы, группы, комментарии" /><Metric label="Онлайн" value={stats.onlineSources} delta="готовы к мониторингу" deltaKind="up" /><Metric label="Требуют доступа" value={stats.sourceWarnings} delta="проверить права" deltaKind={stats.sourceWarnings ? 'down' : 'up'} /><Metric label="Привязок" value={stats.attachedSources} delta="в активных поисках" /></div>

      <SourceTopicBar topics={sourceTopics} value={topicFilter} onChange={setTopicFilter} onCreate={createTopic} />

      <div className="vexa3-layout vexa3-layout-sources">
        <Card flush className="vexa3-card">
          <SectionTitle title="Библиотека источников" subtitle="Источник — это Telegram-место, откуда наш мониторинг берет новые сообщения для поиска совпадений." right={<Segmented value={filter} onChange={setFilter} items={[{ value: 'all', label: 'Все' }, { value: 'online', label: 'Онлайн' }, { value: 'limited', label: 'Доступ' }, { value: 'pending', label: 'Проверка' }, { value: 'Канал', label: 'Каналы' }, { value: 'Группа', label: 'Группы' }]} />} />
          <div className="vexa3-toolbar"><div className="input-with-icon vexa3-search-input"><Icon name="search" /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию, ссылке, группе или заметке" /></div></div>
          <div className="divider" />
          {sources.map((source) => <SourceRow key={source.id} source={source} active={selected?.id === source.id} usage={sourceUsage(workspace, source.id)} onOpen={openSource} onDelete={deleteSource} />)}
          {!sources.length ? <div className="vexa3-empty"><Icon name="filter" /><strong>Источников по фильтру нет</strong><span>Добавьте канал, группу, комментарии или invite-ссылку.</span></div> : null}
        </Card>

        <Card className="vexa3-card vexa3-editor">
          
<SectionTitle title="Настройка источника" subtitle="Наш мониторинг читает из источника новые сообщения после проверки доступа." right={selected ? statusBadge(selected.status) : null} />
<div className="vexa3-editor-body vexa3-source-form-clean">
  <label className="field"><span>Название</span><input className="input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Например: нишевые чаты по дизайну" /></label>
  <label className="field"><span>Ссылка, @username или invite</span><input className="input" value={draft.ref} onChange={(event) => setDraft({ ...draft, ref: event.target.value })} placeholder="@channel или https://t.me/..." /></label>
  <div className="grid-2"><label className="field"><span>Тип</span><select className="input" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{SOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label className="field"><span>Статус</span><select className="input" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{SOURCE_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label></div>
  <label className="field"><span>Доверие источника, %</span><input className="input" type="number" min="0" max="100" value={draft.trust} readOnly /><small>Это значение определяет наш бот по стабильности доступа и качеству совпадений.</small></label>
  <label className="field"><span>Заметка</span><textarea className="input" rows={4} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Что здесь ищем и почему источник важен" /></label>
  <div className="vexa3-form-actions"><Btn kind="secondary" onClick={() => setDraft(toSourceDraft(selected))}>Отмена</Btn>{selected?.ref ? <Btn kind="secondary" icon="arrow-up-right" onClick={() => openTelegram(selected.ref)}>Открыть</Btn> : null}<Btn kind="primary" icon="check" onClick={saveSource}>Сохранить</Btn></div>
</div>
        </Card>
      </div>

      
<Card className="vexa3-card vexa3-bulk vexa3-dev-block">
  <SectionTitle title="Массовый импорт" subtitle="Будет доступен после подключения серверной проверки источников." />
  <div className="vexa3-dev-content" aria-hidden="true">
    <label className="field"><span>Список источников</span><textarea className="input" rows={5} value={bulkText} readOnly /></label>
    <div className="vexa3-form-actions"><Btn kind="secondary" icon="copy" disabled>Скопировать</Btn><Btn kind="primary" icon="plus" disabled>Импортировать</Btn></div>
  </div>
  <div className="vexa3-dev-overlay"><strong>В разработке</strong><span>Массовый импорт будет включен после серверной валидации ссылок и доступа.</span></div>
</Card>
    </PageShell>
  );
}

function VexaAnalyticsBar({ label, value, max, tone = 'brand', meta }) {
  const width = max ? Math.max(4, Math.round((Number(value) / max) * 100)) : 4;
  return (
    <div className="vexa3-analytics-bar">
      <div className="vexa3-analytics-bar-head"><strong>{label}</strong><span>{value}{meta ? ` · ${meta}` : ''}</span></div>
      <div className={`vexa3-analytics-track ${tone}`}><i style={{ width: `${width}%` }} /></div>
    </div>
  );
}


export function VexaAnalyticsPage() {
  const { workspace, stats } = useVexaWorkspace();
  const visible = stats.visibleMatches;
  const maxSource = Math.max(1, ...workspace.sources.map((source) => visible.filter((match) => match.sourceId === source.id).length));
  const avgScore = visible.length ? Math.round(visible.reduce((sum, item) => sum + Number(item.score || 0), 0) / visible.length) : 0;
  const deliveryRate = visible.length ? Math.round((visible.filter((item) => item.sent).length / visible.length) * 100) : 0;
  const highIntent = visible.filter((item) => Number(item.score) >= 80).length;
  const sourceRows = workspace.sources
    .map((source) => ({
      ...source,
      matches: visible.filter((match) => match.sourceId === source.id).length,
      searches: sourceUsage(workspace, source.id),
    }))
    .sort((a, b) => b.matches - a.matches || b.trust - a.trust);
  const keywordRows = workspace.searches
    .flatMap((search) => (search.keywords || []).map((keyword) => ({
      keyword,
      search: search.title,
      count: visible.filter((match) => String(match.keyword || '').toLowerCase() === String(keyword).toLowerCase()).length,
    })))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxKeyword = Math.max(1, ...keywordRows.map((item) => item.count));

  const trendData = useMemo(() => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const total = Math.max(visible.length, workspace.searches.length + workspace.sources.length, 7);
    const sentBase = Math.max(0, stats.sent);
    return days.map((day, index) => {
      const seed = (index + 1) * ((workspace.searches.length % 3) + 2);
      const matches = Math.max(1, Math.round(total / 7 + seed / 3 + (index % 2 ? 1 : 0)));
      const delivered = Math.max(0, Math.min(matches, Math.round(sentBase / 7 + matches * (deliveryRate / 100) * 0.62)));
      return { day, matches, delivered };
    });
  }, [visible.length, workspace.searches.length, workspace.sources.length, stats.sent, deliveryRate]);

  const searchChartData = workspace.searches.map((search) => {
    const matches = visible.filter((match) => match.searchId === search.id).length;
    const delivered = visible.filter((match) => match.searchId === search.id && match.sent).length;
    return { name: search.title.length > 18 ? `${search.title.slice(0, 18)}…` : search.title, matches, delivered };
  });

  const sourceTypeData = SOURCE_TYPES.map((type) => ({
    name: type,
    value: workspace.sources.filter((source) => source.type === type).length,
  })).filter((item) => item.value > 0);

  const scoreBuckets = [
    { range: '90–100', value: visible.filter((item) => Number(item.score) >= 90).length },
    { range: '80–89', value: visible.filter((item) => Number(item.score) >= 80 && Number(item.score) < 90).length },
    { range: '70–79', value: visible.filter((item) => Number(item.score) >= 70 && Number(item.score) < 80).length },
    { range: '<70', value: visible.filter((item) => Number(item.score) < 70).length },
  ];

  const searchPerformance = workspace.searches.map((search) => {
    const matches = visible.filter((match) => match.searchId === search.id);
    const delivered = matches.filter((match) => match.sent).length;
    const avg = matches.length ? Math.round(matches.reduce((sum, item) => sum + Number(item.score || 0), 0) / matches.length) : 0;
    return {
      id: search.id,
      title: search.title,
      status: search.status,
      matches: matches.length,
      delivered,
      avg,
      minScore: search.minScore,
      sources: search.sourceIds?.length || 0,
      keywords: search.keywords?.length || 0,
      quality: search.quality || 0,
    };
  }).sort((a, b) => b.matches - a.matches || b.avg - a.avg);

  const recommendations = [
    stats.sourceWarnings ? `Проверить доступ к ${stats.sourceWarnings} источникам: без доступа они не дают новых сообщений.` : 'Поддерживать текущий набор источников и добавлять новые темы по мере расширения мониторинга.',
    avgScore < 75 ? 'Усилить минус-слова и поднять пороги для сценариев с низким средним скорингом.' : 'Скоринг выглядит рабочим: масштабируйте источники в темах, где уже есть совпадения.',
    deliveryRate < 60 ? 'Проверить авторизацию в Vexa-боте и правила доставки, чтобы полезные совпадения не оставались только в ленте.' : 'Доставка через Vexa-бота работает стабильно, можно подключать ежедневные сводки.',
  ];

  const chartPalette = ['#6E3BB8', '#8B5CF6', '#BBA4FF', '#D8C7FF', '#EEE7FF'];

  return (
    <PageShell
      title="Vexa · Аналитика"
      subtitle="Операционная аналитика по поискам, источникам, скорингу и доставке совпадений через приложение и Vexa-бота."
      actions={<><Btn kind="secondary" icon="arrow-down" onClick={() => downloadJson('vexa-analytics-export.json', { exportedAt: new Date().toISOString(), stats, workspace })}>Экспорт</Btn><Btn kind="primary" icon="refresh" onClick={() => notify('Аналитика обновлена')}>Обновить</Btn></>}
    >
      <div className="grid-4 vexa3-metrics">
        <Metric label="Всего совпадений" value={visible.length} delta={`${highIntent} с высоким скорингом`} deltaKind="up" />
        <Metric label="Средний скоринг" value={`${avgScore}%`} delta="качество входящего потока" deltaKind={avgScore >= 70 ? 'up' : 'down'} />
        <Metric label="Доставлено" value={`${deliveryRate}%`} delta={`${stats.sent} в личные сообщения`} deltaKind={deliveryRate ? 'up' : undefined} />
        <Metric label="Источники" value={workspace.sources.length} delta={`${stats.onlineSources} онлайн · ${stats.sourceWarnings} проверить`} deltaKind={stats.sourceWarnings ? 'down' : 'up'} />
      </div>

      <div className="vexa3-analytics-insights">
        <Card className="vexa3-card vexa3-insight-card"><Icon name="filter" /><span><strong>Качество фильтров</strong><small>{avgScore >= 75 ? 'Поток достаточно точный для масштабирования.' : 'Нужно усилить минус-слова и пороги.'}</small></span></Card>
        <Card className="vexa3-card vexa3-insight-card"><Icon name="send" /><span><strong>Доставка</strong><small>{deliveryRate}% совпадений дошло до пользователя через Vexa-бота или отмечено доставленным.</small></span></Card>
        <Card className="vexa3-card vexa3-insight-card"><Icon name="users" /><span><strong>Покрытие источников</strong><small>{stats.onlineSources} онлайн из {workspace.sources.length}. Темы помогают не смешивать разные ниши.</small></span></Card>
      </div>

      <div className="vexa3-analytics-dashboard">
        <Card className="vexa3-card vexa3-chart-card">
          <SectionTitle title="Поток новых совпадений" subtitle="Недельная динамика новых и доставленных сообщений." />
          <div className="vexa3-chart-shell">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 12, right: 8, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id="vexaMatchesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6E3BB8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6E3BB8" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="vexaDeliveredFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9B6BFF" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#9B6BFF" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124, 113, 141, 0.18)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(124,113,141,.16)', background: 'var(--surface)', color: 'var(--text)' }} />
                <Area type="monotone" dataKey="matches" stroke="#6E3BB8" strokeWidth={2.4} fill="url(#vexaMatchesFill)" name="Совпадения" />
                <Area type="monotone" dataKey="delivered" stroke="#9B6BFF" strokeWidth={2.2} fill="url(#vexaDeliveredFill)" name="Доставлено" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="vexa3-card vexa3-chart-card">
          <SectionTitle title="Поиски по результативности" subtitle="Какие сценарии приводят больше всего полезных сигналов." />
          <div className="vexa3-chart-shell">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={searchChartData} margin={{ top: 12, right: 12, bottom: 2, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124, 113, 141, 0.18)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-10} textAnchor="end" height={56} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(124,113,141,.16)', background: 'var(--surface)', color: 'var(--text)' }} />
                <Bar dataKey="matches" radius={[8, 8, 0, 0]} fill="#6E3BB8" name="Совпадения" />
                <Bar dataKey="delivered" radius={[8, 8, 0, 0]} fill="#CDBBFF" name="Доставлено" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="vexa3-card vexa3-chart-card">
          <SectionTitle title="Структура источников" subtitle="Как распределена библиотека каналов, групп, комментариев и invite-ссылок." />
          <div className="vexa3-chart-shell vexa3-chart-shell-compact">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceTypeData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>
                  {sourceTypeData.map((entry, index) => <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(124,113,141,.16)', background: 'var(--surface)', color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="vexa3-pie-legend">
            {sourceTypeData.map((item, index) => (
              <div key={item.name}><i style={{ background: chartPalette[index % chartPalette.length] }} /><span>{item.name}</span><strong>{item.value}</strong></div>
            ))}
          </div>
        </Card>

        <Card className="vexa3-card vexa3-chart-card">
          <SectionTitle title="Распределение скоринга" subtitle="Насколько качественный поток формирует текущий набор фильтров." />
          <div className="vexa3-chart-shell vexa3-chart-shell-compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(124, 113, 141, 0.18)" />
                <XAxis dataKey="range" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid rgba(124,113,141,.16)', background: 'var(--surface)', color: 'var(--text)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#7D4FD6" name="Сообщения" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="vexa3-card vexa3-analytics-panel">
          <SectionTitle title="Источники" subtitle="Каналы, группы и комментарии с лучшим выходом совпадений." />
          <div className="vexa3-analytics-source-table">
            {sourceRows.map((source) => (
              <div className="vexa3-source-analytics-row" key={source.id}>
                <span className="vexa3-row-icon"><Icon name={sourceIcon(source.type)} /></span>
                <span><strong>{source.title}</strong><small>{source.ref} · {source.type} · {source.searches} поисков</small></span>
                <VexaAnalyticsBar label="" value={source.matches} max={maxSource} meta={`${source.trust}% доверие`} />
                {statusBadge(source.status)}
              </div>
            ))}
          </div>
        </Card>

        <Card className="vexa3-card vexa3-analytics-panel">
          <SectionTitle title="Ключевые фразы" subtitle="Какие формулировки чаще всего приводят новые сообщения." />
          <div className="vexa3-analytics-list">
            {keywordRows.map((item) => <VexaAnalyticsBar key={`${item.search}-${item.keyword}`} label={item.keyword} value={item.count} max={maxKeyword} meta={item.search} tone="soft" />)}
            {!keywordRows.length ? <div className="vexa3-empty-line">Добавьте ключевые фразы в поиски, чтобы увидеть статистику.</div> : null}
          </div>
        </Card>

        <Card className="vexa3-card vexa3-analytics-panel vexa3-analytics-wide">
          <SectionTitle title="Рабочие сценарии" subtitle="Сравнение поисков по совпадениям, доставке, среднему скорингу и готовности." />
          <div className="vexa3-analytics-table">
            <div className="head"><span>Поиск</span><span>Совпадения</span><span>Доставка</span><span>Скоринг</span><span>Контур</span></div>
            {searchPerformance.map((row) => (
              <div key={row.id}>
                <span><strong>{row.title}</strong><small>{row.keywords} фраз · {row.sources} источников · порог {row.minScore}%</small></span>
                <span>{row.matches}</span>
                <span>{row.delivered}</span>
                <span>{row.avg || '—'}%</span>
                <span><i style={{ width: `${row.quality}%` }} />{row.quality}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="vexa3-card vexa3-analytics-panel">
          <SectionTitle title="Что улучшить" subtitle="Практические действия по текущей конфигурации." />
          <div className="vexa3-roadmap">
            {recommendations.map((item, index) => <div key={item}><span>{index + 1}</span><small><strong>{index === 0 ? 'Источники' : index === 1 ? 'Фильтры' : 'Доставка'}</strong>{item}</small></div>)}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

export function VexaSettingsPage() {
  const { workspace, actions, stats } = useVexaWorkspace();
  const profile = useVexaProfile();
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState('');
  const botAuthorized = isBotAuthorized(workspace);
  const botName = botDisplayName(workspace);

  const importWorkspace = () => {
    try {
      const parsed = JSON.parse(importText);
      actions.importWorkspace(parsed);
      setNotice('JSON импортирован. Проверьте поиски, источники, правила доставки и Telegram-профиль.');
      setImportText('');
    } catch {
      setNotice('Не удалось прочитать JSON. Проверьте формат экспорта Vexa.');
    }
  };

  const authorizeBot = () => {
    openTelegram(botName);
    setNotice('Откройте нашего Vexa-бота, нажмите Start и подтвердите получение уведомлений. После этого отметьте авторизацию здесь.');
  };

  return (
    <PageShell title="Vexa · Настройки" subtitle="Аккаунт, наш Telegram-бот, доставка уведомлений, тихие часы, хранение, экспорт и рабочие параметры мониторинга.">
      {notice ? <div className="vexa3-inline-notice"><Icon name="info" size={14} />{notice}</div> : null}
      <MetricGrid workspace={workspace} stats={stats} />
      <div className="vexa3-layout vexa3-layout-settings">
        <Card className="vexa3-card"><SectionTitle title="Наш Telegram-бот" subtitle="Клиент не подключает своего бота. Он авторизуется в нашем Vexa-боте и получает личные уведомления." right={<Badge kind={botAuthorized ? 'success' : 'warn'}>{botAuthorized ? 'авторизован' : 'ждет авторизацию'}</Badge>} />
          <div className="vexa3-editor-body">
            <div className="vexa3-toggle-line"><span><strong>{botAuthorized ? 'Личные уведомления включены' : 'Нужно авторизоваться в Vexa-боте'}</strong><small>Наш бот мониторит новые сообщения по правилам поисков и отправляет подходящие совпадения в приложение и личку пользователя.</small></span><Switch on={botAuthorized} onChange={(telegramLinked) => actions.updateSettings({ telegramLinked, botConnected: telegramLinked })} /></div>
            <div className="grid-2"><label className="field"><span>Vexa-бот</span><input className="input" value={botName} onChange={(event) => actions.updateSettings({ botUsername: event.target.value })} /></label><label className="field"><span>Telegram пользователя</span><input className="input" value={workspace.settings.telegramUser || ''} onChange={(event) => actions.updateSettings({ telegramUser: event.target.value })} placeholder="@username после авторизации" /></label></div>
            <div className="vexa3-form-actions"><Btn kind="primary" icon="send" onClick={authorizeBot}>Открыть Vexa-бота</Btn><Btn kind="secondary" icon="check" onClick={() => actions.updateSettings({ telegramLinked: true, botConnected: true })}>Отметить авторизацию</Btn><Btn kind="secondary" icon="bell" onClick={() => notify('Тестовое уведомление Vexa', `${botName} · личное сообщение`) }>Тест уведомления</Btn></div>
            <div className="vexa3-source-checklist"><div><Icon name="shield" size={14} /><span>Бот принадлежит Vexa, токены клиенту не нужны.</span></div><div><Icon name="send" size={14} /><span>Пользователь получает только совпадения из своих поисков.</span></div><div><Icon name="clock" size={14} /><span>Старые сообщения не подтягиваются.</span></div></div>
          </div>
        </Card>

        <Card className="vexa3-card"><SectionTitle title="Аккаунт и рабочая область" subtitle="Параметры владельца, роли и названия проекта." />
          <div className="vexa3-editor-body">
            <div className="vexa3-session-strip"><div className="vexa3-session-user"><span>{(profile?.email || workspace.settings.owner || 'V').slice(0,1).toUpperCase()}</span><div><strong>{workspace.settings.owner || profile?.name || 'Пользователь Vexa'}</strong><small>{profile?.email || 'email из авторизации Supabase'}</small></div></div><Badge kind="info">{workspace.settings.accountRole || 'Владелец'}</Badge></div>
            <div className="grid-2"><label className="field"><span>Название workspace</span><input className="input" value={workspace.settings.workspaceName || ''} onChange={(event) => actions.updateSettings({ workspaceName: event.target.value })} /></label><label className="field"><span>Владелец</span><input className="input" value={workspace.settings.owner || ''} onChange={(event) => actions.updateSettings({ owner: event.target.value })} /></label></div>
            <div className="grid-2"><label className="field"><span>Роль</span><select className="input" value={workspace.settings.accountRole || 'Владелец'} onChange={(event) => actions.updateSettings({ accountRole: event.target.value })}><option>Владелец</option><option>Маркетолог</option><option>HR</option><option>Продажи</option><option>Аналитик</option></select></label><label className="field"><span>Часовой пояс</span><input className="input" value={workspace.settings.timezone} onChange={(event) => actions.updateSettings({ timezone: event.target.value })} /></label></div>
            <Btn kind="danger" icon="logout" onClick={requestSignOut}>Выйти из Vexa</Btn>
          </div>
        </Card>

        <Card className="vexa3-card"><SectionTitle title="Доставка и правила" subtitle="Что отправлять сразу, что оставлять в ленте, что собирать в сводку." />
          <div className="vexa3-editor-body">
            <div className="vexa3-toggle-line"><span><strong>Уведомления в приложении</strong><small>Все совпадения остаются в ленте Vexa для разбора и обучения фильтров.</small></span><Switch on={workspace.settings.notifyInApp !== false} onChange={(notifyInApp) => actions.updateSettings({ notifyInApp })} /></div>
            <div className="vexa3-toggle-line"><span><strong>Личные сообщения в Vexa-боте</strong><small>Отправлять совпадения, прошедшие порог скоринга и правила минус-слов.</small></span><Switch on={workspace.settings.notifyTelegram !== false} onChange={(notifyTelegram) => actions.updateSettings({ notifyTelegram })} /></div>
            <label className="field"><span>Режим доставки</span><select className="input" value={workspace.settings.deliveryMode} onChange={(event) => actions.updateSettings({ deliveryMode: event.target.value })}><option value="smart">Умно: высокий скоринг сразу, остальное сводкой</option><option value="all">Все совпадения сразу</option><option value="digest">Только ежедневная сводка</option><option value="app-only">Только приложение</option></select></label>
            <div className="grid-2"><label className="field"><span>Минимальный режим источников</span><select className="input" value={workspace.settings.sourceWatchMode || 'new-only'} onChange={(event) => actions.updateSettings({ sourceWatchMode: event.target.value })}><option value="new-only">Только новые сообщения</option><option value="verified-only">Только проверенные источники</option><option value="manual-review">Сначала ручная проверка</option></select></label><label className="field"><span>Хранение совпадений</span><input className="input" value={workspace.settings.retention} onChange={(event) => actions.updateSettings({ retention: event.target.value })} /></label></div>
          </div>
        </Card>

        <Card className="vexa3-card"><SectionTitle title="Тихие часы и сводки" subtitle="Чтобы бот не шумел ночью и не дублировал низкоприоритетные совпадения." />
          <div className="vexa3-editor-body">
            <div className="vexa3-toggle-line"><span><strong>Тихие часы</strong><small>Новые совпадения копятся в приложении и уходят после окна тишины.</small></span><Switch on={workspace.settings.quiet} onChange={(quiet) => actions.updateSettings({ quiet })} /></div>
            <div className="grid-2"><label className="field"><span>С</span><input className="input" value={workspace.settings.quietFrom} onChange={(event) => actions.updateSettings({ quietFrom: event.target.value })} /></label><label className="field"><span>До</span><input className="input" value={workspace.settings.quietTo} onChange={(event) => actions.updateSettings({ quietTo: event.target.value })} /></label></div>
            <div className="grid-2"><label className="field"><span>Ежедневная сводка</span><input className="input" value={workspace.settings.digestTime} onChange={(event) => actions.updateSettings({ digestTime: event.target.value })} /></label><div className="vexa3-toggle-line"><span><strong>Недельный отчет</strong><small>Источники, фразы, шум и доставленные совпадения.</small></span><Switch on={workspace.settings.weeklyReport !== false} onChange={(weeklyReport) => actions.updateSettings({ weeklyReport })} /></div></div>
          </div>
        </Card>

        <Card flush className="vexa3-card"><SectionTitle title="Правила уведомлений" subtitle="Какие события отправлять в приложение и личные сообщения через Vexa-бота." /><div className="divider" />
          {workspace.notificationRules.map((rule) => <div className="vexa3-simple-row" key={rule.id}><span className="vexa3-row-icon"><Icon name="bell" /></span><span><strong>{rule.title}</strong><small>{rule.target} · порог {rule.threshold}%</small></span><Switch on={rule.enabled} onChange={() => actions.updateNotificationRule(rule.id, { enabled: !rule.enabled })} /></div>)}
        </Card>

        <Card className="vexa3-card"><SectionTitle title="Экспорт, импорт и сброс" subtitle="Для переноса пилота между сборками и проверки на тестовых данных." />
          <div className="vexa3-editor-body"><div className="vexa3-form-actions"><Btn kind="secondary" icon="arrow-down" onClick={() => downloadJson('vexa-workspace-export.json', workspace)}>Экспорт JSON</Btn><Btn kind="secondary" icon="refresh" onClick={actions.resetDemo}>Сбросить демо</Btn></div><label className="field"><span>Импорт JSON</span><textarea className="input" rows={5} value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Вставьте JSON экспорта Vexa" /></label><Btn kind="primary" icon="arrow-up" onClick={importWorkspace}>Импортировать</Btn></div>
        </Card>
      </div>
    </PageShell>
  );
}

export function VexaSubscriptionPage() {
  return (
    <PageShell title="Vexa · Тестирование" subtitle="Пилотный контур для проверки реальных сценариев мониторинга Telegram.">
      <div className="vexa3-testing-grid">
        <Card className="vexa3-card vexa3-testing"><Badge kind="info">тестовый доступ</Badge><h2>Цель пилота — понять, какие источники, фразы и правила доставки реально дают полезные совпадения.</h2><p>На этом этапе важнее качество источников, точность ключей, минус-слова и быстрый разбор в Vexa-боте, а не тарифная сетка.</p><Btn kind="primary" icon="send" onClick={() => openTelegram('@olenchuk_b')}>Написать @olenchuk_b</Btn></Card>
        <Card className="vexa3-card"><SectionTitle title="Что проверяем" subtitle="Минимальный набор для пилота." /><div className="vexa3-roadmap"><div><span>1</span><strong>Источники</strong><small>Каналы, группы, комментарии и invite-чаты с доступом.</small></div><div><span>2</span><strong>Фразы</strong><small>Как люди реально формулируют заявки, вакансии и боли.</small></div><div><span>3</span><strong>Шум</strong><small>Минус-слова, отклонения, пороги скоринга.</small></div><div><span>4</span><strong>Доставка</strong><small>Что отправлять сразу, а что собирать в сводку.</small></div></div></Card>
      </div>
    </PageShell>
  );
}

function HelpPage() {
  const [feedback, setFeedback] = useState('Хочу протестировать Vexa для задачи: отслеживать заявки и обсуждения в Telegram-чатах. Источников примерно: 10–20. Важные фразы: ... Минус-слова: ...');
  const [notice, setNotice] = useState('');
  const faq = [
    ['Что делает Vexa?', 'Отслеживает новые сообщения в Telegram-каналах, группах и комментариях по ключевым словам и фразам.'],
    ['Можно загрузить старую историю?', 'Нет. Vexa работает только с новыми публикациями после подключения источника.'],
    ['Что можно отслеживать?', 'Заявки, лиды, вакансии, кандидатов, упоминания бренда, запросы на услуги, объявления и нишевые обсуждения.'],
    ['Зачем минус-слова?', 'Чтобы исключать шумные и нерелевантные сообщения до отправки через Vexa-бота.'],
    ['Как понять, что поиск готов?', 'Есть 3–7 ключевых фраз, 2+ минус-слова, хотя бы один источник онлайн и понятный канал доставки.'],
  ];

  const copyFeedback = () => {
    const text = feedback.trim();
    if (!text) return setNotice('Опишите задачу, которую хотите протестировать.');
    copyText(`Хочу протестировать Vexa:\n${text}`, 'Запрос на тест скопирован');
    setNotice('Запрос скопирован. Отправьте его в Telegram @olenchuk_b.');
  };

  return (
    <PageShell title="Vexa · Помощь" subtitle="FAQ, тестирование и обратная связь.">
      {notice ? <div className="vexa3-inline-notice"><Icon name="info" size={14} />{notice}</div> : null}
      <div className="vexa3-layout vexa3-layout-settings">
        <Card flush className="vexa3-card"><SectionTitle title="Вопросы" subtitle="Базовая логика продукта." /><div className="divider" />{faq.map(([question, answer]) => <div className="vexa3-simple-row" key={question}><span className="vexa3-row-icon"><Icon name="help" /></span><span><strong>{question}</strong><small>{answer}</small></span></div>)}</Card>
        <Card className="vexa3-card"><SectionTitle title="Запрос на тест" subtitle="Сформулируйте реальную задачу, источники и критерии полезного совпадения." /><div className="vexa3-editor-body"><label className="field"><span>Задача для теста</span><textarea className="input" rows={8} value={feedback} onChange={(event) => setFeedback(event.target.value)} /></label><div className="vexa3-form-actions"><Btn kind="secondary" icon="copy" onClick={copyFeedback}>Скопировать</Btn><Btn kind="primary" icon="send" onClick={() => openTelegram('@olenchuk_b')}>Написать</Btn></div></div></Card>
      </div>
    </PageShell>
  );
}

export function VexaSimplePage({ id = 'help' }) {
  if (id === 'contacts') return <VexaSearchesPage />;
  if (id === 'analytics' || id === 'vexa-analytics') return <VexaAnalyticsPage />;
  if (id === 'notifications' || id === 'settings' || id === 'account' || id === 'vexa-settings') return <VexaSettingsPage />;
  if (id === 'subscription' || id === 'payments' || id === 'limits' || id === 'vexa-testing') return <VexaSubscriptionPage />;
  return <HelpPage />;
}
