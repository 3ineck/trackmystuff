import { motion } from "framer-motion";
import type { Tag } from "../types";
import { useAuth } from "../auth/AuthContext";

interface Props {
  tags: Tag[];
  onNewTag: () => void;
}

export default function Sidebar({ tags, onNewTag }: Props) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-panel">
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewTag}
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          + Track new activity
        </motion.button>
      </div>

      <div className="px-4 pb-2 text-xs uppercase tracking-wide text-muted">Tags</div>
      <ul className="flex-1 overflow-y-auto px-2">
        {tags.length === 0 ? (
          <li className="px-2 py-2 text-sm text-muted">No tags yet.</li>
        ) : (
          tags.map((t) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm"
            >
              <span
                className="h-3 w-3 flex-none rounded-full"
                style={{ background: t.color }}
              />
              <span className="truncate">{t.name}</span>
            </motion.li>
          ))
        )}
      </ul>

      <div className="mt-auto flex items-center gap-3 border-t border-border px-4 py-4">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-border" />
        )}
        <div className="min-w-0 flex-1 truncate text-sm">{user?.username}</div>
        <button
          onClick={handleLogout}
          className="text-xs text-muted hover:text-ink"
          title="Log out"
        >
          ↪
        </button>
      </div>
    </aside>
  );
}
