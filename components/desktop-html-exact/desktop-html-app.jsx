'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme as useNextTheme } from 'next-themes';
import { MASTER, SERVICES, CLIENTS, NOTIFICATIONS } from './desktop-html-data';
import { Icon, Avatar, Check, SuccessCheck } from './desktop-html-ui';
import { useDesktopPlatform } from './desktop-platform';
import { VexaAuthGate } from './vexa-auth-gate';
import { PublicPage } from './pages/public';
import { ChatsPage } from './pages/chats';
import { CalendarPage } from './pages/calendar';
import { DesktopDashboardTransferPage } from '../desktop-dashboard-transfer/dashboard-embed';
import {
  VexaDashboardPage,
  VexaMatchesPage,
  VexaSearchesPage,
  VexaSettingsPage,
  VexaSimplePage,
  VexaSourcesPage,
  VexaSubscriptionPage,
} from './pages/vexa';

const pageToRoute = {
  dashboard: 'dashboard',
  searches: 'searches',
  matches: 'matches',
  contacts: 'contacts',
  sources: 'sources',
  notifications: 'notifications',
  analytics: 'analytics',
  payments: 'payments',
  subscription: 'subscription',
  settings: 'settings',
  account: 'settings',
  help: 'help',
  calendar: 'schedule',
  chats: 'chats',
  clients: 'clients',
  services: 'services',
  availability: 'availability',
  profile: 'profile',
  public: 'public',
  appearance: 'appearance',
  templates: 'templates',
  integrations: 'integrations',
  reviews: 'reviews',
  finance: 'finance',
  marketing: 'marketing',
  limits: 'limits',
};

const VEXA_PAGES = new Set([
  'dashboard',
  'searches',
  'matches',
  'contacts',
  'sources',
  'notifications',
  'analytics',
  'payments',
  'subscription',
  'settings',
  'account',
  'help',
]);


const DESKTOP_MODAL_POSITION_STORAGE_KEY = 'clickbook.desktop.modal.positions.v4';

function getDesktopModalKind(node) {
  if (!node) return 'default';
  if (node.classList?.contains('cb-record-popup--client')) return 'client';
  if (node.classList?.contains('cb-record-popup--service')) return 'service';
  if (node.classList?.contains('cb-record-popup--availability')) return 'availability';
  if (node.classList?.contains('command-panel')) return 'command';
  if (node.classList?.contains('modal')) return node.classList?.contains('dashboard-client-modal') ? 'dashboard-client' : 'modal';
  return node.getAttribute?.('data-modal-kind') || 'default';
}

function readDesktopModalPosition(node) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DESKTOP_MODAL_POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const value = parsed?.[getDesktopModalKind(node)];
    if (!Number.isFinite(value?.x) || !Number.isFinite(value?.y)) return null;
    return { x: value.x, y: value.y };
  } catch {
    return null;
  }
}

function writeDesktopModalPosition(node, pos) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(DESKTOP_MODAL_POSITION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[getDesktopModalKind(node)] = { x: Math.round(pos.x), y: Math.round(pos.y) };
    window.localStorage.setItem(DESKTOP_MODAL_POSITION_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Keep drag working even if storage is unavailable.
  }
}

function getDesktopModalTitlebarHeight() {
  if (typeof window === 'undefined') return 0;
  const titlebar = document.querySelector('.clickbook-desktop-titlebar, #clickbook-electron-fallback-titlebar');
  const rect = titlebar?.getBoundingClientRect?.();
  if (rect?.height > 0) return rect.height;
  const css = window.getComputedStyle(document.documentElement).getPropertyValue('--clickbook-desktop-titlebar-height').trim();
  const value = Number.parseFloat(css);
  return Number.isFinite(value) ? value : 0;
}

