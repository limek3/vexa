import 'server-only';

import type { WorkspaceSections, WorkspaceSnapshot } from '@/lib/workspace-store';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

function getSupabaseRestConfig() {
  return {
    url: getSupabaseUrl(),
    serviceRoleKey: getSupabaseServiceRoleKey(),
  };
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
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

function mapRow(row: Record<string, unknown>): WorkspaceSnapshot {
  return {
    id: String(row.id),
    ownerId: typeof row.owner_id === 'string' ? row.owner_id : undefined,
    slug: String(row.slug),
    profile: row.profile as WorkspaceSnapshot['profile'],
    data: (row.data as WorkspaceSections | null) ?? {},
    appearance: (row.appearance as WorkspaceSnapshot['appearance']) ?? null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  };
}

async function getSingle(path: string) {
  const response = await supabaseRequest(path);
  const rows = (await response.json()) as Record<string, unknown>[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function fetchWorkspaceById(workspaceId: string) {
  return getSingle(`/rest/v1/sloty_workspaces?id=eq.${encodeURIComponent(workspaceId)}&select=*`);
}

export async function fetchWorkspaceByOwner(ownerId: string) {
  return getSingle(`/rest/v1/sloty_workspaces?owner_id=eq.${encodeURIComponent(ownerId)}&select=*`);
}

export async function fetchWorkspaceBySlug(slug: string) {
  return getSingle(`/rest/v1/sloty_workspaces?slug=eq.${encodeURIComponent(slug)}&select=*`);
}

export async function createWorkspace(snapshot: Omit<WorkspaceSnapshot, 'id'> & { id?: string; ownerId: string }) {
  const response = await supabaseRequest('/rest/v1/sloty_workspaces?select=*', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify([
      {
        id: snapshot.id,
        owner_id: snapshot.ownerId,
        slug: snapshot.slug,
        profile: snapshot.profile,
        data: snapshot.data,
        appearance: snapshot.appearance ?? null,
      },
    ]),
  });

  const rows = (await response.json()) as Record<string, unknown>[];
  return mapRow(rows[0]);
}

export async function updateWorkspace(
  workspaceId: string,
  patch: Partial<Pick<WorkspaceSnapshot, 'slug' | 'profile' | 'appearance'>> & { data?: WorkspaceSections },
) {
  const response = await supabaseRequest(`/rest/v1/sloty_workspaces?id=eq.${encodeURIComponent(workspaceId)}&select=*`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  });

  const rows = (await response.json()) as Record<string, unknown>[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function ensureUniqueSlug(slug: string, workspaceId?: string | null) {
  const existing = await fetchWorkspaceBySlug(slug);
  if (!existing) return;
  if (!workspaceId || existing.id !== workspaceId) {
    throw new Error('slug_taken');
  }
}

function getTelegramIdFromUser(user: { user_metadata?: Record<string, unknown> | null }) {
  const raw = user.user_metadata?.telegram_id;
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(value) && value > 0 ? String(Math.trunc(value)) : null;
}

async function fetchSingleWorkspaceForRepair() {
  const response = await supabaseRequest('/rest/v1/sloty_workspaces?select=*&order=updated_at.desc&limit=2');
  const rows = (await response.json()) as Record<string, unknown>[];

  if (rows.length !== 1) return null;

  return mapRow(rows[0]);
}

export async function updateWorkspaceOwner(workspaceId: string, ownerId: string) {
  const response = await supabaseRequest(`/rest/v1/sloty_workspaces?id=eq.${encodeURIComponent(workspaceId)}&select=*`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ owner_id: ownerId }),
  });

  const rows = (await response.json()) as Record<string, unknown>[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function fetchWorkspaceForUser(user: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
}) {
  const owned = await fetchWorkspaceByOwner(user.id);
  if (owned) return owned;

  const telegramId = getTelegramIdFromUser(user);
  if (!telegramId || process.env.CLICKBOOK_DISABLE_SINGLE_WORKSPACE_REPAIR === '1') {
    return null;
  }

  // Recovery for early MVP databases: old Telegram auth could create a new
  // Supabase Auth user while the existing workspace stayed attached to the
  // previous synthetic user. If this project has exactly one workspace, safely
  // reattach it to the current Telegram user instead of showing "create profile".
  const singleWorkspace = await fetchSingleWorkspaceForRepair();
  if (!singleWorkspace) return null;

  return updateWorkspaceOwner(singleWorkspace.id, user.id);
}
