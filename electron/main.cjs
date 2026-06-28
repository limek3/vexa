/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, Menu, ipcMain, shell, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const APP_ID = 'app.vexa.desktop';
const DEFAULT_APP_URL = 'http://localhost:3000/desktop/dashboard';

const isMac = process.platform === 'darwin';
const isDev = !app.isPackaged;
const SPLASH_MIN_VISIBLE_MS = 1900;


function resolveAppUrl() {
  const rawUrl = process.env.ELECTRON_APP_URL || process.env.VEXA_APP_URL || DEFAULT_APP_URL;

  try {
    const url = new URL(rawUrl);
    const isRoot = url.pathname === '/' || url.pathname === '';

    if (isRoot) {
      url.pathname = '/desktop/dashboard';
    }

    if (process.env.VEXA_DESKTOP_DEMO === '1') {
      url.searchParams.set('demo', '1');
    }

    return url.toString();
  } catch {
    return DEFAULT_APP_URL;
  }
}

const EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'tg:', 'vk:']);

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isAllowedExternalUrl(value) {
  const url = parseUrl(value);
  return Boolean(url && EXTERNAL_PROTOCOLS.has(url.protocol));
}

function isWebUrl(value) {
  const url = parseUrl(value);
  return Boolean(url && (url.protocol === 'http:' || url.protocol === 'https:'));
}

function hasSameOrigin(a, b) {
  const urlA = parseUrl(a);
  const urlB = parseUrl(b);
  return Boolean(urlA && urlB && urlA.origin === urlB.origin);
}

function sendWindowState(win) {
  if (!win || win.isDestroyed()) return;

  win.webContents.send('clickbook-desktop:window-state', {
    focused: win.isFocused(),
    maximized: win.isMaximized(),
    fullscreen: win.isFullScreen(),
  });
}


function getAssetDataUrl(filename, mime = 'image/png') {
  try {
    const asset = fs.readFileSync(path.join(__dirname, 'assets', filename));
    return `data:${mime};base64,${asset.toString('base64')}`;
  } catch {
    return '';
  }
}

