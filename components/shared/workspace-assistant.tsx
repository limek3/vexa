'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  Bot,
  CalendarClock,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  ExternalLink,
  HelpCircle,
  LayoutPanelTop,
  MessageSquareText,
  Package2,
  Send,
  SquarePen,
  UserRound,
  X,
} from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import {
  isDashboardDemoEnabled,
  withDashboardDemoParam,
} from '@/lib/dashboard-demo';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';
import { searchRoboKnowledge } from '@/lib/robo-knowledge-base';

type ThemeMode = 'light' | 'dark';
type AssistantRole = 'assistant' | 'user';

type AssistantAction = {
  label: string;
  href?: string;
  prompt?: string;
  completeStepId?: string;
  icon?: ReactNode;
};

type AssistantMessage = {
  id: string;
  role: AssistantRole;
  text: string;
  chips?: string[];
  actions?: AssistantAction[];
};

type KnowledgeItem = {
  id: string;
  categoryId?: string;
  ruTitle: string;
  enTitle: string;
  keywordsRu: string[];
  keywordsEn: string[];
  ruAnswer: string;
  enAnswer: string;
  href?: string;
  actions?: Array<{ labelRu: string; labelEn: string; href: string }>;
};

type RouteContext = {
  title: string;
  text: string;
  chips: string[];
  actionHref?: string;
};

type LaunchStep = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
};

const CHECKLIST_STORAGE_KEY = 'clickbook:robo-launch-checklist:v3';

function pageText(light: boolean) {
  return light ? 'text-[#111111]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#6b7280]' : 'text-[#9ca3af]';
}

function faintText(light: boolean) {
  return light ? 'text-black/32' : 'text-white/26';
}

function borderTone(light: boolean) {
  return light ? 'border-black/[0.08]' : 'border-white/[0.08]';
}

function modalTone(light: boolean) {
  return light
    ? 'border-black/[0.09] bg-[var(--cb-surface)] text-[#111111] shadow-[0_34px_90px_rgba(0,0,0,0.18)]'
    : 'border-white/[0.10] bg-[#141414] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]';
}

function panelTone(light: boolean) {
  return light
    ? 'border-black/[0.07] bg-black/[0.025]'
    : 'border-white/[0.07] bg-white/[0.035]';
}

function solidPanelTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-white'
    : 'border-white/[0.08] bg-white/[0.04]';
}

function fieldTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-white text-black placeholder:text-black/34 focus:border-black/[0.14]'
    : 'border-white/[0.08] bg-white/[0.035] text-white placeholder:text-white/30 focus:border-white/[0.14]';
}

function buttonBase(light: boolean, active = false) {
  return cn(
    'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.985]',
    active
      ? light
        ? 'cb-neutral-primary cb-neutral-primary-light hover:opacity-[0.98]'
        : 'cb-neutral-primary cb-neutral-primary-dark hover:opacity-[0.98]'
      : light
        ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
        : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  );
}

function RoboMark({ light }: { light: boolean }) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-[12px] border',
        light
          ? 'border-black/[0.08] bg-white text-black'
          : 'border-white/[0.09] bg-white/[0.045] text-white',
      )}
    >
      <Bot className="size-5 stroke-[1.9]" />
    </span>
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createMessage(
  role: AssistantRole,
  text: string,
  chips?: string[],
  actions?: AssistantAction[],
): AssistantMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    chips,
    actions,
  };
}

