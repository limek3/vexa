'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useInView,
  useScroll,
  animate,
  AnimatePresence,
} from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Grid3X3,
  Layers,
  Globe,
  LineChart,
  MapPin,
  Menu,
  MessageCircle,
  Scissors,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WalletCards,
  Workflow,
  Stethoscope,
  Dumbbell,
  GraduationCap,
  UserRound,
  X,
  Quote,
  Minus,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';

const ACCENT = '#127dfe';

// ─── Copy ────────────────────────────────────────────────────────────────────
const COPY = {
  ru: {
    nav: [
      ['#features', 'Возможности'],
      ['#who', 'Для кого'],
      ['#how', 'Как работает'],
      ['#proof', 'Отзывы'],
    ],
    login: 'Войти',
    ctaTop: 'Попробовать',
    prev: 'Назад',
    next: 'Далее',
    hero: {
      badge: 'Онлайн-запись нового поколения',
      title1: 'Запись клиентов',
      title2: 'без хаоса',
      title3: 'в мессенджерах',
      sub: 'КликБук объединяет расписание, клиентскую базу и аналитику в одном понятном кабинете.',
      cta1: 'Начать бесплатно',
      cta2: 'Смотреть демо',
      trust: ['Без карты', 'Бесплатный старт', '5 минут до запуска'],
      chips: [
        { label: 'Новая запись', sub: 'Дарья · Маникюр' },
        { label: '+38% записей', sub: 'за этот месяц' },
        { label: 'Напоминание', sub: 'Анна · 16:00' },
      ],
    },
    why: {
      eyebrow: 'Зачем',
      title: 'От хаоса — к спокойному рабочему дню',
      before: {
        tag: 'Раньше',
        items: [
          'Записи теряются в десяти чатах',
          'Двойные брони и пропущенные визиты',
          'Нет данных о клиентах и доходе',
          'Часы ручной рутины каждый день',
        ],
      },
      after: {
        tag: 'С КликБук',
        items: [
          'Всё расписание в одном экране',
          'Авто-напоминания убирают no-show',
          'База клиентов и история за секунду',
          'Аналитика и выручка в реальном времени',
        ],
      },
    },
    features: {
      eyebrow: 'Возможности',
      title: 'Всё нужное — в одном продукте',
      sub: 'Один продукт вместо десяти таблиц и чатов.',
      items: [
        { title: 'Онлайн-запись', desc: 'Клиент выбирает услугу и время — без звонков.' },
        { title: 'Расписание', desc: 'Удобный календарь по сотрудникам и локациям.' },
        { title: 'База клиентов', desc: 'Карточки, история и контакты каждого.' },
        { title: 'Напоминания', desc: 'Авто-уведомления убирают отмены.' },
        { title: 'Команда', desc: 'Роли, графики и несколько точек.' },
        { title: 'Аналитика', desc: 'Выручка и повторы в реальном времени.' },
        { title: 'Услуги', desc: 'Гибкое управление ценами и категориями.' },
        { title: 'Интеграции', desc: 'Виджет, Telegram и VK.' },
      ],
    },
    who: {
      eyebrow: 'Для кого',
      title: 'Для бизнеса любого масштаба',
      sub: 'От частного мастера до сети филиалов.',
      items: [
        { title: 'Красота', desc: 'Салоны, барбершопы, маникюр, косметология.' },
        { title: 'Здоровье', desc: 'Массажисты, wellness, частные приёмы.' },
        { title: 'Спорт', desc: 'Тренеры, студии, йога, фитнес.' },
        { title: 'Обучение', desc: 'Репетиторы, курсы, мастер-классы.' },
        { title: 'Специалисты', desc: 'Самозанятые эксперты и консультанты.' },
        { title: 'Сети', desc: 'Команды с филиалами и сложным расписанием.' },
      ],
    },
    how: {
      eyebrow: 'Как работает',
      title: 'Запуск за 5 минут — без обучения',
      steps: [
        { n: '01', title: 'Создайте страницу', desc: 'Зарегистрируйтесь и оформите профиль за 2 минуты.' },
        { n: '02', title: 'Добавьте услуги', desc: 'Услуги, цены, длительность и расписание.' },
        { n: '03', title: 'Клиенты записываются', desc: 'Делитесь ссылкой или встраивайте виджет.' },
        { n: '04', title: 'Управляйте всем', desc: 'Расписание, напоминания, аналитика, выручка.' },
      ],
    },
    proof: {
      eyebrow: 'Результаты',
      title: 'Бизнесы уже растут с КликБук',
      stats: [
        { val: 78, suffix: '%', pre: 'до', label: 'меньше пропущенных' },
        { val: 2500, suffix: '+', pre: '', label: 'активных бизнесов' },
        { val: 5, suffix: ' мин', pre: '', label: 'до запуска страницы' },
        { val: 24, suffix: '/7', pre: '', label: 'онлайн-запись' },
      ],
      reviews: [
        {
          text: 'Раньше расписание было в трёх таблицах и голове администратора. Теперь всё в одном месте — и клиенты записываются сами.',
          name: 'Анна Лебедева',
          role: 'Студия маникюра',
        },
        {
          text: 'Количество no-show упало почти в три раза. Напоминания делают своё дело, сотрудники видят расписание в телефоне.',
          name: 'Дмитрий Орлов',
          role: 'Барбершоп, 2 филиала',
        },
        {
          text: 'Запустили страницу записи за вечер. Через неделю поняли, что без аналитики уже не сможем.',
          name: 'Марина Соколова',
          role: 'Косметолог',
        },
      ],
    },
    cta: {
      badge: 'Бесплатный старт',
      title: 'Запустите онлайн-запись уже сегодня',
      sub: 'Создайте страницу записи за 5 минут — клиенты начнут записываться сами.',
      btn1: 'Начать с КликБук',
      btn2: 'Смотреть демо',
      trust: ['Без карты', '5 минут до запуска', 'Поддержка 24/7'],
    },
    footer: `© ${new Date().getFullYear()} КликБук. Все права защищены.`,
  },
  en: {
    nav: [
      ['#features', 'Features'],
      ['#who', 'For whom'],
      ['#how', 'How it works'],
      ['#proof', 'Reviews'],
    ],
    login: 'Sign in',
    ctaTop: 'Try free',
    prev: 'Prev',
    next: 'Next',
    hero: {
      badge: 'Next-generation booking platform',
      title1: 'Client booking',
      title2: 'without chaos',
      title3: 'in messengers',
      sub: 'ClickBook unifies schedule, client database, and analytics in one clear workspace.',
      cta1: 'Start for free',
      cta2: 'View demo',
      trust: ['No card required', 'Free start', '5 min to launch'],
      chips: [
        { label: 'New booking', sub: 'Daria · Nails' },
        { label: '+38% bookings', sub: 'this month' },
        { label: 'Reminder sent', sub: 'Anna · 16:00' },
      ],
    },
    why: {
      eyebrow: 'Why',
      title: 'From chaos to a calm workday',
      before: {
        tag: 'Before',
        items: [
          'Bookings lost in ten chats',
          'Double bookings and missed visits',
          'No client data or revenue insight',
          'Hours of manual work every day',
        ],
      },
      after: {
        tag: 'With ClickBook',
        items: [
          'Full schedule in one screen',
          'Auto-reminders eliminate no-shows',
          'Client base and history in seconds',
          'Real-time analytics and revenue',
        ],
      },
    },
    features: {
      eyebrow: 'Features',
      title: 'Everything you need — in one product',
      sub: 'One product instead of ten spreadsheets and chats.',
      items: [
        { title: 'Online booking', desc: 'Client picks a service and time — no calls.' },
        { title: 'Calendar', desc: 'Schedule view by staff and locations.' },
        { title: 'Client base', desc: 'Cards, history, and contacts for everyone.' },
        { title: 'Reminders', desc: 'Auto-notifications reduce cancellations.' },
        { title: 'Team', desc: 'Roles, schedules, multiple locations.' },
        { title: 'Analytics', desc: 'Revenue and repeats in real time.' },
        { title: 'Services', desc: 'Flexible price and category management.' },
        { title: 'Integrations', desc: 'Widget, Telegram, and VK.' },
      ],
    },
    who: {
      eyebrow: 'For whom',
      title: 'For businesses of any scale',
      sub: 'From solo specialist to a network of branches.',
      items: [
        { title: 'Beauty', desc: 'Salons, barbershops, nails, cosmetology.' },
        { title: 'Health', desc: 'Massage, wellness, private practice.' },
        { title: 'Fitness', desc: 'Trainers, studios, yoga, gyms.' },
        { title: 'Education', desc: 'Tutors, courses, workshops.' },
        { title: 'Specialists', desc: 'Freelancers, experts, consultants.' },
        { title: 'Networks', desc: 'Teams with branches and complex schedules.' },
      ],
    },
    how: {
      eyebrow: 'How it works',
      title: 'Launch in 5 minutes — no training',
      steps: [
        { n: '01', title: 'Create your page', desc: 'Sign up and set up your profile in 2 minutes.' },
        { n: '02', title: 'Add services', desc: 'Services, prices, duration, and schedule.' },
        { n: '03', title: 'Clients book', desc: 'Share a link or embed a widget.' },
        { n: '04', title: 'Manage everything', desc: 'Schedule, reminders, analytics, revenue.' },
      ],
    },
    proof: {
      eyebrow: 'Results',
      title: 'Businesses growing with ClickBook',
      stats: [
        { val: 78, suffix: '%', pre: 'up to', label: 'fewer missed bookings' },
        { val: 2500, suffix: '+', pre: '', label: 'active businesses' },
        { val: 5, suffix: ' min', pre: '', label: 'to launch a page' },
        { val: 24, suffix: '/7', pre: '', label: 'online booking' },
      ],
      reviews: [
        {
          text: "Before, the schedule was in three spreadsheets and the admin's head. Now everything is in one place and clients book themselves.",
          name: 'Anna Lebedeva',
          role: 'Nail studio',
        },
        {
          text: 'No-shows dropped by almost three times. Reminders do their job, staff see the schedule on their phones.',
          name: 'Dmitry Orlov',
          role: 'Barbershop, 2 locations',
        },
        {
          text: "We launched a booking page in an evening. A week later we realized we can't work without analytics.",
          name: 'Marina Sokolova',
          role: 'Cosmetologist',
        },
      ],
    },
    cta: {
      badge: 'Free start',
      title: 'Launch online booking today',
      sub: 'Create a booking page in 5 minutes — clients will book themselves.',
      btn1: 'Start with ClickBook',
      btn2: 'View demo',
      trust: ['No card required', '5 minutes to launch', 'Support 24/7'],
    },
    footer: `© ${new Date().getFullYear()} ClickBook. All rights reserved.`,
  },
} as const;

