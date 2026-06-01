export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TrackingSession {
  id: string;
  userId: string;
  tagId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  description: string | null;
  createdAt: string;
  tag: Tag;
}

export interface TagStats {
  firstSessionAt: string | null;
  lastSessionAt: string | null;
  totalDurationSec: number;
  sessionCount: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
