import 'server-only';

import crypto from 'node:crypto';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { VkBotProfile } from '@/lib/server/vk-bot';
import { createVkVirtualUserId } from '@/lib/server/vk-id';

type AdminClient = SupabaseClient<any, 'public', any>;

export function createVkBotVirtualUser(profile: VkBotProfile, userId?: string | null): User {
  const id = userId || createVkVirtualUserId(profile.vkId);
  const now = new Date().toISOString();
  const name = profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || null;

  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: `vk_${profile.vkId}@auth.clickbook.app`,
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
      name,
      avatar_url: profile.photoUrl,
      auth_source: 'vk_bot',
    },
    created_at: now,
    updated_at: now,
  } as User;
}

function displayName(profile: VkBotProfile) {
  return profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || null;
}

export async function findVkBotAccountByVkId(admin: AdminClient, vkId: string) {
  const { data, error } = await admin
    .from('sloty_vk_bot_accounts')
    .select('*')
    .eq('vk_user_id', vkId)
    .maybeSingle();

  if (error) throw error;
  return data as { user_id?: string | null; peer_id?: number | string | null } | null;
}

export async function upsertVkBotAccount(
  admin: AdminClient,
  params: {
    userId: string;
    vkUserId: string;
    peerId?: number | string | null;
    profile?: VkBotProfile | null;
    messagesAllowed?: boolean;
    metadata?: Record<string, unknown>;
  },
) {
  const profile = params.profile;
  const now = new Date().toISOString();

  const { error } = await admin.from('sloty_vk_bot_accounts').upsert(
    {
      vk_user_id: params.vkUserId,
      user_id: params.userId,
      peer_id: params.peerId != null ? Number(params.peerId) : null,
      first_name: profile?.firstName ?? null,
      last_name: profile?.lastName ?? null,
      full_name: profile ? displayName(profile) : null,
      screen_name: profile?.screenName ?? null,
      photo_url: profile?.photoUrl ?? null,
      messages_allowed: params.messagesAllowed ?? true,
      last_message_at: now,
      last_login_at: now,
      metadata: {
        ...(params.metadata ?? {}),
        ...(profile?.rawProfile ? { rawProfile: profile.rawProfile } : {}),
      },
      updated_at: now,
    },
    { onConflict: 'vk_user_id' },
  );

  if (error) throw error;
}

export async function upsertVkOauthAccountFromBot(
  admin: AdminClient,
  params: {
    userId: string;
    profile: VkBotProfile;
  },
) {
  const profile = params.profile;
  const now = new Date().toISOString();

  const { error } = await admin.from('sloty_vk_accounts').upsert(
    {
      vk_id: profile.vkId,
      user_id: params.userId,
      screen_name: profile.screenName ?? null,
      domain: profile.domain ?? null,
      first_name: profile.firstName ?? null,
      last_name: profile.lastName ?? null,
      full_name: displayName(profile),
      email: null,
      phone: null,
      photo_url: profile.photoUrl ?? null,
      raw_profile: profile.rawProfile ?? {},
      last_login_at: now,
      updated_at: now,
    },
    { onConflict: 'vk_id' },
  );

  if (error) throw error;
}

export function buildVkLoginToken() {
  return crypto.randomBytes(16).toString('hex');
}
