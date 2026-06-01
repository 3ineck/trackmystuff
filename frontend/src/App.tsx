import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import TrackerPage from "./pages/TrackerPage";
import TagDetailPage from "./pages/TagDetailPage";
import TodosPage from "./pages/TodosPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted">Loading…</div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={user ? <TrackerPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tags/:tagId"
        element={user ? <TagDetailPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/todos"
        element={user ? <Navigate to="/todos/current" replace /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/todos/:view"
        element={user ? <TodosPage /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
