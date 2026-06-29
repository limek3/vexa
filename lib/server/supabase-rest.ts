import 'server-only';

import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

function getSupabaseRestConfig() {
  return {
    url: getSupabaseUrl(),
    serviceRoleKey: getSupabaseServiceRoleKey(),
  };
}

export async function supabaseRestRequest(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getSupabaseRestConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  return response;
}
