import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { createTelegramAppSessionToken, setTelegramAppSessionCookie } from '@/lib/server/app-session';
import { ensureTelegramAuthUser as ensureSharedTelegramAuthUser, upsertTelegramAccount } from '@/lib/server/telegram-user';
import { createTelegramVirtualUser } from '@/lib/server/telegram-virtual-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LoginRequestRow = {
  token: string;
  status: 'pending' | 'confirmed' | 'consumed' | 'expired';
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  metadata: Record<string, unknown> | null;
  confirmed_at: string | null;
  consumed_at: string | null;
  expires_at: string;
  chat_id?: number | null;
};

function telegramEmail(telegramId: number) {
  return `telegram_${telegramId}@auth.clickbook.app`;
}

function legacyTelegramEmail(telegramId: number) {
  return `telegram_${telegramId}@telegram.clickbook.local`;
}

function normalizeReason(value: unknown) {
  let raw: string;

  if (value instanceof Error) raw = value.message;
  else if (typeof value === 'string') raw = value;
  else {
    try {
      raw = JSON.stringify(value);
    } catch {
      raw = 'telegram_status_failed';
    }
  }

  return raw.length > 900 ? `${raw.slice(0, 900)}...` : raw;
}

async function findAuthUserByEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) throw error;

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (found) return found;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function getAuthUserById(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId?: string | null,
) {
  if (!userId) return null;

  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

async function findTelegramAuthUser(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  telegramId: number,
  accountUserId?: string | null,
) {
  return (
    (await getAuthUserById(admin, accountUserId)) ??
    (await findAuthUserByEmail(admin, telegramEmail(telegramId))) ??
    (await findAuthUserByEmail(admin, legacyTelegramEmail(telegramId)))
  );
}

async function ensureTelegramAuthUser(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  telegramId: number;
  accountUserId?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
}) {
  const email = telegramEmail(params.telegramId);
  const password = randomBytes(48).toString('hex');
  const userMetadata = {
    provider: 'telegram',
    telegram_id: params.telegramId,
    telegram_username: params.username ?? null,
    telegram_first_name: params.firstName ?? null,
    telegram_last_name: params.lastName ?? null,
    telegram_photo_url: params.photoUrl ?? null,
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
      // Metadata update is not critical for login. Keep the stable user id.
      console.warn('[telegram-status] user metadata update skipped', error.message);
      return existing as User;
    }

    return (data?.user ?? existing) as User;
  }

  const { data: createdUser, error: createUserError } =
    await params.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

  if (!createUserError && createdUser?.user) return createdUser.user;

  // Rare race: user may have been created between listUsers and createUser.
  const racedUser = await findTelegramAuthUser(params.admin, params.telegramId);
  if (racedUser) return racedUser;

  // Fallback for projects where GoTrue rejects metadata payloads with a generic
  // "Internal Server Error". Create the Auth user with minimum fields and then
  // attach metadata best-effort.
  const { data: minimalUser, error: minimalCreateError } =
    await params.admin.auth.admin.createUser({
      email,
      password: randomBytes(48).toString('hex'),
      email_confirm: true,
    });

  if (minimalCreateError || !minimalUser?.user) {
    const racedAfterFallback = await findTelegramAuthUser(params.admin, params.telegramId);
    if (racedAfterFallback) return racedAfterFallback;

    throw minimalCreateError ?? createUserError ?? new Error('telegram_user_create_failed');
  }

  const { data: updatedUser, error: metadataUpdateError } =
    await params.admin.auth.admin.updateUserById(minimalUser.user.id, {
      user_metadata: userMetadata,
    });

  if (metadataUpdateError) {
    console.warn('[telegram-status] metadata update after create skipped', metadataUpdateError.message);
  }

  return updatedUser.user ?? minimalUser.user;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
      return NextResponse.json({ status: 'invalid' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { data, error: requestError } = await admin
      .from('sloty_telegram_login_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (requestError) throw requestError;

    const loginRequest = data as LoginRequestRow | null;

    if (!loginRequest) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    if (loginRequest.status === 'pending') {
      const expired = new Date(loginRequest.expires_at).getTime() < Date.now();

      if (expired) {
        await admin
          .from('sloty_telegram_login_requests')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('token', token);

        return NextResponse.json({ status: 'expired' });
      }

      return NextResponse.json({ status: 'pending' });
    }

    if (loginRequest.status === 'expired') {
      return NextResponse.json({ status: 'expired' });
    }

    if (loginRequest.status === 'consumed' || loginRequest.consumed_at) {
      return NextResponse.json({ status: 'consumed' });
    }

    if (!loginRequest.telegram_id) {
      return NextResponse.json({ status: 'invalid' }, { status: 400 });
    }

    const telegramId = Number(loginRequest.telegram_id);

    const { data: existingAccount, error: accountError } = await admin
      .from('sloty_telegram_accounts')
      .select('user_id')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (accountError) throw accountError;

    const userMetadata = {
      provider: 'telegram',
      telegram_id: telegramId,
      telegram_username: loginRequest.username,
      telegram_first_name: loginRequest.first_name,
      telegram_last_name: loginRequest.last_name,
      telegram_photo_url: loginRequest.photo_url,
    };

    const metadata = loginRequest.metadata ?? {};
    const linkUserId =
      metadata &&
      metadata['purpose'] === 'link_account' &&
      typeof metadata['link_user_id'] === 'string'
        ? String(metadata['link_user_id'])
        : null;

    if (linkUserId) {
      const linkedUser = await getAuthUserById(admin, linkUserId);

      if (!linkedUser) {
        return NextResponse.json({ status: 'invalid_link_user' }, { status: 400 });
      }

      const linkedMetadata = {
        ...(linkedUser.user_metadata ?? {}),
        ...userMetadata,
        providers: Array.from(
          new Set([
            ...(Array.isArray(linkedUser.user_metadata?.providers)
              ? linkedUser.user_metadata.providers.map(String)
              : []),
            'telegram',
          ]),
        ),
      };

      const { data: updatedLinkedUser, error: updateLinkedError } =
        await admin.auth.admin.updateUserById(linkUserId, {
          user_metadata: linkedMetadata,
        });

      if (updateLinkedError) throw updateLinkedError;

      const { error: upsertLinkError } = await admin.from('sloty_telegram_accounts').upsert(
        {
          telegram_id: telegramId,
          user_id: linkUserId,
          username: loginRequest.username,
          first_name: loginRequest.first_name,
          last_name: loginRequest.last_name,
          photo_url: loginRequest.photo_url,
          auth_date: loginRequest.confirmed_at,
          chat_id: typeof loginRequest.chat_id === 'number' ? loginRequest.chat_id : null,
          metadata: userMetadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' },
      );

      if (upsertLinkError) throw upsertLinkError;

      await admin
        .from('sloty_telegram_login_requests')
        .update({
          status: 'consumed',
          consumed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      return NextResponse.json({
        status: 'linked',
        provider: 'telegram',
        user: {
          id: updatedLinkedUser.user?.id ?? linkUserId,
          email: updatedLinkedUser.user?.email ?? linkedUser.email,
          user_metadata: updatedLinkedUser.user?.user_metadata ?? linkedMetadata,
        },
      });
    }

    let user: User;

    try {
      user = await ensureSharedTelegramAuthUser({
        admin,
        telegramId,
        accountUserId: existingAccount?.user_id as string | undefined,
        username: loginRequest.username,
        firstName: loginRequest.first_name,
        lastName: loginRequest.last_name,
        photoUrl: loginRequest.photo_url,
      });
    } catch (error) {
      console.warn(
        '[telegram-status] Supabase Auth user ensure failed, using virtual Telegram user',
        error instanceof Error ? error.message : 'unknown_error',
      );

      user = createTelegramVirtualUser({
        telegramId,
        username: loginRequest.username,
        firstName: loginRequest.first_name,
        lastName: loginRequest.last_name,
        photoUrl: loginRequest.photo_url,
      });
    }

    try {
      await upsertTelegramAccount(admin, {
        userId: user.id,
        telegramId,
        username: loginRequest.username,
        firstName: loginRequest.first_name,
        lastName: loginRequest.last_name,
        photoUrl: loginRequest.photo_url,
        authDate: loginRequest.confirmed_at,
        chatId: typeof loginRequest.chat_id === 'number' ? loginRequest.chat_id : null,
      });
    } catch (error) {
      console.warn(
        '[telegram-status] Telegram account upsert skipped',
        error instanceof Error ? error.message : 'unknown_error',
      );
    }

    await admin
      .from('sloty_telegram_login_requests')
      .update({
        status: 'consumed',
        consumed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('token', token);

    const appSessionToken = createTelegramAppSessionToken({
      userId: user.id,
      telegramId,
      username: loginRequest.username,
      firstName: loginRequest.first_name,
      lastName: loginRequest.last_name,
    });

    const response = NextResponse.json({
      status: 'confirmed',
      app_session: true,
      appSessionToken,
      user: {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      },
    });

    return setTelegramAppSessionCookie(response, {
      userId: user.id,
      telegramId,
      username: loginRequest.username,
      firstName: loginRequest.first_name,
      lastName: loginRequest.last_name,
      token: appSessionToken,
    });
  } catch (error) {
    const message = normalizeReason(error);
    console.error('[telegram-status]', message);

    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
