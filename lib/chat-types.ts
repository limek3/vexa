export type ChatChannel = 'Telegram' | 'Instagram' | 'VK' | 'Web';
export type ChatAuthor = 'client' | 'master' | 'system';
export type ChatDeliveryState = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatSegment = 'new' | 'active' | 'followup';

export interface ChatMessageRecord {
  id: string;
  threadId: string;
  author: ChatAuthor;
  body: string;
  deliveryState?: ChatDeliveryState | null;
  viaBot: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ChatThreadRecord {
  id: string;
  workspaceId: string;
  clientName: string;
  clientPhone: string;
  channel: ChatChannel;
  segment: ChatSegment;
  source?: string | null;
  nextVisit?: string | null;
  isPriority: boolean;
  botConnected: boolean;
  lastMessagePreview?: string | null;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  messages: ChatMessageRecord[];
}

export interface ChatThreadListResponse {
  workspaceId: string;
  threads: ChatThreadRecord[];
}
