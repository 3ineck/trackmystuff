import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Tag } from "../types";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await api.get<Tag[]>("/tags");
    setTags(list);
  }, []);

  useEffect(() => {
    refresh()
      .catch((err) => console.error("load tags failed:", err))
      .finally(() => setLoading(false));
  }, [refresh]);

  const createTag = useCallback(
    async (name: string, color: string) => {
      const tag = await api.post<Tag>("/tags", { name, color });
      setTags((prev) => [...prev, tag]);
      return tag;
    },
    []
  );

  const deleteTag = useCallback(async (id: string) => {
    await api.del(`/tags/${id}`);
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tags, loading, refresh, createTag, deleteTag };
}
