import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  format,
  isAfter,
  isBefore,
} from "date-fns";
import type { CalendarEvent, Recurrence } from "../types";

const MAX_OCCURRENCES = 500;

function stepFn(rec: Recurrence): (d: Date, n: number) => Date {
  switch (rec) {
    case "DAILY":
      return addDays;
    case "WEEKLY":
      return addWeeks;
    case "MONTHLY":
      return addMonths;
    case "YEARLY":
      return addYears;
    default:
      return (d) => d;
  }
}

function jumpsToRangeStart(rec: Recurrence, from: Date, to: Date): number {
  switch (rec) {
    case "DAILY":
      return Math.max(0, differenceInCalendarDays(to, from));
    case "WEEKLY":
      return Math.max(0, differenceInCalendarWeeks(to, from));
    case "MONTHLY":
      return Math.max(0, differenceInCalendarMonths(to, from));
    case "YEARLY":
      return Math.max(0, differenceInCalendarYears(to, from));
    default:
      return 0;
  }
}

export function expandOccurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const start = new Date(event.startsAt);
  const seriesEnd = event.recurrenceEndsAt ? new Date(event.recurrenceEndsAt) : null;

  if (event.recurrence === "NONE") {
    if (isBefore(start, rangeStart) || isAfter(start, rangeEnd)) return [];
    return [start];
  }

  const step = stepFn(event.recurrence);
  const skip = jumpsToRangeStart(event.recurrence, start, rangeStart);
  const out: Date[] = [];

  let cursor = skip > 0 ? step(start, skip) : new Date(start.getTime());
  // The jump lands "at or before" range start when using calendar-* diffs; nudge back one step if we overshot.
  while (isAfter(cursor, rangeStart) && !isBefore(step(cursor, -1), start)) {
    cursor = step(cursor, -1);
  }

  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    if (isAfter(cursor, rangeEnd)) break;
    if (seriesEnd && isAfter(cursor, seriesEnd)) break;
    if (!isBefore(cursor, rangeStart) && !isBefore(cursor, start)) {
      out.push(new Date(cursor.getTime()));
    }
    cursor = step(cursor, 1);
  }

  return out;
}

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

export interface OccurrenceEntry {
  event: CalendarEvent;
  occurrenceStart: Date;
}

export function occurrencesByDay(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, OccurrenceEntry[]> {
  const map = new Map<string, OccurrenceEntry[]>();
  for (const event of events) {
    const occurrences = expandOccurrences(event, rangeStart, rangeEnd);
    for (const occurrenceStart of occurrences) {
      const key = dayKey(occurrenceStart);
      const list = map.get(key) ?? [];
      list.push({ event, occurrenceStart });
      map.set(key, list);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime());
  }
  return map;
}

export { dayKey };
