import { useState } from "react";
import { motion } from "framer-motion";
import type { TrackingSession } from "../types";
import { formatDateTime } from "../lib/format";

interface Props {
  session: TrackingSession;
  onSave: (description: string) => Promise<void> | void;
  onClose: () => void;
}

export default function EditSessionModal({ session, onSave, onClose }: Props) {
  const [text, setText] = useState(session.description ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onSave(text.trim());
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
        <h2 className="text-lg font-semibold">Edit entry</h2>
        <p className="mt-1 text-xs text-muted">
          {formatDateTime(session.startedAt)}
        </p>

        <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
          Description
        </label>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="What did you do?"
          className="mt-1 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />

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
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
