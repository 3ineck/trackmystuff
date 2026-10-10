import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
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

  const toggleComplete = useCallback(
    async (event: CalendarEvent, occurrenceStart: Date, done: boolean) => {
      if (event.recurrence === "NONE") {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, completed: done } : e)),
        );
        try {
          await api.patch<CalendarEvent>(`/events/${event.id}`, { completed: done });
        } catch (err) {
          await refresh();
          throw err;
        }
        return;
      }

      const dateKey = format(occurrenceStart, "yyyy-MM-dd");
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== event.id) return e;
          const set = new Set(e.completedOccurrences);
          if (done) set.add(dateKey);
          else set.delete(dateKey);
          return { ...e, completedOccurrences: Array.from(set) };
        }),
      );
      try {
        await api.patch<CalendarEvent>(`/events/${event.id}`, {
          completedOccurrence: { date: dateKey, done },
        });
      } catch (err) {
        await refresh();
        throw err;
      }
    },
    [refresh],
  );

  return { events, loading, refresh, create, update, remove, toggleComplete };
}
