'use client';

import { useEffect, useState } from 'react';

type DesktopState = {
  focused: boolean;
  maximized: boolean;
  fullscreen: boolean;
};

type MenuAction =
  | 'create'
  | 'home'
  | 'public'
  | 'reload'
  | 'search'
  | 'command'
  | 'copy-link'
  | 'toggle-theme'
  | 'toggle-sidebar'
  | 'back'
  | 'forward'
  | 'appearance'
  | 'notifications'
  | 'minimize'
  | 'toggle-maximize'
  | 'close'
  | 'help'
  | 'account'
  | 'subscription';

type MenuEntry = {
  label: string;
  action?: MenuAction;
  hint?: string;
  separator?: boolean;
};

const TITLEBAR_MENUS: Array<{ id: string; label: string; items: MenuEntry[] }> = [
  {
    id: 'file',
    label: 'Файл',
    items: [
      { label: 'Новая запись', action: 'create', hint: 'N' },
      { label: 'Главная', action: 'home' },
      { label: 'Публичная страница', action: 'public' },
      { separator: true, label: 'sep-file' },
      { label: 'Перезагрузить', action: 'reload', hint: 'Ctrl R' },
    ],
  },
  {
    id: 'edit',
    label: 'Правка',
    items: [
      { label: 'Поиск', action: 'search', hint: '/' },
      { label: 'Командный центр', action: 'command', hint: 'Ctrl K' },
      { label: 'Скопировать ссылку', action: 'copy-link' },
    ],
  },
  {
    id: 'view',
    label: 'Вид',
    items: [
      { label: 'Переключить тему', action: 'toggle-theme' },
      { label: 'Внешний вид', action: 'appearance' },
      { label: 'Уведомления', action: 'notifications' },
    ],
  },
  {
    id: 'window',
    label: 'Окно',
    items: [
      { label: 'Свернуть', action: 'minimize' },
      { label: 'Развернуть / восстановить', action: 'toggle-maximize' },
      { separator: true, label: 'sep-window' },
      { label: 'Закрыть окно', action: 'close' },
    ],
  },
  {
    id: 'help',
    label: 'Справка',
    items: [
      { label: 'Помощь', action: 'help' },
      { label: 'Аккаунт', action: 'account' },
      { label: 'Подписка', action: 'subscription' },
    ],
  },
];

function dispatchDesktopEvent(name: string, detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}

