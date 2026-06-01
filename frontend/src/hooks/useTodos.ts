import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Todo, TodoInput, TodoPatch, TodoView } from "../types";

export function useTodos(view: TodoView) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<Todo[]>(`/todos?view=${view}`);
      setTodos(list);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    refresh().catch((err) => console.error("load todos failed:", err));
  }, [refresh]);

  const create = useCallback(async (input: TodoInput) => {
    const todo = await api.post<Todo>("/todos", input);
    await refresh();
    return todo;
  }, [refresh]);

  const update = useCallback(
    async (id: string, patch: TodoPatch) => {
      const todo = await api.patch<Todo>(`/todos/${id}`, patch);
      await refresh();
      return todo;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await api.del(`/todos/${id}`);
      await refresh();
    },
    [refresh]
  );

  return { todos, loading, refresh, create, update, remove };
}