const FEATURE_ICONS = [Globe, CalendarDays, Users, Bell, Building2, BarChart3, Sparkles, Workflow];
const WHO_ICONS = [Scissors, Stethoscope, Dumbbell, GraduationCap, UserRound, Layers];

type LandingLocale = keyof typeof COPY;
type LandingCopy = (typeof COPY)[LandingLocale];
type MegaMenuId = 'start' | 'business' | 'solutions' | 'company';

type MegaMenuItem = {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

type MegaMenuColumn = {
  title: string;
  items: MegaMenuItem[];
};

type MegaMenuPromo = {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  tone: 'dark' | 'blue' | 'light';
};

type MegaMenu = {
  id: MegaMenuId;
  label: string;
  intro: {
    title: string;
    desc: string;
    cta: string;
    href: string;
    meta: string;
  };
  columns: MegaMenuColumn[];
  promos: MegaMenuPromo[];
};

const LANDING_MENUS: Record<LandingLocale, MegaMenu[]> = {
  ru: [
    {
      id: 'start',
      label: 'Начало работы',
      intro: {
        title: 'Запустите онлайн-запись без хаоса',
        desc: 'Создайте страницу, добавьте услуги и принимайте заявки из Telegram, VK, сайта и прямой ссылки.',
        cta: 'Запустить страницу',
        href: '/login',
        meta: '5 минут до первого бронирования',
      },
      columns: [
        {
          title: 'Привлекайте клиентов',
          items: [
            { title: 'Страница записи', desc: 'Публичная ссылка с услугами, ценами и свободным временем.', href: '#features', icon: Globe },
            { title: 'Виджет на сайт', desc: 'Встроенная запись без перехода в сторонние сервисы.', href: '#features', icon: Grid3X3 },
            { title: 'Telegram и VK', desc: 'Заявки, ответы и уведомления прямо в мессенджерах.', href: '#features', icon: MessageCircle, badge: 'new' },
          ],
        },
        {
          title: 'Управляйте работой',
          items: [
            { title: 'Календарь', desc: 'День, неделя, сотрудники, перерывы и заблокированные слоты.', href: '/dashboard/today', icon: CalendarDays },
            { title: 'Клиентская база', desc: 'Контакты, история визитов, заметки и повторные записи.', href: '/dashboard/clients', icon: Users },
            { title: 'Услуги и цены', desc: 'Категории, длительность, стоимость и доступность услуг.', href: '/dashboard/services', icon: Scissors },
          ],
        },
        {
          title: 'Растите системно',
          items: [
            { title: 'Автонапоминания', desc: 'Снижают no-show и освобождают администратора от рутины.', href: '/dashboard/notifications', icon: Bell },
            { title: 'Аналитика', desc: 'Выручка, записи, конверсия, загрузка и динамика бизнеса.', href: '/dashboard/stats', icon: BarChart3 },
            { title: 'Финансы', desc: 'Доходы, услуги, средний чек и понятный контроль оплат.', href: '/dashboard/finance', icon: WalletCards },
          ],
        },
      ],
      promos: [
        { title: 'Демо-кабинет', desc: 'Посмотрите, как платформа выглядит на живых мок-данных.', href: '/demo', icon: Sparkles, tone: 'dark' },
        { title: 'Умные чаты', desc: 'Все диалоги с клиентами и контекст бронирований в одном месте.', href: '/dashboard/chats', icon: MessageCircle, tone: 'blue' },
      ],
    },
    {
      id: 'business',
      label: 'Для бизнеса',
      intro: {
        title: 'Подходит и мастеру, и сети филиалов',
        desc: 'КликБук масштабируется от одного специалиста до команды с администраторами, филиалами и плотным расписанием.',
        cta: 'Подобрать сценарий',
        href: '#who',
        meta: 'Красота · здоровье · спорт · обучение',
      },
      columns: [
        {
          title: 'Популярные сферы',
          items: [
            { title: 'Салоны красоты', desc: 'Маникюр, волосы, брови, косметология и комплексные услуги.', href: '#who', icon: Scissors },
            { title: 'Здоровье и wellness', desc: 'Массаж, частные приёмы, процедуры и регулярные клиенты.', href: '#who', icon: Stethoscope },
            { title: 'Спорт и тренировки', desc: 'Персональные тренеры, студии, секции и групповые занятия.', href: '#who', icon: Dumbbell },
          ],
        },
        {
          title: 'Форматы работы',
          items: [
            { title: 'Частный мастер', desc: 'Простая страница записи и быстрый контроль своего дня.', href: '#who', icon: UserRound },
            { title: 'Команда специалистов', desc: 'Графики сотрудников, роли, услуги и общая клиентская база.', href: '#who', icon: Users },
            { title: 'Филиалы и локации', desc: 'Разделение расписаний по адресам, кабинетам и направлениям.', href: '#who', icon: MapPin },
          ],
        },
        {
          title: 'Операционная система',
          items: [
            { title: 'Администратор', desc: 'Быстро создаёт записи, переносы и видит состояние дня.', href: '/dashboard', icon: Settings2 },
            { title: 'Контроль загрузки', desc: 'Понимайте свободные окна, пиковые часы и эффективность команды.', href: '/dashboard/stats', icon: LineChart },
            { title: 'Качество сервиса', desc: 'Отзывы, повторные визиты и аккуратная коммуникация.', href: '/dashboard/reviews', icon: Star },
          ],
        },
      ],
      promos: [
        { title: 'Сценарий для салона', desc: 'Записи, команда, напоминания и повторные визиты без таблиц.', href: '#how', icon: Building2, tone: 'dark' },
        { title: 'Сценарий для мастера', desc: 'Личная ссылка, аккуратный календарь и клиентская история.', href: '#how', icon: UserRound, tone: 'light' },
      ],
    },
    {
      id: 'solutions',
      label: 'Возможности',
      intro: {
        title: 'Все ключевые процессы — в одном кабинете',
        desc: 'Не отдельный календарик, а рабочая SaaS-система: заявки, клиенты, финансы, аналитика и коммуникации.',
        cta: 'Смотреть возможности',
        href: '#features',
        meta: 'Один продукт вместо 10 таблиц и чатов',
      },
      columns: [
        {
          title: 'Запись и расписание',
          items: [
            { title: 'Онлайн-бронирование', desc: 'Клиент сам выбирает услугу, дату и свободное время.', href: '#features', icon: CalendarDays },
            { title: 'Блокировки и перерывы', desc: 'Закрывайте окна, подтверждайте разблокировку и избегайте ошибок.', href: '/dashboard/availability', icon: Clock3 },
            { title: 'Переносы записей', desc: 'Удобная работа с изменениями без потери контекста.', href: '/dashboard/today', icon: Workflow },
          ],
        },
        {
          title: 'Коммуникации',
          items: [
            { title: 'Чаты с клиентами', desc: 'Диалоги связаны с клиентом, записью и историей визитов.', href: '/dashboard/chats', icon: MessageCircle },
            { title: 'Шаблоны сообщений', desc: 'Быстрые ответы, напоминания и сервисные уведомления.', href: '/dashboard/templates', icon: Layers },
            { title: 'Источники заявок', desc: 'Понимайте, откуда приходят записи и какие каналы работают.', href: '/dashboard/sources', icon: Globe },
          ],
        },
        {
          title: 'Деньги и рост',
          items: [
            { title: 'Платежи', desc: 'Контроль оплат, статусов и финансовой дисциплины.', href: '/dashboard/payments', icon: CreditCard },
            { title: 'Статистика', desc: 'Графики записей, выручки, клиентов и загрузки.', href: '/dashboard/stats', icon: BarChart3 },
            { title: 'Маркетинг', desc: 'Повторы, реактивация клиентов и рост записей.', href: '/dashboard/marketing', icon: Sparkles },
          ],
        },
      ],
      promos: [
        { title: 'Аналитика в демо', desc: 'Графики и показатели уже заполнены мок-данными для презентации.', href: '/demo', icon: BarChart3, tone: 'blue' },
        { title: 'Надёжный кабинет', desc: 'Роли, интеграции, лимиты и настройки собраны без лишней сложности.', href: '/dashboard/integrations', icon: ShieldCheck, tone: 'dark' },
      ],
    },
    {
      id: 'company',
      label: 'Наша компания',
      intro: {
        title: 'Мы строим спокойную систему для записей',
        desc: 'КликБук помогает бизнесу убрать хаос из расписания, клиентских сообщений и ежедневной операционки.',
        cta: 'О платформе',
        href: '/about',
        meta: 'Продукт для малого сервиса и локальных команд',
      },
      columns: [
        {
          title: 'О продукте',
          items: [
            { title: 'Миссия', desc: 'Сделать онлайн-запись простой, красивой и понятной для бизнеса.', href: '/about', icon: Sparkles },
            { title: 'Безопасность', desc: 'Аккуратная авторизация, роли и контроль пользовательских данных.', href: '/about', icon: ShieldCheck },
            { title: 'Демо-режим', desc: 'Покажите платформу клиенту или команде без реальных данных.', href: '/demo', icon: Grid3X3 },
          ],
        },
        {
          title: 'Ресурсы',
          items: [
            { title: 'Как работает', desc: 'Пошаговый запуск страницы, услуг и расписания.', href: '#how', icon: Workflow },
            { title: 'Отзывы', desc: 'Почему бизнесу важно видеть результат и повторные записи.', href: '#proof', icon: Star },
            { title: 'Поддержка', desc: 'Помощь с запуском, переносом данных и настройками.', href: '/login', icon: MessageCircle },
          ],
        },
      ],
      promos: [
        { title: 'Запустить бесплатно', desc: 'Создайте страницу и проверьте сценарий на своём бизнесе.', href: '/login', icon: ArrowUpRight, tone: 'dark' },
        { title: 'Смотреть презентацию', desc: 'Откройте демо и покажите, как работает кабинет.', href: '/demo', icon: Sparkles, tone: 'light' },
      ],
    },
  ],
  en: [
    {
      id: 'start',
      label: 'Get started',
      intro: {
        title: 'Launch booking without chaos',
        desc: 'Create a booking page, add services, and receive requests from Telegram, VK, website widgets, and direct links.',
        cta: 'Launch page',
        href: '/login',
        meta: '5 minutes to the first booking',
      },
      columns: [
        {
          title: 'Attract clients',
          items: [
            { title: 'Booking page', desc: 'A public link with services, prices, and available time.', href: '#features', icon: Globe },
            { title: 'Website widget', desc: 'Embedded booking without sending clients elsewhere.', href: '#features', icon: Grid3X3 },
            { title: 'Telegram and VK', desc: 'Requests, replies, and notifications inside messengers.', href: '#features', icon: MessageCircle, badge: 'new' },
          ],
        },
        {
          title: 'Run operations',
          items: [
            { title: 'Calendar', desc: 'Day, week, staff, breaks, and blocked slots.', href: '/dashboard/today', icon: CalendarDays },
            { title: 'Client base', desc: 'Contacts, visit history, notes, and repeat bookings.', href: '/dashboard/clients', icon: Users },
            { title: 'Services and prices', desc: 'Categories, duration, price, and availability.', href: '/dashboard/services', icon: Scissors },
          ],
        },
        {
          title: 'Grow steadily',
          items: [
            { title: 'Auto reminders', desc: 'Reduce no-shows and remove manual admin routine.', href: '/dashboard/notifications', icon: Bell },
            { title: 'Analytics', desc: 'Revenue, bookings, conversion, occupancy, and trends.', href: '/dashboard/stats', icon: BarChart3 },
            { title: 'Finance', desc: 'Income, services, average check, and payment control.', href: '/dashboard/finance', icon: WalletCards },
          ],
        },
      ],
      promos: [
        { title: 'Demo workspace', desc: 'See the platform with rich mock data.', href: '/demo', icon: Sparkles, tone: 'dark' },
        { title: 'Smart chats', desc: 'Client conversations and booking context in one place.', href: '/dashboard/chats', icon: MessageCircle, tone: 'blue' },
      ],
    },
    {
      id: 'business',
      label: 'For business',
      intro: {
        title: 'Built for solo experts and multi-location teams',
        desc: 'ClickBook scales from a single specialist to a team with admins, locations, and complex schedules.',
        cta: 'Choose scenario',
        href: '#who',
        meta: 'Beauty · health · sport · education',
      },
      columns: [
        {
          title: 'Industries',
          items: [
            { title: 'Beauty salons', desc: 'Nails, hair, brows, cosmetology, and combined services.', href: '#who', icon: Scissors },
            { title: 'Health and wellness', desc: 'Massage, private appointments, treatments, and regular clients.', href: '#who', icon: Stethoscope },
            { title: 'Sport and training', desc: 'Personal trainers, studios, classes, and group sessions.', href: '#who', icon: Dumbbell },
          ],
        },
        {
          title: 'Work formats',
          items: [
            { title: 'Solo specialist', desc: 'A simple booking page and quick control over the day.', href: '#who', icon: UserRound },
            { title: 'Team of specialists', desc: 'Staff schedules, roles, services, and a shared client base.', href: '#who', icon: Users },
            { title: 'Locations', desc: 'Separate schedules by address, room, and service direction.', href: '#who', icon: MapPin },
          ],
        },
        {
          title: 'Operating system',
          items: [
            { title: 'Administrator', desc: 'Create bookings, reschedules, and see the day state quickly.', href: '/dashboard', icon: Settings2 },
            { title: 'Occupancy control', desc: 'Understand free windows, peak hours, and team efficiency.', href: '/dashboard/stats', icon: LineChart },
            { title: 'Service quality', desc: 'Reviews, repeat visits, and clean communication.', href: '/dashboard/reviews', icon: Star },
          ],
        },
      ],
      promos: [
        { title: 'Salon scenario', desc: 'Bookings, team, reminders, and repeat visits without spreadsheets.', href: '#how', icon: Building2, tone: 'dark' },
        { title: 'Specialist scenario', desc: 'Personal link, clear calendar, and client history.', href: '#how', icon: UserRound, tone: 'light' },
      ],
    },
    {
      id: 'solutions',
      label: 'Features',
      intro: {
        title: 'All key processes in one workspace',
        desc: 'Not just a calendar — a SaaS operating system for requests, clients, finance, analytics, and communication.',
        cta: 'See features',
        href: '#features',
        meta: 'One product instead of 10 spreadsheets and chats',
      },
      columns: [
        {
          title: 'Booking and schedule',
          items: [
            { title: 'Online booking', desc: 'Clients choose a service, date, and available time themselves.', href: '#features', icon: CalendarDays },
            { title: 'Blocks and breaks', desc: 'Close windows, confirm unblocks, and avoid accidental changes.', href: '/dashboard/availability', icon: Clock3 },
            { title: 'Reschedules', desc: 'Handle changes without losing booking context.', href: '/dashboard/today', icon: Workflow },
          ],
        },
        {
          title: 'Communication',
          items: [
            { title: 'Client chats', desc: 'Dialogues connected to clients, bookings, and visit history.', href: '/dashboard/chats', icon: MessageCircle },
            { title: 'Message templates', desc: 'Quick replies, reminders, and service notifications.', href: '/dashboard/templates', icon: Layers },
            { title: 'Booking sources', desc: 'Understand which channels bring appointments.', href: '/dashboard/sources', icon: Globe },
          ],
        },
        {
          title: 'Money and growth',
          items: [
            { title: 'Payments', desc: 'Control payment states and financial discipline.', href: '/dashboard/payments', icon: CreditCard },
            { title: 'Statistics', desc: 'Charts for bookings, revenue, clients, and occupancy.', href: '/dashboard/stats', icon: BarChart3 },
            { title: 'Marketing', desc: 'Repeat visits, reactivation, and booking growth.', href: '/dashboard/marketing', icon: Sparkles },
          ],
        },
      ],
      promos: [
        { title: 'Analytics demo', desc: 'Charts are filled with mock data for presentation.', href: '/demo', icon: BarChart3, tone: 'blue' },
        { title: 'Reliable workspace', desc: 'Roles, integrations, limits, and settings without complexity.', href: '/dashboard/integrations', icon: ShieldCheck, tone: 'dark' },
      ],
    },
    {
      id: 'company',
      label: 'Company',
      intro: {
        title: 'We build calm booking systems',
        desc: 'ClickBook helps teams remove chaos from scheduling, client messages, and everyday operations.',
        cta: 'About platform',
        href: '/about',
        meta: 'Product for local service businesses and teams',
      },
      columns: [
        {
          title: 'Product',
          items: [
            { title: 'Mission', desc: 'Make online booking simple, beautiful, and clear for business.', href: '/about', icon: Sparkles },
            { title: 'Security', desc: 'Clean auth, roles, and control over user data.', href: '/about', icon: ShieldCheck },
            { title: 'Demo mode', desc: 'Show the platform without real business data.', href: '/demo', icon: Grid3X3 },
          ],
        },
        {
          title: 'Resources',
          items: [
            { title: 'How it works', desc: 'Step-by-step launch of page, services, and schedule.', href: '#how', icon: Workflow },
            { title: 'Reviews', desc: 'Why teams need results and repeat bookings visible.', href: '#proof', icon: Star },
            { title: 'Support', desc: 'Help with launch, data migration, and settings.', href: '/login', icon: MessageCircle },
          ],
        },
      ],
      promos: [
        { title: 'Start free', desc: 'Create a page and test the scenario on your business.', href: '/login', icon: ArrowUpRight, tone: 'dark' },
        { title: 'View demo', desc: 'Open the demo and show how the workspace works.', href: '/demo', icon: Sparkles, tone: 'light' },
      ],
    },
  ],
};

// ─── Scroll progress bar ──────────────────────────────────────────────────────
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  return (
    <motion.div
      style={{ scaleX, background: `linear-gradient(90deg, ${ACCENT}, #38bdf8)` }}
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left"
    />
  );
}

