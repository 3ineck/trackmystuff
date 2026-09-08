import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { CalendarEvent, CalendarEventInput, Recurrence } from "../../types";

interface Props {
  mode: "create" | "edit";
  initial?: CalendarEvent;
  prefill?: { date: Date; time?: string };
  onSave: (input: CalendarEventInput) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onClose: () => void;
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180, 240];

const RECURRENCE_LABEL: Record<Recurrence, string> = {
  NONE: "Does not repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function splitStart(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return { date: format(d, "yyyy-MM-dd"), time: format(d, "HH:mm") };
}

function endDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd");
}

export default function EventModal({
  mode,
  initial,
  prefill,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const initialStart = initial
    ? splitStart(initial.startsAt)
    : {
        date: prefill ? format(prefill.date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        time: prefill?.time ?? "09:00",
      };

  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initialStart.date);
  const [time, setTime] = useState(initialStart.time);
  const [duration, setDuration] = useState<number>(initial?.durationMinutes ?? 60);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? "NONE");
  const [recurrenceEndsAt, setRecurrenceEndsAt] = useState<string>(
    endDateInputValue(initial?.recurrenceEndsAt ?? null),
  );
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim().length > 0 && !!date && !!time && duration >= 1 && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      let recurrenceEndsIso: string | null = null;
      if (recurrence !== "NONE" && recurrenceEndsAt) {
        recurrenceEndsIso = new Date(`${recurrenceEndsAt}T23:59:59`).toISOString();
      }
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        startsAt,
        durationMinutes: duration,
        recurrence,
        recurrenceEndsAt: recurrenceEndsIso,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="my-auto w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "New event" : "Edit event"}
        </h2>

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">Title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Team standup…"
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted">Start time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
          Duration (minutes)
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 0))}
            className="w-24 rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <select
            value={DURATION_PRESETS.includes(duration) ? duration : ""}
            onChange={(e) => e.target.value && setDuration(Number(e.target.value))}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">Custom…</option>
            {DURATION_PRESETS.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}m` : ""}`}
              </option>
            ))}
          </select>
        </div>

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Notes, agenda…"
          className="mt-1 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">Repeats</label>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((r) => (
            <option key={r} value={r}>
              {RECURRENCE_LABEL[r]}
            </option>
          ))}
        </select>

        {recurrence !== "NONE" && (
          <>
            <label className="mt-3 block text-xs uppercase tracking-wide text-muted">
              Repeat until (optional)
            </label>
            <input
              type="date"
              value={recurrenceEndsAt}
              onChange={(e) => setRecurrenceEndsAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </>
        )}

        <div className="mt-6 flex items-center gap-2">
          {mode === "edit" && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
