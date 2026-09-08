import { useState } from "react";
import { motion } from "framer-motion";
import type { PlanGroup, PlanItem } from "../../types";

interface Props {
  group: PlanGroup;
  onRenameGroup: (id: string, name: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onCreateItem: (groupId: string, title: string) => Promise<void>;
  onRenameItem: (id: string, title: string) => Promise<void>;
  onToggleItem: (id: string, done: boolean) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export default function GroupCard({
  group,
  onRenameGroup,
  onDeleteGroup,
  onCreateItem,
  onRenameItem,
  onToggleItem,
  onDeleteItem,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [newItem, setNewItem] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const title = newItem.trim();
    if (!title || busy) return;
    setBusy(true);
    try {
      await onCreateItem(group.id, title);
      setNewItem("");
    } finally {
      setBusy(false);
    }
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
              onRename={onRenameItem}
              onToggle={onToggleItem}
              onDelete={onDeleteItem}
            />
          ))
        )}
      </ul>

      <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          maxLength={200}
          placeholder="Add item…"
          className="flex-1 rounded-md border border-border bg-bg px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newItem.trim() || busy}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </motion.div>
  );
}

interface ItemRowProps {
  item: PlanItem;
  onRename: (id: string, title: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ItemRow({ item, onRename, onToggle, onDelete }: ItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const [busy, setBusy] = useState(false);

  async function save() {
    const next = draft.trim();
    if (!next || next === item.title) {
      setDraft(item.title);
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onRename(item.id, next);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setDraft(item.title);
    setEditing(false);
  }

  return (
    <li className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-border/40">
      <input
        type="checkbox"
        checked={item.done}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="h-4 w-4 accent-accent"
        aria-label={item.done ? "Mark as not done" : "Mark as done"}
      />
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex-1"
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
            }}
            maxLength={200}
            className="w-full rounded border border-border bg-bg px-2 py-0.5 text-sm focus:border-accent focus:outline-none"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(item.title);
            setEditing(true);
          }}
          className={`flex-1 truncate text-left text-sm ${
            item.done ? "text-muted line-through" : "text-ink"
          }`}
          title="Click to rename"
        >
          {item.title}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        disabled={busy}
        className="flex-none rounded p-1 text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
        aria-label="Delete item"
        title="Delete item"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="6" y1="18" x2="18" y2="6" />
        </svg>
      </button>
    </li>
  );
}
