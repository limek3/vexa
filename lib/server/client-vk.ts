import 'server-only';

import type { Booking } from '@/lib/types';
import { supabaseRestRequest } from '@/lib/server/supabase-rest';
import { sendVkMessage } from '@/lib/server/vk-bot';

type BookingVkLinkRow = {
  booking_id: string | null;
  workspace_id: string;
  peer_id: number | null;
  vk_user_id: string | null;
  status: string;
  confirmed_at: string | null;
  booking_snapshot: Booking | null;
};

function normalizePhone(value?: string | null) {
  return (value ?? '').replace(/\D+/g, '');
}

async function listConfirmedClientLinks(workspaceId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_booking_vk_links?workspace_id=eq.${encodeURIComponent(workspaceId)}&status=eq.confirmed&select=booking_id,workspace_id,peer_id,vk_user_id,status,confirmed_at,booking_snapshot&order=confirmed_at.desc.nullslast`,
  );

  return (await response.json()) as BookingVkLinkRow[];
}

export async function findClientVkPeerId(params: {
  workspaceId: string;
  bookingId?: string | null;
  clientPhone?: string | null;
  clientName?: string | null;
  directPeerId?: number | string | null;
}) {
  if (params.directPeerId) return params.directPeerId;
  const rows = await listConfirmedClientLinks(params.workspaceId);
  const normalizedPhone = normalizePhone(params.clientPhone);

  const exact = params.bookingId
    ? rows.find((row) => row.booking_id === params.bookingId && row.peer_id)
    : null;

  if (exact?.peer_id) return exact.peer_id;

  if (normalizedPhone) {
    const byPhone = rows.find((row) => {
      const snapshotPhone = normalizePhone(row.booking_snapshot?.clientPhone);
      return row.peer_id && snapshotPhone && snapshotPhone === normalizedPhone;
    });

    if (byPhone?.peer_id) return byPhone.peer_id;
  }

  const normalizedName = (params.clientName ?? '').trim().toLowerCase();
  if (normalizedName) {
    const byName = rows.find((row) =>
      row.peer_id &&
      (row.booking_snapshot?.clientName ?? '').trim().toLowerCase() === normalizedName,
    );

    if (byName?.peer_id) return byName.peer_id;
  }

  return null;
}

export async function sendClientVkMessage(params: {
  workspaceId: string;
  bookingId?: string | null;
  clientPhone?: string | null;
  clientName?: string | null;
  directPeerId?: number | string | null;
  text: string;
  keyboard?: string | Record<string, unknown>;
}) {
  const peerId = await findClientVkPeerId({
    workspaceId: params.workspaceId,
    bookingId: params.bookingId,
    clientPhone: params.clientPhone,
    clientName: params.clientName,
    directPeerId: params.directPeerId,
  });

  if (!peerId) return false;

  await sendVkMessage({
    peerId,
    message: params.text,
    keyboard: params.keyboard,
  });

  return true;
}
