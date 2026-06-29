import { NextResponse } from 'next/server';

import type { AppearanceSettings } from '@/lib/appearance';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import { fetchWorkspaceForUser, updateWorkspace } from '@/lib/server/supabase-workspaces';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = (await request.json()) as {
      workspaceId?: string;
      settings?: AppearanceSettings;
    };

    if (!body.settings) {
      return NextResponse.json({ error: 'settings_required' }, { status: 400 });
    }

    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (body.workspaceId && body.workspaceId !== workspace.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const nextData = {
      ...(workspace.data ?? {}),
      appearance: body.settings,
    };

    const updated = await updateWorkspace(workspace.id, {
      appearance: body.settings,
      data: nextData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
