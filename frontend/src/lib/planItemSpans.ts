import {
  eachDayOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import type { PlanGroup, PlanItem } from "../types";

export interface PlanItemSpan {
  item: PlanItem;
  groupName: string;
  isStart: boolean;
  isEnd: boolean;
  row: number;
}

interface ItemLayout {
  item: PlanItem;
  groupName: string;
  itemStart: Date;
  itemEnd: Date;
  days: Date[];
}

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

export function planItemSpansByDay(
  groups: PlanGroup[],
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, PlanItemSpan[]> {
  const rs = startOfDay(rangeStart);
  const re = endOfDay(rangeEnd);

  const layouts: ItemLayout[] = [];
  for (const g of groups) {
    for (const item of g.items) {
      if (item.done) continue;
      const rawStart = item.startsAt ? new Date(item.startsAt) : null;
      const rawEnd = item.endsAt ? new Date(item.endsAt) : null;
      if (!rawStart && !rawEnd) continue;

      const itemStart = startOfDay(rawStart ?? rawEnd!);
      const itemEnd = startOfDay(rawEnd ?? rawStart!);
      if (isAfter(itemStart, re) || isBefore(itemEnd, rs)) continue;

      const spanStart = isBefore(itemStart, rs) ? rs : itemStart;
      const spanEnd = isAfter(itemEnd, re) ? re : itemEnd;
      const days = eachDayOfInterval({
        start: startOfDay(spanStart),
        end: startOfDay(spanEnd),
      });
      layouts.push({ item, groupName: g.name, itemStart, itemEnd, days });
    }
  }

  // Longest first so it claims the bottom row (row 0 → rendered at the bottom
  // via flex-col-reverse in DayCell). Ties break by earlier start.
  layouts.sort(
    (a, b) =>
      b.days.length - a.days.length ||
      a.itemStart.getTime() - b.itemStart.getTime(),
  );

  const usedRowsByDay = new Map<string, Set<number>>();
  const map = new Map<string, PlanItemSpan[]>();
  for (const l of layouts) {
    let row = 0;
    while (l.days.some((d) => usedRowsByDay.get(dayKey(d))?.has(row))) {
      row++;
    }
    for (const d of l.days) {
      const key = dayKey(d);
      const rows = usedRowsByDay.get(key) ?? new Set<number>();
      rows.add(row);
      usedRowsByDay.set(key, rows);

      const list = map.get(key) ?? [];
      list.push({
        item: l.item,
        groupName: l.groupName,
        isStart: d.getTime() === l.itemStart.getTime(),
        isEnd: d.getTime() === l.itemEnd.getTime(),
        row,
      });
      map.set(key, list);
    }
  }

  for (const list of map.values()) {
    list.sort((a, b) => a.row - b.row);
  }
  return map;
}
