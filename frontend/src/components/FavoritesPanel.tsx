import { Link } from "react-router-dom";
import { useTodos } from "../hooks/useTodos";
import { formatDueDate, isOverdue } from "../lib/format";

export default function FavoritesPanel() {
  const { todos, update } = useTodos("favorited");

  if (todos.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Favorites
        </div>
        <Link to="/todos/favorited" className="text-xs text-muted hover:text-ink">
          View all →
        </Link>
      </div>
      <ul>
        {todos.map((t) => (
          <li
            key={t.id}
            className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <button
              onClick={() =>
                update(t.id, { archived: true }).catch((err) =>
                  console.error("archive failed:", err)
                )
              }
              className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border border-border bg-bg hover:border-accent"
              aria-label="Mark as done"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-ink">{t.title}</div>
              {t.dueAt && (
                <div
                  className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs ${
                    isOverdue(t.dueAt, t.dueHasTime)
                      ? "bg-red-500/10 text-red-400"
                      : "bg-border/50 text-muted"
                  }`}
                >
                  {formatDueDate(t.dueAt, t.dueHasTime)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