function getDesktopModalSafeRect() {
  if (typeof window === 'undefined') return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  const main = document.querySelector('.cb-desktop-html .main');
  const mainRect = main?.getBoundingClientRect?.();
  const titlebarH = getDesktopModalTitlebarHeight();
  const left = Math.max(0, mainRect?.left ?? 0);
  const top = Math.max(titlebarH, mainRect?.top ?? titlebarH, titlebarH + 8);
  const right = Math.min(window.innerWidth, mainRect?.right ?? window.innerWidth);
  const bottom = Math.min(window.innerHeight, mainRect?.bottom ?? window.innerHeight);
  return {
    left,
    top,
    right: Math.max(left, right),
    bottom: Math.max(top, bottom),
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function getDesktopModalSize(node) {
  const rect = node?.getBoundingClientRect?.();
  const width = rect?.width || node?.offsetWidth || 520;
  const height = rect?.height || node?.offsetHeight || 420;
  return { width, height };
}

function clampDesktopModalPosition(pos, node, pad = 14) {
  if (typeof window === 'undefined') return pos;
  const { width, height } = getDesktopModalSize(node);
  const safe = getDesktopModalSafeRect();
  const minX = safe.left + pad;
  const minY = safe.top + pad;
  const maxX = Math.max(minX, safe.right - width - pad);
  const maxY = Math.max(minY, safe.bottom - height - pad);
  return { x: Math.min(Math.max(pos.x, minX), maxX), y: Math.min(Math.max(pos.y, minY), maxY) };
}

function getDesktopModalCenteredPosition(node) {
  const { width, height } = getDesktopModalSize(node);
  const safe = getDesktopModalSafeRect();
  return clampDesktopModalPosition({
    x: safe.left + Math.max(0, (safe.width - width) / 2),
    y: safe.top + Math.max(0, (safe.height - height) / 2),
  }, node);
}

function isDesktopModalInteractiveTarget(target) {
  return Boolean(target?.closest?.('button,input,textarea,select,a,[role="button"],[role="switch"],[data-no-drag]'));
}

function useDesktopModalWindowBehavior() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const cleanups = new WeakMap();

    const makeFloating = (node, pos) => {
      const next = clampDesktopModalPosition(pos, node);
      node.style.position = 'fixed';
      node.style.left = `${next.x}px`;
      node.style.top = `${next.y}px`;
      node.style.right = 'auto';
      node.style.bottom = 'auto';
      node.style.margin = '0';
      node.style.transform = 'none';
      node.dataset.desktopFloatingModal = 'true';
      return next;
    };

    const applyInitialPosition = (node) => {
      // Keep portaled dashboard popups hidden until we have their final fixed
      // coordinates. This prevents the one-frame flash in the CSS fallback
      // center position before the persisted position is applied.
      node.style.visibility = 'hidden';
      node.style.opacity = '0';

      const place = () => {
        if (!node.isConnected) return;
        const stored = readDesktopModalPosition(node);
        makeFloating(node, stored || getDesktopModalCenteredPosition(node));
        node.style.visibility = '';
        node.style.opacity = '';
      };

      place();
      window.requestAnimationFrame(place);
    };

    const attach = (node) => {
      if (!node || cleanups.has(node) || node.closest('.schedule-v2')) return;
      node.dataset.desktopModalReady = 'true';
      if (node.classList?.contains('cb-record-popup')) {
        applyInitialPosition(node);
      }
      cleanups.set(node, () => undefined);
    };

    const selectors = [
      '.modal-backdrop > .modal',
      '.modal-backdrop > .card.dashboard-client-modal',
      '.modal-backdrop > .dashboard-client-modal',
      '.cb-record-popup',
    ];

    const scan = () => {
      const seen = new Set();
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => {
          if (seen.has(node)) return;
          seen.add(node);
          attach(node);
        });
      });
    };

    let pointerDrag = null;
    const beginPointerDrag = (event) => {
      if (event.button !== 0 || isDesktopModalInteractiveTarget(event.target)) return;
      const handle = event.target?.closest?.('.cb-record-popup-head,[data-modal-drag-handle],.modal-head,.command-head');
      if (!handle) return;
      const node = handle.closest?.('.cb-record-popup,.modal,.command-panel,.card.dashboard-client-modal,.dashboard-client-modal');
      if (!node || node.closest('.schedule-v2')) return;

      const rect = node.getBoundingClientRect();
      pointerDrag = {
        pointerId: event.pointerId,
        node,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        latest: { x: rect.left, y: rect.top },
        prevUserSelect: document.body.style.userSelect,
        prevCursor: document.body.style.cursor,
      };

      try { handle.setPointerCapture?.(event.pointerId); } catch {}
      makeFloating(node, pointerDrag.latest);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      event.preventDefault();
      event.stopPropagation();
    };

    const movePointerDrag = (event) => {
      if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
      pointerDrag.latest = makeFloating(pointerDrag.node, {
        x: event.clientX - pointerDrag.offsetX,
        y: event.clientY - pointerDrag.offsetY,
      });
      event.preventDefault();
      event.stopPropagation();
    };

    const endPointerDrag = (event) => {
      if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
      document.body.style.userSelect = pointerDrag.prevUserSelect;
      document.body.style.cursor = pointerDrag.prevCursor;
      writeDesktopModalPosition(pointerDrag.node, pointerDrag.latest);
      pointerDrag = null;
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('pointerdown', beginPointerDrag, true);
    document.addEventListener('pointermove', movePointerDrag, true);
    document.addEventListener('pointerup', endPointerDrag, true);
    document.addEventListener('pointercancel', endPointerDrag, true);

    const onEscapeKeyDown = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;

      const visibleRecordPopups = Array.from(document.querySelectorAll('.cb-record-popup'))
        .filter((node) => {
          const rect = node.getBoundingClientRect?.();
          return rect && rect.width > 0 && rect.height > 0;
        });

      const recordPopup = visibleRecordPopups.at(-1);
      if (recordPopup) {
        const closeButton = recordPopup.querySelector(
          '.cb-record-popup-head button[aria-label], button[aria-label="Закрыть"], button[aria-label="Close"]',
        );
        if (closeButton) {
          event.preventDefault();
          event.stopPropagation();
          closeButton.click();
          return;
        }
      }

      const scheduleCloseButton = Array.from(document.querySelectorAll(
        '.schedule-v2-overlay-root button[aria-label="Закрыть"], .schedule-v2-overlay-root button[aria-label="Close"]',
      )).at(-1);

      if (scheduleCloseButton) {
        event.preventDefault();
        event.stopPropagation();
        scheduleCloseButton.click();
        return;
      }

      const genericModal = Array.from(document.querySelectorAll('.modal-backdrop > .modal, .command-panel'))
        .filter((node) => {
          const rect = node.getBoundingClientRect?.();
          return rect && rect.width > 0 && rect.height > 0;
        })
        .at(-1);

      const genericClose = genericModal?.querySelector?.(
        'button[aria-label="Закрыть"], button[aria-label="Close"], button[aria-label*="закры" i], button[aria-label*="close" i]',
      );
      if (genericClose) {
        event.preventDefault();
        event.stopPropagation();
        genericClose.click();
      }
    };

    const onResize = () => {
      document.querySelectorAll('[data-desktop-floating-modal="true"]').forEach((node) => {
        const rect = node.getBoundingClientRect();
        const next = makeFloating(node, { x: rect.left, y: rect.top });
        writeDesktopModalPosition(node, next);
      });
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onEscapeKeyDown, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onEscapeKeyDown, true);
      document.removeEventListener('pointerdown', beginPointerDrag, true);
      document.removeEventListener('pointermove', movePointerDrag, true);
      document.removeEventListener('pointerup', endPointerDrag, true);
      document.removeEventListener('pointercancel', endPointerDrag, true);
      document.querySelectorAll('[data-desktop-modal-ready="true"]').forEach((node) => cleanups.get(node)?.());
    };
  }, []);
}

function normalizeInitialPage(value) {
  if (value === 'schedule') return 'calendar';
  if (value && pageToRoute[value]) return value;
  return 'dashboard';
}

const routeToPage = {
  dashboard: 'dashboard',
  searches: 'searches',
  matches: 'matches',
  contacts: 'contacts',
  sources: 'sources',
  notifications: 'notifications',
  analytics: 'analytics',
  payments: 'payments',
  subscription: 'subscription',
  settings: 'settings',
  help: 'help',
  schedule: 'calendar',
  calendar: 'calendar',
  bookings: 'calendar',
  chats: 'chats',
  clients: 'clients',
  services: 'services',
  availability: 'availability',
  profile: 'profile',
  'master-profile': 'profile',
  stats: 'analytics',
  public: 'public',
  appearance: 'appearance',
  templates: 'templates',
  integrations: 'integrations',
  reviews: 'reviews',
  account: 'settings',
  finance: 'finance',
  marketing: 'marketing',
  limits: 'limits',
};

