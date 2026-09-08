import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { CalendarEvent, CalendarEventInput, CalendarEventPatch } from "../types";

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<CalendarEvent[]>("/events");
      setEvents(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((err) => console.error("load events failed:", err));
  }, [refresh]);

  const create = useCallback(
    async (input: CalendarEventInput) => {
      const ev = await api.post<CalendarEvent>("/events", input);
      await refresh();
      return ev;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, patch: CalendarEventPatch) => {
      const ev = await api.patch<CalendarEvent>(`/events/${id}`, patch);
      await refresh();
      return ev;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.del(`/events/${id}`);
      await refresh();
    },
    [refresh],
  );

  return { events, loading, refresh, create, update, remove };
}
