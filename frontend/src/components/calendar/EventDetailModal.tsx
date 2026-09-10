import { motion } from "framer-motion";
import { format } from "date-fns";
import type { CalendarEvent, Recurrence } from "../../types";

interface Props {
  event: CalendarEvent;
  onEdit: () => void;
  onToggleComplete: () => void;
  onClose: () => void;
}

const RECURRENCE_LABEL: Record<Recurrence, string> = {
  NONE: "Does not repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function EventDetailModal({
  event,
  onEdit,
  onToggleComplete,
  onClose,
}: Props) {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const done = event.completed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="my-auto w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2
              className={`text-lg font-semibold ${
                done ? "text-muted line-through" : "text-ink"
              }`}
            >
              {event.title}
            </h2>
            {done && (
              <span className="mt-1 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-400">
                Completed
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:bg-border/60 hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">When</dt>
            <dd className="mt-0.5 text-ink">
              {format(start, "EEEE, MMM d, yyyy")}
              <span className="text-muted"> · </span>
              {format(start, "HH:mm")}–{format(end, "HH:mm")}
              <span className="text-muted"> ({formatDuration(event.durationMinutes)})</span>
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Repeats</dt>
            <dd className="mt-0.5 text-ink">
              {RECURRENCE_LABEL[event.recurrence]}
              {event.recurrence !== "NONE" && event.recurrenceEndsAt && (
                <span className="text-muted">
                  {" "}· until {format(new Date(event.recurrenceEndsAt), "MMM d, yyyy")}
                </span>
              )}
            </dd>
          </div>

          {event.description && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Description</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ink">{event.description}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-border px-3 py-2 text-sm text-ink hover:bg-border/60"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onToggleComplete}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              done ? "bg-border hover:bg-border/80" : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {done ? "Mark as not done" : "Mark complete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
