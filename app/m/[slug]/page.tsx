import { PublicMasterPage } from '@/components/profile/public-master-page';

export default async function MasterPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <PublicMasterPage slug={slug} />;
}
