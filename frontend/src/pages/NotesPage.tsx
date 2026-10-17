import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import NewTagModal from "../components/NewTagModal";
import NoteCard from "../components/NoteCard";
import NoteModal from "../components/NoteModal";
import { useTags } from "../hooks/useTags";
import { useNotes } from "../hooks/useNotes";
import type { Note } from "../types";

export default function NotesPage() {
  const { tags, createTag } = useTags();
  const { notes, loading, create, update, remove } = useNotes();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      await create({
        title: title.trim(),
        content: content.trim() || null,
      });
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("create note failed:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(n: Note) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    try {
      await remove(n.id);
    } catch (err) {
      console.error("delete note failed:", err);
    }
  }

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
        <div className="mx-auto w-full max-w-5xl">
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
            <h1 className="flex-1 text-2xl font-semibold sm:text-3xl">Notes</h1>
          </div>

          <form
            onSubmit={handleCreate}
            className="mt-6 rounded-xl border border-border bg-panel p-4"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Note title…"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium focus:border-accent focus:outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={10000}
              rows={3}
              placeholder="Write something…"
              className="mt-2 w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={!title.trim() || creating}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? "Adding…" : "Add note"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            {notes.length === 0 ? (
              <div className="rounded-xl border border-border bg-panel px-4 py-8 text-center text-sm text-muted">
                {loading ? "Loading…" : "No notes yet."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {notes.map((n) => (
                    <NoteCard
                      key={n.id}
                      note={n}
                      onEdit={() => setEditing(n)}
                      onDelete={() => handleDelete(n)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
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
          <NoteModal
            key={editing.id}
            initial={editing}
            onSave={async (input) => {
              await update(editing.id, input);
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