function getRouteContext(pathname: string, locale: 'ru' | 'en'): RouteContext | null {
  const ru: Record<string, RouteContext> = {
    '/dashboard/profile': {
      title: 'Профиль',
      text:
        'Здесь собирается доверие: имя, специализация, описание, контакты, адрес и основа публичной страницы.',
      chips: ['Что заполнить в профиле?', 'Чек-лист запуска', 'Как проверить публичную страницу?'],
      actionHref: '/dashboard/profile',
    },
    '/dashboard/services': {
      title: 'Услуги',
      text:
        'Здесь клиент должен быстро понять, что выбрать: название, цена, длительность, категория и порядок услуг.',
      chips: ['Как оформить услуги?', 'Какие услуги добавить?', 'Какой порядок услуг лучше?'],
      actionHref: '/dashboard/services',
    },
    '/dashboard/availability': {
      title: 'График',
      text:
        'Здесь открываются реальные окна для записи. Открытый слот должен означать, что мастер точно может принять клиента.',
      chips: ['Как открыть слоты?', 'Как закрыть выходные?', 'Как настроить нестандартный день?'],
      actionHref: '/dashboard/availability',
    },
    '/dashboard/templates': {
      title: 'Шаблоны',
      text:
        'Здесь готовятся сообщения для подтверждений, напоминаний, переносов и возврата клиентов.',
      chips: ['Какие шаблоны нужны?', 'Как написать напоминание?', 'Как работают переменные?'],
      actionHref: '/dashboard/templates',
    },
    '/dashboard/appearance': {
      title: 'Внешний вид',
      text:
        'Здесь настраивается ощущение бренда: тема, акцент, плотность, карточки и стиль публичной страницы.',
      chips: ['Как выбрать стиль?', 'Что лучше для клиента?', 'Как проверить дизайн?'],
      actionHref: '/dashboard/appearance',
    },
    '/dashboard/chats': {
      title: 'Чаты',
      text:
        'Здесь можно вести диалоги, использовать шаблоны и быстрее отвечать клиентам.',
      chips: ['Как использовать шаблоны?', 'Что может бот?', 'Как отвечать клиентам быстрее?'],
      actionHref: '/dashboard/chats',
    },
    '/dashboard/today': {
      title: 'Сегодня',
      text:
        'Здесь контролируются записи дня: визиты, статусы, переносы, напоминания и неявки.',
      chips: ['Как контролировать записи?', 'Что делать с неявкой?', 'Как напомнить клиенту?'],
      actionHref: '/dashboard/today',
    },
    '/dashboard/stats': {
      title: 'Статистика',
      text:
        'Здесь видно записи, доход, статусы, динамику и просадки.',
      chips: ['Какие метрики смотреть?', 'Как анализировать записи?', 'Как понять просадки?'],
      actionHref: '/dashboard/stats',
    },
    '/dashboard/notifications': {
      title: 'Уведомления',
      text:
        'Здесь настраиваются сообщения клиенту и мастеру по важным событиям записи.',
      chips: ['Какие уведомления включить?', 'Что отправлять клиенту?', 'Как не перегружать сообщениями?'],
      actionHref: '/dashboard/notifications',
    },
    '/dashboard/payments': {
      title: 'Оплата',
      text:
        'Здесь проверяется статус оплаты, доступ и платёжные настройки.',
      chips: ['Что проверить по оплате?', 'Что делать если доступ закрыт?', 'Как объяснить клиенту оплату?'],
      actionHref: '/dashboard/payments',
    },
    '/dashboard/subscription': {
      title: 'Подписка',
      text:
        'Здесь управляется тариф, период оплаты и доступ к возможностям платформы.',
      chips: ['Какой тариф выбрать?', 'Что входит в подписку?', 'Как продлить доступ?'],
      actionHref: '/dashboard/subscription',
    },
  };

  const en: Record<string, RouteContext> = {
    '/dashboard/profile': {
      title: 'Profile',
      text:
        'This page builds trust: name, specialty, description, contacts, address and public page basics.',
      chips: ['What should I fill in?', 'Launch checklist', 'How to check public page?'],
      actionHref: '/dashboard/profile',
    },
    '/dashboard/services': {
      title: 'Services',
      text:
        'Here clients should quickly understand what to choose: name, price, duration, category and service order.',
      chips: ['How to format services?', 'Which services to add?', 'Best service order?'],
      actionHref: '/dashboard/services',
    },
    '/dashboard/availability': {
      title: 'Availability',
      text:
        'Here you open real bookable windows. An open slot means the specialist can actually accept a client then.',
      chips: ['How to open slots?', 'How to close weekends?', 'How to set custom day?'],
      actionHref: '/dashboard/availability',
    },
    '/dashboard/templates': {
      title: 'Templates',
      text:
        'Here you prepare confirmation, reminder, reschedule and client return messages.',
      chips: ['What templates do I need?', 'How to write a reminder?', 'How do variables work?'],
      actionHref: '/dashboard/templates',
    },
    '/dashboard/appearance': {
      title: 'Appearance',
      text:
        'Here you configure theme, accent, density, cards and public page style.',
      chips: ['How to choose style?', 'What is better for clients?', 'How to check design?'],
      actionHref: '/dashboard/appearance',
    },
    '/dashboard/chats': {
      title: 'Chats',
      text:
        'Here you manage dialogs, use templates and reply faster to clients.',
      chips: ['How to use templates?', 'What can the bot do?', 'How to reply faster?'],
      actionHref: '/dashboard/chats',
    },
    '/dashboard/today': {
      title: 'Today',
      text:
        'Here you control today bookings: visits, statuses, reschedules, reminders and no-shows.',
      chips: ['How to control bookings?', 'What to do with no-show?', 'How to remind a client?'],
      actionHref: '/dashboard/today',
    },
    '/dashboard/stats': {
      title: 'Stats',
      text:
        'Here you see bookings, revenue, statuses, dynamics and drops.',
      chips: ['Which metrics matter?', 'How to analyze bookings?', 'How to find drops?'],
      actionHref: '/dashboard/stats',
    },
  };

  const map = locale === 'ru' ? ru : en;
  const key = Object.keys(map).find((route) => pathname.startsWith(route));

  return key ? map[key] : null;
}

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'profile',
    ruTitle: 'Профиль мастера',
    enTitle: 'Specialist profile',
    href: '/dashboard/profile',
    keywordsRu: ['профиль', 'мастер', 'описание', 'контакты', 'адрес', 'витрина', 'имя', 'фото', 'специализация'],
    keywordsEn: ['profile', 'master', 'specialist', 'description', 'contacts', 'address', 'storefront', 'name', 'photo'],
    ruAnswer:
      'Профиль лучше собирать как страницу доверия:\n\n1. Имя мастера или название салона.\n2. Специализация простым языком.\n3. Короткое описание: кому помогаете и какой результат получает клиент.\n4. Адрес, район или формат работы.\n5. Контакты и удобный способ связи.\n6. Фото профиля и портфолио, если блок включён.\n\nПосле правок откройте публичную страницу и проверьте её глазами клиента.',
    enAnswer:
      'Build the profile as a trust page:\n\n1. Specialist or salon name.\n2. Specialty in simple language.\n3. Short description: who you help and what result the client gets.\n4. Address, area or work format.\n5. Contacts and preferred communication method.\n6. Profile photo and portfolio if enabled.\n\nAfter editing, open the public page and check it as a client.',
  },
  {
    id: 'services',
    ruTitle: 'Услуги',
    enTitle: 'Services',
    href: '/dashboard/services',
    keywordsRu: ['услуга', 'услуги', 'цена', 'прайс', 'стоимость', 'длительность', 'каталог', 'категория'],
    keywordsEn: ['service', 'services', 'price', 'pricing', 'duration', 'catalog', 'category'],
    ruAnswer:
      'Услуги должны выглядеть как понятный каталог:\n\n1. Название — короткое и привычное клиенту.\n2. Категория — маникюр, брови, тату, тренировка, консультация, массаж и т.д.\n3. Длительность — реальное время с запасом.\n4. Цена — отдельно, без лишнего текста в названии.\n5. Порядок — сначала самые популярные услуги.\n6. Черновики и редкие услуги лучше скрывать.\n\nХороший каталог снижает вопросы и ускоряет запись.',
    enAnswer:
      'Services should look like a clear catalog:\n\n1. Name — short and familiar for clients.\n2. Category — nails, brows, tattoo, training, consultation, massage, etc.\n3. Duration — realistic time with buffer.\n4. Price — separate, without overloading the title.\n5. Order — most popular services first.\n6. Hide drafts and rare services.\n\nA good catalog reduces questions and speeds up booking.',
  },
  {
    id: 'availability',
    ruTitle: 'График и слоты',
    enTitle: 'Availability and slots',
    href: '/dashboard/availability',
    keywordsRu: ['график', 'слоты', 'расписание', 'время', 'рабочие часы', 'окна', 'выходной', 'полный день'],
    keywordsEn: ['availability', 'slots', 'schedule', 'time', 'working hours', 'windows', 'day off', 'full day'],
    ruAnswer:
      'График нужен, чтобы клиент видел только реальное доступное время:\n\n1. Сначала выберите рабочие дни.\n2. Затем откройте конкретные часы и слоты.\n3. Выходные закрывайте полностью.\n4. Нестандартные дни настраивайте вручную.\n5. После настройки проверьте запись на публичной странице.\n\nГлавное правило: открытый слот = мастер точно может принять клиента в это время.',
    enAnswer:
      'Availability makes clients see only real bookable time:\n\n1. Select work days first.\n2. Open exact hours and slots.\n3. Close days off completely.\n4. Configure unusual days manually.\n5. Test booking on the public page.\n\nMain rule: open slot = the specialist can actually accept a client then.',
  },
  {
    id: 'templates',
    ruTitle: 'Шаблоны сообщений',
    enTitle: 'Message templates',
    href: '/dashboard/templates',
    keywordsRu: ['шаблон', 'шаблоны', 'сообщение', 'смс', 'переменные', 'напоминание', 'подтверждение', 'клиенту'],
    keywordsEn: ['template', 'templates', 'message', 'variables', 'reminder', 'confirmation', 'client'],
    ruAnswer:
      'Минимальный набор шаблонов для запуска:\n\n1. Подтверждение записи — сразу после заявки.\n2. Напоминание — за день или за несколько часов до визита.\n3. Сообщение после визита — благодарность и мягкий возврат.\n4. Возврат клиента — когда появились новые слоты.\n\nТекст должен быть коротким: что, когда, где и что сделать дальше.',
    enAnswer:
      'Minimum template set for launch:\n\n1. Booking confirmation right after request.\n2. Reminder one day or a few hours before the visit.\n3. Post-visit thank you and soft return.\n4. Client return message when new slots open.\n\nKeep it short: what, when, where and what to do next.',
  },
  {
    id: 'appearance',
    ruTitle: 'Внешний вид',
    enTitle: 'Appearance',
    href: '/dashboard/appearance',
    keywordsRu: ['внешний вид', 'дизайн', 'тема', 'цвет', 'акцент', 'стиль', 'темная', 'светлая', 'публичная'],
    keywordsEn: ['appearance', 'design', 'theme', 'color', 'accent', 'style', 'dark', 'light', 'public'],
    ruAnswer:
      'Внешний вид лучше настраивать после профиля и услуг:\n\n1. Выберите тему: светлая, тёмная или системная.\n2. Поставьте спокойный акцентный цвет.\n3. Проверьте читаемость текста и кнопок.\n4. Не перегружайте публичную страницу декором.\n5. Проверьте результат на телефоне.\n\nСтраница должна выглядеть спокойно, дорого и понятно.',
    enAnswer:
      'Appearance is best configured after profile and services:\n\n1. Choose theme: light, dark or system.\n2. Select a calm accent color.\n3. Check text and button readability.\n4. Do not overload the public page with decor.\n5. Check the result on mobile.\n\nThe page should feel calm, premium and clear.',
  },
  {
    id: 'public-page',
    ruTitle: 'Публичная страница',
    enTitle: 'Public page',
    keywordsRu: ['публичная', 'клиент', 'страница клиента', 'ссылка', 'запись', 'онлайн запись', 'проверить страницу'],
    keywordsEn: ['public', 'client page', 'link', 'booking', 'online booking', 'check page'],
    ruAnswer:
      'Публичная страница — это то, что видит клиент. Проверяйте её по 5 вопросам:\n\n1. Понятно ли, кто мастер и чем занимается?\n2. Видны ли услуги, цены и длительность?\n3. Есть ли реальные доступные слоты?\n4. Понятно ли, куда нажать для записи?\n5. Хорошо ли всё выглядит на телефоне?\n\nЕсли клиенту нужно думать, где записаться, страницу нужно упрощать.',
    enAnswer:
      'The public page is what the client sees. Check it with 5 questions:\n\n1. Is it clear who the specialist is?\n2. Are services, prices and duration visible?\n3. Are real slots available?\n4. Is the booking action obvious?\n5. Does it look good on mobile?\n\nIf the client has to think where to book, simplify the page.',
  },
  {
    id: 'launch-checklist',
    ruTitle: 'Чек-лист запуска',
    enTitle: 'Launch checklist',
    keywordsRu: ['запуск', 'чеклист', 'чек лист', 'проверить', 'готово', 'начать', 'старт', 'что делать дальше', 'готовность'],
    keywordsEn: ['launch', 'checklist', 'check', 'ready', 'start', 'what next', 'readiness'],
    ruAnswer:
      'Мини-чек-лист перед запуском:\n\n1. Профиль заполнен и выглядит понятно.\n2. Услуги имеют цену и длительность.\n3. График содержит реальные рабочие слоты.\n4. Шаблоны подтверждения и напоминания готовы.\n5. Публичная страница проверена с телефона.\n6. Тестовая запись проходит без ошибок.\n\nПосле этого ссылку уже можно отправлять клиентам.',
    enAnswer:
      'Mini launch checklist:\n\n1. Profile is filled and clear.\n2. Services have price and duration.\n3. Availability has real working slots.\n4. Confirmation and reminder templates are ready.\n5. Public page is checked on mobile.\n6. Test booking works without errors.\n\nAfter that, the link can be sent to clients.',
  },
];

