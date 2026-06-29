import { NextResponse } from 'next/server';

import type { Booking } from '@/lib/types';
import { getPlanLimits, normalizeSubscriptionPlanId } from '@/lib/billing-plans';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import { getWorkspaceBillingSnapshot } from '@/lib/server/supabase-subscriptions';
import { syncAvailabilityDays, syncMessageTemplates, syncServices } from '@/lib/server/supabase-workspace-sections';
import { fetchWorkspaceForUser, updateWorkspace } from '@/lib/server/supabase-workspaces';
import { buildWorkspaceSeed } from '@/lib/workspace-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = (await request.json()) as { workspaceId?: string; section?: string; value?: unknown };

    if (!body.section) {
      return NextResponse.json({ error: 'section_required' }, { status: 400 });
    }

    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (body.workspaceId && body.workspaceId !== workspace.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    let sectionValue = body.value;

    if (body.section === 'services' && Array.isArray(sectionValue) && sectionValue.length === 0) {
      const existingServices = Array.isArray(workspace.data?.services) ? workspace.data.services : [];
      const seed = buildWorkspaceSeed(
        workspace.profile,
        Array.isArray(workspace.data?.bookings) ? (workspace.data.bookings as Booking[]) : [],
        'ru',
      );

      // Do not accidentally wipe the service catalog when a stale client snapshot
      // sends an empty array. The user can still hide services individually.
      sectionValue = existingServices.length > 0 ? existingServices : seed.services;
    }

    if (body.section === 'services' && Array.isArray(sectionValue)) {
      const billing = await getWorkspaceBillingSnapshot(workspace.id).catch(() => null);
      const planId = normalizeSubscriptionPlanId(billing?.subscription?.planId ?? billing?.subscription?.plan);
      const limits = getPlanLimits(planId);
      const activeServicesCount = sectionValue.filter((service) => {
        if (!service || typeof service !== 'object') return false;
        return (service as Record<string, unknown>).status !== 'draft';
      }).length;

      if (activeServicesCount > limits.services) {
        return NextResponse.json(
          {
            error: 'limit_services_exceeded',
            plan: planId,
            limit: limits.services,
            used: activeServicesCount,
          },
          { status: 402 },
        );
      }
    }

    const nextData = {
      ...(workspace.data ?? {}),
      [body.section]: sectionValue,
    };

    const updated = await updateWorkspace(workspace.id, { data: nextData });

    try {
      if (body.section === 'availability') {
        await syncAvailabilityDays(workspace.id, sectionValue);
      }
      if (body.section === 'services') {
        await syncServices(workspace.id, sectionValue);
      }
      if (body.section === 'templates') {
        await syncMessageTemplates(workspace.id, sectionValue);
      }
    } catch {
      // The JSON workspace remains the MVP source of truth. Normalized tables
      // are synchronized for public booking, analytics and future API split.
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
