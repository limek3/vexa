import { BookingReviewPage } from '@/components/reviews/booking-review-page';

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <BookingReviewPage token={token} />;
}
