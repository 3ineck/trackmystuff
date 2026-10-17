import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Note, NoteInput, NotePatch } from "../types";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<Note[]>("/notes");
      setNotes(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((err) => console.error("load notes failed:", err));
  }, [refresh]);

  const create = useCallback(
    async (input: NoteInput) => {
      const note = await api.post<Note>("/notes", input);
      await refresh();
      return note;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: NotePatch) => {
      const note = await api.patch<Note>(`/notes/${id}`, patch);
      await refresh();
      return note;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await api.del(`/notes/${id}`);
      await refresh();
    },
    [refresh]
  );

  return { notes, loading, refresh, create, update, remove };
}
