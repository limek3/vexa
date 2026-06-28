import { NextResponse } from 'next/server';

import { requireAuthUser } from '@/lib/server/require-auth-user';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function addUserProviders(user: Awaited<ReturnType<typeof requireAuthUser>>, providers: Set<string>) {
  user.identities?.forEach((identity) => {
    if (identity.provider) providers.add(identity.provider);
  });

  const appProviders = user.app_metadata?.providers;
  if (Array.isArray(appProviders)) {
    appProviders.forEach((provider) => providers.add(String(provider)));
  }

  const metaProviders = user.user_metadata?.providers;
  if (Array.isArray(metaProviders)) {
    metaProviders.forEach((provider) => providers.add(String(provider)));
  }

  if (user.user_metadata?.provider) {
    providers.add(String(user.user_metadata.provider));
  }

  if (user.user_metadata?.telegram_id) {
    providers.add('telegram');
  }

  if (user.user_metadata?.vk_id) {
    providers.add('vk');
  }
}

async function addLinkedTableProviders(userId: string, providers: Set<string>) {
  try {
    const admin = createSupabaseAdminClient();

    const [{ data: telegramRows }, { data: vkRows }] = await Promise.all([
      admin
        .from('sloty_telegram_accounts')
        .select('telegram_id')
        .eq('user_id', userId)
        .limit(1),
      admin
        .from('sloty_vk_accounts')
        .select('vk_id')
        .eq('user_id', userId)
        .limit(1),
    ]);

    if (Array.isArray(telegramRows) && telegramRows.length > 0) providers.add('telegram');
    if (Array.isArray(vkRows) && vkRows.length > 0) providers.add('vk');
  } catch {
    // Backward compatible with databases where optional account tables are not
    // applied yet. The direct user metadata above still works.
  }
}

export async function GET() {
  try {
    const user = await requireAuthUser();
    const providers = new Set<string>();

    addUserProviders(user, providers);
    await addLinkedTableProviders(user.id, providers);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? null,
        providers: Array.from(providers),
        user_metadata: user.user_metadata ?? {},
        app_metadata: user.app_metadata ?? {},
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'accounts_failed';
    const status = message === 'unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
