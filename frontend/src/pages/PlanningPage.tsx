import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import NewTagModal from "../components/NewTagModal";
import GroupCard from "../components/planning/GroupCard";
import { useTags } from "../hooks/useTags";
import { usePlanGroups } from "../hooks/usePlanGroups";

export default function PlanningPage() {
  const { tags, createTag } = useTags();
  const {
    groups,
    loading,
    createGroup,
    renameGroup,
    deleteGroup,
    createItem,
    renameItem,
    toggleItem,
    deleteItem,
  } = usePlanGroups();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    const name = newGroup.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await createGroup(name);
      setNewGroup("");
    } finally {
      setBusy(false);
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto w-full max-w-6xl"
        >
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
            <h1 className="flex-1 text-2xl font-semibold sm:text-3xl">Planning</h1>
          </div>

          <form onSubmit={handleCreateGroup} className="mt-4 flex gap-2">
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              maxLength={100}
              placeholder="New group name…"
              className="flex-1 rounded-lg border border-border bg-panel px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newGroup.trim() || busy}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              + New group
            </button>
          </form>

          {loading ? (
            <p className="mt-8 text-center text-sm text-muted">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted">
              No groups yet. Create your first one above.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {groups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    onRenameGroup={renameGroup}
                    onDeleteGroup={deleteGroup}
                    onCreateItem={createItem}
                    onRenameItem={renameItem}
                    onToggleItem={toggleItem}
                    onDeleteItem={deleteItem}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {showNewTag && (
          <NewTagModal
            onClose={() => setShowNewTag(false)}
            onCreate={async (name, color) => {
              await createTag(name, color);
              setShowNewTag(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