// ─── Reveal ───────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 28, className = '' }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ target, suffix = '', pre = '' }: { target: number; suffix?: string; pre?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const ctrl = animate(0, target, {
      duration: 2.4, ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        node.textContent = (pre ? pre + ' ' : '') +
          (target >= 1000 ? Math.round(v).toLocaleString('ru') : Math.round(v)) + suffix;
      },
    });
    return () => ctrl.stop();
  }, [inView, target, suffix, pre]);
  return <span ref={ref}>{pre ? pre + ' ' : ''}0{suffix}</span>;
}

// ─── Section eyebrow label ────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <span className="h-px w-5 bg-[#127dfe]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#127dfe]">{children}</span>
    </div>
  );
}

// ─── Slider (mobile carousel) ─────────────────────────────────────────────────
type SliderProps = { children: React.ReactNode; autoplay?: number; loop?: boolean; prevLabel?: string; nextLabel?: string; className?: string };
function Slider({ children, autoplay, loop = true, prevLabel, nextLabel, className = '' }: SliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop, align: 'start', containScroll: 'trimSnaps' });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    const onReInit = () => setSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onReInit);
    setSnaps(emblaApi.scrollSnapList());
    onSelect();
    return () => { emblaApi.off('select', onSelect); emblaApi.off('reInit', onReInit); };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || !autoplay || paused) return;
    const id = setInterval(() => {
      if (emblaApi.canScrollNext()) emblaApi.scrollNext(); else emblaApi.scrollTo(0);
    }, autoplay);
    return () => clearInterval(id);
  }, [emblaApi, autoplay, paused]);

  return (
    <div className={cn('relative', className)} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 touch-pan-y">{children}</div>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {snaps.map((_, i) => (
            <button key={i} type="button" onClick={() => emblaApi?.scrollTo(i)}
              className={cn('h-1 rounded-full transition-all duration-300', selected === i ? 'w-8 bg-[#127dfe]' : 'w-3 bg-black/15 dark:bg-white/15')} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => emblaApi?.scrollPrev()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/12 text-black/60 transition-all hover:border-black/30 hover:bg-black hover:text-white dark:border-white/12 dark:text-white/60 dark:hover:bg-white dark:hover:text-black">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => emblaApi?.scrollNext()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/12 text-black/60 transition-all hover:border-black/30 hover:bg-black hover:text-white dark:border-white/12 dark:text-white/60 dark:hover:bg-white dark:hover:text-black">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Side nav dots ─────────────────────────────────────────────────────────────
const SLIDE_IDS = ['hero', 'why', 'features', 'who', 'how', 'proof', 'cta'] as const;
const SLIDE_LABELS_RU = ['Старт', 'Зачем', 'Возможности', 'Для кого', 'Как', 'Отзывы', 'Запуск'];
const SLIDE_LABELS_EN = ['Start', 'Why', 'Features', 'For whom', 'How', 'Reviews', 'Launch'];

function SideNav({ locale }: { locale: string }) {
  const [active, setActive] = useState(0);
  const labels = locale === 'en' ? SLIDE_LABELS_EN : SLIDE_LABELS_RU;
  useEffect(() => {
    const els = SLIDE_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { const idx = SLIDE_IDS.indexOf(e.target.id as typeof SLIDE_IDS[number]); if (idx !== -1) setActive(idx); } }); },
      { threshold: 0.4 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <nav className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 lg:flex">
      <div className="flex flex-col items-end gap-3">
        {SLIDE_IDS.map((id, i) => (
          <a key={id} href={`#${id}`} className="group flex items-center gap-2.5" title={labels[i]}>
            <span className={cn('text-[10px] font-medium tracking-wide transition-all duration-300',
              active === i ? 'opacity-100 text-black dark:text-white' : 'opacity-0 text-black/40 group-hover:opacity-100 dark:text-white/40')}>{labels[i]}</span>
            <span className={cn('block h-px transition-all duration-300 rounded-full',
              active === i ? 'w-6 bg-[#127dfe]' : 'w-3 bg-black/20 group-hover:w-5 dark:bg-white/20')} />
          </a>
        ))}
      </div>
    </nav>
  );
}

