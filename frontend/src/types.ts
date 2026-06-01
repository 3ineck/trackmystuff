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
