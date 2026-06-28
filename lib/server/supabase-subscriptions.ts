import 'server-only';

import {
  addBillingPeriod,
  getBillingPlan,
  getPlanPrice,
  normalizeBillingCycle,
  normalizeSubscriptionPlanId,
  normalizeSubscriptionStatus,
  type BillingCycle,
  type SubscriptionPlanId,
  type SubscriptionStatus,
} from '@/lib/billing-plans';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

export interface WorkspaceSubscriptionRecord {
  id: string;
  workspaceId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string;
  paymentMethodLabel: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionEventRecord {
  id: string;
  workspaceId: string;
  subscriptionId: string | null;
  eventType: string;
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function getSupabaseRestConfig() {
  return {
    url: getSupabaseUrl(),
    serviceRoleKey: getSupabaseServiceRoleKey(),
  };
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getSupabaseRestConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  return response;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function boolValue(value: unknown) {
  return typeof value === 'boolean' ? value : false;
}

function mapSubscriptionRow(row: Record<string, unknown>): WorkspaceSubscriptionRecord {
  const metadata = asRecord(row.metadata);
  const planId = normalizeSubscriptionPlanId(row.plan ?? row.plan_id ?? metadata.plan ?? metadata.plan_id);

  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    planId,
    status: normalizeSubscriptionStatus(row.status ?? metadata.status),
    billingCycle: normalizeBillingCycle(row.billing_cycle ?? metadata.billing_cycle),
    currentPeriodStart: stringValue(row.current_period_start),
    currentPeriodEnd: stringValue(row.current_period_end),
    cancelAtPeriodEnd: boolValue(row.cancel_at_period_end),
    provider: stringValue(row.provider) ?? stringValue(metadata.provider) ?? 'manual',
    paymentMethodLabel:
      stringValue(row.payment_method_label) ??
      stringValue(metadata.payment_method_label) ??
      stringValue(metadata.paymentMethodLabel) ??
      '',
    metadata,
    createdAt: stringValue(row.created_at) ?? undefined,
    updatedAt: stringValue(row.updated_at) ?? undefined,
  };
}

function mapEventRow(row: Record<string, unknown>): SubscriptionEventRecord {
  const amount = Number(row.amount ?? 0);

  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    subscriptionId: stringValue(row.subscription_id),
    eventType: String(row.event_type ?? 'subscription_event'),
    amount: Number.isFinite(amount) ? amount : 0,
    currency: String(row.currency ?? 'RUB'),
    metadata: asRecord(row.metadata),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function serializeSubscription(record: WorkspaceSubscriptionRecord) {
  const plan = getBillingPlan(record.planId);

  return {
    id: record.id,
    workspaceId: record.workspaceId,
    plan: record.planId,
    planId: record.planId,
    planName: plan.name,
    status: record.status,
    billingCycle: record.billingCycle,
    billing_cycle: record.billingCycle,
    currentPeriodStart: record.currentPeriodStart,
    current_period_start: record.currentPeriodStart,
    currentPeriodEnd: record.currentPeriodEnd,
    current_period_end: record.currentPeriodEnd,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    cancel_at_period_end: record.cancelAtPeriodEnd,
    provider: record.provider,
    paymentMethodLabel: record.paymentMethodLabel,
    payment_method_label: record.paymentMethodLabel,
    metadata: {
      ...record.metadata,
      planId: record.planId,
      planName: plan.name,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function serializeEvent(record: SubscriptionEventRecord) {
  const metadata = record.metadata ?? {};
  const planId = normalizeSubscriptionPlanId(metadata.planId ?? metadata.plan_id ?? metadata.plan);
  const plan = getBillingPlan(planId);

  return {
    id: record.id,
    workspaceId: record.workspaceId,
    subscriptionId: record.subscriptionId,
    eventType: record.eventType,
    event_type: record.eventType,
    amount: record.amount,
    currency: record.currency,
    planId,
    plan_id: planId,
    planName: String(metadata.planName ?? metadata.plan_name ?? plan.name),
    plan_name: String(metadata.planName ?? metadata.plan_name ?? plan.name),
    status: String(metadata.status ?? 'paid'),
    method: String(metadata.method ?? metadata.payment_method_label ?? 'manual'),
    metadata,
    createdAt: record.createdAt,
    created_at: record.createdAt,
  };
}

export async function fetchWorkspaceSubscription(workspaceId: string) {
  const response = await supabaseRequest(
    `/rest/v1/sloty_workspace_subscriptions?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&limit=1`,
  );
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows[0] ? mapSubscriptionRow(rows[0]) : null;
}

async function insertWorkspaceSubscription(workspaceId: string, planId: SubscriptionPlanId = 'start') {
  const now = new Date();
  const plan = getBillingPlan(planId);
  const billingCycle: BillingCycle = 'monthly';
  const currentPeriodEnd = plan.monthly > 0 ? addBillingPeriod(now, billingCycle).toISOString() : null;

  const response = await supabaseRequest('/rest/v1/sloty_workspace_subscriptions?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        workspace_id: workspaceId,
        plan: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: false,
        provider: 'manual',
        payment_method_label: plan.monthly > 0 ? 'Manual activation' : '',
        metadata: {
          planId,
          planName: plan.name,
          source: 'auto_create',
        },
      },
    ]),
  });

  const rows = (await response.json()) as Record<string, unknown>[];
  return mapSubscriptionRow(rows[0]);
}

export async function recordSubscriptionEvent(args: {
  workspaceId: string;
  subscriptionId?: string | null;
  eventType: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await supabaseRequest('/rest/v1/sloty_subscription_events?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        workspace_id: args.workspaceId,
        subscription_id: args.subscriptionId ?? null,
        event_type: args.eventType,
        amount: args.amount ?? 0,
        currency: args.currency ?? 'RUB',
        metadata: args.metadata ?? {},
      },
    ]),
  });

  const rows = (await response.json()) as Record<string, unknown>[];
  return rows[0] ? mapEventRow(rows[0]) : null;
}

