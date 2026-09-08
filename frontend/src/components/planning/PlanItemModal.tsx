import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ApiError } from "../../api/client";
import {
  DEFAULT_PLAN_ITEM_COLOR,
  PLAN_ITEM_COLORS,
} from "../../lib/planItemColors";
import type { PlanItem, PlanItemInput, PlanItemPatch } from "../../types";

type Mode = "create" | "view";

interface Props {
  mode: Mode;
  groupName: string;
  item?: PlanItem;
  onCreate?: (input: PlanItemInput) => Promise<void> | void;
  onUpdate?: (patch: PlanItemPatch) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onClose: () => void;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return format(new Date(iso), "yyyy-MM-dd");
}

export default function PlanItemModal({
  mode,
  groupName,
  item,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: Props) {
  const [editing, setEditing] = useState(mode === "create");
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [startsAt, setStartsAt] = useState(toDateInputValue(item?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateInputValue(item?.endsAt));
  const [color, setColor] = useState<string | null>(
    item?.color ?? (mode === "create" ? DEFAULT_PLAN_ITEM_COLOR : null),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDate = Boolean(startsAt || endsAt);
  const canSubmit = title.trim().length > 0 && !busy && (!hasDate || !!color);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (startsAt && endsAt && startsAt > endsAt) {
      setError("End date must be after the start date.");
      return;
    }
    if (hasDate && !color) {
      setError("Pick a color for the calendar bar.");
      return;
    }
    setError(null);
    setBusy(true);
    const payload: PlanItemInput = {
      title: title.trim(),
      description: description.trim() || null,
      startsAt: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : null,
      endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
      color: hasDate ? color : null,
    };
    try {
      if (mode === "create") {
        await onCreate?.(payload);
      } else {
        await onUpdate?.(payload);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Save failed (${err.status}). Check the backend logs.`);
      } else {
        setError("Save failed. Check the network tab for details.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Delete failed (${err.status}).`);
      } else {
        setError("Delete failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  const heading =
    mode === "create" ? "New item" : editing ? "Edit item" : "Item details";

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
        <h2 className="text-lg font-semibold">{heading}</h2>
        <p className="mt-1 text-xs text-muted">
          in <span className="text-ink">{groupName}</span>
        </p>

        {editing ? (
          <form onSubmit={handleSubmit}>
            <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
              Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="What needs to happen…"
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
              placeholder="Notes, details…"
              className="mt-1 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted">
                  Start
                </label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted">
                  End
                </label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {hasDate && (
              <>
                <label className="mt-4 block text-xs uppercase tracking-wide text-muted">
                  Calendar bar color
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLAN_ITEM_COLORS.map((c) => {
                    const selected = c === color;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        aria-label={`Pick color ${c}`}
                        title={c}
                        className={`h-7 w-7 rounded-full border-2 transition-transform ${
                          selected
                            ? "border-ink scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={mode === "create" ? onClose : () => setEditing(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : mode === "create" ? "Add item" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted">Title</div>
                <div className="mt-1 text-sm text-ink">{item?.title}</div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-muted">Description</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-ink">
                  {item?.description || <span className="text-muted">—</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">Start</div>
                  <div className="mt-1 text-sm text-ink">
                    {item?.startsAt
                      ? format(new Date(item.startsAt), "MMM d, yyyy")
                      : <span className="text-muted">—</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">End</div>
                  <div className="mt-1 text-sm text-ink">
                    {item?.endsAt
                      ? format(new Date(item.endsAt), "MMM d, yyyy")
                      : <span className="text-muted">—</span>}
                  </div>
                </div>
              </div>

              {item?.color && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">
                    Calendar bar color
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm tabular-nums text-ink">{item.color}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wide text-muted">Status</div>
                <div className="mt-1 text-sm text-ink">
                  {item?.done ? "Done" : "Open"}
                </div>
              </div>
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <div className="mt-6 flex items-center gap-2">
              {onDelete && (
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
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
