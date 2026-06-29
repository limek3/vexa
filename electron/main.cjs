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

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vexa</title>
  <style>
    :root {
      color-scheme: light;
      --purple: #7b4dff;
      --text: #20242e;
      --muted: #727889;
    }

    * { box-sizing: border-box; }

    html,
    body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #faf9f7;
      color: var(--text);
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      display: grid;
      grid-template-columns: 42.5% 57.5%;
      border-radius: 20px;
      -webkit-app-region: drag;
    }

    .splash {
      display: contents;
    }

    .brand-panel {
      display: grid;
      grid-template-rows: auto auto 1fr auto auto;
      gap: 34px;
      padding: 58px 54px 42px;
      background:
        radial-gradient(circle at 24% 0%, rgba(124, 92, 255, .17), transparent 36%),
        radial-gradient(circle at 84% 100%, rgba(124, 92, 255, .13), transparent 42%),
        linear-gradient(140deg, #10141d 0%, #171b26 56%, #202036 100%);
      color: #f7f7fb;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 16px;
      color: #fff;
      font-size: 42px;
      font-weight: 750;
      letter-spacing: -0.055em;
    }

    .logo img {
      width: 58px;
      height: 58px;
      border-radius: 15px;
      object-fit: cover;
    }

    .copy {
      display: grid;
      gap: 18px;
    }

    .copy h1 {
      margin: 0;
      color: #fff;
      font-size: 32px;
      line-height: 1.32;
      letter-spacing: -0.045em;
    }

    .copy p {
      margin: 0;
      color: rgba(247,247,251,.68);
      font-size: 17px;
      line-height: 1.62;
    }

    .features {
      display: grid;
      align-content: start;
      gap: 26px;
      padding-top: 2px;
    }

    .feature {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 22px;
      align-items: start;
    }

    .feature-icon {
      color: #9b6cff;
      font-size: 22px;
      line-height: 1;
    }

    .feature strong {
      display: block;
      color: #fff;
      font-size: 16px;
      font-weight: 650;
      margin-bottom: 7px;
    }

    .feature span {
      color: rgba(247,247,251,.58);
      font-size: 13px;
      line-height: 1.45;
    }

    .status {
      display: flex;
      gap: 28px;
      align-items: center;
      padding-top: 28px;
      border-top: 1px solid rgba(255,255,255,.12);
      color: rgba(247,247,251,.58);
      font-size: 13px;
    }

    .status b {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: rgba(247,247,251,.86);
      font-weight: 500;
    }

    .dot {
      width: 21px;
      height: 21px;
      border-radius: 999px;
      background: radial-gradient(circle, #43d17b 0 28%, rgba(67, 209, 123, .24) 30% 100%);
      box-shadow: 0 0 20px rgba(67, 209, 123, .24);
    }

    .footer {
      display: grid;
      gap: 14px;
      color: rgba(247,247,251,.44);
      font-size: 12px;
    }

    .form-stage {
      display: grid;
      place-items: center;
      padding: 72px;
      background:
        radial-gradient(circle at 50% 30%, rgba(124, 92, 255, .05), transparent 38%),
        #faf9f7;
    }

    .card {
      width: min(100%, 490px);
      display: grid;
      gap: 20px;
      padding: 46px;
      border: 1px solid rgba(28,32,42,.11);
      border-radius: 8px;
      background: rgba(255,255,255,.72);
      box-shadow: 0 18px 52px rgba(20,24,34,.045);
      backdrop-filter: blur(12px);
    }

    .card-head {
      display: grid;
      gap: 9px;
      text-align: center;
    }

    .card h2 {
      margin: 0;
      color: #20242e;
      font-size: 28px;
      line-height: 1.15;
      letter-spacing: -0.045em;
    }

    .card p {
      margin: 0;
      color: #727889;
      font-size: 15px;
    }

    .tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      height: 50px;
      overflow: hidden;
      border: 1px solid rgba(28,32,42,.15);
      border-radius: 7px;
      background: rgba(255,255,255,.58);
    }

    .tabs span {
      display: grid;
      place-items: center;
      color: #6c7280;
      font-size: 15px;
      font-weight: 650;
      border-right: 1px solid rgba(28,32,42,.11);
    }

    .tabs span:first-child {
      color: var(--purple);
      background: rgba(255,255,255,.72);
      box-shadow: inset 0 0 0 1.5px #8b63ff;
    }

    label {
      display: grid;
      gap: 10px;
      color: #4b5160;
      font-size: 14px;
      font-weight: 650;
    }

    .input {
      height: 58px;
      display: grid;
      grid-template-columns: 24px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      border: 1px solid rgba(28,32,42,.12);
      border-radius: 7px;
      background: rgba(255,255,255,.66);
      color: #9aa1af;
      font-size: 15px;
      font-weight: 500;
    }

    .options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #858b99;
      font-size: 14px;
    }

    .check {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .box {
      width: 22px;
      height: 22px;
      border: 1px solid rgba(28,32,42,.25);
      border-radius: 4px;
      background: rgba(255,255,255,.65);
    }

    .link { color: var(--purple); font-weight: 700; }

    .primary {
      height: 58px;
      display: grid;
      place-items: center;
      width: 100%;
      border-radius: 7px;
      background: linear-gradient(180deg, #814fff, #641ee8);
      color: #fff;
      font-size: 16px;
      font-weight: 650;
    }

    .divider {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 20px;
      color: #a0a5b0;
      font-size: 14px;
    }

    .divider::before,
    .divider::after {
      content: '';
      height: 1px;
      background: rgba(28,32,42,.11);
    }

    .create {
      text-align: center;
      color: var(--purple);
      font-size: 16px;
      font-weight: 700;
    }

    @media (max-width: 980px) {
      body { grid-template-columns: 1fr; overflow: auto; }
      .brand-panel { padding: 30px; gap: 20px; }
      .features, .footer { display: none; }
      .form-stage { padding: 28px; }
    }
  </style>
</head>
<body>
  <div class="splash">
    <section class="brand-panel">
      <div class="logo"><img src="${logoSrc}" alt="Vexa" /><span>vexa</span></div>
      <div class="copy">
        <h1>Командный центр<br />мониторинга лидов в Telegram</h1>
        <p>Находите клиентов. Отвечайте вовремя. Увеличивайте конверсию.</p>
      </div>
      <div class="features">
        <div class="feature"><div class="feature-icon">⌕</div><div><strong>Мониторинг групп и каналов</strong><span>Отслеживайте новые лиды в реальном времени</span></div></div>
        <div class="feature"><div class="feature-icon">✦</div><div><strong>AI-фильтрация и обучение</strong><span>Отсекайте спам и фокусируйтесь на целевом</span></div></div>
        <div class="feature"><div class="feature-icon">▣</div><div><strong>Быстрые ответы из единого окна</strong><span>Отвечайте быстрее, не переключаясь</span></div></div>
        <div class="feature"><div class="feature-icon">▥</div><div><strong>Аналитика и отчёты</strong><span>Смотрите, что работает, и масштабируйте результат</span></div></div>
      </div>
      <div class="status"><b><i class="dot"></i>Система работает</b><span>Все сервисы доступны</span></div>
      <div class="footer"><span>© 2024 Vexa. Все права защищены.</span><span>Политика конфиденциальности · Пользовательское соглашение</span></div>
    </section>
    <section class="form-stage">
      <div class="card">
        <div class="card-head">
          <h2>Добро пожаловать в Vexa</h2>
          <p>Войдите в аккаунт, чтобы продолжить</p>
        </div>
        <div class="tabs"><span>Email</span><span>Код из Telegram</span></div>
        <label>Email<div class="input"><span>✉</span><span>name@company.com</span></div></label>
        <label>Пароль<div class="input"><span>▣</span><span>Введите пароль</span><span>◉</span></div></label>
        <div class="options"><span class="check"><i class="box"></i>Запомнить меня</span><span class="link">Забыли пароль?</span></div>
        <div class="primary">Войти</div>
        <div class="divider"><span>или</span></div>
        <div class="create">Создать аккаунт</div>
      </div>
    </section>
  </div>
</body>
</html>`;
}
function createSplashWindow() {
  const iconPath = path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const splashWidth = Math.min(1280, Math.max(980, workArea.width - 120));
  const splashHeight = Math.min(820, Math.max(700, workArea.height - 120));

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
