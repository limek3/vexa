# КликБук Desktop / Electron shell

Добавлен Electron shell: приложение открывает КликБук в отдельном frameless-окне с собственной верхней панелью, кнопками свернуть/развернуть/закрыть и без браузерной шапки.

## Что сейчас настроено для теста

- корневой адрес `/` открывает `/dashboard?demo=1`, а не `/login`;
- `desktop:dev` открывает `http://localhost:3000/dashboard?demo=1`;
- `desktop:preview` открывает `https://cl1ckbook.onrender.com/dashboard?demo=1`;
- если Electron получает просто домен без пути, он сам переводит его на `/dashboard?demo=1`;
- авторизация не нужна для просмотра кабинета в demo mode.

## Dev запуск

```bash
npm install
npm run desktop:dev
```

Команда поднимает Next.js на `http://localhost:3000`, ждёт готовности сервера и открывает Electron сразу на dashboard.

## Проверить оболочку на проде

```bash
npm run desktop:preview
```

По умолчанию используется:

```txt
https://cl1ckbook.onrender.com/dashboard?demo=1
```

Открыть live-кабинет без demo-параметра:

```bash
npm run desktop:live
```

Открыть login в dev-режиме, если понадобится вернуть тест авторизации:

```bash
npm run desktop:dev:login
```

Можно указать другой адрес:

```bash
set CLICKBOOK_APP_URL=https://your-domain.ru/dashboard?demo=1 && npm run desktop:preview
```

PowerShell:

```powershell
$env:CLICKBOOK_APP_URL="https://your-domain.ru/dashboard?demo=1"; npm run desktop:preview
```

## Собрать Windows .exe installer

```bash
npm install
npm run desktop:dist
```

Готовый установщик появится в папке:

```txt
release/
```

Если на Windows при сборке появляется ошибка `Cannot create symbolic link`, включите Developer Mode в Windows или запустите терминал от администратора.

## Важно

Это shell-версия: само приложение продолжает жить на сервере, а desktop открывает URL внутри Electron. Поэтому:

- обновления интерфейса приходят после деплоя сайта;
- не нужно паковать Next.js сервер внутрь `.exe`;
- нужна сеть;
- для теста сейчас используется demo dashboard без логина.
