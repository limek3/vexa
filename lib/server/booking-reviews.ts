import 'server-only';

import crypto from 'node:crypto';
import type { Booking, MasterProfile, ReviewItem } from '@/lib/types';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { getAppUrl } from '@/lib/server/telegram-bot';

function buildToken() {
  return crypto.randomBytes(32).toString('hex');
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 5;
  return Math.min(5, Math.max(1, value));
}

function calculateRating(reviews: ReviewItem[]) {
  if (reviews.length === 0) return 4.9;
  const total = reviews.reduce((sum, review) => sum + clampRating(Number(review.rating)), 0);
  return Number((total / reviews.length).toFixed(1));
}

export function buildReviewUrl(token: string) {
  return `${getAppUrl()}/review/${encodeURIComponent(token)}`;
}

export async function createBookingReviewLink(params: {
  workspaceId: string;
  booking: Booking;
  masterSlug: string;
}) {
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from('sloty_booking_review_links')
    .select('token,status')
    .eq('workspace_id', params.workspaceId)
    .eq('booking_id', params.booking.id)
    .in('status', ['pending', 'sent'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingToken = typeof existing?.token === 'string' ? existing.token : '';
  if (existingToken) {
    return { token: existingToken, url: buildReviewUrl(existingToken) };
  }

  const token = buildToken();

  await admin.from('sloty_booking_review_links').insert({
    token,
    workspace_id: params.workspaceId,
    booking_id: params.booking.id,
    master_slug: params.masterSlug,
    client_name: params.booking.clientName,
    service: params.booking.service,
    status: 'pending',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return { token, url: buildReviewUrl(token) };
}

export async function submitBookingReview(params: {
  token: string;
  author?: string;
  rating: number;
  text: string;
}) {
  const admin = createSupabaseAdminClient();
  const token = params.token.trim();
  const text = params.text.trim();

  if (!token || !text) return { ok: false as const, reason: 'required' as const };

  const { data: link, error: linkError } = await admin
    .from('sloty_booking_review_links')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!link) return { ok: false as const, reason: 'not_found' as const };
  if (link.status === 'submitted') return { ok: false as const, reason: 'already_submitted' as const };

  const expiresAt = typeof link.expires_at === 'string' ? new Date(link.expires_at).getTime() : 0;
  if (expiresAt && Date.now() > expiresAt) return { ok: false as const, reason: 'expired' as const };

  const { data: workspace, error: workspaceError } = await admin
    .from('sloty_workspaces')
    .select('id,profile,data')
    .eq('id', link.workspace_id)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspace) return { ok: false as const, reason: 'workspace_not_found' as const };

  const profile = ((workspace.profile ?? {}) as MasterProfile) || ({} as MasterProfile);
  const currentReviews = Array.isArray(profile.reviews) ? profile.reviews : [];
  const review: ReviewItem = {
    id: `review-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    author: params.author?.trim() || link.client_name || 'Клиент',
    rating: clampRating(Number(params.rating)),
    text,
    service: typeof link.service === 'string' ? link.service : undefined,
    dateLabel: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  };

  const nextReviews = [review, ...currentReviews].slice(0, 80);
  const nextProfile: MasterProfile = {
    ...profile,
    reviews: nextReviews,
    reviewCount: nextReviews.length,
    rating: calculateRating(nextReviews),
  };

  const { error: updateError } = await admin
    .from('sloty_workspaces')
    .update({ profile: nextProfile })
    .eq('id', workspace.id);

  if (updateError) throw updateError;

  await admin
    .from('sloty_booking_review_links')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      review_id: review.id,
      rating: review.rating,
      review_text: review.text,
      updated_at: new Date().toISOString(),
    })
    .eq('token', token);

  return { ok: true as const, review, profile: nextProfile };
}


export async function getBookingReviewContext(tokenInput: string) {
  const admin = createSupabaseAdminClient();
  const token = tokenInput.trim();

  if (!token) {
    return { ok: false as const, reason: 'required' as const };
  }

  const { data: link, error: linkError } = await admin
    .from('sloty_booking_review_links')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!link) return { ok: false as const, reason: 'not_found' as const };

  const { data: workspace, error: workspaceError } = await admin
    .from('sloty_workspaces')
    .select('id,slug,profile')
    .eq('id', link.workspace_id)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspace) return { ok: false as const, reason: 'workspace_not_found' as const };

  const profile = ((workspace.profile ?? {}) as MasterProfile) || ({} as MasterProfile);
  const expiresAt = typeof link.expires_at === 'string' ? link.expires_at : null;
  const expired = Boolean(expiresAt && Date.now() > new Date(expiresAt).getTime());

  return {
    ok: true as const,
    context: {
      token,
      status: typeof link.status === 'string' ? link.status : 'pending',
      expired,
      expiresAt,
      submittedAt: typeof link.submitted_at === 'string' ? link.submitted_at : null,
      master: {
        slug:
          (typeof workspace.slug === 'string' && workspace.slug) ||
          (typeof link.master_slug === 'string' ? link.master_slug : '') ||
          profile.slug ||
          '',
        name: profile.name || 'Мастер',
        profession: profile.profession || '',
        city: profile.city || '',
        avatar: profile.avatar || '',
        rating: profile.rating ?? null,
        reviewCount: profile.reviewCount ?? 0,
      },
      booking: {
        clientName: typeof link.client_name === 'string' ? link.client_name : '',
        service: typeof link.service === 'string' ? link.service : '',
      },
    },
  };
}
