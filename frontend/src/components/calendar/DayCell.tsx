import { format, isSameMonth, isToday } from "date-fns";
import type { CalendarEvent, Todo } from "../../types";
import type { OccurrenceEntry } from "../../lib/eventOccurrences";
import type { PlanItemSpan } from "../../lib/planItemSpans";

interface Props {
  day: Date;
  cursor: Date;
  entries?: OccurrenceEntry[];
  todos?: Todo[];
  planSpans?: PlanItemSpan[];
  onClick?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const MAX_ITEMS = 3;
const MAX_PLAN_BARS = 3;

export default function DayCell({
  day,
  cursor,
  entries = [],
  todos = [],
  planSpans = [],
  onClick,
  onEventClick,
}: Props) {
  const inMonth = isSameMonth(day, cursor);
  const today = isToday(day);

  const totalItems = entries.length + todos.length;
  const visibleEntries = entries.slice(0, MAX_ITEMS);
  const remainingSlots = Math.max(0, MAX_ITEMS - visibleEntries.length);
  const visibleTodos = todos.slice(0, remainingSlots);
  const overflow = totalItems - visibleEntries.length - visibleTodos.length;

  const visibleSpans = planSpans.slice(0, MAX_PLAN_BARS);
  const extraSpans = planSpans.length - visibleSpans.length;

  return (
    <div
      onClick={onClick}
      className={`group relative flex min-h-[80px] cursor-pointer flex-col p-1.5 pb-3 transition-colors sm:min-h-[110px] sm:p-2 sm:pb-3.5 ${
        inMonth ? "bg-panel hover:bg-border/60" : "bg-bg hover:bg-border/40"
      }`}
    >
      <div className="flex items-start justify-end">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs sm:text-sm ${
            today
              ? "bg-accent font-semibold text-white"
              : inMonth
                ? "text-ink"
                : "text-muted"
          }`}
        >
          {day.getDate()}
        </span>
      </div>
      {(visibleEntries.length > 0 || visibleTodos.length > 0) && (
        <ul className="mt-1 flex flex-col gap-0.5">
          {visibleEntries.map(({ event, occurrenceStart }) => (
            <li key={`e-${event.id}-${occurrenceStart.getTime()}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
                className="flex w-full items-center gap-1 truncate rounded bg-accent/20 px-1 py-0.5 text-left text-[11px] text-ink hover:bg-accent/30 sm:text-xs"
                title={event.title}
              >
                <span className="hidden text-[10px] font-medium text-accent sm:inline">
                  {format(occurrenceStart, "HH:mm")}
                </span>
                <span className="truncate">{event.title}</span>
              </button>
            </li>
          ))}
          {visibleTodos.map((todo) => (
            <li key={`t-${todo.id}`}>
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex w-full items-center gap-1 truncate rounded bg-blue-500/20 px-1 py-0.5 text-left text-[11px] text-ink sm:text-xs"
                title={todo.title}
              >
                {todo.dueHasTime && todo.dueAt && (
                  <span className="hidden text-[10px] font-medium text-blue-300 sm:inline">
                    {format(new Date(todo.dueAt), "HH:mm")}
                  </span>
                )}
                <svg
                  className="h-3 w-3 flex-none text-blue-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 11 12 14 20 6" />
                  <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" />
                </svg>
                <span className="truncate">{todo.title}</span>
              </div>
            </li>
          ))}
          {overflow > 0 && (
            <li className="px-1 text-[10px] text-muted">+{overflow} more</li>
          )}
        </ul>
      )}
      {visibleSpans.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0.5 flex flex-col gap-0.5">
          {visibleSpans.map(({ item, groupName, isStart, isEnd }) => (
            <div
              key={`span-${item.id}`}
              title={`${item.title} · ${groupName}`}
              className={`pointer-events-auto -mx-px h-1.5 opacity-80 ${
                isStart ? "ml-1 rounded-l-full" : ""
              } ${isEnd ? "mr-1 rounded-r-full" : ""}`}
              style={{ backgroundColor: item.color ?? "#8b5cf6" }}
            />
          ))}
          {extraSpans > 0 && (
            <div className="px-1 text-right text-[9px] leading-none text-muted">
              +{extraSpans}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