// ─── Marquee strip ────────────────────────────────────────────────────────────
function MarqueeStrip({ items, dark = false }: { items: string[]; dark?: boolean }) {
  const list = [...items, ...items, ...items];
  return (
    <div className="relative w-full overflow-hidden py-3.5"
      style={{ maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
      <motion.div
        animate={{ x: ['0%', '-33.333%'] }}
        transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
        className={cn('flex w-max items-center gap-10 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.22em]',
          dark ? 'text-white/30' : 'text-black/35 dark:text-white/30')}>
        {list.map((item, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-current opacity-60" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Dashboard mockup ─────────────────────────────────────────────────────────
type ChipsTuple = ReadonlyArray<{ readonly label: string; readonly sub: string }>;

function DashboardMockup({ chips, inView }: { chips: ChipsTuple; inView: boolean }) {
  const [notiIdx, setNotiIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNotiIdx((i) => (i + 1) % chips.length), 3200);
    return () => clearInterval(id);
  }, [chips.length]);

  const slots = [
    { name: chips[0].sub.split(' · ')[0] || 'Дарья', service: chips[0].sub.split(' · ')[1] || 'Маникюр', time: '12:30' },
    { name: chips[2].sub.split(' · ')[0] || 'Анна', service: 'Стрижка', time: chips[2].sub.split(' · ')[1] || '16:00' },
    { name: 'Михаил', service: 'Массаж', time: '18:00' },
  ];
  const chartPoints = [22, 38, 31, 52, 44, 70, 62, 88];
  const chartW = 240; const chartH = 56;
  const stepX = chartW / (chartPoints.length - 1);
  const maxY = Math.max(...chartPoints);
  const pathD = chartPoints.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${chartH - (v / maxY) * chartH * 0.92}`).join(' ');
  const areaD = `${pathD} L ${chartW} ${chartH} L 0 ${chartH} Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[520px]"
    >
      {/* Glow */}
      <motion.div
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -inset-6 rounded-[44px] blur-[60px] opacity-60"
        style={{ background: `radial-gradient(ellipse at 50% 60%, ${ACCENT}55, transparent 68%)` }}
      />
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#0d0f1a] p-5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
      >
        {/* Mac-style header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c840]" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1">
            <CalendarDays className="h-3 w-3 text-white/40" />
            <span className="text-[10px] font-medium tracking-[0.1em] text-white/40">clickbook.app</span>
          </div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Bell className="h-3.5 w-3.5 text-white/40" />
          </motion.div>
        </div>

        {/* Notification */}
        <div className="relative mb-4 h-[60px]">
          <AnimatePresence mode="wait">
            <motion.div key={notiIdx}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3 overflow-hidden"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#127dfe]/20 text-[#127dfe]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-white/90">{chips[notiIdx].label}</div>
                <div className="truncate text-[11px] text-white/40">{chips[notiIdx].sub}</div>
              </div>
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-[#127dfe] to-[#38bdf8]" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Booking slots */}
        <div className="mb-4 space-y-1.5">
          {slots.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.7 + i * 0.1 }}
              className="group flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5 transition-all hover:border-[#127dfe]/30 hover:bg-[#127dfe]/[0.06]"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-white/70">{s.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-white/85">{s.name}</div>
                <div className="text-[10.5px] text-white/40">{s.service}</div>
              </div>
              <div className="rounded-lg bg-white/8 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white/70">{s.time}</div>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#127dfe]" />
            </motion.div>
          ))}
        </div>

        {/* Mini chart */}
        <div className="mb-3 rounded-2xl border border-white/6 bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">Записи · 7 дней</div>
            <div className="text-[11px] font-bold tabular-nums text-[#38bdf8]">+24%</div>
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-12 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity="0.28" />
                <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path d={areaD} fill="url(#cFill)" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.9, delay: 1.2 }} />
            <motion.path d={pathD} fill="none" stroke={ACCENT} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.6, delay: 1, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
        </div>

        {/* Bottom stat */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 1.5 }}
          className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#127dfe] to-[#0a5fd4] p-3.5"
        >
          <div>
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/70">{chips[1].sub}</div>
            <div className="text-[24px] font-bold leading-none tracking-[-0.03em] text-white">{chips[1].label}</div>
          </div>
          <BarChart3 className="h-6 w-6 text-white/80" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
const menuPanelVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.985, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    filter: 'blur(6px)',
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
} as const;

const menuItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.03 + index * 0.025, duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  }),
} as const;

function MegaMenuItemLink({ item, index }: { item: MegaMenuItem; index: number }) {
  const Icon = item.icon;

  return (
    <motion.a
      custom={index}
      variants={menuItemVariants}
      initial="hidden"
      animate="visible"
      href={item.href}
      className="group/item relative -mx-2 flex gap-3 rounded-2xl px-2 py-2.5 transition-all duration-300 hover:bg-black/[0.035] dark:hover:bg-white/[0.06]"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-black/72 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover/item:-translate-y-0.5 group-hover/item:border-black/18 group-hover/item:bg-black group-hover/item:text-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white/72 dark:group-hover/item:bg-white dark:group-hover/item:text-black">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[13px] font-semibold leading-5 text-black/86 dark:text-white/88">
          {item.title}
          {item.badge ? (
            <span className="rounded-full bg-[#127dfe]/10 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#127dfe]">
              {item.badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block max-w-[230px] text-[11.5px] leading-[1.45] text-black/46 transition-colors group-hover/item:text-black/58 dark:text-white/42 dark:group-hover/item:text-white/58">
          {item.desc}
        </span>
      </span>
      <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-black/0 transition-all duration-300 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:text-black/35 dark:group-hover/item:text-white/45" />
    </motion.a>
  );
}

function MegaPromoCard({ promo, index }: { promo: MegaMenuPromo; index: number }) {
  const Icon = promo.icon;
  const toneClass =
    promo.tone === 'blue'
      ? 'border-[#127dfe]/20 bg-[#127dfe] text-white shadow-[0_24px_70px_-28px_rgba(18,125,254,0.85)]'
      : promo.tone === 'dark'
        ? 'border-white/10 bg-[#06070b] text-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.75)]'
        : 'border-black/8 bg-[#f6f7f9] text-black dark:border-white/10 dark:bg-white/[0.06] dark:text-white';

  return (
    <motion.a
      custom={index}
      variants={menuItemVariants}
      initial="hidden"
      animate="visible"
      href={promo.href}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.24 }}
      className={cn('group/promo relative min-h-[124px] overflow-hidden rounded-[22px] border p-5', toneClass)}
    >
      <span className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/18 blur-3xl transition-opacity duration-500 group-hover/promo:opacity-80" />
      <span className="relative z-10 flex items-start justify-between gap-4">
        <span>
          <span className="block text-[14px] font-semibold tracking-[-0.015em]">{promo.title}</span>
          <span className={cn('mt-2 block max-w-[330px] text-[11.5px] leading-[1.55]', promo.tone === 'light' ? 'text-black/52 dark:text-white/50' : 'text-white/66')}>
            {promo.desc}
          </span>
        </span>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', promo.tone === 'light' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white/14 text-white')}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </span>
      <span className={cn('relative z-10 mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold', promo.tone === 'light' ? 'text-black/50 dark:text-white/48' : 'text-white/58')}>
        Подробнее
        <ArrowRight className="h-3 w-3 transition-transform group-hover/promo:translate-x-0.5" />
      </span>
    </motion.a>
  );
}

