import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onSave: (description: string) => Promise<void> | void;
  onDiscard: () => void;
}

export default function DescriptionForm({ onSave, onDiscard }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onSave(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-md overflow-hidden"
    >
      <label className="block text-xs uppercase tracking-wide text-muted">
        What did you do?
      </label>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Quick description…"
        className="mt-1 w-full resize-none rounded-lg border border-border bg-panel px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink"
        >
          Skip
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
  );
}
