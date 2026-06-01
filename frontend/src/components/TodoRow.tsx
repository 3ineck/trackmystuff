import type { Todo } from "../types";
import { formatDueDate, isOverdue } from "../lib/format";

interface Props {
  todo: Todo;
  showStar: boolean;
  onToggleArchived: () => void;
  onToggleFavorited: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TodoRow({
  todo,
  showStar,
  onToggleArchived,
  onToggleFavorited,
  onEdit,
  onDelete,
}: Props) {
  const archived = todo.archivedAt !== null;
  const overdue = todo.dueAt ? !archived && isOverdue(todo.dueAt, todo.dueHasTime) : false;

  return (
    <li className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <button
        onClick={onToggleArchived}
        className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border ${
          archived ? "border-accent bg-accent" : "border-border bg-bg hover:border-accent"
        }`}
        aria-label={archived ? "Mark as not done" : "Mark as done"}
      >
        {archived && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium ${archived ? "text-muted line-through" : "text-ink"}`}>
          {todo.title}
        </div>
        {todo.description && (
          <div className="mt-0.5 truncate text-xs text-muted">{todo.description}</div>
        )}
        {todo.dueAt && (
          <div
            className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs ${
              overdue
                ? "bg-red-500/10 text-red-400"
                : "bg-border/50 text-muted"
            }`}
          >
            {formatDueDate(todo.dueAt, todo.dueHasTime)}
          </div>
        )}
      </div>

      <div className="flex flex-none gap-1">
        {showStar && (
          <button
            onClick={onToggleFavorited}
            className={`rounded-md border border-border bg-panel p-2 hover:border-accent ${
              todo.favorited ? "text-yellow-400" : "text-muted hover:text-ink"
            }`}
            aria-label={todo.favorited ? "Unfavorite" : "Favorite"}
            title={todo.favorited ? "Unfavorite" : "Favorite"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={todo.favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )}
        <button
          onClick={onEdit}
          className="rounded-md border border-border bg-panel p-2 text-muted hover:border-accent hover:text-ink"
          aria-label="Edit todo"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="rounded-md border border-border bg-panel p-2 text-muted hover:border-red-500 hover:text-red-400"
          aria-label="Delete todo"
          title="Delete"
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
    </li>
  );
}