function findKnowledge(locale: 'ru' | 'en', prompt: string) {
  const external = searchRoboKnowledge(prompt, locale, 1)[0];

  if (external) {
    return {
      id: external.id,
      ruTitle: external.questionRu,
      enTitle: external.questionEn,
      categoryId: external.categoryId,
      href: external.actions[0]?.href ?? '/dashboard',
      actions: external.actions,
      keywordsRu: external.keywordsRu,
      keywordsEn: external.keywordsEn,
      ruAnswer: external.answerRu,
      enAnswer: external.answerEn,
    };
  }

  const clean = normalize(prompt);

  const scored = KNOWLEDGE_BASE.map((item) => {
    const keywords = locale === 'ru' ? item.keywordsRu : item.keywordsEn;
    const score = keywords.reduce((total, keyword) => {
      return clean.includes(normalize(keyword)) ? total + 1 : total;
    }, 0);

    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.item ?? null;
}


function getStepIdByKnowledgeCategory(categoryId?: string) {
  if (!categoryId) return undefined;

  const map: Record<string, string> = {
    profile: 'profile',
    'public-page': 'profile',
    services: 'services',
    availability: 'availability',
    templates: 'templates',
    appearance: 'appearance',
  };

  return map[categoryId];
}

function isGreeting(prompt: string) {
  const clean = normalize(prompt);

  return [
    'привет',
    'здарова',
    'здравствуйте',
    'hello',
    'hi',
    'hey',
    'добрый день',
    'добрый вечер',
  ].some((word) => clean.includes(word));
}

function isThanks(prompt: string) {
  const clean = normalize(prompt);

  return [
    'спасибо',
    'благодарю',
    'понял',
    'поняла',
    'круто',
    'отлично',
    'thanks',
    'thank you',
    'great',
    'cool',
  ].some((word) => clean.includes(word));
}

function buildAssistantReply(
  locale: 'ru' | 'en',
  pathname: string,
  prompt: string,
  buildHref: (href: string) => string,
) {
  const route = getRouteContext(pathname, locale);

  if (isGreeting(prompt)) {
    return {
      text:
        locale === 'ru'
          ? `Привет. Я Робо — помощник по кабинету.\n\n${
              route
                ? `Сейчас открыт раздел «${route.title}». ${route.text}`
                : 'Могу помочь настроить профиль, услуги, график, шаблоны и публичную страницу.'
            }`
          : `Hi. I am Robo — your workspace assistant.\n\n${
              route
                ? `You are now in “${route.title}”. ${route.text}`
                : 'I can help configure profile, services, availability, templates and public page.'
            }`,
      chips: route?.chips,
      actions: route?.actionHref
        ? [
            {
              label: locale === 'ru' ? `Открыт раздел: ${route.title}` : `Current section: ${route.title}`,
              href: buildHref(route.actionHref),
              icon: <ExternalLink className="size-3.5" />,
            },
          ]
        : [],
    };
  }

  if (isThanks(prompt)) {
    return {
      text:
        locale === 'ru'
          ? 'Рад помочь. Логика запуска простая: профиль → услуги → график → шаблоны → публичная страница → тестовая запись.'
          : 'Glad to help. The launch flow is simple: profile → services → availability → templates → public page → test booking.',
      chips:
        locale === 'ru'
          ? ['Чек-лист запуска', 'Как проверить публичную страницу?', 'Как открыть слоты?']
          : ['Launch checklist', 'How to check public page?', 'How to open slots?'],
      actions: [
        {
          label: locale === 'ru' ? 'Профиль' : 'Profile',
          href: buildHref('/dashboard/profile'),
          icon: <SquarePen className="size-3.5" />,
        },
        {
          label: locale === 'ru' ? 'Услуги' : 'Services',
          href: buildHref('/dashboard/services'),
          icon: <Package2 className="size-3.5" />,
        },
        {
          label: locale === 'ru' ? 'График' : 'Availability',
          href: buildHref('/dashboard/availability'),
          icon: <CalendarRange className="size-3.5" />,
        },
      ],
    };
  }

  const knowledge = findKnowledge(locale, prompt);

  if (knowledge) {
    return {
      text: locale === 'ru' ? knowledge.ruAnswer : knowledge.enAnswer,
      chips:
        locale === 'ru'
          ? ['Чек-лист запуска', 'Что делать дальше?', 'Как проверить публичную страницу?']
          : ['Launch checklist', 'What next?', 'How to check public page?'],
      actions: [
        ...(knowledge.actions?.length
          ? knowledge.actions.slice(0, 3).map((action) => ({
              label: locale === 'ru' ? action.labelRu : action.labelEn,
              href: buildHref(action.href),
              icon: <ExternalLink className="size-3.5" />,
            }))
          : knowledge.href
            ? [
                {
                  label: locale === 'ru' ? `Открыть: ${knowledge.ruTitle}` : `Open: ${knowledge.enTitle}`,
                  href: buildHref(knowledge.href),
                  icon: <ExternalLink className="size-3.5" />,
                },
              ]
            : []),
        ...(getStepIdByKnowledgeCategory(knowledge.categoryId)
          ? [
              {
                label: locale === 'ru' ? 'Отметить шаг готовым' : 'Mark step done',
                completeStepId: getStepIdByKnowledgeCategory(knowledge.categoryId),
                icon: <Check className="size-3.5" />,
              },
            ]
          : []),
      ],
    };
  }

  if (route) {
    return {
      text:
        locale === 'ru'
          ? `${route.text}\n\nЯ не нашёл точный ответ по формулировке. Попробуй спросить проще: «как добавить услугу», «как открыть слоты», «как настроить профиль», «как проверить публичную страницу».`
          : `${route.text}\n\nI did not find an exact answer for this wording. Try: “how to add a service”, “how to open slots”, “how to set up profile”, “how to check public page”.`,
      chips: route.chips,
      actions: route.actionHref
        ? [
            {
              label: locale === 'ru' ? `Перейти: ${route.title}` : `Open: ${route.title}`,
              href: buildHref(route.actionHref),
              icon: <ExternalLink className="size-3.5" />,
            },
          ]
        : [],
    };
  }

  return {
    text:
      locale === 'ru'
        ? 'Я лучше всего отвечаю по кабинету КликБук: профиль, услуги, график, слоты, шаблоны, публичная страница, демо-режим, статистика и чаты. Спроси по одному из этих разделов.'
        : 'I answer best about ClickBook workspace: profile, services, availability, slots, templates, public page, demo mode, statistics and chats. Ask about one of these sections.',
    chips:
      locale === 'ru'
        ? ['Как настроить профиль?', 'Как добавить услугу?', 'Как открыть слоты?']
        : ['How to set up profile?', 'How to add a service?', 'How to open slots?'],
    actions: [
      {
        label: locale === 'ru' ? 'Проверить профиль' : 'Check profile',
        href: buildHref('/dashboard/profile'),
        icon: <SquarePen className="size-3.5" />,
      },
      {
        label: locale === 'ru' ? 'Проверить график' : 'Check availability',
        href: buildHref('/dashboard/availability'),
        icon: <CalendarRange className="size-3.5" />,
      },
    ],
  };
}

function getInitialMessage(locale: 'ru' | 'en', pathname: string): AssistantMessage {
  const route = getRouteContext(pathname, locale);

  return {
    id: 'assistant-intro',
    role: 'assistant',
    text:
      locale === 'ru'
        ? `Я Робо. Помогу быстро довести кабинет до состояния, когда ссылку уже можно отправлять клиентам.${
            route ? `\n\nСейчас открыт раздел «${route.title}». ${route.text}` : ''
          }`
        : `I am Robo. I will help bring the workspace to a state where the link can be sent to clients.${
            route ? `\n\nCurrent section is “${route.title}”. ${route.text}` : ''
          }`,
    chips:
      route?.chips ??
      (locale === 'ru'
        ? ['Чек-лист запуска', 'Как добавить услугу?', 'Как открыть слоты?']
        : ['Launch checklist', 'How to add a service?', 'How to open slots?']),
  };
}

export function WorkspaceAssistant() {
  const { locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useBrowserSearchParams();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    getInitialMessage(locale, pathname),
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const currentTheme: ThemeMode = resolvedTheme === 'light' ? 'light' : 'dark';
  const isLight = currentTheme === 'light';
  const demoMode = isDashboardDemoEnabled(searchParams);
  const routeContext = getRouteContext(pathname, locale);

  const buildHref = useCallback(
    (href: string) => withDashboardDemoParam(href, demoMode),
    [demoMode],
  );

  const copy = useMemo(
    () =>
      locale === 'ru'
        ? {
            title: 'КликБук Робо',
            subtitle: 'Помощник по настройке кабинета, записи и публичной страницы.',
            placeholder: 'Напиши задачу: например, как открыть слоты или проверить страницу...',
            send: 'Спросить',
            reset: 'Сбросить',
            close: 'Закрыть',
            current: 'Текущий экран',
            plan: 'План запуска',
            readiness: 'Готовность',
            quick: 'Быстрый запуск',
            enter: 'Enter — отправить',
            shift: 'Shift + Enter — новая строка',
            base: 'внутренняя база Робо',
            you: 'Вы',
            robo: 'Робо',
            workspace: 'Кабинет',
            copy: 'Копировать',
            copied: 'Скопировано',
            checkReady: 'Проверить готовность',
            nextStep: 'Следующий шаг',
            allDone: 'Всё готово',
            emptyContext:
              'Можно начать с чек-листа запуска или задать вопрос по кабинету.',
            readyIntro: 'Готовность кабинета',
            readyDone: 'Уже отмечено',
            readyLeft: 'Осталось сделать',
            readyNext: 'Следующий шаг',
            readyComplete:
              'Все основные пункты отмечены. Теперь можно проверить публичную страницу и сделать тестовую запись.',
            steps: [
              { id: 'profile', label: 'Профиль', href: '/dashboard/profile', icon: <SquarePen className="size-3.5" /> },
              { id: 'services', label: 'Услуги', href: '/dashboard/services', icon: <Package2 className="size-3.5" /> },
              { id: 'availability', label: 'График', href: '/dashboard/availability', icon: <CalendarRange className="size-3.5" /> },
              { id: 'templates', label: 'Шаблоны', href: '/dashboard/templates', icon: <MessageSquareText className="size-3.5" /> },
              { id: 'appearance', label: 'Внешний вид', href: '/dashboard/appearance', icon: <LayoutPanelTop className="size-3.5" /> },
            ] satisfies LaunchStep[],
            suggestions: [
              'Чек-лист запуска',
              'Как настроить профиль?',
              'Как добавить услугу?',
              'Как открыть слоты?',
              'Какие шаблоны нужны?',
              'Как проверить публичную страницу?',
            ],
          }
        : {
            title: 'ClickBook Robo',
            subtitle: 'Assistant for workspace setup, bookings and public page.',
            placeholder: 'Write a task: for example, how to open slots or check the page...',
            send: 'Ask',
            reset: 'Reset',
            close: 'Close',
            current: 'Current screen',
            plan: 'Launch plan',
            readiness: 'Readiness',
            quick: 'Quick start',
            enter: 'Enter — send',
            shift: 'Shift + Enter — new line',
            base: 'internal Robo brain',
            you: 'You',
            robo: 'Robo',
            workspace: 'Workspace',
            copy: 'Copy',
            copied: 'Copied',
            checkReady: 'Check readiness',
            nextStep: 'Next step',
            allDone: 'All done',
            emptyContext:
              'You can start with the launch checklist or ask a workspace question.',
            readyIntro: 'Workspace readiness',
            readyDone: 'Already completed',
            readyLeft: 'Still left',
            readyNext: 'Next step',
            readyComplete:
              'All main points are checked. Now you can review the public page and make a test booking.',
            steps: [
              { id: 'profile', label: 'Profile', href: '/dashboard/profile', icon: <SquarePen className="size-3.5" /> },
              { id: 'services', label: 'Services', href: '/dashboard/services', icon: <Package2 className="size-3.5" /> },
              { id: 'availability', label: 'Availability', href: '/dashboard/availability', icon: <CalendarRange className="size-3.5" /> },
              { id: 'templates', label: 'Templates', href: '/dashboard/templates', icon: <MessageSquareText className="size-3.5" /> },
              { id: 'appearance', label: 'Appearance', href: '/dashboard/appearance', icon: <LayoutPanelTop className="size-3.5" /> },
            ] satisfies LaunchStep[],
            suggestions: [
              'Launch checklist',
              'How to set up profile?',
              'How to add a service?',
              'How to open slots?',
              'What templates do I need?',
              'How to check public page?',
            ],
          },
    [locale],
  );

  const completedCount = copy.steps.filter((step) =>
    completedIds.includes(step.id),
  ).length;

  const progressPercent = Math.round((completedCount / copy.steps.length) * 100);

  const nextIncompleteStep =
    copy.steps.find((step) => !completedIds.includes(step.id)) ?? null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCompletedIds(parsed.filter((item) => typeof item === 'string'));
      }
    } catch {
      setCompletedIds([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CHECKLIST_STORAGE_KEY,
        JSON.stringify(completedIds),
      );
    } catch {
      // ignore storage errors
    }
  }, [completedIds]);

  useEffect(() => {
    const handleOpenRobo = () => {
      setOpen(true);
    };

    window.addEventListener('clickbook:open-robo', handleOpenRobo);

    return () => {
      window.removeEventListener('clickbook:open-robo', handleOpenRobo);
    };
  }, []);

  useEffect(() => {
    setMessages((current) => {
      if (current.length === 1 && current[0]?.id === 'assistant-intro') {
        return [getInitialMessage(locale, pathname)];
      }

      return current;
    });
  }, [locale, pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const sendMessage = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      const reply = buildAssistantReply(locale, pathname, clean, buildHref);

      setMessages((current) => [
        ...current,
        createMessage('user', clean),
        createMessage('assistant', reply.text, reply.chips, reply.actions),
      ]);

      setMessage('');
    },
    [buildHref, locale, pathname],
  );

  const sendReadinessMessage = useCallback(() => {
    const done = copy.steps.filter((step) => completedIds.includes(step.id));
    const left = copy.steps.filter((step) => !completedIds.includes(step.id));
    const next = left[0];

    const text =
      locale === 'ru'
        ? `${copy.readyIntro}: ${completedCount}/${copy.steps.length} (${progressPercent}%).\n\n${
            done.length
              ? `${copy.readyDone}:\n${done.map((step) => `• ${step.label}`).join('\n')}`
              : `${copy.readyDone}: пока ничего не отмечено.`
          }\n\n${
            left.length
              ? `${copy.readyLeft}:\n${left.map((step) => `• ${step.label}`).join('\n')}\n\n${copy.readyNext}: ${next?.label}.`
              : copy.readyComplete
          }`
        : `${copy.readyIntro}: ${completedCount}/${copy.steps.length} (${progressPercent}%).\n\n${
            done.length
              ? `${copy.readyDone}:\n${done.map((step) => `• ${step.label}`).join('\n')}`
              : `${copy.readyDone}: nothing checked yet.`
          }\n\n${
            left.length
              ? `${copy.readyLeft}:\n${left.map((step) => `• ${step.label}`).join('\n')}\n\n${copy.readyNext}: ${next?.label}.`
              : copy.readyComplete
          }`;

    setMessages((current) => [
      ...current,
      createMessage('user', copy.checkReady),
      createMessage(
        'assistant',
        text,
        locale === 'ru'
          ? ['Чек-лист запуска', 'Как проверить публичную страницу?']
          : ['Launch checklist', 'How to check public page?'],
        next
          ? [
              {
                label: `${copy.nextStep}: ${next.label}`,
                href: buildHref(next.href),
                icon: <ArrowRight className="size-3.5" />,
              },
            ]
          : [],
      ),
    ]);
  }, [
    buildHref,
    completedCount,
    completedIds,
    copy,
    locale,
    progressPercent,
  ]);

  const goNextStep = useCallback(() => {
    if (!nextIncompleteStep) {
      sendReadinessMessage();
      return;
    }

    router.push(buildHref(nextIncompleteStep.href));
    setOpen(false);
  }, [buildHref, nextIncompleteStep, router, sendReadinessMessage]);

  const toggleCompleted = useCallback((id: string) => {
    setCompletedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;

    event.preventDefault();
    sendMessage(message);
  };

  const resetChat = () => {
    setMessages([getInitialMessage(locale, pathname)]);
    setMessage('');
  };

  const handleAction = (action: AssistantAction) => {
    if (action.completeStepId) {
      setCompletedIds((current) =>
        current.includes(action.completeStepId!)
          ? current
          : [...current, action.completeStepId!],
      );

      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          locale === 'ru'
            ? 'Готово. Отметил шаг в плане запуска. Теперь можно проверить готовность или перейти к следующему шагу.'
            : 'Done. I marked this step in the launch plan. You can now check readiness or move to the next step.',
          locale === 'ru'
            ? ['Проверить готовность', 'Что делать дальше?']
            : ['Check readiness', 'What next?'],
        ),
      ]);
      return;
    }

    if (action.prompt) {
      sendMessage(action.prompt);
      return;
    }

    if (action.href) {
      router.push(action.href);
      setOpen(false);
    }
  };

  const copyMessage = async (id: string, text: string) => {
    try {
      await window.navigator.clipboard.writeText(text);
      setCopiedId(id);

      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? '' : current));
      }, 1400);
    } catch {
      setCopiedId('');
    }
  };

  return (
    <>
      <button
        type="button"
        data-workspace-assistant-trigger
        data-robo-trigger
        id="workspace-assistant-trigger"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => setOpen(true)}
        className="hidden"
      />

      {open ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center px-3 py-4 sm:px-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label={copy.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-[10px]"
          />

          <aside
            className={cn(
              'relative flex h-[720px] max-h-[calc(100dvh-32px)] w-full max-w-[860px] overflow-hidden rounded-[18px] border',
              'flex-col',
              modalTone(isLight),
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background: isLight
                  ? 'linear-gradient(90deg, transparent, rgba(0,0,0,0.16), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
              }}
            />

            <header className={cn('shrink-0 border-b px-5 py-4 sm:px-6 sm:py-5', borderTone(isLight))}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <RoboMark light={isLight} />

                  <div className="min-w-0">
                    <h2 className="text-[27px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-[31px]">
                      {copy.title}
                    </h2>

                    <p className={cn('mt-1.5 max-w-[560px] text-[12.5px] leading-5', mutedText(isLight))}>
                      {copy.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-[10px] border transition-colors',
                    isLight
                      ? 'border-black/[0.08] bg-white text-black/42 hover:bg-black/[0.035] hover:text-black'
                      : 'border-white/[0.08] bg-white/[0.04] text-white/42 hover:bg-white/[0.07] hover:text-white',
                  )}
                  aria-label={copy.close}
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 md:grid-cols-[260px_minmax(0,1fr)]">
              <aside className={cn('hidden min-h-0 border-r p-4 md:flex md:flex-col md:overflow-y-auto [scrollbar-width:thin]', borderTone(isLight))}>
                <div className={cn('rounded-[12px] border p-3.5', panelTone(isLight))}>
                  <div
                    className={cn(
                      'mb-2 text-[9.5px] font-semibold uppercase tracking-[0.16em]',
                      faintText(isLight),
                    )}
                  >
                    {copy.current}
                  </div>

                  <div className="flex items-start gap-3">
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[10px] border', solidPanelTone(isLight))}>
                      <CalendarClock className={cn('size-4', mutedText(isLight))} />
                    </span>

                    <div className="min-w-0">
                      <div className={cn('text-[14px] font-semibold tracking-[-0.04em]', pageText(isLight))}>
                        {routeContext?.title ?? copy.workspace}
                      </div>

                      <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                        {routeContext?.text ?? copy.emptyContext}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={cn('mt-3 rounded-[12px] border p-3', panelTone(isLight))}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div
                      className={cn(
                        'text-[9.5px] font-semibold uppercase tracking-[0.16em]',
                        faintText(isLight),
                      )}
                    >
                      {copy.readiness}
                    </div>

                    <div className={cn('text-[10px] font-semibold', mutedText(isLight))}>
                      {completedCount}/{copy.steps.length}
                    </div>
                  </div>

                  <div className={cn('h-1.5 overflow-hidden rounded-full', isLight ? 'bg-black/[0.055]' : 'bg-white/[0.07]')}>
                    <div
                      className={cn('h-full rounded-full transition-all duration-300', isLight ? 'bg-black/70' : 'bg-white/70')}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={sendReadinessMessage}
                      className={cn(buttonBase(isLight), 'h-8 px-2 text-[10.5px]')}
                    >
                      <ClipboardCheck className="size-3.5" />
                      {copy.checkReady}
                    </button>

                    <button
                      type="button"
                      onClick={goNextStep}
                      className={cn(buttonBase(isLight, true), 'h-8 px-2 text-[10.5px]')}
                    >
                      {nextIncompleteStep ? copy.nextStep : copy.allDone}
                    </button>
                  </div>
                </div>

                <div className={cn('mt-3 rounded-[12px] border p-3', panelTone(isLight))}>
                  <div
                    className={cn(
                      'mb-2 text-[9.5px] font-semibold uppercase tracking-[0.16em]',
                      faintText(isLight),
                    )}
                  >
                    {copy.plan}
                  </div>

                  <div className="grid gap-1.5">
                    {copy.steps.map((step, index) => {
                      const href = buildHref(step.href);
                      const active = pathname.startsWith(step.href);
                      const completed = completedIds.includes(step.id);

                      return (
                        <div
                          key={step.href}
                          className={cn(
                            'flex h-9 min-w-0 items-center gap-1.5 rounded-[9px] border px-1.5 transition',
                            active
                              ? 'cb-neutral-primary'
                              : isLight
                                ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.025] hover:text-black'
                                : 'border-white/[0.08] bg-white/[0.04] text-white/52 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCompleted(step.id)}
                            className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-[7px] border text-[9px] font-semibold transition active:scale-[0.96]',
                              completed
                                ? active
                                  ? 'border-current/20 bg-white/18 text-current dark:bg-black/15'
                                  : isLight
                                    ? 'border-black/[0.12] bg-black/[0.075] text-black'
                                    : 'border-white/[0.14] bg-white/[0.10] text-white'
                                : active
                                  ? 'border-current/15 bg-white/10 text-current/70 dark:bg-black/10'
                                  : isLight
                                    ? 'border-black/[0.07] bg-black/[0.035] text-black/38'
                                    : 'border-white/[0.08] bg-white/[0.045] text-white/36',
                            )}
                            aria-label={step.label}
                          >
                            {completed ? <Check className="size-3.5" /> : index + 1}
                          </button>

                          <Link
                            href={href}
                            onClick={() => setOpen(false)}
                            className="group flex min-w-0 flex-1 items-center justify-between gap-2"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              {step.icon}
                              <span className="truncate text-[11px] font-medium">
                                {step.label}
                              </span>
                            </span>

                            <ChevronRight className="size-3 shrink-0 opacity-45 transition group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={cn('mt-3 rounded-[12px] border p-3', panelTone(isLight))}>
                  <div
                    className={cn(
                      'mb-2 text-[9.5px] font-semibold uppercase tracking-[0.16em]',
                      faintText(isLight),
                    )}
                  >
                    {copy.quick}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {copy.suggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => sendMessage(item)}
                        className={cn(
                          'rounded-[9px] border px-2.5 py-1.5 text-left text-[10.5px] font-medium transition active:scale-[0.99]',
                          isLight
                            ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.025] hover:text-black'
                            : 'border-white/[0.08] bg-white/[0.04] text-white/52 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="flex min-h-0 flex-col">
                <div
                  ref={listRef}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4 [scrollbar-width:thin]"
                >
                  <div className="grid gap-2 md:hidden">
                    {routeContext ? (
                      <div className={cn('rounded-[12px] border p-3.5', panelTone(isLight))}>
                        <div
                          className={cn(
                            'mb-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]',
                            faintText(isLight),
                          )}
                        >
                          {copy.current}
                        </div>

                        <div className={cn('text-[13px] font-semibold tracking-[-0.04em]', pageText(isLight))}>
                          {routeContext.title}
                        </div>

                        <p className={cn('mt-1 text-[11.5px] leading-5', mutedText(isLight))}>
                          {routeContext.text}
                        </p>
                      </div>
                    ) : null}

                    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                      <button
                        type="button"
                        onClick={sendReadinessMessage}
                        className={cn(
                          'h-8 shrink-0 rounded-[9px] border px-2.5 text-[10.5px] font-medium transition active:scale-[0.99]',
                          isLight
                            ? 'border-black/[0.08] bg-white text-black/58'
                            : 'border-white/[0.08] bg-white/[0.04] text-white/52',
                        )}
                      >
                        {copy.checkReady}
                      </button>

                      {copy.suggestions.slice(0, 3).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => sendMessage(item)}
                          className={cn(
                            'h-8 shrink-0 rounded-[9px] border px-2.5 text-[10.5px] font-medium transition active:scale-[0.99]',
                            isLight
                              ? 'border-black/[0.08] bg-white text-black/58'
                              : 'border-white/[0.08] bg-white/[0.04] text-white/52',
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {messages.map((item) => {
                      const assistant = item.role === 'assistant';

                      return (
                        <div
                          key={item.id}
                          className={cn('flex', assistant ? 'justify-start' : 'justify-end')}
                        >
                          <div
                            className={cn(
                              'max-w-[92%] overflow-hidden rounded-[14px] text-[12px] leading-5 sm:max-w-[86%]',
                              assistant
                                ? isLight
                                  ? 'border border-black/[0.07] bg-white text-black/72'
                                  : 'border border-white/[0.08] bg-white/[0.045] text-white/74'
                                : 'cb-neutral-primary',
                            )}
                          >
                            <div
                              className={cn(
                                'flex items-center justify-between gap-2 border-b px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em]',
                                assistant
                                  ? isLight
                                    ? 'border-black/[0.06] text-black/42'
                                    : 'border-white/[0.07] text-white/40'
                                  : 'border-white/15 text-current/62 dark:border-black/10',
                              )}
                            >
                              <span className="flex items-center gap-2">
                                {assistant ? (
                                  <>
                                    <Bot className="size-3" />
                                    {copy.robo}
                                  </>
                                ) : (
                                  <>
                                    <UserRound className="size-3" />
                                    {copy.you}
                                  </>
                                )}
                              </span>

                              {assistant ? (
                                <button
                                  type="button"
                                  onClick={() => copyMessage(item.id, item.text)}
                                  className="flex h-6 items-center gap-1 rounded-[7px] px-1.5 text-[9px] normal-case tracking-normal opacity-45 transition hover:bg-black/[0.045] hover:opacity-100 dark:hover:bg-white/[0.07]"
                                >
                                  <Copy className="size-3" />
                                  {copiedId === item.id ? copy.copied : copy.copy}
                                </button>
                              ) : null}
                            </div>

                            <div className="px-3.5 py-2.5">
                              <div className="whitespace-pre-wrap">{item.text}</div>

                              {item.chips?.length ? (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {item.chips.map((chip) => (
                                    <button
                                      key={chip}
                                      type="button"
                                      onClick={() => sendMessage(chip)}
                                      className={cn(
                                        'inline-flex min-h-7 items-center gap-1 rounded-[8px] border px-2 py-1 text-left text-[10px] font-medium transition active:scale-[0.98]',
                                        isLight
                                          ? 'border-black/[0.08] bg-black/[0.018] text-black/52 hover:bg-black/[0.04] hover:text-black'
                                          : 'border-white/[0.08] bg-white/[0.04] text-white/45 hover:bg-white/[0.07] hover:text-white',
                                      )}
                                    >
                                      <span>{chip}</span>
                                      <ChevronRight className="size-3 shrink-0" />
                                    </button>
                                  ))}
                                </div>
                              ) : null}

                              {item.actions?.length ? (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {item.actions.map((action) => (
                                    <button
                                      key={action.label}
                                      type="button"
                                      onClick={() => handleAction(action)}
                                      className={cn(
                                        'inline-flex h-8 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-medium transition active:scale-[0.98]',
                                        isLight
                                          ? 'border-black/[0.08] bg-black/[0.018] text-black/58 hover:bg-black/[0.04] hover:text-black'
                                          : 'border-white/[0.08] bg-white/[0.04] text-white/48 hover:bg-white/[0.07] hover:text-white',
                                      )}
                                    >
                                      {action.icon}
                                      <span>{action.label}</span>
                                      {action.href ? (
                                        <ExternalLink className="size-3" />
                                      ) : (
                                        <ArrowRight className="size-3" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <footer className={cn('shrink-0 border-t p-3', borderTone(isLight))}>
                  <div className="grid gap-2">
                    <Textarea
                      ref={inputRef}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={copy.placeholder}
                      className={cn(
                        'h-[78px] min-h-[78px] max-h-[78px] resize-none rounded-[12px] border px-3 py-2.5 text-[12.5px] leading-5 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
                        fieldTone(isLight),
                      )}
                    />

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={resetChat}
                        className={cn(buttonBase(isLight), 'h-8')}
                      >
                        <HelpCircle className="size-3.5" />
                        {copy.reset}
                      </button>

                      <button
                        type="button"
                        disabled={!message.trim()}
                        onClick={() => sendMessage(message)}
                        className={cn(
                          buttonBase(isLight, true),
                          'h-8 min-w-[132px] justify-between disabled:pointer-events-none disabled:opacity-40',
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <MessageSquareText className="size-3.5" />
                          {copy.send}
                        </span>

                        <Send className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'mt-2 hidden flex-wrap items-center gap-2 text-[10px] sm:flex',
                      faintText(isLight),
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {copy.enter}
                    </span>
                    <span>{copy.shift}</span>
                    <span>{copy.base}</span>
                  </div>
                </footer>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}