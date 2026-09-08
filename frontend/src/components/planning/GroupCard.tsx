import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type {
  PlanGroup,
  PlanItem,
  PlanItemInput,
  PlanItemPatch,
} from "../../types";
import PlanItemModal from "./PlanItemModal";

interface Props {
  group: PlanGroup;
  onRenameGroup: (id: string, name: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onCreateItem: (groupId: string, input: PlanItemInput) => Promise<void>;
  onUpdateItem: (id: string, patch: PlanItemPatch) => Promise<void>;
  onToggleItem: (id: string, done: boolean) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export default function GroupCard({
  group,
  onRenameGroup,
  onDeleteGroup,
  onCreateItem,
  onUpdateItem,
  onToggleItem,
  onDeleteItem,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [busy, setBusy] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);

  const viewingItem = viewingItemId
    ? group.items.find((it) => it.id === viewingItemId) ?? null
    : null;

  async function saveName() {
    const next = nameDraft.trim();
    if (!next || next === group.name) {
      setEditingName(false);
      setNameDraft(group.name);
      return;
    }
    setBusy(true);
    try {
      await onRenameGroup(group.id, next);
      setEditingName(false);
    } finally {
      setBusy(false);
    }
  }

  function cancelName() {
    setNameDraft(group.name);
    setEditingName(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this group and all its items? This cannot be undone.")) return;
    setBusy(true);
    try {
      await onDeleteGroup(group.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateItem(input: PlanItemInput) {
    setBusy(true);
    try {
      await onCreateItem(group.id, input);
      setShowNewItem(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateItem(patch: PlanItemPatch) {
    if (!viewingItem) return;
    await onUpdateItem(viewingItem.id, patch);
    setViewingItemId(null);
  }

  async function handleDeleteItem() {
    if (!viewingItem) return;
    await onDeleteItem(viewingItem.id);
    setViewingItemId(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col rounded-xl border border-border bg-panel p-4"
    >
      <div className="flex items-start gap-2">
        {editingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
            className="flex flex-1 items-center gap-2"
          >
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelName();
              }}
              maxLength={100}
              className="flex-1 rounded-md border border-border bg-bg px-2 py-1 text-lg font-semibold focus:border-accent focus:outline-none"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNameDraft(group.name);
              setEditingName(true);
            }}
            className="flex-1 truncate text-left text-lg font-semibold text-ink hover:text-accent"
            title="Click to rename"
          >
            {group.name}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowNewItem(true)}
          disabled={busy}
          className="flex-none rounded-md p-1.5 text-muted hover:bg-accent/10 hover:text-accent disabled:opacity-50"
          aria-label="Add item"
          title="Add item"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="flex-none rounded-md p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          aria-label="Delete group"
          title="Delete group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {group.items.length === 0 ? (
          <li className="rounded-md px-2 py-1 text-sm text-muted">No items yet.</li>
        ) : (
          group.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              onOpen={() => setViewingItemId(item.id)}
            />
          ))
        )}
      </ul>

      <AnimatePresence>
        {showNewItem && (
          <PlanItemModal
            mode="create"
            groupName={group.name}
            onCreate={handleCreateItem}
            onClose={() => setShowNewItem(false)}
          />
        )}
        {viewingItem && (
          <PlanItemModal
            mode="view"
            groupName={group.name}
            item={viewingItem}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onClose={() => setViewingItemId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ItemRowProps {
  item: PlanItem;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onOpen: () => void;
}

function ItemRow({ item, onToggle, onOpen }: ItemRowProps) {
  const dateRange = formatRange(item.startsAt, item.endsAt);
  const tint = item.color ? hexToRgba(item.color, 0.18) : null;

  return (
    <li
      className={`group flex items-start gap-2 rounded-md border-l-2 px-2 py-1 transition-colors ${
        tint ? "" : "border-transparent hover:bg-border/40"
      }`}
      style={
        tint
          ? { backgroundColor: tint, borderLeftColor: item.color ?? undefined }
          : undefined
      }
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1 h-4 w-4 accent-accent"
        aria-label={item.done ? "Mark as not done" : "Mark as done"}
      />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
        title="View details"
      >
        <div
          className={`block w-full truncate text-sm ${
            item.done ? "text-muted line-through" : "text-ink"
          }`}
        >
          {item.title}
        </div>
        {(dateRange || item.description) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
            {dateRange && (
              <span className="tabular-nums text-accent/80">{dateRange}</span>
            )}
            {item.description && (
              <span className="truncate">{item.description}</span>
            )}
          </div>
        )}
      </button>
    </li>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatRange(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt && !endsAt) return null;
  const start = startsAt ? format(new Date(startsAt), "MMM d") : null;
  const end = endsAt ? format(new Date(endsAt), "MMM d") : null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `from ${start}`;
  return `until ${end}`;
}
