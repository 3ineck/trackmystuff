import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTags } from "../hooks/useTags";
import { useTagDetail } from "../hooks/useTagDetail";
import Sidebar from "../components/Sidebar";
import NewTagModal from "../components/NewTagModal";
import { AnimatePresence } from "framer-motion";
import { formatDate, formatDateTime, formatDuration } from "../lib/format";

export default function TagDetailPage() {
  const { tagId = "" } = useParams<{ tagId: string }>();
  const { tags, createTag } = useTags();
  const { tag, stats, sessions, total, page, pageSize, loading, notFound, setPage } =
    useTagDetail(tagId);
  const [showNewTag, setShowNewTag] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (notFound) return <Navigate to="/" replace />;

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
            <div className="hidden grid-cols-[1fr_120px_2fr] gap-4 border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted sm:grid">
              <div>Date</div>
              <div>Duration</div>
              <div>Description</div>
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
                    className="grid grid-cols-1 gap-1 border-b border-border px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_120px_2fr] sm:gap-4"
                  >
                    <div className="text-ink">{formatDateTime(s.startedAt)}</div>
                    <div className="text-muted sm:text-ink">
                      {s.durationSec != null ? formatDuration(s.durationSec) : "—"}
                    </div>
                    <div className="truncate text-muted">
                      {s.description || <span className="italic">No description</span>}
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
