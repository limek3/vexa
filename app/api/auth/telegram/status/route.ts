import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
      return NextResponse.json({ status: 'invalid' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from('sloty_telegram_login_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;

    const loginRequest = data as LoginRequestRow | null;

    if (!loginRequest) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    if (loginRequest.status === 'pending') {
      const expired = new Date(loginRequest.expires_at).getTime() < Date.now();

      if (expired) {
        await admin
          .from('sloty_telegram_login_requests')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
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

    const metadata = loginRequest.metadata ?? {};
    const linkUserId =
      metadata.purpose === 'link_account' && typeof metadata.link_user_id === 'string'
        ? metadata.link_user_id
        : null;

    if (!linkUserId) {
      return NextResponse.json({ status: 'invalid_link_user' }, { status: 400 });
    }

    const linkedUser = await getAuthUserById(admin, linkUserId);

    if (!linkedUser) {
      return NextResponse.json({ status: 'invalid_link_user' }, { status: 400 });
    }

    const telegramMetadata = {
      provider: 'email',
      telegram_id: loginRequest.telegram_id,
      telegram_username: loginRequest.username,
      telegram_first_name: loginRequest.first_name,
      telegram_last_name: loginRequest.last_name,
      telegram_photo_url: loginRequest.photo_url,
      providers: Array.from(
        new Set([
          ...(Array.isArray(linkedUser.user_metadata?.providers)
            ? linkedUser.user_metadata.providers.map(String)
            : []),
          'telegram',
        ]),
      ),
    };

    const { data: updatedUser, error: updateUserError } =
      await admin.auth.admin.updateUserById(linkUserId, {
        user_metadata: {
          ...(linkedUser.user_metadata ?? {}),
          ...telegramMetadata,
        },
      });

    if (updateUserError) throw updateUserError;

    const { error: upsertError } = await admin.from('sloty_telegram_accounts').upsert(
      {
        telegram_id: loginRequest.telegram_id,
        user_id: linkUserId,
        username: loginRequest.username,
        first_name: loginRequest.first_name,
        last_name: loginRequest.last_name,
        photo_url: loginRequest.photo_url,
        auth_date: loginRequest.confirmed_at,
        chat_id: typeof loginRequest.chat_id === 'number' ? loginRequest.chat_id : null,
        metadata: telegramMetadata,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' },
    );

    if (upsertError) throw upsertError;

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
        id: updatedUser.user?.id ?? linkUserId,
        email: updatedUser.user?.email ?? linkedUser.email,
        user_metadata: updatedUser.user?.user_metadata ?? telegramMetadata,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'telegram_status_failed';
    console.error('[vexa-telegram-status]', message);
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
