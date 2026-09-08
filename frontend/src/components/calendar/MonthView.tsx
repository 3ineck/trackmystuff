import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import DayCell from "./DayCell";
import type { CalendarEvent, PlanGroup, Todo } from "../../types";
import { dayKey, occurrencesByDay } from "../../lib/eventOccurrences";
import { todosByDay } from "../../lib/todoOccurrences";
import { planItemSpansByDay } from "../../lib/planItemSpans";

interface Props {
  cursor: Date;
  events: CalendarEvent[];
  todos: Todo[];
  planGroups: PlanGroup[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const WEEKDAY_LONG = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function MonthView({
  cursor,
  events,
  todos,
  planGroups,
  onDayClick,
  onEventClick,
}: Props) {
  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDay = useMemo(
    () => occurrencesByDay(events, gridStart, gridEnd),
    [events, gridStart.getTime(), gridEnd.getTime()],
  );
  const todosByDayMap = useMemo(
    () => todosByDay(todos, gridStart, gridEnd),
    [todos, gridStart.getTime(), gridEnd.getTime()],
  );
  const planSpansByDay = useMemo(
    () => planItemSpansByDay(planGroups, gridStart, gridEnd),
    [planGroups, gridStart.getTime(), gridEnd.getTime()],
  );

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-panel">
        {WEEKDAY_LONG.map((label, i) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{WEEKDAY_SHORT[i]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            cursor={cursor}
            entries={byDay.get(dayKey(day)) ?? []}
            todos={todosByDayMap.get(dayKey(day)) ?? []}
            planSpans={planSpansByDay.get(dayKey(day)) ?? []}
            onClick={() => onDayClick(day)}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
}
