/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');

const windowStateChannel = 'clickbook-desktop:window-state';

contextBridge.exposeInMainWorld('clickbookDesktop', {
  isDesktop: true,
  platform: process.platform,
  minimize: () => ipcRenderer.invoke('clickbook-desktop:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('clickbook-desktop:toggle-maximize'),
  close: () => ipcRenderer.invoke('clickbook-desktop:close'),
  isMaximized: () => ipcRenderer.invoke('clickbook-desktop:is-maximized'),
  openExternal: (url) => ipcRenderer.invoke('clickbook-desktop:open-external', url),
  reload: () => ipcRenderer.invoke('clickbook-desktop:reload'),
  goHome: () => ipcRenderer.invoke('clickbook-desktop:go-home'),
  getAppInfo: () => ipcRenderer.invoke('clickbook-desktop:get-app-info'),
  onWindowState: (callback) => {
    if (typeof callback !== 'function') return () => {};

    const handler = (_event, state) => callback(state);
    ipcRenderer.on(windowStateChannel, handler);

    return () => {
      ipcRenderer.removeListener(windowStateChannel, handler);
    };
  },
});

function injectFallbackTitlebar() {
  try {
    if (document.querySelector('.clickbook-desktop-titlebar')) return;
    if (document.getElementById('clickbook-electron-fallback-titlebar')) return;
    if (!window.clickbookDesktop?.isDesktop) return;

    document.documentElement.dataset.clickbookDesktop = 'true';
    document.body.dataset.clickbookDesktop = 'true';

    const style = document.createElement('style');
    style.id = 'clickbook-electron-fallback-titlebar-style';
    style.textContent = `
      :root { --clickbook-desktop-titlebar-height: 36px; }

      html[data-clickbook-desktop='true'] body {
        padding-top: var(--clickbook-desktop-titlebar-height) !important;
        background: #eef4f9 !important;
      }

      #clickbook-electron-fallback-titlebar {
        position: fixed;
        inset: 0 0 auto 0;
        z-index: 2147483647;
        height: var(--clickbook-desktop-titlebar-height);
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;
        gap: 14px;
        padding-left: 8px;
        color: #4c4f69;
        background: #eef4f9;
        border-bottom: 1px solid #d9e1ea;
        box-shadow: none;
        font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        user-select: none;
        -webkit-user-select: none;
        -webkit-app-region: drag;
      }

      .clickbook-electron-fallback-titlebar__drag {
        width: 100%;
        height: 100%;
      }

      .clickbook-electron-fallback-titlebar__nav {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 100%;
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__navButton {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        padding: 0;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: #72768f;
        cursor: default;
        transition: background-color 140ms ease, color 140ms ease;
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__navButton:hover,
      .clickbook-electron-fallback-titlebar__navButton[aria-pressed='true'] {
        background: #eff1f5;
        color: #4c4f69;
      }

      .clickbook-electron-fallback-titlebar__sidebarIcon {
        position: relative;
        width: 15px;
        height: 13px;
        display: block;
        border: 1.5px solid currentColor;
        border-radius: 3px;
      }

      .clickbook-electron-fallback-titlebar__sidebarIcon::before {
        position: absolute;
        top: 1px;
        bottom: 1px;
        left: 4px;
        width: 1.5px;
        border-radius: 999px;
        background: currentColor;
        content: '';
      }

      .clickbook-electron-fallback-titlebar__chevron {
        width: 8px;
        height: 8px;
        display: block;
        border-top: 1.6px solid currentColor;
        border-left: 1.6px solid currentColor;
      }

      .clickbook-electron-fallback-titlebar__chevron--left {
        transform: rotate(-45deg) translate(1px, 1px);
      }

      .clickbook-electron-fallback-titlebar__chevron--right {
        transform: rotate(135deg) translate(1px, 1px);
      }

      .clickbook-electron-fallback-titlebar__brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 100%;
        min-width: 128px;
        padding: 0;
        border: 0;
        background: transparent;
        color: #4c4f69;
        font: inherit;
        white-space: nowrap;
        cursor: default;
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__brandLogo {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 7px;
        background: #eff1f5;
      }

      .clickbook-electron-fallback-titlebar__brandLogo img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }

      .clickbook-electron-fallback-titlebar__brandLogo--light {
        display: none;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__brand,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__brand {
        color: #ffffff;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__brandLogo--dark,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__brandLogo--dark {
        display: none;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__brandLogo--light,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__brandLogo--light {
        display: grid;
      }

      .clickbook-electron-fallback-titlebar__brandText {
        display: grid;
        gap: 1px;
        min-width: 0;
      }

      .clickbook-electron-fallback-titlebar__brandName {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11.5px;
        font-weight: 760;
        line-height: 1;
      }

      .clickbook-electron-fallback-titlebar__brandMeta {
        overflow: hidden;
        text-overflow: ellipsis;
        color: #9398aa;
        font-size: 8px;
        font-weight: 650;
        line-height: 1;
      }

      .clickbook-electron-fallback-titlebar__menu {
        display: inline-flex;
        align-items: center;
        gap: 18px;
        max-width: min(54vw, 560px);
        height: 100%;
        overflow: visible;
        color: #72768f;
        font-size: 11px;
        font-weight: 500;
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__menuItem {
        position: relative;
        flex: 0 0 auto;
      }

      .clickbook-electron-fallback-titlebar__menuButton {
        height: 24px;
        padding: 0 2px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: default;
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__dropdown {
        position: absolute;
        top: calc(100% - 4px);
        left: 0;
        z-index: 2147483647;
        display: none;
        min-width: 226px;
        padding: 6px;
        border: 1px solid #d9e1ea;
        border-radius: 10px;
        background: #f1f3f6;
        color: #4c4f69;
        box-shadow: 0 18px 48px rgba(42, 51, 66, 0.16);
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__menuItem:hover .clickbook-electron-fallback-titlebar__dropdown,
      .clickbook-electron-fallback-titlebar__menuItem:focus-within .clickbook-electron-fallback-titlebar__dropdown {
        display: block;
      }

      .clickbook-electron-fallback-titlebar__dropdownItem {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        min-height: 30px;
        padding: 0 9px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: default;
      }

      .clickbook-electron-fallback-titlebar__dropdownItem:hover {
        background: #eff1f5;
      }

      .clickbook-electron-fallback-titlebar__dropdownItem kbd {
        color: #9398aa;
        font: inherit;
        font-size: 10px;
      }

      .clickbook-electron-fallback-titlebar__dropdownSeparator {
        height: 1px;
        margin: 6px;
        background: #d9e1ea;
      }

      .clickbook-electron-fallback-titlebar__controls {
        display: inline-flex;
        align-items: stretch;
        height: 100%;
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__control {
        position: relative;
        display: grid;
        width: 42px;
        height: 100%;
        place-items: center;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: #4c4f69;
        cursor: default;
        transition: background-color 140ms ease, color 140ms ease;
        -webkit-app-region: no-drag;
      }

      .clickbook-electron-fallback-titlebar__control:hover {
        background: #eff1f5;
        color: #4c4f69;
      }

      .clickbook-electron-fallback-titlebar__control--close:hover {
        background: #2d2d2d;
        color: #fff;
      }

      html[data-theme='dark'] body,
      html[data-clickbook-desktop-theme='dark'] body {
        background: #181818 !important;
      }

      html[data-theme='dark'] #clickbook-electron-fallback-titlebar,
      html[data-clickbook-desktop-theme='dark'] #clickbook-electron-fallback-titlebar {
        color: #ffffff;
        background: #1b2126;
        border-bottom-color: #3a4147;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__menu,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__menu {
        color: #99a2ad;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__navButton,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__navButton {
        color: #c8ced6;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__navButton:hover,
      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__navButton[aria-pressed='true'],
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__navButton:hover,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__navButton[aria-pressed='true'] {
        background: #2d2d2d;
        color: #ffffff;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__dropdown,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__dropdown {
        border-color: #3a4147;
        background: #2d2d2d;
        color: #ffffff;
        box-shadow: 0 18px 54px rgba(0,0,0,.32);
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__dropdownItem:hover,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__dropdownItem:hover {
        background: #181818;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__dropdownSeparator,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__dropdownSeparator {
        background: #3a4147;
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__control,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__control {
        background: transparent;
        border: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        color: rgba(236, 237, 239, 0.54);
      }

      html[data-theme='dark'] .clickbook-electron-fallback-titlebar__control:hover,
      html[data-clickbook-desktop-theme='dark'] .clickbook-electron-fallback-titlebar__control:hover {
        border: 0;
        background: rgba(255, 255, 255, 0.055);
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        color: #ffffff;
      }

      .clickbook-electron-fallback-titlebar__icon {
        position: relative;
        display: block;
        width: 12px;
        height: 12px;
      }

      .clickbook-electron-fallback-titlebar__icon--minimize::before {
        position: absolute;
        left: 1px;
        right: 1px;
        bottom: 2px;
        height: 1.5px;
        border-radius: 999px;
        background: currentColor;
        content: '';
      }

      .clickbook-electron-fallback-titlebar__icon--maximize::before {
        position: absolute;
        inset: 1px;
        border: 1.5px solid currentColor;
        border-radius: 2px;
        content: '';
      }

      .clickbook-electron-fallback-titlebar__icon--close::before,
      .clickbook-electron-fallback-titlebar__icon--close::after {
        position: absolute;
        top: 5px;
        left: 1px;
        width: 10px;
        height: 1.5px;
        border-radius: 999px;
        background: currentColor;
        content: '';
      }

      .clickbook-electron-fallback-titlebar__icon--close::before { transform: rotate(45deg); }
      .clickbook-electron-fallback-titlebar__icon--close::after { transform: rotate(-45deg); }
    `;

    const titlebar = document.createElement('div');
    titlebar.id = 'clickbook-electron-fallback-titlebar';
    titlebar.innerHTML = `
      <div class="clickbook-electron-fallback-titlebar__nav" aria-label="Навигация окна">
        <button type="button" class="clickbook-electron-fallback-titlebar__navButton" id="clickbook-electron-sidebar" aria-label="Скрыть меню" aria-pressed="false">
          <span class="clickbook-electron-fallback-titlebar__sidebarIcon"></span>
        </button>
        <button type="button" class="clickbook-electron-fallback-titlebar__navButton" id="clickbook-electron-back" aria-label="Назад">
          <span class="clickbook-electron-fallback-titlebar__chevron clickbook-electron-fallback-titlebar__chevron--left"></span>
        </button>
        <button type="button" class="clickbook-electron-fallback-titlebar__navButton" id="clickbook-electron-forward" aria-label="Вперед">
          <span class="clickbook-electron-fallback-titlebar__chevron clickbook-electron-fallback-titlebar__chevron--right"></span>
        </button>
      </div>
      <div class="clickbook-electron-fallback-titlebar__menu" aria-hidden="true">
        <span>Файл</span><span>Правка</span><span>Вид</span><span>Окно</span><span>Справка</span>
      </div>
      <div class="clickbook-electron-fallback-titlebar__drag" aria-hidden="true"></div>
      <div class="clickbook-electron-fallback-titlebar__controls" aria-label="Управление окном">
        <button type="button" class="clickbook-electron-fallback-titlebar__control" id="clickbook-electron-minimize" aria-label="Свернуть">
          <span class="clickbook-electron-fallback-titlebar__icon clickbook-electron-fallback-titlebar__icon--minimize"></span>
        </button>
        <button type="button" class="clickbook-electron-fallback-titlebar__control" id="clickbook-electron-maximize" aria-label="Развернуть">
          <span class="clickbook-electron-fallback-titlebar__icon clickbook-electron-fallback-titlebar__icon--maximize"></span>
        </button>
        <button type="button" class="clickbook-electron-fallback-titlebar__control clickbook-electron-fallback-titlebar__control--close" id="clickbook-electron-close" aria-label="Закрыть">
          <span class="clickbook-electron-fallback-titlebar__icon clickbook-electron-fallback-titlebar__icon--close"></span>
        </button>
      </div>
    `;

    document.head.appendChild(style);
    document.body.prepend(titlebar);

    const fallbackMenu = titlebar.querySelector('.clickbook-electron-fallback-titlebar__menu');
    if (fallbackMenu) {
      fallbackMenu.removeAttribute('aria-hidden');
      fallbackMenu.setAttribute('aria-label', 'Меню приложения');
      fallbackMenu.innerHTML = `
        <div class="clickbook-electron-fallback-titlebar__menuItem">
          <button type="button" class="clickbook-electron-fallback-titlebar__menuButton">Файл</button>
          <div class="clickbook-electron-fallback-titlebar__dropdown">
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-new"><span>Новый поиск</span><kbd>N</kbd></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-home"><span>Главная</span></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-public"><span>Совпадения</span></button>
            <div class="clickbook-electron-fallback-titlebar__dropdownSeparator"></div>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-reload"><span>Перезагрузить</span><kbd>Ctrl R</kbd></button>
          </div>
        </div>
        <div class="clickbook-electron-fallback-titlebar__menuItem">
          <button type="button" class="clickbook-electron-fallback-titlebar__menuButton">Правка</button>
          <div class="clickbook-electron-fallback-titlebar__dropdown">
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-search"><span>Поиск</span><kbd>/</kbd></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-command"><span>Командный центр</span><kbd>Ctrl K</kbd></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-copy"><span>Скопировать ссылку</span></button>
          </div>
        </div>
        <div class="clickbook-electron-fallback-titlebar__menuItem">
          <button type="button" class="clickbook-electron-fallback-titlebar__menuButton">Вид</button>
          <div class="clickbook-electron-fallback-titlebar__dropdown">
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-theme"><span>Переключить тему</span></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-appearance"><span>Источники</span></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-notifications"><span>Уведомления</span></button>
          </div>
        </div>
        <div class="clickbook-electron-fallback-titlebar__menuItem">
          <button type="button" class="clickbook-electron-fallback-titlebar__menuButton">Окно</button>
          <div class="clickbook-electron-fallback-titlebar__dropdown">
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-minimize"><span>Свернуть</span></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-maximize"><span>Развернуть / восстановить</span></button>
            <div class="clickbook-electron-fallback-titlebar__dropdownSeparator"></div>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-close"><span>Закрыть окно</span></button>
          </div>
        </div>
        <div class="clickbook-electron-fallback-titlebar__menuItem">
          <button type="button" class="clickbook-electron-fallback-titlebar__menuButton">Справка</button>
          <div class="clickbook-electron-fallback-titlebar__dropdown">
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-help"><span>Помощь</span></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-account"><span>Аккаунт</span></button>
            <button type="button" class="clickbook-electron-fallback-titlebar__dropdownItem" id="clickbook-electron-menu-subscription"><span>Подписка</span></button>
          </div>
        </div>
      `;
    }

    const dispatchDesktop = (name, detail) => {
      window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
    };
    const navigateDesktop = (page) => dispatchDesktop('clickbook:desktop-navigate', { page });
    document.getElementById('clickbook-electron-menu-new')?.addEventListener('click', () => navigateDesktop('searches'));
    document.getElementById('clickbook-electron-menu-home')?.addEventListener('click', () => navigateDesktop('dashboard'));
    document.getElementById('clickbook-electron-menu-public')?.addEventListener('click', () => navigateDesktop('matches'));
    document.getElementById('clickbook-electron-menu-reload')?.addEventListener('click', () => window.clickbookDesktop?.reload());
    document.getElementById('clickbook-electron-menu-search')?.addEventListener('click', () => dispatchDesktop('clickbook:focus-search'));
    document.getElementById('clickbook-electron-menu-command')?.addEventListener('click', () => dispatchDesktop('clickbook:open-command-center'));
    document.getElementById('clickbook-electron-menu-copy')?.addEventListener('click', () => navigator.clipboard?.writeText(window.location.href));
    document.getElementById('clickbook-electron-menu-theme')?.addEventListener('click', () => dispatchDesktop('clickbook:toggle-desktop-theme'));
    document.getElementById('clickbook-electron-menu-appearance')?.addEventListener('click', () => navigateDesktop('sources'));
    document.getElementById('clickbook-electron-menu-notifications')?.addEventListener('click', () => navigateDesktop('notifications'));
    document.getElementById('clickbook-electron-menu-minimize')?.addEventListener('click', () => window.clickbookDesktop?.minimize());
    document.getElementById('clickbook-electron-menu-maximize')?.addEventListener('click', () => window.clickbookDesktop?.toggleMaximize());
    document.getElementById('clickbook-electron-menu-close')?.addEventListener('click', () => window.clickbookDesktop?.close());
    document.getElementById('clickbook-electron-menu-help')?.addEventListener('click', () => navigateDesktop('help'));
    document.getElementById('clickbook-electron-menu-account')?.addEventListener('click', () => navigateDesktop('account'));
    document.getElementById('clickbook-electron-menu-subscription')?.addEventListener('click', () => navigateDesktop('subscription'));

    document.getElementById('clickbook-electron-sidebar')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const collapsed = button?.getAttribute('aria-pressed') !== 'true';
      button?.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
      button?.setAttribute('aria-label', collapsed ? 'Показать меню' : 'Скрыть меню');
      dispatchDesktop('clickbook:toggle-sidebar', { collapsed });
    });
    document.getElementById('clickbook-electron-back')?.addEventListener('click', () => window.history.back());
    document.getElementById('clickbook-electron-forward')?.addEventListener('click', () => window.history.forward());
    document.getElementById('clickbook-electron-minimize')?.addEventListener('click', () => window.clickbookDesktop?.minimize());
    document.getElementById('clickbook-electron-maximize')?.addEventListener('click', () => window.clickbookDesktop?.toggleMaximize());
    document.getElementById('clickbook-electron-close')?.addEventListener('click', () => window.clickbookDesktop?.close());
    titlebar.addEventListener('dblclick', (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('button')) return;
      window.clickbookDesktop?.toggleMaximize();
    });
  } catch {
    // Never break the loaded Next.js app because of desktop chrome fallback.
  }
}

function scheduleFallbackTitlebarInjection() {
  // Important: do not mutate DOM before Next.js hydration. The delay makes this
  // safe for remote builds that do not contain the React DesktopTitlebar yet.
  window.setTimeout(injectFallbackTitlebar, 1400);
  window.setTimeout(injectFallbackTitlebar, 3000);
}

if (document.readyState === 'complete') {
  scheduleFallbackTitlebarInjection();
} else {
  window.addEventListener('load', scheduleFallbackTitlebarInjection, { once: true });
}
