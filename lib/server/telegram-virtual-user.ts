import 'server-only';

import crypto from 'node:crypto';
import type { User } from '@supabase/supabase-js';

export type TelegramVirtualUserParams = {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  chatId?: number | null;
};

function toUuidFromHash(hash: Buffer) {
  const bytes = Buffer.from(hash.subarray(0, 16));

  // RFC 4122 compatible deterministic UUID, version 5-like marker.
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createTelegramVirtualUserId(telegramId: number) {
  const normalizedId = Math.trunc(Number(telegramId));
  const hash = crypto
    .createHash('sha256')
    .update(`clickbook:telegram:user:${normalizedId}`)
    .digest();

  return toUuidFromHash(hash);
}

export function createTelegramVirtualUser(params: TelegramVirtualUserParams): User {
  const telegramId = Math.trunc(Number(params.telegramId));
  const now = new Date().toISOString();

  return {
    id: createTelegramVirtualUserId(telegramId),
    aud: 'authenticated',
    role: 'authenticated',
    email: `telegram_${telegramId}@auth.clickbook.app`,
    app_metadata: {
      provider: 'telegram',
      providers: ['telegram'],
      virtual_auth_user: true,
    },
    user_metadata: {
      provider: 'telegram',
      telegram_id: telegramId,
      telegram_username: params.username ?? null,
      telegram_first_name: params.firstName ?? null,
      telegram_last_name: params.lastName ?? null,
      telegram_photo_url: params.photoUrl ?? null,
      telegram_chat_id: params.chatId ?? null,
      virtual_auth_user: true,
    },
    created_at: now,
    updated_at: now,
  } as User;
}

export function isTelegramVirtualUser(user: Pick<User, 'app_metadata' | 'user_metadata'> | null | undefined) {
  return Boolean(user?.app_metadata?.virtual_auth_user || user?.user_metadata?.virtual_auth_user);
}
