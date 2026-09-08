import { motion } from "framer-motion";
import { endOfWeek, format, startOfWeek } from "date-fns";

export type CalendarView = "month" | "week";

interface Props {
  view: CalendarView;
  cursor: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: CalendarView) => void;
}

function formatTitle(view: CalendarView, cursor: Date): string {
  if (view === "month") return format(cursor, "MMMM yyyy");
  const s = startOfWeek(cursor, { weekStartsOn: 1 });
  const e = endOfWeek(cursor, { weekStartsOn: 1 });
  if (s.getMonth() === e.getMonth()) {
    return `${format(s, "d")} – ${format(e, "d MMM yyyy")}`;
  }
  return `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
}

function formatTitleShort(view: CalendarView, cursor: Date): string {
  if (view === "month") return format(cursor, "MMM yyyy");
  const s = startOfWeek(cursor, { weekStartsOn: 1 });
  return `Week of ${format(s, "d MMM")}`;
}

export default function CalendarHeader({
  view,
  cursor,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="rounded-md border border-border bg-panel px-3 py-1.5 text-sm text-ink hover:border-accent"
        >
          Today
        </button>
        <div className="flex items-center">
          <button
            onClick={onPrev}
            className="rounded-md p-2 text-muted hover:bg-border hover:text-ink"
            aria-label="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={onNext}
            className="rounded-md p-2 text-muted hover:bg-border hover:text-ink"
            aria-label="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <h2 className="ml-1 text-lg font-semibold sm:text-xl">
          <span className="hidden sm:inline">{formatTitle(view, cursor)}</span>
          <span className="sm:hidden">{formatTitleShort(view, cursor)}</span>
        </h2>
      </div>

      <div className="sm:ml-auto">
        <div className="inline-flex rounded-md border border-border bg-panel p-0.5">
          {(["month", "week"] as CalendarView[]).map((v) => {
            const active = view === v;
            return (
              <motion.button
                key={v}
                whileTap={{ scale: 0.96 }}
                onClick={() => onViewChange(v)}
                className={`rounded px-3 py-1 text-sm capitalize transition-colors ${
                  active ? "bg-border text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {v}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
