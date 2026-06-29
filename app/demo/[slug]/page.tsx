import { PublicMasterPage } from '@/components/profile/public-master-page';

export default async function DemoMasterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <PublicMasterPage slug={slug} isDemo />;
}
