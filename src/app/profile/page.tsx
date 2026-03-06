import { ProfileFeaturePage } from "@/features/profile";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <ProfileFeaturePage searchParams={searchParams} />;
}
