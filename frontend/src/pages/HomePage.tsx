import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { endOfDay, format, startOfDay } from "date-fns";
import Sidebar from "../components/Sidebar";
import NewTagModal from "../components/NewTagModal";
import NowDisplay from "../components/NowDisplay";
import { useAuth } from "../auth/AuthContext";
import { useTags } from "../hooks/useTags";
import { useTodos } from "../hooks/useTodos";
import { useEvents } from "../hooks/useEvents";
import { usePlanGroups } from "../hooks/usePlanGroups";
import {
  dayKey,
  occurrencesByDay,
  type OccurrenceEntry,
} from "../lib/eventOccurrences";
import { hexToRgba } from "../lib/planItemColors";
import type { PlanItem, Todo } from "../types";

interface DatedPlanItem {
  item: PlanItem;
  groupName: string;
  sortKey: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const { tags, createTag } = useTags();
  const { todos } = useTodos("current");
  const { events } = useEvents();
  const { groups } = usePlanGroups();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);

  const todayOccurrences = useMemo(() => {
    const now = new Date();
    const map = occurrencesByDay(events, startOfDay(now), endOfDay(now));
    return map.get(dayKey(now)) ?? [];
  }, [events]);

  const datedPlanItems = useMemo<DatedPlanItem[]>(() => {
    const out: DatedPlanItem[] = [];
    for (const g of groups) {
      for (const item of g.items) {
        if (item.done) continue;
        const anchor = item.startsAt ?? item.endsAt;
        if (!anchor) continue;
        out.push({
          item,
          groupName: g.name,
          sortKey: new Date(anchor).getTime(),
        });
      }
    }
    return out.sort((a, b) => a.sortKey - b.sortKey);
  }, [groups]);

  return (
    <div className="relative flex h-full">
      <Sidebar
        tags={tags}
        onNewTag={() => {
          setShowNewTag(true);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="relative flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-border bg-panel p-2 text-ink md:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-2xl text-muted sm:text-4xl">
              Welcome back, <span className="text-ink">{user?.username ?? "friend"}</span>!
            </p>
            <div className="mt-8">
              <NowDisplay />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TodosCard todos={todos} />
            <TodayEventsCard entries={todayOccurrences} />
            <PlanningCard items={datedPlanItems} />
          </div>
        </motion.div>

        {showNewTag && (
          <NewTagModal
            onClose={() => setShowNewTag(false)}
            onCreate={async (name, color) => {
              await createTag(name, color);
              setShowNewTag(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

function TodosCard({ todos }: { todos: Todo[] }) {
  return (
    <section className="rounded-xl border border-border bg-panel p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Todos
        </h2>
        <Link
          to="/todos/current"
          className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:bg-accent/10"
        >
          View all
        </Link>
      </header>
      {todos.length === 0 ? (
        <Link
          to="/todos/current"
          className="block rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted hover:border-accent hover:text-ink"
        >
          No current todos.
        </Link>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-bg px-3 py-2"
            >
              {todo.favorited && (
                <svg
                  className="h-3.5 w-3.5 flex-none text-amber-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
              <span className="flex-1 truncate text-sm text-ink">
                {todo.title}
              </span>
              {todo.dueAt && (
                <span className="flex-none rounded bg-blue-500/15 px-1.5 py-0.5 text-[11px] tabular-nums text-blue-300">
                  {todo.dueHasTime
                    ? format(new Date(todo.dueAt), "MMM d · HH:mm")
                    : format(new Date(todo.dueAt), "MMM d")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlanningCard({ items }: { items: DatedPlanItem[] }) {
  return (
    <section className="rounded-xl border border-border bg-panel p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Planning
        </h2>
        <Link
          to="/planning"
          className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:bg-accent/10"
        >
          View planning
        </Link>
      </header>
      {items.length === 0 ? (
        <Link
          to="/planning"
          className="block rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted hover:border-accent hover:text-ink"
        >
          No dated items.
        </Link>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {items.map(({ item, groupName }) => {
            const tint = item.color ? hexToRgba(item.color, 0.18) : null;
            return (
              <li
                key={item.id}
                className={`flex flex-col gap-0.5 rounded-lg border border-l-2 border-border/60 px-3 py-2 ${
                  tint ? "" : "bg-bg"
                }`}
                style={
                  tint
                    ? {
                        backgroundColor: tint,
                        borderLeftColor: item.color ?? undefined,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm text-ink">
                    {item.title}
                  </span>
                  <span
                    className="flex-none rounded px-1.5 py-0.5 text-[11px] tabular-nums"
                    style={{
                      backgroundColor: item.color
                        ? hexToRgba(item.color, 0.25)
                        : undefined,
                      color: item.color ?? undefined,
                    }}
                  >
                    {formatItemRange(item.startsAt, item.endsAt)}
                  </span>
                </div>
                <span className="truncate text-[11px] text-muted">
                  {groupName}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function formatItemRange(startsAt: string | null, endsAt: string | null): string {
  const start = startsAt ? format(new Date(startsAt), "MMM d") : null;
  const end = endsAt ? format(new Date(endsAt), "MMM d") : null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `from ${start}`;
  return `until ${end}`;
}

function TodayEventsCard({ entries }: { entries: OccurrenceEntry[] }) {
  return (
    <section className="rounded-xl border border-border bg-panel p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Today
        </h2>
        <Link
          to="/calendar"
          className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:bg-accent/10"
        >
          View calendar
        </Link>
      </header>
      {entries.length === 0 ? (
        <Link
          to="/calendar"
          className="block rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted hover:border-accent hover:text-ink"
        >
          Nothing scheduled for today.
        </Link>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {entries.map(({ event, occurrenceStart }) => (
            <li key={`${event.id}-${occurrenceStart.getTime()}`}>
              <Link
                to="/calendar"
                className="flex items-center gap-2 rounded-lg bg-accent/20 px-3 py-2 hover:bg-accent/30"
              >
                <span className="flex-none text-xs font-medium tabular-nums text-accent">
                  {format(occurrenceStart, "HH:mm")}
                </span>
                <span className="flex-1 truncate text-sm text-ink">
                  {event.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