export async function ensureWorkspaceSubscription(workspaceId: string) {
  const existing = await fetchWorkspaceSubscription(workspaceId);

  if (existing) {
    return existing;
  }

  const created = await insertWorkspaceSubscription(workspaceId, 'start');

  await recordSubscriptionEvent({
    workspaceId,
    subscriptionId: created.id,
    eventType: 'subscription_created',
    amount: 0,
    metadata: {
      planId: created.planId,
      planName: getBillingPlan(created.planId).name,
      status: created.status,
      method: 'auto',
    },
  }).catch(() => null);

  return created;
}

export async function updateWorkspaceSubscription(args: {
  workspaceId: string;
  planId: SubscriptionPlanId;
  billingCycle: BillingCycle;
  eventType?: string;
}) {
  const current = await ensureWorkspaceSubscription(args.workspaceId);
  const plan = getBillingPlan(args.planId);
  const now = new Date();
  const amount = getPlanPrice(args.planId, args.billingCycle);
  const currentPeriodEnd = amount > 0 ? addBillingPeriod(now, args.billingCycle).toISOString() : null;
  const paymentMethodLabel = amount > 0 ? 'Manual activation' : '';

  const response = await supabaseRequest(
    `/rest/v1/sloty_workspace_subscriptions?id=eq.${encodeURIComponent(current.id)}&select=*`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        plan: args.planId,
        status: 'active',
        billing_cycle: args.billingCycle,
        current_period_start: now.toISOString(),
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: false,
        provider: 'manual',
        payment_method_label: paymentMethodLabel,
        metadata: {
          ...(current.metadata ?? {}),
          planId: args.planId,
          planName: plan.name,
          billingCycle: args.billingCycle,
          method: paymentMethodLabel || 'free',
          source: 'dashboard_subscription_page',
          updatedAt: now.toISOString(),
        },
      }),
    },
  );

  const rows = (await response.json()) as Record<string, unknown>[];
  const updated = rows[0] ? mapSubscriptionRow(rows[0]) : current;

  await recordSubscriptionEvent({
    workspaceId: args.workspaceId,
    subscriptionId: updated.id,
    eventType: args.eventType ?? (amount > 0 ? 'payment_succeeded' : 'plan_changed'),
    amount,
    metadata: {
      planId: args.planId,
      planName: plan.name,
      billingCycle: args.billingCycle,
      status: updated.status,
      method: paymentMethodLabel || 'free',
      mode: 'manual_mvp',
    },
  }).catch(() => null);

  return updated;
}

export async function listSubscriptionEvents(workspaceId: string) {
  const response = await supabaseRequest(
    `/rest/v1/sloty_subscription_events?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=created_at.desc&limit=50`,
  );
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows.map(mapEventRow);
}

export async function getWorkspaceBillingSnapshot(workspaceId: string) {
  const subscription = await ensureWorkspaceSubscription(workspaceId);
  const events = await listSubscriptionEvents(workspaceId).catch(() => [] as SubscriptionEventRecord[]);

  return {
    subscription: serializeSubscription(subscription),
    subscriptionEvents: events.map(serializeEvent),
  };
}
