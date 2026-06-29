import { getInitials, cn } from '@/lib/utils';

export function MasterAvatar({
  name,
  avatar,
  className,
}: {
  name: string;
  avatar?: string;
  className?: string;
}) {
  if (avatar) {
    return <img src={avatar} alt={name} className={cn('h-12 w-12 rounded-[14px] border border-border object-cover', className)} />;
  }

  return (
    <div className={cn('relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] border border-border bg-accent text-[13px] font-semibold text-foreground', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_55%)]" />
      <span className="relative z-10">{getInitials(name)}</span>
    </div>
  );
}
