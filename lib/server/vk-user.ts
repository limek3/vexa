import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { VkIdProfile } from '@/lib/server/vk-id';
import { createVkVirtualUserId } from '@/lib/server/vk-id';

type AdminClient = SupabaseClient<any, 'public', any>;

function displayName(profile: VkIdProfile) {
  return profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || null;
}

export function createVkVirtualUser(profile: VkIdProfile, userId?: string | null): User {
  const id = userId || createVkVirtualUserId(profile.vkId);
  const now = new Date().toISOString();
  const name = displayName(profile);

  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: profile.email || `vk_${profile.vkId}@auth.clickbook.app`,
    app_metadata: {
      provider: 'vk',
      providers: ['vk'],
    },
    user_metadata: {
      provider: 'vk',
      providers: ['vk'],
      vk_id: profile.vkId,
      vk_screen_name: profile.screenName,
      vk_domain: profile.domain,
      vk_first_name: profile.firstName,
      vk_last_name: profile.lastName,
      vk_full_name: name,
      vk_photo_url: profile.photoUrl,
      email: profile.email,
      phone: profile.phone,
      name,
      avatar_url: profile.photoUrl,
    },
    created_at: now,
    updated_at: now,
  } as User;
}

export async function upsertVkAccount(
  admin: AdminClient,
  params: {
    userId: string;
    profile: VkIdProfile;
  },
) {
  const profile = params.profile;

  const { error } = await admin.from('sloty_vk_accounts').upsert(
    {
      vk_id: profile.vkId,
      user_id: params.userId,
      screen_name: profile.screenName ?? null,
      domain: profile.domain ?? null,
      first_name: profile.firstName ?? null,
      last_name: profile.lastName ?? null,
      full_name: displayName(profile),
      email: profile.email ?? null,
      phone: profile.phone ?? null,
      photo_url: profile.photoUrl ?? null,
      raw_profile: profile.rawProfile ?? {},
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'vk_id' },
  );

  if (error) throw error;
}

export async function findVkAccountByVkId(admin: AdminClient, vkId: string) {
  const { data, error } = await admin
    .from('sloty_vk_accounts')
    .select('*')
    .eq('vk_id', vkId)
    .maybeSingle();

  if (error) throw error;
  return data as { user_id?: string | null } | null;
}
