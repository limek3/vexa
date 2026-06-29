import { BookingReviewPage } from '@/components/reviews/booking-review-page';

export default async function ProfileReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BookingReviewPage profileSlug={slug} />;
}
