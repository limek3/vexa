import 'server-only';

import crypto from 'node:crypto';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createTelegramVirtualUser } from '@/lib/server/telegram-virtual-user';

type TelegramUserInput = {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  chatId?: number | null;
};

type EnsureTelegramUserParams = TelegramUserInput & {
  admin: SupabaseClient;
  accountUserId?: string | null;
};

function normalizeAuthError(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch {
    return 'unknown_auth_error';
  }
}

export function telegramSyntheticEmail(telegramId: number) {
  return `telegram_${telegramId}@auth.clickbook.app`;
}

function legacyTelegramEmail(telegramId: number) {
  return `telegram_${telegramId}@telegram.clickbook.local`;
}

function userMatchesTelegram(user: User, telegramId: number) {
  const email = user.email?.toLowerCase();
  const syntheticEmail = telegramSyntheticEmail(telegramId).toLowerCase();
  const legacyEmail = legacyTelegramEmail(telegramId).toLowerCase();
  const metadataTelegramId = Number(user.user_metadata?.telegram_id);

  return (
    email === syntheticEmail ||
    email === legacyEmail ||
    metadataTelegramId === telegramId
  );
}

async function findUserById(admin: SupabaseClient, userId?: string | null) {
  if (!userId) return null;

  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user) return null;

  return data.user;
}

export async function findTelegramAuthUser(
  admin: SupabaseClient,
  telegramId: number,
  accountUserId?: string | null,
) {
  const byId = await findUserById(admin, accountUserId);
  if (byId) return byId;

  let page = 1;
  const perPage = 1000;

  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) return null;

    const found = data.users.find((user) => userMatchesTelegram(user, telegramId));
    if (found) return found;

    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

export async function ensureTelegramAuthUser(params: EnsureTelegramUserParams) {
  const userMetadata = {
    provider: 'telegram',
    telegram_id: params.telegramId,
    telegram_username: params.username ?? null,
    telegram_first_name: params.firstName ?? null,
    telegram_last_name: params.lastName ?? null,
    telegram_photo_url: params.photoUrl ?? null,
    telegram_chat_id: params.chatId ?? null,
  };

  const existing = await findTelegramAuthUser(
    params.admin,
    params.telegramId,
    params.accountUserId,
  );

  if (existing) {
    const { data, error } = await params.admin.auth.admin.updateUserById(existing.id, {
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        ...userMetadata,
        providers: Array.from(
          new Set([
            ...(Array.isArray(existing.user_metadata?.providers)
              ? existing.user_metadata.providers.map(String)
              : []),
            'telegram',
          ]),
        ),
      },
    });

    if (error) {
      // Supabase Auth metadata updates are not allowed to break Telegram login.
      console.warn('[telegram-user] metadata update skipped', error.message);
      return existing;
    }

    return data.user ?? existing;
  }

  const email = telegramSyntheticEmail(params.telegramId);
  const password = crypto.randomBytes(48).toString('hex');

  const { data, error } = await params.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (!error && data?.user) return data.user;

  // Fallback for projects where GoTrue rejects metadata payloads with a generic
  // "Internal Server Error". Create the user with the smallest possible payload,
  // then attach Telegram metadata best-effort.
  const raced = await findTelegramAuthUser(params.admin, params.telegramId);
  if (raced) return raced;

  const { data: minimalData, error: minimalError } = await params.admin.auth.admin.createUser({
    email,
    password: crypto.randomBytes(48).toString('hex'),
    email_confirm: true,
  });

  if (minimalError || !minimalData?.user) {
    const racedAfterFallback = await findTelegramAuthUser(params.admin, params.telegramId);
    if (racedAfterFallback) return racedAfterFallback;

    console.warn(
      '[telegram-user] Supabase Auth user create failed, using virtual Telegram user',
      normalizeAuthError(minimalError ?? error),
    );

    return createTelegramVirtualUser(params);
  }

  const { data: updatedData, error: updateError } = await params.admin.auth.admin.updateUserById(
    minimalData.user.id,
    { user_metadata: userMetadata },
  );

  if (updateError) {
    console.warn('[telegram-user] metadata update after create skipped', updateError.message);
  }

  return updatedData.user ?? minimalData.user;
}

export async function upsertTelegramAccount(
  admin: SupabaseClient,
  params: TelegramUserInput & { userId: string; authDate?: string | null },
) {
  const metadata = {
    provider: 'telegram',
    telegram_id: params.telegramId,
    telegram_username: params.username ?? null,
    telegram_first_name: params.firstName ?? null,
    telegram_last_name: params.lastName ?? null,
    telegram_photo_url: params.photoUrl ?? null,
    telegram_chat_id: params.chatId ?? null,
  };

  const payload: Record<string, unknown> = {
    telegram_id: params.telegramId,
    user_id: params.userId,
    username: params.username ?? null,
    first_name: params.firstName ?? null,
    last_name: params.lastName ?? null,
    photo_url: params.photoUrl ?? null,
    auth_date: params.authDate ?? new Date().toISOString(),
    metadata,
    updated_at: new Date().toISOString(),
  };

  if (typeof params.chatId === 'number') {
    payload.chat_id = params.chatId;
  }

  const { error } = await admin.from('sloty_telegram_accounts').upsert(payload, {
    onConflict: 'telegram_id',
  });

  if (error) throw error;
}