function DesktopMegaPanel({ menu }: { menu: MegaMenu }) {
  let itemIndex = 0;

  return (
    <motion.div
      key={menu.id}
      variants={menuPanelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-1/2 top-[calc(100%+10px)] w-[min(calc(100vw-16px),1260px)] -translate-x-1/2 overflow-hidden rounded-[28px] border border-black/8 bg-white/96 text-black shadow-[0_34px_120px_-34px_rgba(0,0,0,0.38)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07080d]/96 dark:text-white"
    >
      <div className="grid min-h-[420px] grid-cols-[310px_minmax(0,1fr)]">
        <aside className="relative flex flex-col border-r border-black/8 p-8 dark:border-white/9">
          <span className="mb-6 inline-flex w-max items-center gap-2 rounded-full border border-black/8 bg-black/[0.025] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/42 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/42">
            <span className="h-1.5 w-1.5 rounded-full bg-[#127dfe]" />
            КликБук
          </span>
          <h3 className="max-w-[250px] text-[22px] font-semibold leading-[1.08] tracking-[-0.04em] text-black dark:text-white">
            {menu.intro.title}
          </h3>
          <p className="mt-4 max-w-[250px] text-[13px] leading-6 text-black/50 dark:text-white/48">
            {menu.intro.desc}
          </p>
          <motion.a
            href={menu.intro.href}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="group/cta mt-7 inline-flex h-12 w-full items-center justify-between rounded-2xl bg-black px-5 text-[13px] font-semibold text-white shadow-[0_18px_38px_-22px_rgba(0,0,0,0.65)] transition-colors hover:bg-[#111827] dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {menu.intro.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
          </motion.a>
          <div className="mt-auto pt-8">
            <div className="rounded-2xl border border-black/8 bg-[#f7f8fb] p-4 dark:border-white/8 dark:bg-white/[0.04]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/32 dark:text-white/32">Важно</div>
              <div className="mt-2 text-[13px] font-medium leading-5 text-black/68 dark:text-white/70">{menu.intro.meta}</div>
            </div>
          </div>
        </aside>

        <div className="p-8">
          <div className={cn('grid gap-8', menu.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {menu.columns.map((column) => (
              <section key={column.title}>
                <div className="mb-4 text-[12px] font-semibold leading-5 tracking-[-0.01em] text-black/58 dark:text-white/58">
                  {column.title}
                </div>
                <div className="space-y-1">
                  {column.items.map((item) => {
                    const currentIndex = itemIndex++;
                    return <MegaMenuItemLink key={item.title} item={item} index={currentIndex} />;
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {menu.promos.map((promo) => {
              const currentIndex = itemIndex++;
              return <MegaPromoCard key={promo.title} promo={promo} index={currentIndex} />;
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MobileMegaMenu({ menus, open, onClose, t }: { menus: MegaMenu[]; open: boolean; onClose: () => void; t: LandingCopy }) {
  const [expanded, setExpanded] = useState<MegaMenuId>(menus[0]?.id ?? 'start');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-white text-black dark:bg-[#05060a] dark:text-white lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-black/8 px-4 dark:border-white/10">
            <Link href="/landing" onClick={onClose} className="flex items-center">
              <Image src="/brand/clickbook-logo-dark-transparent.png" alt="КликБук" width={124} height={30} className="h-7 w-auto dark:hidden" priority />
              <Image src="/brand/clickbook-logo-light-transparent.png" alt="КликБук" width={124} height={30} className="hidden h-7 w-auto dark:block" priority />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 text-black/70 dark:border-white/10 dark:text-white/70"
              aria-label="Закрыть меню"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="h-[calc(100vh-64px)] overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              {menus.map((menu) => {
                const isExpanded = expanded === menu.id;
                return (
                  <div key={menu.id} className="overflow-hidden rounded-3xl border border-black/8 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.035]">
                    <button
                      type="button"
                      onClick={() => setExpanded(menu.id)}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <span className="text-[17px] font-semibold tracking-[-0.03em]">{menu.label}</span>
                      <ChevronDown className={cn('h-4 w-4 text-black/45 transition-transform dark:text-white/45', isExpanded && 'rotate-180')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <div className="border-t border-black/8 px-5 py-5 dark:border-white/8">
                            <p className="max-w-sm text-[13px] leading-6 text-black/52 dark:text-white/48">{menu.intro.desc}</p>
                            <div className="mt-5 grid gap-5">
                              {menu.columns.map((column) => (
                                <section key={column.title}>
                                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.17em] text-black/35 dark:text-white/35">{column.title}</div>
                                  <div className="grid gap-1">
                                    {column.items.map((item) => {
                                      const Icon = item.icon;
                                      return (
                                        <a key={item.title} href={item.href} onClick={onClose} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black/70 shadow-sm dark:bg-white/[0.08] dark:text-white/74">
                                            <Icon className="h-4 w-4" />
                                          </span>
                                          <span>
                                            <span className="block text-[13.5px] font-semibold">{item.title}</span>
                                            <span className="mt-0.5 block text-[11.5px] leading-5 text-black/45 dark:text-white/42">{item.desc}</span>
                                          </span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                </section>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/login" onClick={onClose} className="flex h-12 items-center justify-center rounded-2xl bg-black text-[13px] font-semibold text-white dark:bg-white dark:text-black">
                {t.login}
              </Link>
              <a href="#cta" onClick={onClose} className="flex h-12 items-center justify-center rounded-2xl bg-[#127dfe] text-[13px] font-semibold text-white">
                {t.ctaTop}
              </a>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LandingHeader({ t, locale }: { t: LandingCopy; locale: string }) {
  const menus = LANDING_MENUS[locale === 'en' ? 'en' : 'ru'];
  const [scrolled, setScrolled] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<MegaMenuId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeMenu = menus.find((menu) => menu.id === activeMenuId) ?? null;

  const closeDesktopMenu = useCallback(() => setActiveMenuId(null), []);

  useEffect(() => {
    const cb = () => setScrolled(window.scrollY > 20);
    cb();
    window.addEventListener('scroll', cb, { passive: true });
    return () => window.removeEventListener('scroll', cb);
  }, []);

  useEffect(() => {
    if (!activeMenuId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDesktopMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMenuId, closeDesktopMenu]);

  return (
    <>
      <AnimatePresence>
        {activeMenu ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[38] hidden bg-black/45 backdrop-blur-[3px] lg:block"
          />
        ) : null}
      </AnimatePresence>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onMouseLeave={closeDesktopMenu}
        className="fixed inset-x-0 top-0 z-[60] px-2 pt-2 transition-all duration-300 sm:px-3"
      >
        <div
          className={cn(
            'mx-auto flex h-[58px] max-w-[1260px] items-center justify-between gap-4 rounded-[18px] border border-black/8 bg-white/94 px-3 text-black shadow-[0_10px_44px_-34px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-[#07080d]/92 dark:text-white sm:px-5',
            (scrolled || activeMenu) && 'shadow-[0_18px_64px_-40px_rgba(0,0,0,0.75)]',
          )}
        >
          <Link href="/landing" className="flex shrink-0 items-center">
            <Image src="/brand/clickbook-logo-dark-transparent.png" alt="КликБук" width={126} height={30} className="h-7 w-auto dark:hidden" priority />
            <Image src="/brand/clickbook-logo-light-transparent.png" alt="КликБук" width={126} height={30} className="hidden h-7 w-auto dark:block" priority />
          </Link>

          <nav className="hidden h-full items-center gap-1 lg:flex" aria-label="Главное меню">
            {menus.map((menu) => {
              const isActive = activeMenuId === menu.id;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onMouseEnter={() => setActiveMenuId(menu.id)}
                  onFocus={() => setActiveMenuId(menu.id)}
                  onClick={() => setActiveMenuId(isActive ? null : menu.id)}
                  aria-expanded={isActive}
                  className={cn(
                    'group/nav inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-semibold text-black/58 transition-all duration-200 hover:bg-black/[0.04] hover:text-black dark:text-white/58 dark:hover:bg-white/[0.06] dark:hover:text-white',
                    isActive && 'bg-black/[0.055] text-black dark:bg-white/[0.08] dark:text-white',
                  )}
                >
                  {menu.label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', isActive && 'rotate-180')} />
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/login" className="hidden h-10 items-center rounded-xl px-3 text-[12.5px] font-semibold text-black/58 transition-colors hover:text-black dark:text-white/58 dark:hover:text-white md:inline-flex">
              {t.login}
            </Link>
            <motion.a
              href="#cta"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="hidden h-10 items-center rounded-xl bg-black px-4 text-[12.5px] font-semibold text-white shadow-[0_14px_30px_-22px_rgba(0,0,0,0.7)] transition-colors hover:bg-[#111827] dark:bg-white dark:text-black dark:hover:bg-white/90 sm:inline-flex"
            >
              {t.ctaTop}
            </motion.a>
            <button
              type="button"
              onMouseEnter={() => setActiveMenuId('solutions')}
              onFocus={() => setActiveMenuId('solutions')}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-black/8 text-black/58 transition-all hover:border-black/14 hover:bg-black/[0.04] hover:text-black dark:border-white/10 dark:text-white/58 dark:hover:bg-white/[0.06] dark:hover:text-white sm:flex"
              aria-label="Все возможности"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <LanguageToggle compact minimal />
            </div>
            <div className="hidden sm:block">
              <ThemeToggle compact minimal />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/8 text-black/70 dark:border-white/10 dark:text-white/70 lg:hidden"
              aria-label="Открыть меню"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeMenu ? <DesktopMegaPanel key={activeMenu.id} menu={activeMenu} /> : null}
        </AnimatePresence>
      </motion.header>

      <MobileMegaMenu menus={menus} open={mobileOpen} onClose={() => setMobileOpen(false)} t={t} />
    </>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSlide({ t }: { t: LandingCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const yContent = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const cx = useMotionValue(0); const cy = useMotionValue(0);
  const sx = useSpring(cx, { stiffness: 40, damping: 22 });
  const sy = useSpring(cy, { stiffness: 40, damping: 22 });
  const blobX = useTransform(sx, (v) => v * 30);
  const blobY = useTransform(sy, (v) => v * 30);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cx.set((e.clientX - window.innerWidth / 2) / window.innerWidth);
      cy.set((e.clientY - window.innerHeight / 2) / window.innerHeight);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [cx, cy]);

  const marqueeItems = [...t.hero.trust, 'Telegram · VK · Web', '−78% no-show', '2 500+', '24/7'];

  return (
    <section id="hero" ref={ref} className="relative min-h-screen overflow-hidden bg-[#030407] flex flex-col">
      {/* Grid mesh */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />

      {/* Orbs */}
      <motion.div style={{ x: blobX, y: blobY }}
        className="pointer-events-none absolute right-[-8%] top-[-5%] h-[640px] w-[640px] rounded-full blur-[120px] opacity-40">
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="h-full w-full rounded-full"
          style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 68%)` }} />
      </motion.div>
      <motion.div className="pointer-events-none absolute bottom-[5%] left-[-12%] h-[480px] w-[480px] rounded-full blur-[100px] opacity-25">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="h-full w-full rounded-full"
          style={{ background: `radial-gradient(circle, #38bdf8, transparent 68%)` }} />
      </motion.div>

      {/* Content */}
      <motion.div style={{ opacity, y: yContent }}
        className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-4 pt-24 pb-8 text-center sm:px-6 lg:px-8">

        {/* Badge */}
        <Reveal>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-[#127dfe]" />
            <span className="text-[12px] font-medium tracking-[0.06em] text-white/60">{t.hero.badge}</span>
          </div>
        </Reveal>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl">
          {[t.hero.title1, t.hero.title2, t.hero.title3].map((word, i) => (
            <span key={i} className="block overflow-hidden">
              <motion.span
                initial={{ y: 110 }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'block text-[48px] font-bold leading-[0.95] tracking-[-0.05em] text-white sm:text-[70px] lg:text-[92px] xl:text-[108px]',
                  i === 1 && 'bg-gradient-to-r from-[#127dfe] via-[#38bdf8] to-[#127dfe] bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_4s_ease-in-out_infinite]'
                )}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* Sub */}
        <Reveal delay={0.52}>
          <p className="mx-auto mt-8 max-w-lg text-[16px] leading-7 text-white/45 sm:text-[18px] lg:max-w-xl">
            {t.hero.sub}
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal delay={0.66}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <motion.a href="/login" whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-8 py-3.5 text-[15px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #127dfe 0%, #0a5fd4 100%)', boxShadow: '0 0 48px rgba(18,125,254,0.5), 0 1px 0 rgba(255,255,255,0.18) inset' }}>
              <span className="pointer-events-none absolute inset-y-0 -left-10 w-12 rotate-12 bg-white/20 transition-all duration-700 group-hover:left-[120%]" />
              <span className="relative z-10 flex items-center gap-2">
                {t.hero.cta1}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.a>
            <motion.a href="#features" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/5 px-8 py-3.5 text-[15px] font-semibold text-white/70 backdrop-blur-sm transition-all hover:border-white/28 hover:bg-white/10 hover:text-white">
              {t.hero.cta2}
            </motion.a>
          </div>
        </Reveal>

        {/* Trust */}
        <Reveal delay={0.8}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-white/35">
            {t.hero.trust.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#127dfe]" />
                {item}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Mockup */}
        <div className="mt-20 w-full">
          <DashboardMockup chips={t.hero.chips} inView={inView} />
        </div>
      </motion.div>

      {/* Marquee */}
      <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.4 }}
        className="relative z-10 border-t border-white/6 bg-white/[0.02] backdrop-blur-sm">
        <MarqueeStrip dark items={marqueeItems} />
      </motion.div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030407] to-transparent" />
    </section>
  );
}

// ─── WHY ──────────────────────────────────────────────────────────────────────
function WhySlide({ t }: { t: LandingCopy }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="why" ref={ref} className="relative overflow-hidden bg-white py-28 dark:bg-[#06080f] lg:py-36">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <Reveal><Eyebrow>{t.why.eyebrow}</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 max-w-2xl text-[36px] font-bold leading-[1.04] tracking-[-0.045em] text-black dark:text-white sm:text-[46px] lg:text-[54px]">
              {t.why.title}
            </h2>
          </Reveal>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -28 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl border border-black/8 bg-black/[0.018] p-8 dark:border-white/8 dark:bg-white/[0.025] lg:p-10"
          >
            <div className="mb-7 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-black/40 dark:text-white/35">
              <span className="h-px w-5 bg-black/25 dark:bg-white/25" />
              {t.why.before.tag}
            </div>
            <ul className="space-y-4">
              {t.why.before.items.map((item, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3 text-[15px] leading-6 text-black/55 dark:text-white/45">
                  <Minus className="mt-0.5 h-4 w-4 flex-shrink-0 text-black/25 dark:text-white/25" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 28 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-[#127dfe]/22 bg-[#127dfe]/[0.04] p-8 dark:border-[#127dfe]/28 dark:bg-[#127dfe]/[0.07] lg:p-10"
          >
            <motion.div animate={{ opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
              className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-[80px]"
              style={{ background: `radial-gradient(circle, ${ACCENT}55, transparent 68%)` }} />
            <div className="mb-7 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#127dfe]">
              <span className="h-px w-5 bg-[#127dfe]" />
              {t.why.after.tag}
            </div>
            <ul className="space-y-4">
              {t.why.after.items.map((item, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, x: 12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.45, delay: 0.4 + i * 0.08 }}
                  className="flex items-start gap-3 text-[15px] leading-6 font-medium text-black/80 dark:text-white/80">
                  <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#127dfe]/20">
                    <Check className="h-2.5 w-2.5 text-[#127dfe]" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function FeatureCard({ Icon, title, desc, index }: { Icon: typeof Globe; title: string; desc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    ref.current.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full overflow-hidden rounded-2xl border border-black/7 bg-white p-6 transition-all duration-400 hover:-translate-y-1 hover:border-black/16 hover:shadow-[0_20px_56px_-20px_rgba(0,0,0,0.18)] dark:border-white/8 dark:bg-white/[0.02] dark:hover:border-white/18"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{ background: `radial-gradient(260px circle at var(--mx,50%) var(--my,50%), ${ACCENT}0d, transparent 60%)` }} />
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.04] text-black/65 transition-all duration-300 group-hover:bg-[#127dfe] group-hover:text-white dark:bg-white/[0.06] dark:text-white/65">
          <Icon className="h-[17px] w-[17px]" />
        </div>
        <span className="tabular-nums text-[10px] font-semibold tracking-[0.14em] text-black/22 dark:text-white/22">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="relative z-10 mt-6 text-[16px] font-semibold tracking-tight text-black dark:text-white">{title}</h3>
      <p className="relative z-10 mt-1.5 text-[13px] leading-relaxed text-black/50 dark:text-white/42">{desc}</p>
      <div className="relative z-10 mt-5 h-px w-0 bg-[#127dfe] transition-all duration-500 group-hover:w-8" />
    </motion.div>
  );
}

function FeaturesSlide({ t }: { t: LandingCopy }) {
  return (
    <section id="features" className="relative overflow-hidden bg-[#f7f8fb] py-28 dark:bg-[#08090e] lg:py-36">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Reveal><Eyebrow>{t.features.eyebrow}</Eyebrow></Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-5 text-[36px] font-bold leading-[1.04] tracking-[-0.045em] text-black dark:text-white sm:text-[46px] lg:text-[54px]">
                {t.features.title}
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-xs text-[15px] leading-6 text-black/50 dark:text-white/42 lg:text-right">{t.features.sub}</p>
          </Reveal>
        </div>

        {/* Grid on desktop, slider on mobile */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {t.features.items.map((item, i) => (
            <FeatureCard key={i} Icon={FEATURE_ICONS[i]} title={item.title} desc={item.desc} index={i} />
          ))}
        </div>
        <div className="sm:hidden">
          <Slider autoplay={5000} prevLabel={t.prev} nextLabel={t.next}>
            {t.features.items.map((item, i) => (
              <div key={i} className="flex-[0_0_84%] pl-4">
                <FeatureCard Icon={FEATURE_ICONS[i]} title={item.title} desc={item.desc} index={i} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}

// ─── WHO ──────────────────────────────────────────────────────────────────────
function WhoCard({ Icon, title, desc, index }: { Icon: typeof Scissors; title: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full overflow-hidden rounded-2xl border border-black/7 bg-white p-7 transition-all duration-400 hover:-translate-y-1 hover:border-black/16 hover:shadow-[0_20px_56px_-20px_rgba(0,0,0,0.16)] dark:border-white/8 dark:bg-white/[0.02] dark:hover:border-white/18"
    >
      <motion.div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${ACCENT}50, transparent 68%)` }} />
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.04] text-black/65 transition-all duration-300 group-hover:bg-[#127dfe] group-hover:text-white dark:bg-white/[0.06] dark:text-white/65">
          <Icon className="h-5 w-5" />
        </div>
        <span className="tabular-nums text-[10px] font-semibold tracking-[0.14em] text-black/22 dark:text-white/22">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="relative z-10 mt-7 text-[19px] font-bold tracking-tight text-black dark:text-white">{title}</h3>
      <p className="relative z-10 mt-2 text-[13.5px] leading-relaxed text-black/52 dark:text-white/42">{desc}</p>
      <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-full bg-gradient-to-r from-[#127dfe] to-[#38bdf8]"
        initial={{ width: 0 }} whileInView={{ width: '35%' }}
        viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 + index * 0.06 }} />
    </motion.div>
  );
}

function WhoSlide({ t }: { t: LandingCopy }) {
  return (
    <section id="who" className="relative overflow-hidden bg-white py-28 dark:bg-[#06080f] lg:py-36">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <Reveal><Eyebrow>{t.who.eyebrow}</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-[36px] font-bold leading-[1.04] tracking-[-0.045em] text-black dark:text-white sm:text-[46px] lg:text-[54px]">
              {t.who.title}
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-[15px] leading-6 text-black/50 dark:text-white/42">{t.who.sub}</p>
          </Reveal>
        </div>
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {t.who.items.map((item, i) => (
            <WhoCard key={i} Icon={WHO_ICONS[i]} title={item.title} desc={item.desc} index={i} />
          ))}
        </div>
        <div className="sm:hidden">
          <Slider autoplay={6000} prevLabel={t.prev} nextLabel={t.next}>
            {t.who.items.map((item, i) => (
              <div key={i} className="flex-[0_0_84%] pl-4">
                <WhoCard Icon={WHO_ICONS[i]} title={item.title} desc={item.desc} index={i} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}

// ─── HOW ──────────────────────────────────────────────────────────────────────
function StepCard({ n, title, desc, index }: { n: string; title: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full overflow-hidden rounded-2xl border border-black/7 bg-white p-7 transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)] dark:border-white/8 dark:bg-white/[0.025] dark:hover:border-white/16"
    >
      <div className="mb-8 flex items-start justify-between">
        <div className="text-[52px] font-bold leading-none tracking-[-0.04em] text-black/8 transition-colors duration-300 group-hover:text-[#127dfe]/20 dark:text-white/8 dark:group-hover:text-[#127dfe]/20">
          {n}
        </div>
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
          className="h-2 w-2 rounded-full bg-[#127dfe]" />
      </div>
      <h3 className="text-[17px] font-semibold tracking-tight text-black dark:text-white">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-black/50 dark:text-white/42">{desc}</p>
      <div className="mt-6 flex items-center gap-2 text-[11.5px] font-medium text-black/30 transition-all duration-300 group-hover:text-[#127dfe] dark:text-white/30">
        <span className="h-px w-5 bg-current transition-all duration-300 group-hover:w-8" />
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </motion.div>
  );
}

function HowSlide({ t }: { t: LandingCopy }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const lineWidth = useTransform(scrollYProgress, [0.15, 0.6], ['0%', '100%']);

  return (
    <section id="how" ref={ref} className="relative overflow-hidden bg-[#f7f8fb] py-28 dark:bg-[#08090e] lg:py-36">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <Reveal><Eyebrow>{t.how.eyebrow}</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-[36px] font-bold leading-[1.04] tracking-[-0.045em] text-black dark:text-white sm:text-[46px] lg:text-[54px]">
              {t.how.title}
            </h2>
          </Reveal>
        </div>
        <div className="relative mb-10 hidden h-px overflow-hidden rounded-full bg-black/8 dark:bg-white/8 sm:block">
          <motion.div style={{ width: lineWidth }} className="h-full bg-gradient-to-r from-[#127dfe] to-[#38bdf8]" />
        </div>
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {t.how.steps.map((step, i) => (
            <StepCard key={i} n={step.n} title={step.title} desc={step.desc} index={i} />
          ))}
        </div>
        <div className="sm:hidden">
          <Slider autoplay={5500} prevLabel={t.prev} nextLabel={t.next}>
            {t.how.steps.map((step, i) => (
              <div key={i} className="flex-[0_0_84%] pl-4">
                <StepCard n={step.n} title={step.title} desc={step.desc} index={i} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}

// ─── PROOF ────────────────────────────────────────────────────────────────────
function ReviewCard({ text, name, role }: { text: string; name: string; role: string }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-black/7 bg-white p-7 transition-all duration-400 hover:-translate-y-1 hover:border-black/14 hover:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.16)] dark:border-white/8 dark:bg-white/[0.025] dark:hover:border-white/16 lg:p-8">
      <div className="pointer-events-none absolute -right-4 -top-4 text-[96px] font-bold leading-none text-black/[0.03] dark:text-white/[0.03]">"</div>
      <Quote className="h-5 w-5 text-[#127dfe]/50 transition-colors duration-300 group-hover:text-[#127dfe]" />
      <p className="mt-5 text-[15px] leading-7 text-black/68 dark:text-white/60">{text}</p>
      <div className="mt-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#127dfe] to-[#0a5fd4] text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(18,125,254,0.4)]">
            {name.slice(0, 1)}
          </div>
          <div>
            <div className="text-[13.5px] font-semibold text-black dark:text-white">{name}</div>
            <div className="text-[11.5px] text-black/42 dark:text-white/38">{role}</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, si) => (
            <motion.span key={si} initial={{ opacity: 0, scale: 0.3 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.3 + si * 0.06, type: 'spring', stiffness: 320 }}>
              <Star className="h-3.5 w-3.5 fill-[#127dfe] text-[#127dfe]" />
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProofSlide({ t }: { t: LandingCopy }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="proof" ref={ref} className="relative overflow-hidden bg-white py-28 dark:bg-[#06080f] lg:py-36">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <Reveal><Eyebrow>{t.proof.eyebrow}</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-[36px] font-bold leading-[1.04] tracking-[-0.045em] text-black dark:text-white sm:text-[46px] lg:text-[54px]">
              {t.proof.title}
            </h2>
          </Reveal>
        </div>

        {/* Stats */}
        <div className="mb-20 grid grid-cols-2 gap-px border border-black/7 overflow-hidden rounded-3xl dark:border-white/8 lg:grid-cols-4">
          {t.proof.stats.map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="relative bg-white px-6 py-9 transition-colors hover:bg-[#127dfe]/[0.025] dark:bg-[#06080f] dark:hover:bg-[#127dfe]/[0.05]"
            >
              {stat.pre && (
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/38 dark:text-white/32">{stat.pre}</div>
              )}
              <div className="text-[52px] font-bold leading-none tracking-[-0.05em] text-black tabular-nums dark:text-white sm:text-[60px]">
                {inView && <Counter target={stat.val} suffix={stat.suffix} pre="" />}
              </div>
              <div className="mt-3 text-[12.5px] text-black/48 dark:text-white/38">{stat.label}</div>
              <motion.div className="absolute bottom-0 left-6 h-[2px] rounded-full bg-gradient-to-r from-[#127dfe] to-[#38bdf8]"
                initial={{ width: 0 }} whileInView={{ width: 32 }} viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.08 }} />
            </motion.div>
          ))}
        </div>

        {/* Reviews grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {t.proof.reviews.map((review, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <ReviewCard text={review.text} name={review.name} role={review.role} />
            </Reveal>
          ))}
        </div>
        <div className="sm:hidden">
          <Slider autoplay={7000} prevLabel={t.prev} nextLabel={t.next}>
            {t.proof.reviews.map((review, i) => (
              <div key={i} className="flex-[0_0_90%] pl-4">
                <ReviewCard text={review.text} name={review.name} role={review.role} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CtaSlide({ t }: { t: LandingCopy }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const glowY = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section id="cta" ref={ref} className="relative overflow-hidden bg-[#030407] py-36 lg:py-48">
      {/* Animated gradient blob */}
      <motion.div style={{ y: glowY }}
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[500px] w-[800px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(18,125,254,0.55) 0%, rgba(56,189,248,0.2) 50%, transparent 70%)' }} />
      </motion.div>

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 72%)' }} />

      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <Check className="h-3.5 w-3.5 text-[#127dfe]" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">{t.cta.badge}</span>
          </div>
        </Reveal>

        <h2 className="mx-auto max-w-3xl">
          {t.cta.title.split(' ').map((word, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <motion.span
                initial={{ y: 100 }} animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="mr-[0.2em] inline-block text-[44px] font-bold leading-[0.96] tracking-[-0.045em] text-white sm:text-[62px] lg:text-[80px]">
                {word}
              </motion.span>
            </span>
          ))}
        </h2>

        <Reveal delay={0.5}>
          <p className="mx-auto mt-8 max-w-lg text-[16px] leading-7 text-white/45">{t.cta.sub}</p>
        </Reveal>

        <Reveal delay={0.65}>
          <div className="mt-11 flex flex-col items-center gap-3 sm:flex-row">
            <motion.a href="/login" whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-white px-9 py-4 text-[15px] font-bold text-black transition-shadow duration-300 hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)]">
              <span className="pointer-events-none absolute inset-y-0 -left-12 w-12 rotate-12 bg-black/8 transition-all duration-700 group-hover:left-[120%]" />
              <span className="relative z-10 flex items-center gap-2">
                {t.cta.btn1}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.a>
            <motion.a href="/demo/demo" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/18 px-9 py-4 text-[15px] font-semibold text-white/68 transition-all hover:border-white/35 hover:text-white">
              {t.cta.btn2}
            </motion.a>
          </div>
        </Reveal>

        <Reveal delay={0.82}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-white/35">
            {t.cta.trust.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#127dfe]" />
                {item}
              </span>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-28 border-t border-white/7 px-4 pt-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
          <Image src="/brand/clickbook-logo-light-transparent.png" alt="КликБук" width={110} height={26}
            className="h-6 w-auto opacity-60"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="text-[11.5px] text-white/25">{t.footer}</div>
        </div>
      </div>
    </section>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function ClickbookLanding() {
  const { locale } = useLocale();
  const t = locale === 'en' ? COPY.en : COPY.ru;

  return (
    <div className="min-h-screen antialiased">
      <style>{`
        @keyframes shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      `}</style>
      <ScrollProgress />
      <LandingHeader t={t} locale={locale} />
      <SideNav locale={locale} />
      <main>
        <HeroSlide t={t} />
        <WhySlide t={t} />
        <FeaturesSlide t={t} />
        <WhoSlide t={t} />
        <HowSlide t={t} />
        <ProofSlide t={t} />
        <CtaSlide t={t} />
      </main>
    </div>
  );
}
