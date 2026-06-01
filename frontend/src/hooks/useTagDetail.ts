import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import type { Paginated, Tag, TagStats, TrackingSession } from "../types";

const PAGE_SIZE = 15;

interface Result {
  tag: Tag | null;
  stats: TagStats | null;
  sessions: TrackingSession[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  notFound: boolean;
  setPage: (p: number) => void;
  refresh: () => void;
}

export function useTagDetail(tagId: string): Result {
  const [tag, setTag] = useState<Tag | null>(null);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [sessions, setSessions] = useState<TrackingSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      api.get<TagStats>(`/tags/${tagId}/stats`),
      api.get<Tag[]>("/tags"),
    ])
      .then(([s, tags]) => {
        if (cancelled) return;
        const found = tags.find((t) => t.id === tagId) ?? null;
        if (!found) {
          setNotFound(true);
          return;
        }
        setTag(found);
        setStats(s);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          console.error("load tag detail failed:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tagId, version]);

  useEffect(() => {
    if (notFound) return;
    let cancelled = false;
    api
      .get<Paginated<TrackingSession>>(
        `/sessions?tagId=${encodeURIComponent(tagId)}&page=${page}&limit=${PAGE_SIZE}`
      )
      .then((res) => {
        if (cancelled) return;
        setSessions(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (!cancelled) console.error("load sessions failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [tagId, page, notFound, version]);

  return {
    tag,
    stats,
    sessions,
    total,
    page,
    pageSize: PAGE_SIZE,
    loading,
    notFound,
    setPage,
    refresh,
  };
}
