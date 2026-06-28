import 'server-only';

import type { Booking, BookingStatus } from '@/lib/types';
import { supabaseRestRequest } from '@/lib/server/supabase-rest';

interface BookingRow {
  id: string;
  workspace_id: string;
  master_slug: string;
  client_name: string;
  client_phone: string;
  service: string;
  booking_date: string;
  booking_time: string;
  comment: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  duration_minutes?: number | null;
  price_amount?: number | null;
  source?: string | null;
  channel?: string | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  no_show_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  status_check_sent_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

function mapRow(row: BookingRow): Booking {
  return {
    id: row.id,
    masterSlug: row.master_slug,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    service: row.service,
    date: row.booking_date,
    time: row.booking_time,
    comment: row.comment ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    source: row.source ?? undefined,
    channel: row.channel ?? undefined,
    priceAmount: typeof row.price_amount === 'number' ? row.price_amount : undefined,
    durationMinutes: typeof row.duration_minutes === 'number' ? row.duration_minutes : undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    noShowAt: row.no_show_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    statusCheckSentAt: row.status_check_sent_at ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

export async function listBookingsByWorkspace(workspaceId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_bookings?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=created_at.desc`,
  );
  const rows = (await response.json()) as BookingRow[];
  return rows.map(mapRow);
}

export async function createBookingRecord(workspaceId: string, booking: Booking) {
  const response = await supabaseRestRequest('/rest/v1/sloty_bookings?select=*', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        id: booking.id,
        workspace_id: workspaceId,
        master_slug: booking.masterSlug,
        client_name: booking.clientName,
        client_phone: booking.clientPhone,
        service: booking.service,
        booking_date: booking.date,
        booking_time: booking.time,
        comment: booking.comment ?? null,
        status: booking.status,
        duration_minutes: booking.durationMinutes ?? null,
        price_amount: booking.priceAmount ?? null,
        source: booking.source ?? 'Web',
        channel: booking.channel ?? 'web',
        confirmed_at: booking.status === 'confirmed' ? booking.confirmedAt ?? new Date().toISOString() : null,
        completed_at: booking.completedAt ?? null,
        no_show_at: booking.noShowAt ?? null,
        cancelled_at: booking.cancelledAt ?? null,
        cancel_reason: booking.cancelReason ?? null,
        metadata: booking.metadata ?? {},
      },
    ]),
  });

  const rows = (await response.json()) as BookingRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}


export type BookingRecordPatch = Partial<{
  status: BookingStatus;
  date: string;
  time: string;
  comment: string | null;
  source: string | null;
  channel: string | null;
  durationMinutes: number | null;
  priceAmount: number | null;
  confirmedAt: string | null;
  completedAt: string | null;
  noShowAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  statusCheckSentAt: string | null;
  metadata: Record<string, unknown>;
}>;

function buildPatchPayload(patch: BookingRecordPatch) {
  const payload: Record<string, unknown> = {};

  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.date !== undefined) payload.booking_date = patch.date;
  if (patch.time !== undefined) payload.booking_time = patch.time;
  if (patch.comment !== undefined) payload.comment = patch.comment;
  if (patch.source !== undefined) payload.source = patch.source;
  if (patch.channel !== undefined) payload.channel = patch.channel;
  if (patch.durationMinutes !== undefined) payload.duration_minutes = patch.durationMinutes;
  if (patch.priceAmount !== undefined) payload.price_amount = patch.priceAmount;
  if (patch.confirmedAt !== undefined) payload.confirmed_at = patch.confirmedAt;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;
  if (patch.noShowAt !== undefined) payload.no_show_at = patch.noShowAt;
  if (patch.cancelledAt !== undefined) payload.cancelled_at = patch.cancelledAt;
  if (patch.cancelReason !== undefined) payload.cancel_reason = patch.cancelReason;
  if (patch.statusCheckSentAt !== undefined) payload.status_check_sent_at = patch.statusCheckSentAt;
  if (patch.metadata !== undefined) payload.metadata = patch.metadata;

  return payload;
}

export async function updateBookingRecord(workspaceId: string, bookingId: string, patch: BookingRecordPatch) {
  const payload = buildPatchPayload(patch);

  const response = await supabaseRestRequest(
    `/rest/v1/sloty_bookings?id=eq.${encodeURIComponent(bookingId)}&workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    },
  );

  const rows = (await response.json()) as BookingRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function updateBookingStatusRecord(workspaceId: string, bookingId: string, status: BookingStatus) {
  const now = new Date().toISOString();

  return updateBookingRecord(workspaceId, bookingId, {
    status,
    ...(status === 'confirmed' ? { confirmedAt: now } : {}),
    ...(status === 'completed' ? { completedAt: now } : {}),
    ...(status === 'no_show' ? { noShowAt: now } : {}),
    ...(status === 'cancelled' ? { cancelledAt: now } : {}),
  });
}
