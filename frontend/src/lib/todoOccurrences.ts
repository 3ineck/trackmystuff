import { isAfter, isBefore } from "date-fns";
import type { Todo } from "../types";
import { dayKey } from "./eventOccurrences";

export function todosByDay(
  todos: Todo[],
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  for (const todo of todos) {
    if (!todo.dueAt) continue;
    const due = new Date(todo.dueAt);
    if (isBefore(due, rangeStart) || isAfter(due, rangeEnd)) continue;
    const key = dayKey(due);
    const list = map.get(key) ?? [];
    list.push(todo);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const at = a.dueAt ? new Date(a.dueAt).getTime() : 0;
      const bt = b.dueAt ? new Date(b.dueAt).getTime() : 0;
      return at - bt;
    });
  }
  return map;
}
