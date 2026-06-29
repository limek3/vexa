import type { Locale } from '@/lib/i18n';

export type SubscriptionPlanId = 'start' | 'pro' | 'studio' | 'premium';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'inactive';

export interface PlanLimitSet {
  services: number;
  clients: number;
  reminders: number;
  exports: number;
  templates: number;
  teamMembers: number;
}

export interface BillingPlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  descriptionRu: string;
  descriptionEn: string;
  monthly: number;
  yearly: number;
  popular?: boolean;
  featuresRu: string[];
  featuresEn: string[];
  limits: PlanLimitSet;
}

export const SUBSCRIPTION_PLAN_IDS: SubscriptionPlanId[] = ['start', 'pro', 'studio', 'premium'];

export const SUBSCRIPTION_PLANS: BillingPlanDefinition[] = [
  {
    id: 'start',
    name: 'Start',
    descriptionRu: 'Для мастера, который только запускает страницу записи.',
    descriptionEn: 'For a master just launching a booking page.',
    monthly: 0,
    yearly: 0,
    featuresRu: ['До 5 услуг', 'Базовая публичная ссылка', 'Заявки и календарь', '1 канал уведомлений', 'Базовые напоминания'],
    featuresEn: ['Up to 5 services', 'Basic public link', 'Requests and calendar', '1 notification channel', 'Basic reminders'],
    limits: {
      services: 5,
      clients: 30,
      reminders: 30,
      exports: 0,
      templates: 3,
      teamMembers: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    descriptionRu: 'Основной рабочий тариф с аналитикой и кастомизацией.',
    descriptionEn: 'The main working plan with analytics and customization.',
    monthly: 990,
    yearly: 9990,
    popular: true,
    featuresRu: ['До 20 услуг', 'Статистика и доход', 'Шаблоны сообщений', 'Кастомизация страницы', 'Напоминания клиентам'],
    featuresEn: ['Up to 20 services', 'Stats and revenue', 'Message templates', 'Public page styling', 'Client reminders'],
    limits: {
      services: 20,
      clients: 150,
      reminders: 120,
      exports: 10,
      templates: 20,
      teamMembers: 1,
    },
  },
  {
    id: 'studio',
    name: 'Studio',
    descriptionRu: 'Для мастеров с несколькими направлениями и плотным потоком.',
    descriptionEn: 'For busier masters with multiple service lines.',
    monthly: 2490,
    yearly: 24990,
    featuresRu: ['До 80 услуг', 'Источники и конверсия', 'Экспорт данных', 'Интеграции', 'Брендирование'],
    featuresEn: ['Up to 80 services', 'Sources and conversion', 'Data export', 'Integrations', 'Branding'],
    limits: {
      services: 80,
      clients: 500,
      reminders: 500,
      exports: 60,
      templates: 80,
      teamMembers: 3,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    descriptionRu: 'Для студии и команды с приоритетной поддержкой.',
    descriptionEn: 'For studios and teams with priority support.',
    monthly: 5990,
    yearly: 59990,
    featuresRu: ['Команда и сотрудники', 'Премиум-аналитика', 'Брендированные блоки', 'Приоритетная поддержка', 'Расширенные лимиты'],
    featuresEn: ['Team members', 'Premium analytics', 'White-label blocks', 'Priority support', 'Expanded limits'],
    limits: {
      services: 9999,
      clients: 9999,
      reminders: 9999,
      exports: 999,
      templates: 999,
      teamMembers: 10,
    },
  },
];

export function normalizeSubscriptionPlanId(value: unknown): SubscriptionPlanId {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'free' || raw === 'base' || raw === 'basic') return 'start';
  if (raw === 'starter') return 'start';
  return SUBSCRIPTION_PLAN_IDS.includes(raw as SubscriptionPlanId)
    ? (raw as SubscriptionPlanId)
    : 'start';
}

export function normalizeBillingCycle(value: unknown): BillingCycle {
  return String(value ?? '').trim().toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
}

export function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'trialing' || raw === 'past_due' || raw === 'cancelled' || raw === 'inactive') return raw;
  return 'active';
}

export function getBillingPlan(planId: unknown): BillingPlanDefinition {
  const normalized = normalizeSubscriptionPlanId(planId);
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === normalized) ?? SUBSCRIPTION_PLANS[0];
}

export function getPlanPrice(planId: unknown, billingCycle: unknown) {
  const plan = getBillingPlan(planId);
  return normalizeBillingCycle(billingCycle) === 'yearly' ? plan.yearly : plan.monthly;
}

export function getLocalizedPlan(plan: BillingPlanDefinition, locale: Locale) {
  return {
    id: plan.id,
    name: plan.name,
    description: locale === 'ru' ? plan.descriptionRu : plan.descriptionEn,
    monthly: plan.monthly,
    yearly: plan.yearly,
    popular: plan.popular,
    features: locale === 'ru' ? plan.featuresRu : plan.featuresEn,
  };
}

export function getLocalizedPlans(locale: Locale) {
  return SUBSCRIPTION_PLANS.map((plan) => getLocalizedPlan(plan, locale));
}

export function getPlanLimits(planId: unknown) {
  return getBillingPlan(planId).limits;
}

export function isFinitePlanLimit(value: number) {
  return value < 9000;
}

export function addBillingPeriod(date: Date, billingCycle: BillingCycle) {
  const next = new Date(date);
  if (billingCycle === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}