function pageFromDesktopPath(pathname, fallback = 'dashboard') {
  const match = String(pathname || '').match(/\/desktop\/([^/?#]+)/);
  const route = match?.[1] || 'dashboard';
  return normalizeInitialPage(routeToPage[route] || fallback);
}

function getInitialDesktopPage(fallback) {
  if (typeof window !== 'undefined') {
    return pageFromDesktopPath(window.location.pathname, fallback);
  }
  return normalizeInitialPage(fallback);
}

function TweaksPanel() { return null; }
function TweakSection() { return null; }
function TweakRadio() { return null; }
function TweakSelect() { return null; }

/* Exact Claude desktop shell — adapted for Next/Electron */

const CRUMBS = {
  dashboard: ['Мониторинг', 'Главная'],
  searches: ['Мониторинг', 'Поиски'],
  matches: ['Мониторинг', 'Совпадения'],
  sources: ['Мониторинг', 'Источники'],
  contacts: ['Мониторинг', 'Контакты'],
  analytics: ['Мониторинг', 'Аналитика'],
  subscription: ['Аккаунт', 'Подписка'],
  account: ['Аккаунт', 'Настройки'],
  settings: ['Аккаунт', 'Настройки'],
};

const PLATFORM_NAV = [
  { section: 'Мониторинг', items: [
    { id: 'dashboard', label: 'Главная', icon: 'home' },
    { id: 'searches', label: 'Поиски', icon: 'search', count: 4 },
    { id: 'matches', label: 'Совпадения', icon: 'inbox', count: 24 },
    { id: 'sources', label: 'Источники', icon: 'filter' },
    { id: 'contacts', label: 'Контакты', icon: 'users' },
    { id: 'analytics', label: 'Аналитика', icon: 'chart' },
  ]},
  { section: 'Аккаунт', items: [
    { id: 'notifications', label: 'Уведомления', icon: 'bell' },
    { id: 'payments', label: 'Платежи', icon: 'card' },
    { id: 'subscription', label: 'Подписка', icon: 'crown' },
    { id: 'settings', label: 'Настройки', icon: 'gear' },
    { id: 'help', label: 'Помощь', icon: 'help' },
  ]},
];

const PLATFORM_CRUMBS = Object.fromEntries(
  PLATFORM_NAV.flatMap((section) => section.items.map((item) => [item.id, [section.section, item.label]])),
);

const NAV_SEARCH_ITEMS = PLATFORM_NAV.flatMap((section) =>
  section.items.map((item) => ({
    id: `nav-${item.id}`,
    page: item.id,
    icon: item.icon,
    title: item.label,
    subtitle: section.section,
  })),
);

function textIncludes(value, query) {
  return String(value || '').toLowerCase().includes(query);
}

function buildSearchResults(query, platform) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  void platform;

  const modules = NAV_SEARCH_ITEMS.filter((item) =>
    [item.title, item.subtitle].some((value) => textIncludes(value, needle)),
  );

  return modules.slice(0, 8);
}

function GlobalSearchResults({ query, results, onPick }) {
  if (!query.trim()) return null;
  return (
    <div className="desktop-search-popover">
      {results.length ? results.map((result) => (
        <button
          key={result.id}
          type="button"
          className="desktop-search-item"
          onClick={() => onPick(result)}
        >
          <span className="desktop-search-icon"><Icon name={result.icon} size={14} /></span>
          <span style={{ minWidth: 0 }}>
            <span className="desktop-search-title">{result.title}</span>
            <span className="desktop-search-sub">{result.subtitle}</span>
          </span>
        </button>
      )) : (
        <div className="desktop-search-item" style={{ cursor: 'default' }}>
          <span className="desktop-search-icon"><Icon name="search" size={14} /></span>
          <span>
            <span className="desktop-search-title">Ничего не найдено</span>
            <span className="desktop-search-sub">Попробуйте поиск, источник, совпадение или раздел</span>
          </span>
        </div>
      )}
    </div>
  );
}

function DesktopToasts({ notifications }) {
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [leavingIds, setLeavingIds] = useState(() => new Set());
  const initialToastIds = useRef(null);
  if (initialToastIds.current === null) {
    initialToastIds.current = new Set((notifications || []).filter((item) => item.kind === 'platform' && item.unread).map((item) => item.id));
  }
  const items = (notifications || [])
    .filter((item) => item.kind === 'platform' && item.unread && !initialToastIds.current.has(item.id) && !hiddenIds.has(item.id))
    .slice(0, 3);
  const visibleIds = items.map((item) => item.id);
  const visibleKey = visibleIds.join('|');

  const dismiss = useCallback((id) => {
    setLeavingIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });

    window.setTimeout(() => {
      setHiddenIds((current) => {
        const next = new Set(current);
        next.add(id);
        return next;
      });
      setLeavingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 260);
  }, []);

  useEffect(() => {
    if (!visibleKey) return undefined;
    const timers = visibleKey.split('|').map((id) => window.setTimeout(() => dismiss(id), 2000));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dismiss, visibleKey]);

  if (!items.length) return null;

  return (
    <div className="desktop-toast-stack" aria-live="polite">
      {items.map((item) => (
        <div className={`desktop-toast ${leavingIds.has(item.id) ? 'is-leaving' : ''}`} key={item.id}>
          <span className="desktop-search-icon"><Icon name={item.icon || 'bell'} size={14} /></span>
          <span style={{ minWidth: 0 }}>
            <span className="desktop-search-title">{item.title}</span>
            <span className="desktop-search-sub">{item.body}</span>
          </span>
          <button
            type="button"
            className="desktop-toast-close"
            aria-label="Закрыть уведомление"
            onClick={() => dismiss(item.id)}
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function buildDesktopSummary(platform) {
  const unread = (platform?.notifications || []).filter((item) => item.unread).length;
  return [
    'Vexa workspace',
    '4 активных поиска',
    '52 источника',
    '214 совпадений сегодня',
    `${unread} уведомлений`,
  ].join(' · ');
}

function buildCommandGroups({ platform, setPage, onClose, onToggleTheme, tweaks }) {
  const openPage = (page) => () => setPage(page);
  const runAction = (label, action) => () => {
    action?.();
    platform.recordAction?.(label);
  };
  const copySummary = async () => {
    const summary = buildDesktopSummary(platform);
    try {
      await navigator.clipboard?.writeText(summary);
      platform.recordAction?.('Сводка скопирована', summary);
    } catch {
      platform.recordAction?.('Сводка готова', summary);
    }
  };
  return [
    {
      title: 'Быстрые действия',
      items: [
        { id: 'create', icon: 'plus', title: 'Новый поиск', subtitle: 'Ключи, минус-слова и источники', run: openPage('searches') },
        { id: 'summary', icon: 'copy', title: 'Скопировать сводку мониторинга', subtitle: buildDesktopSummary(platform), run: copySummary },
        { id: 'theme', icon: tweaks.theme === 'dark' ? 'sun' : 'moon', title: tweaks.theme === 'dark' ? 'Включить светлую тему' : 'Включить темную тему', subtitle: 'Мгновенно меняет рабочую тему', run: onToggleTheme },
        { id: 'read', icon: 'check', title: 'Отметить уведомления прочитанными', subtitle: 'Очистить бейджи и тосты', run: () => platform.markNotificationsRead?.() },
      ],
    },
    {
      title: 'Разделы',
      items: NAV_SEARCH_ITEMS.map((item) => ({
        id: item.id,
        icon: item.icon,
        title: item.title,
        subtitle: item.subtitle,
        run: openPage(item.page),
      })),
    },
    {
      title: 'Мониторинг',
      items: [
        { id: 'matches', icon: 'inbox', title: 'Открыть совпадения', subtitle: 'Лента новых сообщений', run: openPage('matches') },
        { id: 'sources', icon: 'filter', title: 'Проверить источники', subtitle: 'Доступ и статусы Telegram', run: openPage('sources') },
        { id: 'subscription', icon: 'crown', title: 'Тариф и лимиты', subtitle: 'Free, Start, Pro, Business', run: openPage('subscription') },
      ],
    },
    {
      title: 'Сервис',
      items: [
        { id: 'refresh-data', icon: 'refresh', title: 'Обновить рабочие данные', subtitle: 'Перечитать поиски, источники и лимиты', run: runAction('Данные обновлены', () => platform.resetDemoData?.()) },
        { id: 'help', icon: 'help', title: 'Помощь и диагностика', subtitle: 'Проверка статуса и поддержка', run: openPage('help') },
        { id: 'settings', icon: 'gear', title: 'Настройки рабочего места', subtitle: 'Поведение платформы и безопасность', run: openPage('settings') },
      ],
    },
  ];
}

function CommandCenter({ open, onClose, platform, setPage, onToggleTheme, tweaks }) {
  const [query, setQuery] = useState('');
  const groups = useMemo(
    () => buildCommandGroups({ platform, setPage, onClose, onToggleTheme, tweaks }),
    [platform, setPage, onClose, onToggleTheme, tweaks],
  );
  const needle = query.trim().toLowerCase();
  const filteredGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !needle || [item.title, item.subtitle].some((value) => textIncludes(value, needle))),
  })).filter((group) => group.items.length);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const runItem = (item) => {
    if (!item.run) return;
    item.run();
    onClose();
  };

  return (
    <div className="command-backdrop" onClick={onClose}>
      <div className="command-panel" onClick={(event) => event.stopPropagation()}>
        <div className="command-head">
          <div className="command-brand">
            <span className="command-orb"><Icon name="sparkle" size={15} /></span>
            <div>
          <div className="command-title">Командный центр</div>
              <div className="command-sub">Рабочее место Vexa · мониторинг Telegram</div>
            </div>
          </div>
          <button type="button" className="btn btn-ghost icon" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={14} /></button>
        </div>
        <div className="command-search">
          <Icon name="search" size={15} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Команда, поиск, источник или действие" />
          <kbd>Esc</kbd>
        </div>
        <div className="command-body">
          {filteredGroups.map((group) => (
            <div className="command-group" key={group.title}>
              <div className="command-group-title">{group.title}</div>
              {group.items.map((item) => (
                <button type="button" className="command-item" key={item.id} onClick={() => runItem(item)} disabled={!item.run}>
                  <span className="command-item-icon"><Icon name={item.icon} size={14} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="command-item-title">{item.title}</span>
                    <span className="command-item-sub">{item.subtitle}</span>
                  </span>
                  <Icon name="chevron-right" size={13} />
                </button>
              ))}
            </div>
          ))}
          {!filteredGroups.length && (
            <div className="command-empty">
              <Icon name="search" size={18} />
              <span>Команда не найдена</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function passiveNativeButtonLabel(button) {
  if (!button || button.disabled || button.dataset.desktopUiButton) return '';
  if (button.matches('.nav-item, .seg-btn, .chip, .li-row, .switch, .check, .desktop-search-item')) return '';
  if (!button.matches('.btn, .link, .play-btn')) return '';
  return (
    button.getAttribute('aria-label') ||
    button.getAttribute('data-tip') ||
    button.getAttribute('title') ||
    button.textContent?.trim() ||
    ''
  );
}

function Sidebar({ page, setPage, collapsed }) {
  const sidebarRef = useRef(null);
  const activeItemRef = useRef(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, visible: false });

  const measureActiveIndicator = useCallback(() => {
    const sidebar = sidebarRef.current;
    const activeItem = activeItemRef.current;
    if (!sidebar || !activeItem) {
      setIndicator((current) => current.visible ? { ...current, visible: false } : current);
      return;
    }

    const sidebarRect = sidebar.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();
    const lineHeight = Math.max(16, Math.min(24, activeRect.height - 14));
    const next = {
      top: activeRect.top - sidebarRect.top + sidebar.scrollTop + (activeRect.height - lineHeight) / 2,
      height: lineHeight,
      visible: true,
    };

    setIndicator((current) => {
      if (
        current.visible === next.visible &&
        Math.abs(current.top - next.top) < 0.5 &&
        Math.abs(current.height - next.height) < 0.5
      ) {
        return current;
      }
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    let raf = window.requestAnimationFrame(measureActiveIndicator);
    const t1 = window.setTimeout(measureActiveIndicator, 90);
    const t2 = window.setTimeout(measureActiveIndicator, 230);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [measureActiveIndicator, page, collapsed]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    window.addEventListener('resize', measureActiveIndicator);
    sidebar?.addEventListener('scroll', measureActiveIndicator, { passive: true });
    const observer = typeof ResizeObserver !== 'undefined' && sidebar
      ? new ResizeObserver(() => measureActiveIndicator())
      : null;
    observer?.observe(sidebar);

    return () => {
      window.removeEventListener('resize', measureActiveIndicator);
      sidebar?.removeEventListener('scroll', measureActiveIndicator);
      observer?.disconnect();
    };
  }, [measureActiveIndicator]);

  return (
    <aside
      ref={sidebarRef}
      className="sidebar"
      data-nav-ready={indicator.visible ? 'true' : 'false'}
      style={{
        '--nav-indicator-top': `${indicator.top}px`,
        '--nav-indicator-height': `${indicator.height}px`,
      }}
    >
      <span className="nav-active-indicator" aria-hidden="true" />

      {PLATFORM_NAV.map((sec, i) => (
        <div className="nav-section" key={sec.section} style={{ marginTop: i === 0 ? 0 : 14 }}>
          <div className="nav-section-label">{sec.section}</div>
          {sec.items.map(item => {
            const isActive = page === item.id;
            return (
              <button
                ref={isActive ? activeItemRef : null}
                type="button"
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                data-screen-label={`Nav: ${item.label}`}
              >
                <Icon name={item.icon} size={15} className="icon" />
                <span>{item.label}</span>
                {item.count != null && <span className="count">{item.count}</span>}
              </button>
            );
          })}
        </div>
      ))}

    </aside>
  );
}

function Topbar({ page, setPage, search, setSearch, onNotif, theme, onToggleTheme, unreadNotifications, master }) {
  const crumbs = PLATFORM_CRUMBS[page] || CRUMBS[page] || ['Кабинет'];
  const isDark = theme === 'dark';
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron-right" size={12} className="crumb-sep" />}
            <span className={i === crumbs.length - 1 ? 'crumb-cur' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="spacer" />
      <div className="input-with-icon" style={{ width: 300, maxWidth: '28vw' }}>
        <Icon name="search" />
        <input className="input" placeholder="Поиск по Vexa: поиски, источники, совпадения…" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="kbd">/</span>
      </div>
      <button
        className="btn btn-ghost icon"
        onClick={onToggleTheme}
        aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
        data-tip={isDark ? 'Светлая тема' : 'Тёмная тема'}
      >
        <Icon name={isDark ? 'sun' : 'moon'} size={15} />
      </button>
      <button className="btn btn-ghost icon" onClick={() => setPage('help')} data-tip="Помощь · ?" aria-label="Помощь"><Icon name="help" size={15} /></button>
      <button className="btn btn-ghost icon" onClick={onNotif} style={{ position: 'relative' }} data-tip="Уведомления" aria-label="Уведомления">
        <Icon name="bell" size={15} />
        <span className="t-badge" data-open={unreadNotifications > 0 ? 'true' : 'false'}>
          <span className="t-badge-dot">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
        </span>
      </button>
      <button
        type="button"
        className="topbar-profile"
        onClick={() => setPage('account')}
        data-tip={master?.name || 'Профиль'}
        aria-label="Профиль аккаунта"
      >
        <Avatar name={master?.name || MASTER.name} />
      </button>
    </header>
  );
}

/* ================== Notification Panel ================== */
function NotifPanel({ open, onClose, notifications = NOTIFICATIONS, onMarkRead, onOpenAll }) {
  if (!open) return null;
  return (
    <>
      <div className="modal-backdrop notification-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', justifyContent: 'flex-end', padding: '70px 24px 24px', background: 'transparent', backdropFilter: 'none' }}>
        <div className="card" onClick={e => e.stopPropagation()} style={{ width: 380, padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title">Уведомления</div>
            <button className="btn btn-ghost sm" onClick={onMarkRead}>Отметить прочитанным</button>
          </div>
          <div>
            {notifications.map(n => (
              <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, background: n.unread ? 'var(--surface-2)' : 'transparent' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--text-2)' }}>
                  <Icon name={n.icon} size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{n.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
                </div>
                {n.unread && <div className="dot accent" style={{ marginTop: 6 }} />}
              </div>
            ))}
          </div>
          <div style={{ padding: 12, textAlign: 'center' }}>
            <button className="btn btn-ghost sm" onClick={onOpenAll}>Открыть все уведомления</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================== Quick-Create Modal ================== */
function CreateModal({ open, onClose, platform }) {
  const [step, setStep] = useState(0);
  const [client, setClient] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('26 мая');
  const [time, setTime] = useState('14:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) return null;
  const clients = platform?.clients || CLIENTS;
  const services = platform?.services || SERVICES;
  const activeServiceId = service || services.find((item) => item.active)?.id || services[0]?.id;
  const selectedService = services.find((item) => item.id === activeServiceId);
  const canGoNext = step !== 0 || client.trim().length > 0;

  const addClient = () => {
    const name = client.trim();
    if (!name) {
      setError('Введите имя или телефон клиента');
      return;
    }
    const created = platform?.createClient?.({ name, phone: '' });
    setClient(created?.name || name);
    setError('');
    setStep(1);
  };

  const goNext = () => {
    if (step === 0 && !canGoNext) {
      setError('Выберите клиента или введите нового');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const saveBooking = async () => {
    if (!client.trim()) {
      setStep(0);
      setError('Выберите клиента или введите нового');
      return;
    }
    if (!activeServiceId) {
      setStep(1);
      setError('Выберите активную услугу');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await platform?.createBooking?.({
        clientName: client.trim(),
        serviceId: activeServiceId,
        date,
        time,
        notes,
      });
      if (created) {
        setSaved(true);
        window.setTimeout(onClose, 680);
      } else {
        setError('Не удалось создать запись. Проверьте слот и данные клиента.');
      }
    } catch {
      setError('Не удалось создать запись. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="section-title">Новая запись</div>
            <div className="section-sub" style={{ marginTop: 2 }}>Шаг {step + 1} из 3</div>
          </div>
          <button className="btn btn-ghost icon" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 0 && (
            <>
              <div className="field">
                <div className="field-label">Клиент</div>
                <div className="input-with-icon">
                  <Icon name="search" />
                  <input className="input" placeholder="Имя или телефон" value={client} onChange={e => setClient(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>Недавние</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {clients.slice(0, 4).map(c => (
                    <button type="button" key={c.id} className="li-row" onClick={() => { setClient(c.name); setError(''); setStep(1); }}>
                      <Avatar name={c.name} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.phone}</div>
                      </div>
                      <span className="mono muted">{c.visits} визит.</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-soft" style={{ flex: 1 }} onClick={addClient}><Icon name="plus" size={13} /> Создать нового клиента</button>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="field">
                <div className="field-label">Услуга</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {services.filter(s => s.active).slice(0, 6).map(s => (
                    <button type="button" key={s.id} className={`li-row ${service === s.id ? 'active' : ''}`} onClick={() => { setService(s.id); setError(''); setStep(2); }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.dur} мин · {s.price ? `${s.price.toLocaleString('ru-RU')} ₽` : 'бесплатно'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="grid-2">
                <div className="field">
                  <div className="field-label">Дата</div>
                  <input className="input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="field">
                  <div className="field-label">Время</div>
                  <input className="input" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <div className="field-label">Заметки</div>
                <textarea className="textarea" placeholder="Например: первое посещение, чувствительная кожа головы." value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check on={true} />
                <span style={{ fontSize: 13 }}>Отправить клиенту подтверждение в чат</span>
              </div>
              <div className="card" style={{ background: 'var(--surface-2)', padding: 14 }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Запись</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{client || 'Клиент'} · {selectedService?.name || 'Услуга'}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>{date}, {time}</div>
              </div>
            </>
          )}
        </div>
        {error && <div style={{ padding: '0 20px 10px', color: 'var(--danger)', fontSize: 12.5 }}>{error}</div>}
        <div className="modal-foot">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Назад</button>}
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          {step < 2
            ? <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext}>Далее</button>
            : <button className="btn btn-primary" onClick={saveBooking} disabled={saving || saved}>{saving ? 'Сохраняем...' : saved ? <><SuccessCheck active size={14} /> Готово</> : 'Записать'}</button>}
        </div>
      </div>
    </div>
  );
}

/* ================== App root ================== */
const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "clay",
  "density": "default",
  "radius": "default",
  "showSubscriptionBanner": false
}/*EDITMODE-END*/;


function lockDesktopThemeTransitions() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.dataset.desktopThemeSwitching = 'true';
  window.clearTimeout(window.__clickbookDesktopThemeLockTimer);
  window.__clickbookDesktopThemeLockTimer = window.setTimeout(() => {
    delete document.documentElement.dataset.desktopThemeSwitching;
  }, 120);
}

function applyDesktopChromeTheme(preferences, options = {}) {
  if (typeof document === 'undefined') return;
  if (options.lockTransitions) lockDesktopThemeTransitions();
  const theme = preferences?.theme === 'dark' ? 'dark' : 'light';
  const shellPalette = theme === 'dark'
    ? { bg: '#131316', text: '#ECEDEF' }
    : { bg: '#F4F4F6', text: '#1A1B1E' };
  const root = document.documentElement;
  root.dataset.desktopScreen = 'true';
  root.dataset.theme = theme;
  root.dataset.accent = preferences?.accent || 'clay';
  root.dataset.density = preferences?.density || 'default';
  root.dataset.radius = preferences?.radius || 'default';
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme !== 'dark');
  root.style.setProperty('background', shellPalette.bg, 'important');
  root.style.setProperty('color-scheme', theme);
  document.body.style.setProperty('background', shellPalette.bg, 'important');
  document.body.style.setProperty('background-color', shellPalette.bg, 'important');
  document.body.style.setProperty('color', shellPalette.text, 'important');
  const desktopRoot = document.querySelector('.cb-desktop-html');
  if (desktopRoot) {
    desktopRoot.setAttribute('data-theme', theme);
    desktopRoot.setAttribute('data-accent', preferences?.accent || 'clay');
    desktopRoot.setAttribute('data-density', preferences?.density || 'default');
    desktopRoot.setAttribute('data-radius', preferences?.radius || 'default');
  }
}

const DESKTOP_DEMO_LS_KEY = 'clickbook.desktop.mode.v1';
const DESKTOP_SIDEBAR_COLLAPSED_LS_KEY = 'clickbook.desktop.sidebar-collapsed.v1';

export default function DesktopHtmlExactApp({ initialPage = 'dashboard' }) {
  useDesktopModalWindowBehavior();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoMode = searchParams?.get('demo') === '1';

  // Rehydrate the desktop mode preference from localStorage on first load so a
  // direct visit to /desktop/... remembers the previously chosen mode.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (searchParams?.has('demo')) return;
    try {
      const stored = window.localStorage.getItem(DESKTOP_DEMO_LS_KEY);
      if (stored === 'demo') {
        const next = new URLSearchParams(searchParams?.toString() || '');
        next.set('demo', '1');
        router.replace(`${window.location.pathname}?${next.toString()}`);
      }
    } catch (err) { /* localStorage unavailable */ void err; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const platform = useDesktopPlatform(DEFAULT_TWEAKS, { demoMode });
  const [page, setRawPage] = useState(() => getInitialDesktopPage(initialPage));
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(DESKTOP_SIDEBAR_COLLAPSED_LS_KEY) === '1';
    } catch (err) { /* localStorage unavailable */ void err; return false; }
  });
  const initialHtmlDarkClass = useRef(null);
  const initialHtmlLightClass = useRef(null);
  const initialRootStyle = useRef(null);
  const initialBodyStyle = useRef(null);
  const tweaks = platform.preferences;
  const setTweak = platform.setPreference;
  const setDesktopTweak = useCallback((keyOrObject, value) => {
    const patch = typeof keyOrObject === 'object' ? keyOrObject : { [keyOrObject]: value };
    const nextPreferences = { ...tweaks, ...patch };
    applyDesktopChromeTheme(nextPreferences, { lockTransitions: Object.prototype.hasOwnProperty.call(patch, 'theme') });
    setTweak(keyOrObject, value);
  }, [setTweak, tweaks]);
  const searchResults = useMemo(() => buildSearchResults(search, platform), [search, platform]);

  // Keep next-themes in sync with the desktop preference so embedded dashboard
  // pages (which call useTheme() from next-themes) render in the same mode.
  const { setTheme: setNextTheme } = useNextTheme();
  useLayoutEffect(() => {
    applyDesktopChromeTheme(tweaks);
    setNextTheme(tweaks.theme === 'dark' ? 'dark' : 'light');
  }, [tweaks, setNextTheme]);

  useEffect(() => {
    const syncPageFromLocation = () => {
      const next = getInitialDesktopPage(initialPage);
      setRawPage((current) => current === next ? current : next);
    };
    syncPageFromLocation();
    window.addEventListener('popstate', syncPageFromLocation);
    return () => window.removeEventListener('popstate', syncPageFromLocation);
  }, [initialPage]);

  useEffect(() => {
    document.documentElement.dataset.desktopPage = page;
    document.body.dataset.desktopPage = page;
    return () => {
      delete document.documentElement.dataset.desktopPage;
      delete document.body.dataset.desktopPage;
    };
  }, [page]);

  const setPage = useCallback((nextPage) => {
    const normalized = normalizeInitialPage(nextPage);
    const nextRoute = pageToRoute[normalized] || 'dashboard';
    const query = typeof window !== 'undefined' ? window.location.search : '';
    const nextUrl = `/desktop/${nextRoute}${query || ''}`;

    setRawPage((current) => current === normalized ? current : normalized);

    if (typeof window !== 'undefined') {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl !== nextUrl) {
        window.history.pushState({ clickbookDesktopPage: normalized }, '', nextUrl);
      }
    } else {
      router.push(nextUrl);
    }
  }, [router]);

  useLayoutEffect(() => {
    if (initialHtmlDarkClass.current === null) {
      initialHtmlDarkClass.current = document.documentElement.classList.contains('dark');
      initialHtmlLightClass.current = document.documentElement.classList.contains('light');
      initialRootStyle.current = {
        background: document.documentElement.style.getPropertyValue('background'),
        colorScheme: document.documentElement.style.getPropertyValue('color-scheme'),
      };
      initialBodyStyle.current = {
        background: document.body.style.getPropertyValue('background'),
        backgroundColor: document.body.style.getPropertyValue('background-color'),
        color: document.body.style.getPropertyValue('color'),
      };
    }
    applyDesktopChromeTheme(tweaks);
    return () => {
      delete document.documentElement.dataset.desktopScreen;
      if (initialHtmlDarkClass.current) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      if (initialHtmlLightClass.current) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      if (initialRootStyle.current) {
        if (initialRootStyle.current.background) {
          document.documentElement.style.setProperty('background', initialRootStyle.current.background);
        } else {
          document.documentElement.style.removeProperty('background');
        }
        if (initialRootStyle.current.colorScheme) {
          document.documentElement.style.setProperty('color-scheme', initialRootStyle.current.colorScheme);
        } else {
          document.documentElement.style.removeProperty('color-scheme');
        }
      }
      if (initialBodyStyle.current) {
        if (initialBodyStyle.current.background) {
          document.body.style.setProperty('background', initialBodyStyle.current.background);
        } else {
          document.body.style.removeProperty('background');
        }
        if (initialBodyStyle.current.backgroundColor) {
          document.body.style.setProperty('background-color', initialBodyStyle.current.backgroundColor);
        } else {
          document.body.style.removeProperty('background-color');
        }
        if (initialBodyStyle.current.color) {
          document.body.style.setProperty('color', initialBodyStyle.current.color);
        } else {
          document.body.style.removeProperty('color');
        }
      }
    };
  }, [tweaks]);

  useEffect(() => {
    const palette = tweaks.theme === 'dark'
      ? { surface: '#1B1C20', line: 'rgba(255, 255, 255, 0.09)', text: '#ECEDEF' }
      : { surface: '#FFFFFF', line: 'rgba(20, 20, 28, 0.09)', text: '#1A1B1E' };

    const applyInputTheme = () => {
      document.querySelectorAll('.cb-desktop-html .input, .cb-desktop-html .select, .cb-desktop-html .textarea')
        .forEach((node) => {
          node.style.setProperty('background', palette.surface, 'important');
          node.style.setProperty('background-color', palette.surface, 'important');
          node.style.setProperty('border-color', palette.line, 'important');
          node.style.setProperty('box-shadow', `inset 0 0 0 1000px ${palette.surface}`, 'important');
          node.style.setProperty('color', palette.text, 'important');
        });
    };

    applyInputTheme();
    const root = document.querySelector('.cb-desktop-html');
    if (!root) return undefined;

    const observer = new MutationObserver(applyInputTheme);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [tweaks.theme]);

  useEffect(() => {
    const handleAction = (event) => {
      const label = event?.detail?.label;
      if (label) platform.recordAction?.(label);
    };
    window.addEventListener('clickbook-desktop-action', handleAction);
    return () => window.removeEventListener('clickbook-desktop-action', handleAction);
  }, [platform]);

  useEffect(() => {
    const openCommand = () => setCommandOpen(true);
    window.addEventListener('clickbook:open-command-center', openCommand);
    return () => window.removeEventListener('clickbook:open-command-center', openCommand);
  }, []);

  useEffect(() => {
    const openCreate = () => setCreateOpen(true);
    const focusSearch = () => document.querySelector('.topbar input')?.focus();
    const toggleTheme = () => setDesktopTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark');
    const toggleSidebar = (event) => {
      const collapsed = event?.detail?.collapsed;
      setSidebarCollapsed((current) => {
        const next = typeof collapsed === 'boolean' ? collapsed : !current;
        try {
          window.localStorage.setItem(DESKTOP_SIDEBAR_COLLAPSED_LS_KEY, next ? '1' : '0');
        } catch (err) { /* localStorage unavailable */ void err; }
        return next;
      });
    };
    const navigate = (event) => {
      const nextPage = event?.detail?.page;
      if (nextPage) setPage(nextPage);
    };

    window.addEventListener('clickbook:open-create-modal', openCreate);
    window.addEventListener('clickbook:focus-search', focusSearch);
    window.addEventListener('clickbook:toggle-desktop-theme', toggleTheme);
    window.addEventListener('clickbook:toggle-sidebar', toggleSidebar);
    window.addEventListener('clickbook:desktop-navigate', navigate);

    return () => {
      window.removeEventListener('clickbook:open-create-modal', openCreate);
      window.removeEventListener('clickbook:focus-search', focusSearch);
      window.removeEventListener('clickbook:toggle-desktop-theme', toggleTheme);
      window.removeEventListener('clickbook:toggle-sidebar', toggleSidebar);
      window.removeEventListener('clickbook:desktop-navigate', navigate);
    };
  }, [setPage, setDesktopTweak, tweaks.theme]);

  // ⌘K opens command center; / focuses search; n creates new.
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCommandOpen(true); }
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); document.querySelector('.topbar input')?.focus(); }
      if (e.key === 'n' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) setCreateOpen(true);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const pickSearchResult = (result) => {
    if (!result?.page) return;
    setPage(result.page);
    setSearch('');
  };
  const handlePassiveNativeButtonClick = (event) => {
    const target = event.target;
    const button = target?.closest?.('button');
    const label = passiveNativeButtonLabel(button);
    if (label) platform.recordAction?.(label);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <VexaDashboardPage go={setPage} />;
      case 'searches': return <VexaSearchesPage />;
      case 'matches': return <VexaMatchesPage />;
      case 'sources': return <VexaSourcesPage />;
      case 'contacts': return <VexaSimplePage id="contacts" go={setPage} />;
      case 'analytics': return <VexaSimplePage id="analytics" go={setPage} />;
      case 'notifications': return <VexaSimplePage id="notifications" go={setPage} />;
      case 'payments': return <VexaSimplePage id="payments" go={setPage} />;
      case 'subscription': return <VexaSubscriptionPage />;
      case 'settings':
      case 'account':
        return <VexaSettingsPage />;
      case 'calendar':  return <CalendarPage platform={platform} setPage={setPage} onCreate={() => setCreateOpen(true)} />;
      case 'chats':     return <ChatsPage platform={platform} setPage={setPage} onCreate={() => setCreateOpen(true)} onNotif={() => setNotifOpen(true)} onToggleTheme={() => setDesktopTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark')} theme={tweaks.theme} />;
      case 'clients':   return <DesktopDashboardTransferPage page="clients" />;
      case 'services':  return <DesktopDashboardTransferPage page="services" />;
      case 'public':    return <PublicPage tweaks={tweaks} platform={platform} />;
      case 'appearance':return <DesktopDashboardTransferPage page="appearance" />;
      case 'availability':
      case 'profile':
      case 'templates':
      case 'integrations':
      case 'reviews':
      case 'finance':
      case 'marketing':
      case 'limits':
        return <DesktopDashboardTransferPage page={page} />;
      case 'help':
        return <VexaSimplePage id="help" go={setPage} />;
      default: return null;
    }
  };

  // Public preview is full-bleed. Chats stay inside the normal desktop shell,
  // but force the left navigation into icon-only mode so the chat ecosystem
  // occupies the main rounded workspace.
  const chatMode = page === 'chats';
  const chatPage = page === 'chats';
  const vexaPage = VEXA_PAGES.has(page);
  const shellSidebarCollapsed = chatMode || sidebarCollapsed;
  const flush = page === 'public' || chatMode;
  const dashboardTransferPage = !vexaPage && page !== 'public' && page !== 'chats' && page !== 'calendar';

  const popupOpen = Boolean(notifOpen || commandOpen || createOpen || search.trim());

  return (
    <div
      className="cb-desktop-html"
      data-theme={tweaks.theme}
      data-accent={tweaks.accent}
      data-density={tweaks.density}
      data-radius={tweaks.radius}
      data-sidebar-collapsed={shellSidebarCollapsed ? 'true' : 'false'}
      data-popup-open={popupOpen ? 'true' : 'false'}
    >
      <div className={`app ${chatMode ? 'chat-docked-mode' : ''}`} data-screen-label={`Page: ${page}`}>
      <Sidebar page={page} setPage={setPage} collapsed={shellSidebarCollapsed} />
      <div className="main">
        <Topbar page={page} setPage={setPage} search={search} setSearch={setSearch}
          onNotif={() => setNotifOpen(true)}
          theme={tweaks.theme}
          onToggleTheme={() => setDesktopTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark')}
          unreadNotifications={(platform.notifications || []).filter((item) => item.unread).length}
          master={platform.master} />
        <GlobalSearchResults query={search} results={searchResults} onPick={pickSearchResult} />
        <main className={`content ${flush ? 'flush wide' : ''} ${chatPage ? 'chat-content' : ''} ${dashboardTransferPage ? 'dashboard-transfer-content' : ''}`} key={page}>
          {vexaPage ? <VexaAuthGate>{renderPage()}</VexaAuthGate> : renderPage()}
        </main>
      </div>
      <NotifPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={platform.notifications}
        onMarkRead={() => platform.markNotificationsRead?.()}
        onOpenAll={() => { setNotifOpen(false); setPage('notifications'); }}
      />
      <CommandCenter
        key={commandOpen ? 'command-open' : 'command-closed'}
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        platform={platform}
        setPage={setPage}
        onToggleTheme={() => setDesktopTweak('theme', tweaks.theme === 'dark' ? 'light' : 'dark')}
        tweaks={tweaks}
      />
      <CreateModal key={createOpen ? 'create-open' : 'create-closed'} open={createOpen} onClose={() => setCreateOpen(false)} platform={platform} />
      <DesktopToasts notifications={platform.notifications} />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Тема">
          <TweakRadio label="Режим"
            options={[{value:'light',label:'Светлая'},{value:'dark',label:'Тёмная'}]}
            value={tweaks.theme} onChange={v => setTweak('theme', v)} />
        </TweakSection>
        <TweakSection label="Acc­ent цвет">
          <TweakSelect label="Палитра" value={tweaks.accent}
            options={[
              {value:'clay',   label:'Глина (тёплый коралл)'},
              {value:'sage',   label:'Шалфей (зелёный)'},
              {value:'indigo', label:'Индиго (синий)'},
              {value:'plum',   label:'Слива (розово-лиловый)'},
              {value:'amber',  label:'Янтарь (тёплый жёлтый)'},
            ]}
            onChange={v => setDesktopTweak('accent', v)} />
        </TweakSection>
        <TweakSection label="Плотность">
          <TweakRadio label="Density"
            options={[{value:'compact',label:'Плотно'},{value:'default',label:'Норма'},{value:'cozy',label:'Свободно'}]}
            value={tweaks.density} onChange={v => setDesktopTweak('density', v)} />
        </TweakSection>
        <TweakSection label="Скругления">
          <TweakRadio label="Radius"
            options={[{value:'sharp',label:'Острые'},{value:'default',label:'Норма'},{value:'round',label:'Круглые'}]}
            value={tweaks.radius} onChange={v => setDesktopTweak('radius', v)} />
        </TweakSection>
      </TweaksPanel>
      </div>
    </div>
  );
}
