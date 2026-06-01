import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTags } from "../hooks/useTags";
import { useTagDetail } from "../hooks/useTagDetail";
import Sidebar from "../components/Sidebar";
import NewTagModal from "../components/NewTagModal";
import EditSessionModal from "../components/EditSessionModal";
import { AnimatePresence } from "framer-motion";
import { formatDate, formatDateTime, formatDuration } from "../lib/format";
import { api } from "../api/client";
import type { TrackingSession } from "../types";

export default function TagDetailPage() {
  const { tagId = "" } = useParams<{ tagId: string }>();
  const { tags, createTag } = useTags();
  const {
    tag,
    stats,
    sessions,
    total,
    page,
    pageSize,
    loading,
    notFound,
    setPage,
    refresh,
  } = useTagDetail(tagId);
  const [showNewTag, setShowNewTag] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editing, setEditing] = useState<TrackingSession | null>(null);

  if (notFound) return <Navigate to="/" replace />;

  const handleDelete = async (s: TrackingSession) => {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    try {
      await api.del(`/sessions/${s.id}`);
      refresh();
    } catch (err) {
      console.error("delete session failed:", err);
    }
  };

  const handleSaveDescription = async (description: string) => {
    if (!editing) return;
    try {
      await api.patch(`/sessions/${editing.id}`, { description });
      setEditing(null);
      refresh();
    } catch (err) {
      console.error("update session failed:", err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="relative flex h-full">
      <Sidebar
        tags={tags}
        onNewTag={() => {
          setShowNewTag(true);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="relative flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-border bg-panel p-2 text-ink md:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to tracker
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {tag && (
              <span
                className="h-4 w-4 flex-none rounded-full"
                style={{ background: tag.color }}
              />
            )}
            <h1 className="truncate text-2xl font-semibold sm:text-3xl">
              {tag?.name ?? (loading ? "Loading…" : "")}
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="First entry"
              value={stats?.firstSessionAt ? formatDate(stats.firstSessionAt) : "—"}
            />
            <StatCard
              label="Last entry"
              value={stats?.lastSessionAt ? formatDate(stats.lastSessionAt) : "—"}
            />
            <StatCard
              label="Total time"
              value={stats ? formatDuration(stats.totalDurationSec) : "—"}
            />
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-border bg-panel">
            <div className="hidden grid-cols-[1fr_110px_2fr_88px] gap-4 border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted sm:grid">
              <div>Date</div>
              <div>Duration</div>
              <div>Description</div>
              <div className="text-right">Actions</div>
            </div>
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                {loading ? "Loading…" : "No entries yet."}
              </div>
            ) : (
              <ul>
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-1 gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_110px_2fr_88px] sm:gap-4"
                  >
                    <div className="text-ink">{formatDateTime(s.startedAt)}</div>
                    <div className="text-muted sm:text-ink">
                      {s.durationSec != null ? formatDuration(s.durationSec) : "—"}
                    </div>
                    <div className="truncate text-muted">
                      {s.description || <span className="italic">No description</span>}
                    </div>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(s)}
                        className="rounded-md border border-border bg-panel p-2 text-muted hover:border-accent hover:text-ink"
                        aria-label="Edit entry"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="rounded-md border border-border bg-panel p-2 text-muted hover:border-red-500 hover:text-red-400"
                        aria-label="Delete entry"
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
                ))}
              </ul>
            )}
          </div>

          {total > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!canPrev}
                className="rounded-md border border-border bg-panel px-3 py-1 text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!canNext}
                className="rounded-md border border-border bg-panel px-3 py-1 text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showNewTag && (
          <NewTagModal
            onCreate={async (name, color) => {
              await createTag(name, color);
              setShowNewTag(false);
            }}
            onClose={() => setShowNewTag(false)}
          />
        )}
        {editing && (
          <EditSessionModal
            key={editing.id}
            session={editing}
            onSave={handleSaveDescription}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-panel px-4 py-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
