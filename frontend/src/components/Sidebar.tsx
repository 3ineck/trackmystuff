import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Tag } from "../types";
import { useAuth } from "../auth/AuthContext";

interface Props {
  tags: Tag[];
  onNewTag: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ tags, onNewTag, open, onClose }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-border bg-panel transition-transform duration-300 ease-out md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-end p-2 md:hidden">
        <button
          onClick={onClose}
          className="rounded-md p-2 text-muted hover:text-ink"
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onClose();
            navigate("/");
          }}
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          Track new activity
        </motion.button>
      </div>

      <div className="px-2 pb-2">
        <button
          onClick={onNewTag}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-ink transition-colors hover:bg-border"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add new tag</span>
        </button>
      </div>

      <div className="px-4 pb-2 text-xs uppercase tracking-wide text-muted">Tags</div>
      <ul className="flex-1 overflow-y-auto px-2">
        {tags.length === 0 ? (
          <li className="px-2 py-2 text-sm text-muted">No tags yet.</li>
        ) : (
          tags.map((t) => {
            const isActive = location.pathname === `/tags/${t.id}`;
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Link
                  to={`/tags/${t.id}`}
                  onClick={onClose}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-border ${
                    isActive ? "bg-border text-ink" : "text-ink"
                  }`}
                >
                  <span
                    className="h-3 w-3 flex-none rounded-full"
                    style={{ background: t.color }}
                  />
                  <span className="truncate">{t.name}</span>
                </Link>
              </motion.li>
            );
          })
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
