import 'server-only';

import type {
  ChatAuthor,
  ChatDeliveryState,
  ChatMessageRecord,
  ChatSegment,
  ChatThreadRecord,
} from '@/lib/chat-types';
import { supabaseRestRequest } from '@/lib/server/supabase-rest';

type ChatThreadRow = {
  id: string;
  workspace_id: string;
  client_name: string;
  client_phone: string;
  channel: ChatThreadRecord['channel'];
  segment: string | null;
  source: string | null;
  next_visit: string | null;
  is_priority: boolean;
  bot_connected: boolean;
  last_message_preview: string | null;
  last_message_at: string;
  unread_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type ChatMessageRow = {
  id: string;
  workspace_id: string;
  thread_id: string;
  author: ChatAuthor;
  body: string;
  delivery_state: ChatDeliveryState | null;
  via_bot: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function mapThread(row: ChatThreadRow): Omit<ChatThreadRecord, 'messages'> {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    channel: row.channel,
    segment: row.segment === 'followup' || row.segment === 'active' ? row.segment : 'new',
    source: row.source,
    nextVisit: row.next_visit,
    isPriority: row.is_priority,
    botConnected: row.bot_connected,
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at,
    unreadCount: row.unread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata ?? {},
  };
}

function mapMessage(row: ChatMessageRow): ChatMessageRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    author: row.author,
    body: row.body,
    deliveryState: row.delivery_state,
    viaBot: row.via_bot,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  };
}

export async function listChatThreads(workspaceId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_chat_threads?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=last_message_at.desc`,
  );
  const rows = (await response.json()) as ChatThreadRow[];
  return rows.map(mapThread);
}

export async function listChatMessages(workspaceId: string, threadIds: string[]) {
  if (threadIds.length === 0) return [];

  const encoded = threadIds.map((id) => id.replaceAll(',', '')).join(',');
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_chat_messages?workspace_id=eq.${encodeURIComponent(workspaceId)}&thread_id=in.(${encoded})&select=*&order=created_at.asc`,
  );
  const rows = (await response.json()) as ChatMessageRow[];
  return rows.map(mapMessage);
}

export async function listChatsForWorkspace(workspaceId: string) {
  const threads = await listChatThreads(workspaceId);
  const messages = await listChatMessages(
    workspaceId,
    threads.map((item) => item.id),
  );
  const messagesByThreadId = new Map<string, ChatMessageRecord[]>();

  messages.forEach((message) => {
    const bucket = messagesByThreadId.get(message.threadId) ?? [];
    bucket.push(message);
    messagesByThreadId.set(message.threadId, bucket);
  });

  return threads.map((thread) => ({
    ...thread,
    messages: messagesByThreadId.get(thread.id) ?? [],
  }));
}

export async function fetchChatThreadByBookingId(workspaceId: string, bookingId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_chat_threads?workspace_id=eq.${encodeURIComponent(workspaceId)}&metadata->>bookingId=eq.${encodeURIComponent(bookingId)}&select=*&order=updated_at.desc&limit=1`,
  );
  const rows = (await response.json()) as ChatThreadRow[];
  return rows[0] ? mapThread(rows[0]) : null;
}

export async function fetchChatThreadByPhone(workspaceId: string, clientPhone: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_chat_threads?workspace_id=eq.${encodeURIComponent(workspaceId)}&client_phone=eq.${encodeURIComponent(clientPhone)}&select=*&limit=1`,
  );
  const rows = (await response.json()) as ChatThreadRow[];
  return rows[0] ? mapThread(rows[0]) : null;
}

export async function createChatThread(
  workspaceId: string,
  input: {
    clientName: string;
    clientPhone: string;
    channel: ChatThreadRecord['channel'];
    segment?: ChatSegment;
    source?: string | null;
    nextVisit?: string | null;
    isPriority?: boolean;
    botConnected?: boolean;
    lastMessagePreview?: string | null;
    lastMessageAt?: string;
    unreadCount?: number;
    metadata?: Record<string, unknown>;
  },
) {
  const response = await supabaseRestRequest('/rest/v1/sloty_chat_threads?select=*', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        workspace_id: workspaceId,
        client_name: input.clientName,
        client_phone: input.clientPhone,
        channel: input.channel,
        segment: input.segment ?? 'new',
        source: input.source ?? null,
        next_visit: input.nextVisit ?? null,
        is_priority: input.isPriority ?? false,
        bot_connected: input.botConnected ?? true,
        last_message_preview: input.lastMessagePreview ?? null,
        last_message_at: input.lastMessageAt ?? new Date().toISOString(),
        unread_count: input.unreadCount ?? 0,
        metadata: input.metadata ?? {},
      },
    ]),
  });
  const rows = (await response.json()) as ChatThreadRow[];
  return rows[0] ? mapThread(rows[0]) : null;
}

export async function updateChatThread(
  workspaceId: string,
  threadId: string,
  patch: Partial<{
    clientName: string;
    clientPhone: string;
    channel: ChatThreadRecord['channel'];
    segment: ChatSegment;
    source: string | null;
    nextVisit: string | null;
    isPriority: boolean;
    botConnected: boolean;
    lastMessagePreview: string | null;
    lastMessageAt: string;
    unreadCount: number;
    metadata: Record<string, unknown>;
  }>,
) {
  const payload: Record<string, unknown> = {};
  if (patch.clientName !== undefined) payload.client_name = patch.clientName;
  if (patch.clientPhone !== undefined) payload.client_phone = patch.clientPhone;
  if (patch.channel !== undefined) payload.channel = patch.channel;
  if (patch.segment !== undefined) payload.segment = patch.segment;
  if (patch.source !== undefined) payload.source = patch.source;
  if (patch.nextVisit !== undefined) payload.next_visit = patch.nextVisit;
  if (patch.isPriority !== undefined) payload.is_priority = patch.isPriority;
  if (patch.botConnected !== undefined) payload.bot_connected = patch.botConnected;
  if (patch.lastMessagePreview !== undefined) payload.last_message_preview = patch.lastMessagePreview;
  if (patch.lastMessageAt !== undefined) payload.last_message_at = patch.lastMessageAt;
  if (patch.unreadCount !== undefined) payload.unread_count = patch.unreadCount;
  if (patch.metadata !== undefined) payload.metadata = patch.metadata;

  const response = await supabaseRestRequest(
    `/rest/v1/sloty_chat_threads?id=eq.${encodeURIComponent(threadId)}&workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    },
  );

  const rows = (await response.json()) as ChatThreadRow[];
  return rows[0] ? mapThread(rows[0]) : null;
}

export async function createChatMessage(
  workspaceId: string,
  input: {
    threadId: string;
    author: ChatAuthor;
    body: string;
    deliveryState?: ChatDeliveryState | null;
    viaBot?: boolean;
    metadata?: Record<string, unknown>;
  },
) {
  const response = await supabaseRestRequest('/rest/v1/sloty_chat_messages?select=*', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        workspace_id: workspaceId,
        thread_id: input.threadId,
        author: input.author,
        body: input.body,
        delivery_state: input.deliveryState ?? null,
        via_bot: input.viaBot ?? false,
        metadata: input.metadata ?? {},
      },
    ]),
  });

  const rows = (await response.json()) as ChatMessageRow[];
  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function deleteChatThread(workspaceId: string, threadId: string) {
  await supabaseRestRequest(
    `/rest/v1/sloty_chat_threads?id=eq.${encodeURIComponent(threadId)}&workspace_id=eq.${encodeURIComponent(workspaceId)}`,
    {
      method: 'DELETE',
    },
  );
}
