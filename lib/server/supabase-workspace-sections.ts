import 'server-only';

import type { AvailabilityDayInsight, MessageTemplateInsight, ServiceInsight } from '@/lib/master-workspace';
import type { BookingAvailabilityDay } from '@/lib/availability';
import { supabaseRestRequest } from '@/lib/server/supabase-rest';

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function cleanNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function cleanBoolean(value: unknown, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item)).filter(Boolean);
}

function normalizeStatus(value: unknown): 'workday' | 'short' | 'day-off' {
  return value === 'short' || value === 'day-off' || value === 'workday' ? value : 'workday';
}

function normalizeServiceStatus(value: unknown): 'active' | 'seasonal' | 'draft' {
  return value === 'seasonal' || value === 'draft' || value === 'active' ? value : 'active';
}

function normalizeDate(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function normalizeWeekdayIndex(item: Record<string, unknown>) {
  const raw = item.weekdayIndex ?? item.weekday_index ?? item.dayIndex ?? item.day_index ?? item.dayOfWeek ?? item.day_of_week;
  const value = cleanNumber(raw, Number.NaN);
  if (Number.isFinite(value) && value >= 0 && value <= 6) return Math.trunc(value);
  return null;
}

function normalizeAvailabilityItem(item: unknown, index: number) {
  if (!item || typeof item !== 'object') return null;
  const candidate = item as Record<string, unknown>;
  const date = normalizeDate(candidate.date);
  const weekdayIndex = normalizeWeekdayIndex(candidate);
  const slots = cleanStringArray(candidate.slots ?? candidate.windows ?? candidate.hours);
  const breaks = cleanStringArray(candidate.breaks ?? candidate.pauses);

  if (!date && weekdayIndex === null && slots.length === 0) return null;

  return {
    date,
    weekdayIndex,
    label: cleanString(candidate.label, date ? '' : `day-${index + 1}`),
    status: normalizeStatus(candidate.status),
    slots,
    breaks,
    custom: cleanBoolean(candidate.custom, Boolean(date)),
    metadata: {
      sourceId: cleanString(candidate.id),
      monthKey: cleanString(candidate.monthKey ?? candidate.month_key),
      dayNumber: cleanNumber(candidate.dayNumber ?? candidate.day_number, 0),
    },
  };
}

function mapAvailabilityRow(row: Record<string, unknown>): BookingAvailabilityDay {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
  const date = normalizeDate(row.date);
  const weekdayIndex = normalizeWeekdayIndex(row);
  const dayNumber = cleanNumber(metadata.dayNumber ?? metadata.day_number, 0);

  return {
    id: cleanString(row.id, cleanString(metadata.sourceId)),
    date: date ?? undefined,
    monthKey: cleanString(metadata.monthKey ?? metadata.month_key) || undefined,
    dayNumber: dayNumber > 0 ? dayNumber : undefined,
    weekdayIndex: weekdayIndex ?? undefined,
    label: cleanString(row.label) || undefined,
    status: normalizeStatus(row.status),
    slots: cleanStringArray(row.slots),
    breaks: cleanStringArray(row.breaks),
    custom: cleanBoolean(row.custom, Boolean(date)),
  };
}

function normalizeServiceItem(item: unknown, index: number) {
  if (!item || typeof item !== 'object') return null;
  const candidate = item as Record<string, unknown>;
  const name = cleanString(candidate.name);
  if (!name) return null;

  return {
    name,
    duration: Math.max(5, Math.round(cleanNumber(candidate.duration, 60))),
    price: Math.max(0, cleanNumber(candidate.price, 0)),
    status: normalizeServiceStatus(candidate.status),
    visible: cleanBoolean(candidate.visible, true),
    category: cleanString(candidate.category) || null,
    sort_order: Math.round(cleanNumber(candidate.sortOrder ?? candidate.sort_order, index)),
    metadata: {
      sourceId: cleanString(candidate.id),
      bookings: cleanNumber(candidate.bookings, 0),
      revenue: cleanNumber(candidate.revenue, 0),
      popularity: cleanNumber(candidate.popularity, 0),
    },
  };
}

function mapServiceRow(row: Record<string, unknown>): ServiceInsight {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
  const id = cleanString(metadata.sourceId) || cleanString(row.id) || crypto.randomUUID();

  return {
    id,
    name: cleanString(row.name),
    duration: Math.max(5, Math.round(cleanNumber(row.duration, 60))),
    price: Math.max(0, cleanNumber(row.price, 0)),
    status: normalizeServiceStatus(row.status),
    visible: cleanBoolean(row.visible, true),
    bookings: Math.max(0, Math.round(cleanNumber(metadata.bookings, 0))),
    revenue: Math.max(0, cleanNumber(metadata.revenue, 0)),
    popularity: Math.max(0, Math.round(cleanNumber(metadata.popularity, 0))),
    category: cleanString(row.category) || 'Основное',
  };
}

function normalizeTemplateItem(item: unknown, index: number) {
  if (!item || typeof item !== 'object') return null;
  const candidate = item as Record<string, unknown>;
  const title = cleanString(candidate.title);
  const content = cleanString(candidate.content);
  if (!title && !content) return null;

  return {
    title: title || `Template ${index + 1}`,
    channel: cleanString(candidate.channel, 'Telegram'),
    content,
    variables: cleanStringArray(candidate.variables),
    conversion: cleanString(candidate.conversion) || null,
    enabled: cleanBoolean(candidate.enabled, true),
    metadata: {
      sourceId: cleanString(candidate.id),
    },
  };
}

function mapTemplateRow(row: Record<string, unknown>): MessageTemplateInsight {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};

  return {
    id: cleanString(metadata.sourceId) || cleanString(row.id) || crypto.randomUUID(),
    title: cleanString(row.title),
    channel: cleanString(row.channel, 'Telegram'),
    conversion: cleanString(row.conversion),
    variables: cleanStringArray(row.variables),
    content: cleanString(row.content),
  };
}

