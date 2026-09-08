import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  endOfDay,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import type { CalendarEvent } from "@prisma/client";

type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

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
  const rec = event.recurrence as Recurrence;

  if (rec === "NONE") {
    if (isBefore(start, rangeStart) || isAfter(start, rangeEnd)) return [];
    return [start];
  }

  const step = stepFn(rec);
  const skip = jumpsToRangeStart(rec, start, rangeStart);
  const out: Date[] = [];

  let cursor = skip > 0 ? step(start, skip) : new Date(start.getTime());
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

export interface EventOccurrence {
  event: CalendarEvent;
  occurrenceStart: Date;
}

export function occurrencesOnDay(
  events: CalendarEvent[],
  day: Date,
): EventOccurrence[] {
  const from = startOfDay(day);
  const to = endOfDay(day);
  const out: EventOccurrence[] = [];
  for (const event of events) {
    for (const occurrenceStart of expandOccurrences(event, from, to)) {
      out.push({ event, occurrenceStart });
    }
  }
  out.sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime());
  return out;
}
