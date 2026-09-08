import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { PlanGroup, PlanItem, PlanItemInput, PlanItemPatch } from "../types";

export function usePlanGroups() {
  const [groups, setGroups] = useState<PlanGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<PlanGroup[]>("/plan-groups");
      setGroups(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((err) => console.error("load plan groups failed:", err));
  }, [refresh]);

  const createGroup = useCallback(
    async (name: string) => {
      await api.post<PlanGroup>("/plan-groups", { name });
      await refresh();
    },
    [refresh],
  );

  const renameGroup = useCallback(
    async (id: string, name: string) => {
      await api.patch<PlanGroup>(`/plan-groups/${id}`, { name });
      await refresh();
    },
    [refresh],
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      await api.del(`/plan-groups/${id}`);
      await refresh();
    },
    [refresh],
  );

  const createItem = useCallback(
    async (groupId: string, input: PlanItemInput) => {
      await api.post<PlanItem>("/plan-items", { groupId, ...input });
      await refresh();
    },
    [refresh],
  );

  const updateItem = useCallback(
    async (id: string, patch: PlanItemPatch) => {
      await api.patch<PlanItem>(`/plan-items/${id}`, patch);
      await refresh();
    },
    [refresh],
  );

  const renameItem = useCallback(
    (id: string, title: string) => updateItem(id, { title }),
    [updateItem],
  );

  const toggleItem = useCallback(
    (id: string, done: boolean) => updateItem(id, { done }),
    [updateItem],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await api.del(`/plan-items/${id}`);
      await refresh();
    },
    [refresh],
  );

  return {
    groups,
    loading,
    refresh,
    createGroup,
    renameGroup,
    deleteGroup,
    createItem,
    updateItem,
    renameItem,
    toggleItem,
    deleteItem,
  };
}
