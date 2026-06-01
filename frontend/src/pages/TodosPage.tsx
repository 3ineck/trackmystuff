import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import NewTagModal from "../components/NewTagModal";
import TodoRow from "../components/TodoRow";
import TodoModal from "../components/TodoModal";
import { useTags } from "../hooks/useTags";
import { useTodos } from "../hooks/useTodos";
import type { Todo, TodoView } from "../types";

const VIEW_TITLES: Record<TodoView, string> = {
  current: "Current",
  archived: "Archived",
  favorited: "Favorited",
};

const EMPTY_LABEL: Record<TodoView, string> = {
  current: "No todos yet.",
  archived: "Nothing archived.",
  favorited: "No favorites yet.",
};

function isView(v: string | undefined): v is TodoView {
  return v === "current" || v === "archived" || v === "favorited";
}

export default function TodosPage() {
  const { view: viewParam } = useParams<{ view: string }>();
  if (!isView(viewParam)) return <Navigate to="/todos/current" replace />;
  const view: TodoView = viewParam;

  const { tags, createTag } = useTags();
  const { todos, loading, create, update, remove } = useTodos(view);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);

  const handleDelete = async (t: Todo) => {
    if (!window.confirm("Delete this todo? This cannot be undone.")) return;
    try {
      await remove(t.id);
    } catch (err) {
      console.error("delete todo failed:", err);
    }
  };

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
        <div className="mx-auto w-full max-w-2xl">
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
            <h1 className="flex-1 text-2xl font-semibold sm:text-3xl">
              Todos <span className="text-muted">· {VIEW_TITLES[view]}</span>
            </h1>
            {view === "current" && (
              <button
                onClick={() => setShowNew(true)}
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                + New todo
              </button>
            )}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-panel">
            {todos.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                {loading ? "Loading…" : EMPTY_LABEL[view]}
              </div>
            ) : (
              <ul>
                {todos.map((t) => (
                  <TodoRow
                    key={t.id}
                    todo={t}
                    showStar={view !== "archived"}
                    onToggleArchived={() =>
                      update(t.id, { archived: t.archivedAt === null }).catch((err) =>
                        console.error("toggle archived failed:", err)
                      )
                    }
                    onToggleFavorited={() =>
                      update(t.id, { favorited: !t.favorited }).catch((err) =>
                        console.error("toggle favorited failed:", err)
                      )
                    }
                    onEdit={() => setEditing(t)}
                    onDelete={() => handleDelete(t)}
                  />
                ))}
              </ul>
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
        {showNew && (
          <TodoModal
            mode="create"
            onSave={async (input) => {
              await create(input);
              setShowNew(false);
            }}
            onClose={() => setShowNew(false)}
          />
        )}
        {editing && (
          <TodoModal
            key={editing.id}
            mode="edit"
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
