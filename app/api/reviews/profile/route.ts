import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import type { MasterProfile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug')?.trim();

    if (!slug) {
      return NextResponse.json({ error: 'slug_required' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: workspace, error } = await admin
      .from('sloty_workspaces')
      .select('slug,profile')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (!workspace) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });

    const profile = ((workspace.profile ?? {}) as MasterProfile) || ({} as MasterProfile);

    return NextResponse.json({
      ok: true,
      profile: {
        slug,
        name: profile.name || 'Мастер',
        profession: profile.profession || '',
        city: profile.city || '',
        avatar: profile.avatar || '',
        rating: profile.rating ?? null,
        reviewCount: profile.reviewCount ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'unknown_error' },
      { status: 500 },
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'secure_review_only',
      message: 'Reviews can only be submitted using a personal visit link.',
    },
    { status: 403 },
  );
}