function createSplashHtml() {
  const logoSrc = getAssetDataUrl('icon.png');
  const messages = [
    'Настраиваем интерфейс...',
    'Синхронизируем данные...',
    'Загружаем поиски...',
    'Проверяем источники...',
    'Готовим рабочее место...',
    'Почти готово...',
  ];

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vexa</title>
  <style>
    @property --ai-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }

    :root {
      color-scheme: light;
      --bg: #f3f4f7;
      --card: #ffffff;
      --brand: #1f2540;
      --muted: #8b94a8;
      --track: #e8eaef;
      --c1: 91, 124, 255;
      --c2: 140, 91, 255;
      --c3: 255, 91, 158;
    }

    * { box-sizing: border-box; }

    html,
    body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
      color: var(--brand);
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .splash {
      width: min(520px, calc(100vw - 40px));
      padding: 56px 48px 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      border: 1px solid rgba(230, 232, 238, 0.78);
      border-radius: 24px;
      background:
        radial-gradient(circle at 50% 0%, rgba(var(--c1), 0.055), transparent 46%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
      box-shadow:
        0 1px 2px rgba(20, 30, 60, 0.04),
        0 18px 40px -12px rgba(20, 30, 60, 0.08);
      backdrop-filter: blur(18px) saturate(145%);
      -webkit-backdrop-filter: blur(18px) saturate(145%);
      -webkit-app-region: drag;
    }

    .ai-logo-wrap {
      --size: 128px;
      --radius: 28px;
      --border: 3px;
      --speed: 2.6s;

      position: relative;
      width: var(--size);
      height: var(--size);
      padding: var(--border);
      isolation: isolate;
      border-radius: var(--radius);
      background:
        conic-gradient(
          from var(--ai-angle),
          rgba(var(--c1), 0) 0deg,
          rgba(var(--c1), 0) 220deg,
          rgba(var(--c1), 0.35) 250deg,
          rgba(var(--c1), 0.90) 285deg,
          rgba(var(--c2), 1) 315deg,
          rgba(var(--c3), 1) 345deg,
          rgba(var(--c3), 0) 360deg
        );
      animation: ai-flow var(--speed) linear infinite;
    }

    @keyframes ai-flow { to { --ai-angle: 360deg; } }

    @supports not (background: conic-gradient(from 0deg, red, red)) {
      .ai-logo-wrap { animation: ai-rotate var(--speed) linear infinite; }
    }

    @keyframes ai-rotate { to { transform: rotate(360deg); } }

    .ai-logo-wrap::before {
      content: '';
      position: absolute;
      inset: -4px;
      z-index: -1;
      border-radius: calc(var(--radius) + 4px);
      background: inherit;
      filter: blur(10px);
      opacity: 0.45;
      pointer-events: none;
    }

    .ai-logo {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: calc(var(--radius) - var(--border));
      background: #1f2540;
    }

    .ai-logo img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
    }

    .brand {
      margin: 0;
      color: var(--brand);
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .status {
      min-height: 20px;
      display: inline-flex;
      margin-top: -12px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 500;
      line-height: 1.35;
      white-space: pre;
    }

    .status .ai-char {
      display: inline-block;
      will-change: transform, opacity, filter;
    }

    @keyframes ai-char-in {
      0% { transform: translateY(6px); opacity: 0; filter: blur(2px); }
      100% { transform: translateY(0); opacity: 1; filter: blur(0); }
    }

    @keyframes ai-char-out {
      0% { transform: translateY(0); opacity: 1; filter: blur(0); }
      100% { transform: translateY(-6px); opacity: 0; filter: blur(2px); }
    }

    .ai-char.in { animation: ai-char-in 450ms cubic-bezier(0.34, 1.45, 0.64, 1) both; }
    .ai-char.out { animation: ai-char-out 300ms cubic-bezier(0.4, 0, 0.6, 1) both; }

    .progress {
      position: relative;
      width: 240px;
      height: 3px;
      margin-top: 4px;
      overflow: hidden;
      border-radius: 2px;
      background: var(--track);
    }

    .progress::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: -40%;
      width: 40%;
      border-radius: inherit;
      background:
        linear-gradient(
          90deg,
          transparent,
          rgba(var(--c1), 1),
          rgba(var(--c2), 1),
          rgba(var(--c3), 1),
          transparent
        );
      animation: progress-run 1.8s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
    }

    @keyframes progress-run {
      0% { left: -40%; }
      100% { left: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .ai-logo-wrap,
      .ai-char.in,
      .ai-char.out,
      .progress::before {
        animation: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="splash">
    <div class="ai-logo-wrap">
      <div class="ai-logo">
        <img src="${logoSrc}" alt="Vexa" />
      </div>
    </div>

    <h1 class="brand">Vexa</h1>
    <span class="status" id="status"></span>
    <div class="progress" aria-hidden="true"></div>
  </div>

  <script>
    const messages = ${JSON.stringify(messages)};
    const container = document.getElementById('status');
    const HOLD_MS = 2200;
    const CHAR_STEP = 18;
    const OUT_MS = 300;
    let idx = 0;

    function renderChars(text) {
      container.innerHTML = '';
      Array.from(text).forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'ai-char in';
        span.style.animationDelay = (i * CHAR_STEP) + 'ms';
        span.textContent = ch === ' ' ? '\\u00A0' : ch;
        container.appendChild(span);
      });
    }

    function animateOut() {
      container.querySelectorAll('.ai-char').forEach((char, i) => {
        char.classList.remove('in');
        char.style.animationDelay = (i * (CHAR_STEP * 0.6)) + 'ms';
        void char.offsetWidth;
        char.classList.add('out');
      });
    }

    function tick() {
      const text = messages[idx];
      renderChars(text);
      setTimeout(animateOut, HOLD_MS);
      const next = HOLD_MS + OUT_MS + text.length * (CHAR_STEP * 0.6);
      setTimeout(() => {
        idx = (idx + 1) % messages.length;
        tick();
      }, next);
    }

    tick();
  </script>
</body>
</html>`;
}
function createSplashWindow() {
  const iconPath = path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const splashWidth = Math.min(620, Math.max(580, workArea.width - 96));
  const splashHeight = Math.min(460, Math.max(430, workArea.height - 96));

  const splash = new BrowserWindow({
    width: splashWidth,
    height: splashHeight,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    frame: false,
    transparent: true,
    center: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    title: 'Vexa',
    icon: iconPath,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: false,
    },
  });

  splash.once('ready-to-show', () => {
    if (!splash.isDestroyed()) splash.show();
  });

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(createSplashHtml())}`).catch(() => {});
  return splash;
}
function loadOfflineScreen(win, appUrl, details) {
  const safeDescription = String(details?.errorDescription || 'Не удалось открыть Vexa.')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
  const offlineLogoSrc = getAssetDataUrl('icon.png');

  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vexa</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #eef4f9;
      color: #4c4f69;
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 0;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      width: min(440px, calc(100vw - 32px));
      border: 1px solid #d9e1ea;
      border-radius: 18px;
      background: #f1f3f6;
      padding: 28px;
      box-shadow: 0 24px 70px rgba(42,51,66,.10);
      backdrop-filter: blur(18px);
    }
    .logo {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: #eff1f5;
      margin-bottom: 18px;
    }
    .logo img { width: 28px; height: 28px; object-fit: contain; }
    h1 { margin: 0; font-size: 24px; line-height: 1.1; }
    p { margin: 12px 0 0; color: #72768f; font-size: 14px; line-height: 1.55; }
    .error { margin-top: 12px; color: #9398aa; font-size: 12px; }
    button {
      margin-top: 22px;
      width: 100%;
      height: 44px;
      border: 0;
      border-radius: 999px;
      background: #4c4f69;
      color: #eef4f9;
      font: inherit;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }
    button:hover { background: #5e6178; }
  </style>
</head>
<body>
  <main class="card">
    <div class="logo"><img src="${offlineLogoSrc}" alt="Vexa" /></div>
    <h1>Не получилось открыть Vexa</h1>
    <p>Проверьте интернет или доступность сервера. Приложение попробует открыть рабочий кабинет заново.</p>
    <div class="error">${safeDescription}</div>
    <button onclick="location.href=${JSON.stringify(appUrl)}">Повторить</button>
  </main>
</body>
</html>`;

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).catch(() => {});
}

function createMainWindow(splashWindow = null, splashStartedAt = Date.now()) {
  const appUrl = resolveAppUrl();
  const iconPath = path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const initialWidth = Math.min(workArea.width, Math.min(1880, Math.max(1640, workArea.width - 40)));
  const initialHeight = Math.min(workArea.height, Math.min(1100, Math.max(980, workArea.height - 36)));

  const win = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    minWidth: 1180,
    minHeight: 780,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    title: 'Vexa',
    icon: iconPath,
    backgroundColor: '#eff1f5',
    vibrancy: isMac ? 'sidebar' : undefined,
    visualEffectState: isMac ? 'active' : undefined,
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: true,
      spellcheck: true,
    },
  });

  win.once('ready-to-show', () => {
    const elapsed = Date.now() - splashStartedAt;
    const delay = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);

    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.show();
        sendWindowState(win);

        if (isDev && process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
          win.webContents.openDevTools({ mode: 'detach' });
        }
      }

      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
    }, delay);
  });

  win.on('maximize', () => sendWindowState(win));
  win.on('unmaximize', () => sendWindowState(win));
  win.on('enter-full-screen', () => sendWindowState(win));
  win.on('leave-full-screen', () => sendWindowState(win));
  win.on('focus', () => sendWindowState(win));
  win.on('blur', () => sendWindowState(win));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAllowedExternalUrl(url)) return { action: 'deny' };

    if (hasSameOrigin(url, appUrl)) {
      win.loadURL(url).catch(() => {});
      return { action: 'deny' };
    }

    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedExternalUrl(url)) {
      event.preventDefault();
      return;
    }

    if (isWebUrl(url) && hasSameOrigin(url, appUrl)) return;

    event.preventDefault();
    shell.openExternal(url).catch(() => {});
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    if (errorCode === -3) return; // Navigation cancelled intentionally.

    loadOfflineScreen(win, appUrl, { errorCode, errorDescription, validatedURL });
  });

  win.loadURL(appUrl).catch((error) => {
    loadOfflineScreen(win, appUrl, { errorDescription: error?.message });
  });

  return win;
}

function getSenderWindow(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

app.setName('Vexa');
app.setAppUserModelId(APP_ID);

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  let mainWindow = null;

  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    const splashStartedAt = Date.now();
    const splashWindow = createSplashWindow();
    mainWindow = createMainWindow(splashWindow, splashStartedAt);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        const nextSplashStartedAt = Date.now();
        const nextSplashWindow = createSplashWindow();
        mainWindow = createMainWindow(nextSplashWindow, nextSplashStartedAt);
      }
    });
  });

  app.on('window-all-closed', () => {
    if (!isMac) app.quit();
  });
}

ipcMain.handle('clickbook-desktop:minimize', (event) => {
  const win = getSenderWindow(event);
  if (win && !win.isDestroyed()) win.minimize();
});

ipcMain.handle('clickbook-desktop:toggle-maximize', (event) => {
  const win = getSenderWindow(event);
  if (!win || win.isDestroyed()) return false;

  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }

  sendWindowState(win);
  return win.isMaximized();
});

ipcMain.handle('clickbook-desktop:close', (event) => {
  const win = getSenderWindow(event);
  if (win && !win.isDestroyed()) win.close();
});

ipcMain.handle('clickbook-desktop:is-maximized', (event) => {
  const win = getSenderWindow(event);
  return Boolean(win && !win.isDestroyed() && win.isMaximized());
});

ipcMain.handle('clickbook-desktop:open-external', async (_event, url) => {
  if (!isAllowedExternalUrl(url)) return false;
  await shell.openExternal(url);
  return true;
});

ipcMain.handle('clickbook-desktop:reload', (event) => {
  const win = getSenderWindow(event);
  if (!win || win.isDestroyed()) return false;

  win.webContents.reloadIgnoringCache();
  return true;
});

ipcMain.handle('clickbook-desktop:go-home', (event) => {
  const win = getSenderWindow(event);
  if (!win || win.isDestroyed()) return false;

  win.loadURL(resolveAppUrl()).catch(() => {});
  return true;
});

ipcMain.handle('clickbook-desktop:get-app-info', () => ({
  name: app.getName(),
  version: app.getVersion(),
  packaged: app.isPackaged,
  platform: process.platform,
  defaultUrl: resolveAppUrl(),
}));
