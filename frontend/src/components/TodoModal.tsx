import { useState } from "react";
import { motion } from "framer-motion";
import type { Todo, TodoInput } from "../types";

interface Props {
  mode: "create" | "edit";
  initial?: Todo;
  onSave: (input: TodoInput) => Promise<void> | void;
  onClose: () => void;
}

function splitDue(iso: string | null, hasTime: boolean) {
  if (!iso) return { date: "", time: "", useTime: false };
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = hasTime ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
  return { date, time, useTime: hasTime };
}

export default function TodoModal({ mode, initial, onSave, onClose }: Props) {
  const initialDue = splitDue(initial?.dueAt ?? null, initial?.dueHasTime ?? false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initialDue.date);
  const [useTime, setUseTime] = useState(initialDue.useTime);
  const [time, setTime] = useState(initialDue.time || "09:00");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);

    let dueAt: string | null = null;
    if (date) {
      const localIso = useTime
        ? `${date}T${time}:00`
        : `${date}T00:00:00`;
      dueAt = new Date(localIso).toISOString();
    }

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        dueAt,
        dueHasTime: !!date && useTime,
      });
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
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "New todo" : "Edit todo"}
        </h2>

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
          Title
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Pick groceries…"
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Any details…"
          className="mt-1 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
          Limit date (optional)
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

        {date && (
          <>
            <label className="mt-3 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={useTime}
                onChange={(e) => setUseTime(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Add time
            </label>
            {useTime && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            )}
          </>
        )}

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
            disabled={!title.trim() || busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
