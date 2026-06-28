import 'server-only';

type WorkspaceLike = {
  data?: Record<string, unknown> | null;
};

type NotificationItem = {
  id?: string;
  title?: string;
  audience?: string;
  channel?: string;
  enabled?: boolean;
};

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function getItems(workspace: WorkspaceLike): NotificationItem[] {
  const items = workspace.data?.notifications;
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is NotificationItem => Boolean(item && typeof item === 'object'));
}

export function isNotificationEnabled(
  workspace: WorkspaceLike,
  params: {
    id?: string;
    titleIncludes?: string;
    audience?: 'master' | 'client';
    fallback?: boolean;
  },
) {
  const items = getItems(workspace);

  if (items.length === 0) return params.fallback ?? true;

  const wantedId = normalize(params.id);
  const wantedTitle = normalize(params.titleIncludes);
  const wantedAudience = normalize(params.audience);

  const item = items.find((candidate) => {
    const idMatches = wantedId ? normalize(candidate.id) === wantedId : false;
    const titleMatches = wantedTitle ? normalize(candidate.title).includes(wantedTitle) : false;
    const audienceMatches = wantedAudience ? normalize(candidate.audience) === wantedAudience : true;

    return (idMatches || titleMatches) && audienceMatches;
  });

  if (!item) return params.fallback ?? true;
  return item.enabled !== false;
}

export function areQuietHoursEnabled(workspace: WorkspaceLike) {
  return workspace.data?.quietHours === true;
}
