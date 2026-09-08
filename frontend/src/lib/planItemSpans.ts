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
}

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

export function planItemSpansByDay(
  groups: PlanGroup[],
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, PlanItemSpan[]> {
  const map = new Map<string, PlanItemSpan[]>();
  const rs = startOfDay(rangeStart);
  const re = endOfDay(rangeEnd);

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

      for (const d of days) {
        const key = dayKey(d);
        const list = map.get(key) ?? [];
        list.push({
          item,
          groupName: g.name,
          isStart: d.getTime() === itemStart.getTime(),
          isEnd: d.getTime() === itemEnd.getTime(),
        });
        map.set(key, list);
      }
    }
  }

  for (const list of map.values()) {
    list.sort((a, b) => a.item.id.localeCompare(b.item.id));
  }
  return map;
}
