import { NextResponse } from 'next/server';

import { normalizeAvailabilityDays } from '@/lib/availability';
import { listBookingsByWorkspace } from '@/lib/server/supabase-bookings';
import { listAvailabilityDays, listServices } from '@/lib/server/supabase-workspace-sections';
import { fetchWorkspaceBySlug } from '@/lib/server/supabase-workspaces';
import type { Booking } from '@/lib/types';
import { buildWorkspaceSeed } from '@/lib/workspace-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAvailabilityKey(item: unknown) {
  if (!item || typeof item !== 'object') return crypto.randomUUID();
  const day = item as Record<string, unknown>;

  if (typeof day.date === 'string' && day.date) return `date:${day.date}`;
  if (typeof day.weekdayIndex === 'number') return `weekday:${day.weekdayIndex}`;
  if (typeof day.weekday_index === 'number') return `weekday:${day.weekday_index}`;
  if (typeof day.id === 'string' && day.id) return `id:${day.id}`;

  return crypto.randomUUID();
}

function mergeAvailability(...sources: unknown[][]) {
  const map = new Map<string, unknown>();

  for (const source of sources) {
    for (const item of source) {
      if (!item || typeof item !== 'object') continue;
      map.set(getAvailabilityKey(item), item);
    }
  }

  return Array.from(map.values());
}

function resolveAvailability(params: {
  seedAvailability: unknown[];
  storedAvailability: unknown[];
  normalizedAvailability: unknown[];
}) {
  const stored = normalizeAvailabilityDays(params.storedAvailability);
  const normalized = normalizeAvailabilityDays(params.normalizedAvailability);
  const seed = normalizeAvailabilityDays(params.seedAvailability);

  // The JSON workspace section is the source of truth because it is what the
  // availability page edits. Normalized SQL rows are only a backup. Using stale
  // normalized rows together with fresh JSON was the reason /m showed random
  // slots from older saves.
  if (stored.length > 0) {
    return mergeAvailability(seed.filter((day) => !day.date), stored);
  }

  if (normalized.length > 0) {
    return mergeAvailability(seed.filter((day) => !day.date), normalized);
  }

  return seed;
}

function mergeBookings(tableBookings: Booking[], jsonBookings: Booking[]) {
  const map = new Map<string, Booking>();

  for (const booking of [...jsonBookings, ...tableBookings]) {
    if (!booking?.id) continue;
    map.set(booking.id, booking);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const workspace = await fetchWorkspaceBySlug(slug);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const jsonBookings = Array.isArray(workspace.data?.bookings)
      ? (workspace.data.bookings as Booking[])
      : [];
    const tableBookings = await listBookingsByWorkspace(workspace.id).catch(() => [] as Booking[]);
    const bookings = mergeBookings(tableBookings, jsonBookings);

    const seed = buildWorkspaceSeed(workspace.profile, bookings, 'ru');
    const storedServices = Array.isArray(workspace.data?.services) ? workspace.data.services : [];
    const normalizedServices = await listServices(workspace.id).catch(() => []);
    const serviceDetails = storedServices.length > 0
      ? storedServices
      : normalizedServices.length > 0
        ? normalizedServices
        : seed.services;

    const storedAvailability = Array.isArray(workspace.data?.availability)
      ? workspace.data.availability
      : [];
    const normalizedAvailability = await listAvailabilityDays(workspace.id).catch(() => []);
    const availability = resolveAvailability({
      seedAvailability: seed.availability,
      storedAvailability,
      normalizedAvailability,
    });

    const publicServiceNames = serviceDetails
      .filter((service) => {
        if (!service || typeof service !== 'object') return false;
        const item = service as Record<string, unknown>;
        return typeof item.name === 'string' && item.visible !== false && item.status !== 'draft';
      })
      .map((service) => String((service as Record<string, unknown>).name));

    return NextResponse.json({
      profile: publicServiceNames.length > 0
        ? { ...workspace.profile, services: publicServiceNames }
        : workspace.profile,
      appearance: workspace.appearance ?? workspace.data?.appearance ?? null,
      workspaceId: workspace.id,
      availability: normalizeAvailabilityDays(availability),
      services: serviceDetails,
      bookedSlots: bookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        service: booking.service,
        status: booking.status,
        durationMinutes: (booking as Booking & { durationMinutes?: number | null }).durationMinutes ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'unknown_error' }, { status: 500 });
  }
}
