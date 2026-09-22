import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatDuration } from "../lib/format";

export interface SessionFormValues {
  startedAt: string;
  endedAt: string;
  description: string;
}

interface Props {
  title: string;
  submitLabel: string;
  initial: {
    startedAt: string;
    endedAt: string | null;
    description: string | null;
  };
  onSave: (values: SessionFormValues) => Promise<void> | void;
  onClose: () => void;
}

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(local: string): string {
  return new Date(local).toISOString();
}

export default function EditSessionModal({
  title,
  submitLabel,
  initial,
  onSave,
  onClose,
}: Props) {
  const [start, setStart] = useState(() => toDateTimeLocal(initial.startedAt));
  const [end, setEnd] = useState(() =>
    toDateTimeLocal(initial.endedAt ?? new Date().toISOString())
  );
  const [description, setDescription] = useState(initial.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationSec = useMemo(() => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return null;
    const diff = Math.round((e - s) / 1000);
    return diff;
  }, [start, end]);

  const invalidRange = durationSec === null || durationSec <= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (invalidRange) {
      setError("End must be after start.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({
        startedAt: fromDateTimeLocal(start),
        endedAt: fromDateTimeLocal(end),
        description: description.trim(),
      });
    } catch (err) {
      setError("Could not save. Please try again.");
      console.error("save session failed:", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">{title}</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted">
              Start
            </label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-muted">
              End
            </label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <p className="mt-2 text-xs text-muted">
          Duration:{" "}
          <span className={invalidRange ? "text-red-400" : "text-ink"}>
            {invalidRange ? "invalid" : formatDuration(durationSec!)}
          </span>
        </p>

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="What did you do?"
          className="mt-1 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || invalidRange}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
