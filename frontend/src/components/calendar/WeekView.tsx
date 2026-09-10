import { useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import type { CalendarEvent, Todo } from "../../types";
import { dayKey, occurrencesByDay } from "../../lib/eventOccurrences";
import { todosByDay } from "../../lib/todoOccurrences";

interface Props {
  cursor: Date;
  events: CalendarEvent[];
  todos: Todo[];
  onSlotClick: (dateAtHour: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT_PX = 48;
const DAY_HEIGHT_PX = HOUR_HEIGHT_PX * 24;
const TODO_BLOCK_MINUTES = 30;

export default function WeekView({
  cursor,
  events,
  todos,
  onSlotClick,
  onEventClick,
}: Props) {
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const byDay = useMemo(
    () => occurrencesByDay(events, weekStart, weekEnd),
    [events, weekStart.getTime(), weekEnd.getTime()],
  );
  const todosByDayMap = useMemo(
    () => todosByDay(todos, weekStart, weekEnd),
    [todos, weekStart.getTime(), weekEnd.getTime()],
  );

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const todayIndex = days.findIndex((d) => isSameDay(d, now));
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-border bg-panel sm:grid-cols-[56px_repeat(7,minmax(0,1fr))]">
        <div />
        {days.map((day) => {
          const today = isToday(day);
          const dayTodos = todosByDayMap.get(dayKey(day)) ?? [];
          const allDayTodos = dayTodos.filter((t) => !t.dueHasTime);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center gap-1 border-l border-border px-1 py-2"
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted sm:text-xs">
                {format(day, "EEE")}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  today ? "bg-accent font-semibold text-white" : "text-ink"
                }`}
              >
                {day.getDate()}
              </span>
              {allDayTodos.length > 0 && (
                <ul className="mt-1 flex w-full flex-col gap-0.5">
                  {allDayTodos.slice(0, 2).map((todo) => (
                    <li
                      key={todo.id}
                      onClick={(e) => e.stopPropagation()}
                      className="truncate rounded bg-blue-500/20 px-1 py-0.5 text-left text-[10px] text-ink"
                      title={todo.title}
                    >
                      {todo.title}
                    </li>
                  ))}
                  {allDayTodos.length > 2 && (
                    <li className="text-[10px] text-muted">
                      +{allDayTodos.length - 2} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[48px_repeat(7,minmax(0,1fr))] sm:min-w-0 sm:grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          <div className="bg-panel">
            {HOURS.map((h) => (
              <div
                key={h}
                className="relative h-12 border-b border-border pr-1 text-right text-[10px] text-muted sm:text-xs"
              >
                <span className="absolute right-1 -top-1.5 bg-panel px-1">
                  {h === 0 ? "" : `${h.toString().padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>

          {days.map((day, colIdx) => {
            const isTodayCol = todayIndex === colIdx;
            const entries = byDay.get(dayKey(day)) ?? [];
            const dayTodos = todosByDayMap.get(dayKey(day)) ?? [];
            const timedTodos = dayTodos.filter((t) => t.dueHasTime && t.dueAt);
            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-border"
                style={{ height: `${DAY_HEIGHT_PX}px` }}
              >
                {HOURS.map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(h, 0, 0, 0);
                      onSlotClick(d);
                    }}
                    className="block h-12 w-full border-b border-border hover:bg-border/40"
                  />
                ))}

                {entries.map(({ event, occurrenceStart }) => {
                  const startMin =
                    occurrenceStart.getHours() * 60 + occurrenceStart.getMinutes();
                  const top = (startMin / 1440) * DAY_HEIGHT_PX;
                  const height = Math.max(
                    18,
                    (event.durationMinutes / 1440) * DAY_HEIGHT_PX,
                  );
                  return (
                    <button
                      type="button"
                      key={`e-${event.id}-${occurrenceStart.getTime()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`absolute left-1 right-1 z-10 flex flex-col items-start overflow-hidden rounded border px-1 py-0.5 text-left text-[11px] ${
                        event.completed
                          ? "border-accent/40 bg-accent/10 text-muted line-through opacity-70 hover:bg-accent/20"
                          : "border-accent bg-accent/25 text-ink hover:bg-accent/40"
                      }`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={event.title}
                    >
                      <span className="truncate font-medium">{event.title}</span>
                      <span className="text-[10px] text-muted">
                        {format(occurrenceStart, "HH:mm")}
                      </span>
                    </button>
                  );
                })}

                {timedTodos.map((todo) => {
                  const due = new Date(todo.dueAt!);
                  const startMin = due.getHours() * 60 + due.getMinutes();
                  const top = (startMin / 1440) * DAY_HEIGHT_PX;
                  const height =
                    (TODO_BLOCK_MINUTES / 1440) * DAY_HEIGHT_PX;
                  return (
                    <div
                      key={`t-${todo.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-1 right-1 z-10 flex flex-col items-start overflow-hidden rounded border border-blue-500 bg-blue-500/25 px-1 py-0.5 text-left text-[11px] text-ink"
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={todo.title}
                    >
                      <span className="truncate font-medium">{todo.title}</span>
                      <span className="text-[10px] text-muted">
                        {format(due, "HH:mm")}
                      </span>
                    </div>
                  );
                })}

                {isTodayCol && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                    style={{ top: `${nowTop}%` }}
                  >
                    <span className="h-2 w-2 -translate-x-1 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