export function DesktopTitlebar() {
  const [enabled, setEnabled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [state, setState] = useState<DesktopState>({
    focused: true,
    maximized: false,
    fullscreen: false,
  });

  useEffect(() => {
    const api = window.clickbookDesktop;
    if (!api?.isDesktop) return;

    let disposed = false;
    window.queueMicrotask(() => {
      if (!disposed) setEnabled(true);
    });

    document.documentElement.dataset.clickbookDesktop = 'true';
    document.body.dataset.clickbookDesktop = 'true';

    const syncDesktopTheme = () => {
      const desktopTheme =
        document.querySelector('.cb-desktop-html')?.getAttribute('data-theme') ||
        document.documentElement.getAttribute('data-theme') ||
        (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

      document.documentElement.dataset.clickbookDesktopTheme =
        desktopTheme === 'dark' ? 'dark' : 'light';
    };

    const themeObserver = new MutationObserver(syncDesktopTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
      childList: true,
      subtree: true,
    });
    syncDesktopTheme();

    void api.isMaximized().then((maximized) => {
      setState((current) => ({ ...current, maximized }));
    });

    const unsubscribe = api.onWindowState((nextState) => {
      setState(nextState);
    });

    return () => {
      disposed = true;
      unsubscribe?.();
      themeObserver.disconnect();
      delete document.documentElement.dataset.clickbookDesktop;
      delete document.documentElement.dataset.clickbookDesktopTheme;
      delete document.body.dataset.clickbookDesktop;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const closeOnPointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('.clickbook-desktop-titlebar__menu')) return;
      setOpenMenu(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };

    window.addEventListener('pointerdown', closeOnPointer);
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('pointerdown', closeOnPointer);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [enabled]);

  if (!enabled) return null;

  const toggleMenu = (menuId: string, trigger: HTMLButtonElement) => {
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 246;
    setDropdownLeft(Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)));
    setOpenMenu((current) => (current === menuId ? null : menuId));
  };

  const runAction = (action?: MenuAction) => {
    if (!action) return;
    setOpenMenu(null);

    switch (action) {
      case 'create':
        dispatchDesktopEvent('clickbook:open-create-modal');
        break;
      case 'home':
        dispatchDesktopEvent('clickbook:desktop-navigate', { page: 'dashboard' });
        break;
      case 'public':
        dispatchDesktopEvent('clickbook:desktop-navigate', { page: 'public' });
        break;
      case 'reload':
        void window.clickbookDesktop?.reload?.();
        break;
      case 'search':
        dispatchDesktopEvent('clickbook:focus-search');
        break;
      case 'command':
        dispatchDesktopEvent('clickbook:open-command-center');
        break;
      case 'copy-link':
        void navigator.clipboard?.writeText(window.location.href);
        break;
      case 'toggle-theme':
        dispatchDesktopEvent('clickbook:toggle-desktop-theme');
        break;
      case 'toggle-sidebar': {
        const next = !sidebarCollapsed;
        setSidebarCollapsed(next);
        dispatchDesktopEvent('clickbook:toggle-sidebar', { collapsed: next });
        break;
      }
      case 'back':
        window.history.back();
        break;
      case 'forward':
        window.history.forward();
        break;
      case 'appearance':
        dispatchDesktopEvent('clickbook:desktop-navigate', { page: 'appearance' });
        break;
      case 'notifications':
        dispatchDesktopEvent('clickbook:desktop-navigate', { page: 'notifications' });
        break;
      case 'minimize':
        void window.clickbookDesktop?.minimize();
        break;
      case 'toggle-maximize':
        void window.clickbookDesktop?.toggleMaximize();
        break;
      case 'close':
        void window.clickbookDesktop?.close();
        break;
      case 'help':
        dispatchDesktopEvent('clickbook:desktop-navigate', { page: 'help' });
        break;
      case 'account':
        dispatchDesktopEvent('clickbook:desktop-navigate', { page: 'account' });
        break;
      case 'subscription':
        dispatchDesktopEvent('clickbook:desktop-navigate', { page: 'subscription' });
        break;
    }
  };

  return (
    <>
      <div className="clickbook-desktop-titlebar" data-focused={state.focused ? 'true' : 'false'}>
        <div className="clickbook-desktop-titlebar__nav" aria-label="Навигация окна">
          <button
            type="button"
            className="clickbook-desktop-titlebar__navButton clickbook-desktop-titlebar__navButton--sidebar"
            aria-label={sidebarCollapsed ? 'Показать меню' : 'Скрыть меню'}
            aria-pressed={sidebarCollapsed}
            onClick={() => runAction('toggle-sidebar')}
          >
            <span className="clickbook-desktop-titlebar__sidebarIcon" />
          </button>

          <button
            type="button"
            className="clickbook-desktop-titlebar__navButton"
            aria-label="Назад"
            onClick={() => runAction('back')}
          >
            <span className="clickbook-desktop-titlebar__chevron clickbook-desktop-titlebar__chevron--left" />
          </button>

          <button
            type="button"
            className="clickbook-desktop-titlebar__navButton"
            aria-label="Вперед"
            onClick={() => runAction('forward')}
          >
            <span className="clickbook-desktop-titlebar__chevron clickbook-desktop-titlebar__chevron--right" />
          </button>
        </div>

        <div className="clickbook-desktop-titlebar__menu" aria-label="Меню приложения">
          {TITLEBAR_MENUS.map((menu) => (
            <div className="clickbook-desktop-titlebar__menuItem" key={menu.id}>
              <button
                type="button"
                className="clickbook-desktop-titlebar__menuButton"
                aria-haspopup="menu"
                aria-expanded={openMenu === menu.id}
                onClick={(event) => toggleMenu(menu.id, event.currentTarget)}
              >
                {menu.label}
              </button>

              {openMenu === menu.id && (
                <div
                  className="clickbook-desktop-titlebar__dropdown"
                  role="menu"
                  style={{ left: dropdownLeft }}
                >
                  {menu.items.map((item) => (
                    item.separator ? (
                      <div className="clickbook-desktop-titlebar__dropdownSeparator" key={item.label} />
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        className="clickbook-desktop-titlebar__dropdownItem"
                        key={item.label}
                        onClick={() => runAction(item.action)}
                      >
                        <span>{item.label}</span>
                        {item.hint && <kbd>{item.hint}</kbd>}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="clickbook-desktop-titlebar__drag" aria-hidden="true" />

        <div className="clickbook-desktop-titlebar__controls" aria-label="Управление окном">
          <button
            type="button"
            className="clickbook-desktop-titlebar__control"
            aria-label="Свернуть"
            onClick={() => void window.clickbookDesktop?.minimize()}
          >
            <span className="clickbook-desktop-titlebar__minimize" />
          </button>

          <button
            type="button"
            className="clickbook-desktop-titlebar__control"
            aria-label={state.maximized ? 'Восстановить окно' : 'Развернуть'}
            onClick={() => void window.clickbookDesktop?.toggleMaximize()}
          >
            <span
              className={
                state.maximized
                  ? 'clickbook-desktop-titlebar__restore'
                  : 'clickbook-desktop-titlebar__maximize'
              }
            />
          </button>

          <button
            type="button"
            className="clickbook-desktop-titlebar__control clickbook-desktop-titlebar__control--close"
            aria-label="Закрыть"
            onClick={() => void window.clickbookDesktop?.close()}
          >
            <span className="clickbook-desktop-titlebar__close" />
          </button>
        </div>
      </div>

      <div className="clickbook-desktop-titlebar-spacer" aria-hidden="true" />
    </>
  );
}
