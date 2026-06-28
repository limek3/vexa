import 'server-only';

import { headers } from 'next/headers';
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';
import { getAppSessionUser, getAppSessionUserFromToken } from '@/lib/server/app-session';

function parseBearerToken(value: string | null) {
  if (!value) return null;

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function getRequestAuthHeaders() {
  try {
    const headerStore = await headers();
    return {
      bearerToken: parseBearerToken(headerStore.get('authorization')),
      appSessionToken: headerStore.get('x-clickbook-app-session'),
    };
  } catch {
    return {
      bearerToken: null,
      appSessionToken: null,
    };
  }
}

export async function requireAuthUser(): Promise<User> {
  const serverSupabase = await createServerSupabaseClient();
  const { data, error } = await serverSupabase.auth.getUser();

  if (!error && data.user) {
    return data.user;
  }

  const { bearerToken: token, appSessionToken } = await getRequestAuthHeaders();

  if (token) {
    const tokenSupabase = createSupabaseClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    const { data: tokenData, error: tokenError } = await tokenSupabase.auth.getUser(token);

    if (!tokenError && tokenData.user) {
      return tokenData.user;
    }
  }

  const headerAppSessionUser = getAppSessionUserFromToken(appSessionToken);

  if (headerAppSessionUser) {
    return headerAppSessionUser;
  }

  const appSessionUser = await getAppSessionUser();

  if (appSessionUser) {
    return appSessionUser;
  }

  throw new Error('unauthorized');
}