import { motion } from "framer-motion";
import type { Note } from "../types";

interface Props {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NoteCard({ note, onEdit, onDelete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      onClick={onEdit}
      className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-panel p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
          {note.title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex-none rounded-md border border-border bg-panel p-1.5 text-muted opacity-0 transition-opacity hover:border-red-500 hover:text-red-400 group-hover:opacity-100"
          aria-label="Delete note"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {note.content && (
        <p className="line-clamp-6 whitespace-pre-wrap text-xs text-muted">
          {note.content}
        </p>
      )}

      <div className="mt-auto pt-2 text-[11px] text-muted">
        {formatTimestamp(note.updatedAt)}
      </div>
    </motion.div>
  );
}
