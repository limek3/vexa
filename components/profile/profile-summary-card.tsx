import { Badge } from '@/components/ui/badge';
import { MasterAvatar } from '@/components/profile/master-avatar';
import type { MasterProfile } from '@/lib/types';

export function ProfileSummaryCard({ profile }: { profile: MasterProfile }) {
  return (
    <div className="workspace-card h-full rounded-[18px] p-4">
      <div className="flex items-start gap-3">
        <MasterAvatar name={profile.name} avatar={profile.avatar} className="h-14 w-14 rounded-[16px]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-foreground">{profile.name}</div>
          <div className="truncate text-[12px] text-muted-foreground">{profile.profession}</div>
          <div className="mt-2 text-[12px] text-muted-foreground">{profile.city}</div>
        </div>
      </div>

      <p className="text-[13px] leading-6 text-muted-foreground">{profile.bio}</p>

      <div className="flex flex-wrap gap-2">
        {profile.services.slice(0, 5).map((service) => (
          <Badge key={service} variant="outline">
            {service}
          </Badge>
        ))}
      </div>
    </div>
  );
}
