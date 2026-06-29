import { NextResponse } from 'next/server';
import type { Locale } from '@/lib/i18n';
import { getPlanLimits, normalizeSubscriptionPlanId } from '@/lib/billing-plans';
import type { Booking, MasterProfile } from '@/lib/types';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import { getWorkspaceBillingSnapshot } from '@/lib/server/supabase-subscriptions';
import { buildWorkspaceSeed } from '@/lib/workspace-store';
import {
  createWorkspace,
  ensureUniqueSlug,
  fetchWorkspaceById,
  fetchWorkspaceForUser,
  updateWorkspace,
} from '@/lib/server/supabase-workspaces';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


function mergeWorkspaceDataForProfile(
  currentData: Record<string, unknown> | null | undefined,
  profile: MasterProfile,
  locale: Locale,
) {
  const data = currentData ?? {};
  const seed = buildWorkspaceSeed(profile, Array.isArray(data.bookings) ? (data.bookings as Booking[]) : [], locale);
  const currentServices = Array.isArray(data.services) ? (data.services as Record<string, unknown>[]) : [];
  const currentByName = new Map(
    currentServices
      .filter((service) => service && typeof service.name === 'string')
      .map((service) => [String(service.name), service]),
  );

  const mergedServices = seed.services.map((service) => ({
    ...service,
    ...(currentByName.get(service.name) ?? {}),
    id: currentByName.get(service.name)?.id ?? service.id,
    name: service.name,
  }));

  for (const service of currentServices) {
    const name = typeof service.name === 'string' ? service.name.trim() : '';
    if (!name) continue;
    if (!mergedServices.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) {
      mergedServices.push(service as typeof mergedServices[number]);
    }
  }

  return {
    ...data,
    services: mergedServices,
    availability: Array.isArray(data.availability) && data.availability.length > 0
      ? data.availability
      : seed.availability,
    templates: Array.isArray(data.templates) && data.templates.length > 0
      ? data.templates
      : seed.templates,
    notifications: Array.isArray(data.notifications) && data.notifications.length > 0
      ? data.notifications
      : seed.notifications,
  };
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const telegramOwnerId = Number(user.user_metadata?.telegram_id);
    const ownerTelegramId = Number.isFinite(telegramOwnerId) && telegramOwnerId > 0 ? Math.trunc(telegramOwnerId) : null;

    const body = (await request.json()) as {
      workspaceId?: string | null;
      profile?: MasterProfile;
      locale?: Locale;
    };

    if (!body.profile) {
      return NextResponse.json({ error: 'profile_required' }, { status: 400 });
    }

    const ownedWorkspace = await fetchWorkspaceForUser(user);
    const requestedWorkspace = body.workspaceId
      ? await fetchWorkspaceById(body.workspaceId)
      : null;

    if (requestedWorkspace?.ownerId && requestedWorkspace.ownerId !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const currentWorkspace = ownedWorkspace ?? requestedWorkspace;

    if (body.workspaceId && currentWorkspace && body.workspaceId !== currentWorkspace.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    await ensureUniqueSlug(body.profile.slug, currentWorkspace?.id ?? null);

    const profileServicesCount = Array.isArray(body.profile.services) ? body.profile.services.length : 0;
    const currentBilling = currentWorkspace
      ? await getWorkspaceBillingSnapshot(currentWorkspace.id).catch(() => null)
      : null;
    const profilePlanId = normalizeSubscriptionPlanId(currentBilling?.subscription?.planId ?? currentBilling?.subscription?.plan ?? 'start');
    const profileLimits = getPlanLimits(profilePlanId);

    if (profileServicesCount > profileLimits.services) {
      return NextResponse.json(
        {
          error: 'limit_services_exceeded',
          plan: profilePlanId,
          limit: profileLimits.services,
          used: profileServicesCount,
        },
        { status: 402 },
      );
    }

    if (currentWorkspace) {
      const updated = await updateWorkspace(currentWorkspace.id, {
        slug: body.profile.slug,
        profile: body.profile,
        data: {
          ...mergeWorkspaceDataForProfile(currentWorkspace.data, body.profile, body.locale ?? 'ru'),
          ...(ownerTelegramId ? { ownerTelegramId } : {}),
        },
      });

      if (updated) {
        const billing = await getWorkspaceBillingSnapshot(updated.id).catch(() => null);
        if (billing) {
          return NextResponse.json({
            ...updated,
            data: {
              ...(updated.data ?? {}),
              subscription: billing.subscription,
              subscriptionEvents: billing.subscriptionEvents,
            },
          });
        }
      }

      return NextResponse.json(updated);
    }

    const created = await createWorkspace({
      ownerId: user.id,
      slug: body.profile.slug,
      profile: body.profile,
      data: {
        ...buildWorkspaceSeed(body.profile, [], body.locale ?? 'ru'),
        ...(ownerTelegramId ? { ownerTelegramId } : {}),
      },
      appearance: null,
    });

    const billing = await getWorkspaceBillingSnapshot(created.id).catch(() => null);

    if (billing) {
      return NextResponse.json({
        ...created,
        data: {
          ...(created.data ?? {}),
          subscription: billing.subscription,
          subscriptionEvents: billing.subscriptionEvents,
        },
      });
    }

    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (message === 'slug_taken') {
      return NextResponse.json({ error: 'slug_taken' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