async function replaceTableRows(table: string, workspaceId: string, rows: Record<string, unknown>[]) {
  await supabaseRestRequest(`/rest/v1/${table}?workspace_id=eq.${encodeURIComponent(workspaceId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });

  if (rows.length === 0) return;

  await supabaseRestRequest(`/rest/v1/${table}`, {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
}

export async function syncAvailabilityDays(workspaceId: string, value: unknown) {
  const items = Array.isArray(value) ? value : [];
  const rows = items
    .map(normalizeAvailabilityItem)
    .filter((item): item is NonNullable<ReturnType<typeof normalizeAvailabilityItem>> => Boolean(item))
    .map((item) => ({
      workspace_id: workspaceId,
      weekday_index: item.weekdayIndex,
      date: item.date,
      label: item.label,
      status: item.status,
      slots: item.slots,
      breaks: item.breaks,
      custom: item.custom,
      metadata: item.metadata,
    }));

  await replaceTableRows('sloty_availability_days', workspaceId, rows);
}

export async function listAvailabilityDays(workspaceId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_availability_days?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=date.asc.nullsfirst,weekday_index.asc.nullsfirst`,
  );
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows.map(mapAvailabilityRow).filter((item) => item.date || typeof item.weekdayIndex === 'number' || (item.slots?.length ?? 0) > 0);
}

export async function syncServices(workspaceId: string, value: unknown) {
  const items = Array.isArray(value) ? value : [];
  const rows = items
    .map(normalizeServiceItem)
    .filter((item): item is NonNullable<ReturnType<typeof normalizeServiceItem>> => Boolean(item))
    .map((item) => ({
      workspace_id: workspaceId,
      name: item.name,
      duration: item.duration,
      price: item.price,
      status: item.status,
      visible: item.visible,
      category: item.category,
      sort_order: item.sort_order,
      metadata: item.metadata,
    }));

  await replaceTableRows('sloty_services', workspaceId, rows);
}

export async function listServices(workspaceId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_services?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=sort_order.asc,name.asc`,
  );
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows.map(mapServiceRow).filter((item) => item.name);
}

export async function syncMessageTemplates(workspaceId: string, value: unknown) {
  const items = Array.isArray(value) ? value : [];
  const rows = items
    .map(normalizeTemplateItem)
    .filter((item): item is NonNullable<ReturnType<typeof normalizeTemplateItem>> => Boolean(item))
    .map((item) => ({
      workspace_id: workspaceId,
      title: item.title,
      channel: item.channel,
      content: item.content,
      variables: item.variables,
      conversion: item.conversion,
      enabled: item.enabled,
      metadata: item.metadata,
    }));

  await replaceTableRows('sloty_message_templates', workspaceId, rows);
}

export async function listMessageTemplates(workspaceId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_message_templates?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=created_at.asc`,
  );
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows.map(mapTemplateRow).filter((item) => item.title || item.content);
}
