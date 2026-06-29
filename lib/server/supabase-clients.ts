import 'server-only';

import type { Booking } from '@/lib/types';
import { supabaseRestRequest } from '@/lib/server/supabase-rest';

type ClientSegment = 'new' | 'regular' | 'sleeping';

type ClientRow = {
  id: string;
  workspace_id: string;
  name: string;
  phone: string;
  phone_normalized?: string | null;
  segment: ClientSegment | string | null;
  source: string | null;
  is_vip: boolean;
  last_visit: string | null;
  next_visit: string | null;
  total_visits: number | null;
  total_revenue: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ClientSourceChannel = 'web' | 'telegram' | 'vk';

export type UpsertClientFromBookingInput = {
  workspaceId: string;
  booking: Booking;
  source: string;
  channel: ClientSourceChannel;
  communicationScenario: string;
  metadata?: Record<string, unknown>;
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

function clean(value: string) {
  return value.trim();
}

async function readFirstClient(workspaceId: string, booking: Booking) {
  const normalizedPhone = normalizePhone(booking.clientPhone);

  if (normalizedPhone) {
    const response = await supabaseRestRequest(
      `/rest/v1/sloty_clients?workspace_id=eq.${encodeURIComponent(workspaceId)}&phone_normalized=eq.${encodeURIComponent(normalizedPhone)}&select=*&limit=1`,
    );
    const rows = (await response.json()) as ClientRow[];
    if (rows[0]) return rows[0];
  }

  if (booking.clientPhone) {
    const response = await supabaseRestRequest(
      `/rest/v1/sloty_clients?workspace_id=eq.${encodeURIComponent(workspaceId)}&phone=eq.${encodeURIComponent(booking.clientPhone)}&select=*&limit=1`,
    );
    const rows = (await response.json()) as ClientRow[];
    if (rows[0]) return rows[0];
  }

  return null;
}

function mergeBookingIds(existing: unknown, nextId: string) {
  const ids = Array.isArray(existing)
    ? existing.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];

  return Array.from(new Set([...ids, nextId]));
}

export async function upsertClientFromBooking(input: UpsertClientFromBookingInput) {
  const existing = await readFirstClient(input.workspaceId, input.booking);
  const visits = Math.max(0, Number(existing?.total_visits ?? 0)) + 1;
  const previousMetadata = existing?.metadata && typeof existing.metadata === 'object' ? existing.metadata : {};
  const nextMetadata = {
    ...previousMetadata,
    ...(input.metadata ?? {}),
    sourceChannel: input.channel,
    source: input.source,
    communicationScenario: input.communicationScenario,
    lastBookingId: input.booking.id,
    lastBookingService: input.booking.service,
    lastBookingAt: input.booking.createdAt,
    bookingIds: mergeBookingIds(previousMetadata.bookingIds, input.booking.id),
  };

  const payload = {
    name: clean(input.booking.clientName) || existing?.name || 'Клиент',
    phone: clean(input.booking.clientPhone) || existing?.phone || '',
    segment: visits > 1 ? 'regular' : 'new',
    source: input.source,
    last_visit: input.booking.date,
    next_visit: input.booking.status === 'cancelled' ? null : input.booking.date,
    total_visits: visits,
    total_revenue: Number(existing?.total_revenue ?? 0),
    metadata: nextMetadata,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const response = await supabaseRestRequest(
      `/rest/v1/sloty_clients?id=eq.${encodeURIComponent(existing.id)}&workspace_id=eq.${encodeURIComponent(input.workspaceId)}&select=*`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload),
      },
    );
    const rows = (await response.json()) as ClientRow[];
    return rows[0] ?? existing;
  }

  const response = await supabaseRestRequest('/rest/v1/sloty_clients?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([
      {
        workspace_id: input.workspaceId,
        is_vip: false,
        ...payload,
      },
    ]),
  });
  const rows = (await response.json()) as ClientRow[];
  return rows[0] ?? null;
}
