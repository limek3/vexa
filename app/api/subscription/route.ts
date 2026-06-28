import { NextResponse } from 'next/server';

import {
  normalizeBillingCycle,
  normalizeSubscriptionPlanId,
} from '@/lib/billing-plans';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import {
  getWorkspaceBillingSnapshot,
  updateWorkspaceSubscription,
} from '@/lib/server/supabase-subscriptions';
import { fetchWorkspaceForUser } from '@/lib/server/supabase-workspaces';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await requireAuthUser();
    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const billing = await getWorkspaceBillingSnapshot(workspace.id);

    return NextResponse.json({
      workspaceId: workspace.id,
      ...billing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser();
    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      planId?: string;
      plan?: string;
      billingCycle?: string;
      billing_cycle?: string;
    };

    const planId = normalizeSubscriptionPlanId(body.planId ?? body.plan);
    const billingCycle = normalizeBillingCycle(body.billingCycle ?? body.billing_cycle);

    await updateWorkspaceSubscription({
      workspaceId: workspace.id,
      planId,
      billingCycle,
    });

    const billing = await getWorkspaceBillingSnapshot(workspace.id);

    return NextResponse.json({
      workspaceId: workspace.id,
      ...billing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
