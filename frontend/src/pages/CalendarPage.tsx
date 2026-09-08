import { useState } from "react";
import { motion } from "framer-motion";
import { addMonths, addWeeks, format, subMonths, subWeeks } from "date-fns";
import Sidebar from "../components/Sidebar";
import NewTagModal from "../components/NewTagModal";
import CalendarHeader, {
  type CalendarView,
} from "../components/calendar/CalendarHeader";
import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import EventModal from "../components/calendar/EventModal";
import { useTags } from "../hooks/useTags";
import { useEvents } from "../hooks/useEvents";
import { useTodos } from "../hooks/useTodos";
import { usePlanGroups } from "../hooks/usePlanGroups";
import type { CalendarEvent, CalendarEventInput } from "../types";

type ModalState =
  | { mode: "create"; prefill: { date: Date; time?: string } }
  | { mode: "edit"; event: CalendarEvent }
  | null;

export default function CalendarPage() {
  const { tags, createTag } = useTags();
  const { events, create, update, remove } = useEvents();
  const { todos } = useTodos("current");
  const { groups: planGroups } = usePlanGroups();
  const datedTodos = todos.filter((t) => t.dueAt !== null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [modal, setModal] = useState<ModalState>(null);

  const handlePrev = () => {
    setCursor((c) => (view === "month" ? subMonths(c, 1) : subWeeks(c, 1)));
  };
  const handleNext = () => {
    setCursor((c) => (view === "month" ? addMonths(c, 1) : addWeeks(c, 1)));
  };
  const handleToday = () => setCursor(new Date());

  const handleDayClick = (date: Date) => {
    setModal({ mode: "create", prefill: { date } });
  };
  const handleSlotClick = (dateAtHour: Date) => {
    setModal({
      mode: "create",
      prefill: { date: dateAtHour, time: format(dateAtHour, "HH:mm") },
    });
  };
  const handleEventClick = (event: CalendarEvent) => {
    setModal({ mode: "edit", event });
  };

  const handleSave = async (input: CalendarEventInput) => {
    if (modal?.mode === "edit") {
      await update(modal.event.id, input);
    } else {
      await create(input);
    }
    setModal(null);
  };

  const handleDelete = async () => {
    if (modal?.mode !== "edit") return;
    await remove(modal.event.id);
    setModal(null);
  };

  return (
    <div className="relative flex h-full">
      <Sidebar
        tags={tags}
        onNewTag={() => {
          setShowNewTag(true);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="relative flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto w-full max-w-6xl"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-border bg-panel p-2 text-ink md:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="flex-1 text-2xl font-semibold sm:text-3xl">Calendar</h1>
          </div>

          <div className="mt-4">
            <CalendarHeader
              view={view}
              cursor={cursor}
              onPrev={handlePrev}
              onNext={handleNext}
              onToday={handleToday}
              onViewChange={setView}
            />
          </div>

          {view === "month" ? (
            <MonthView
              cursor={cursor}
              events={events}
              todos={datedTodos}
              planGroups={planGroups}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          ) : (
            <WeekView
              cursor={cursor}
              events={events}
              todos={datedTodos}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
            />
          )}
        </motion.div>

        {showNewTag && (
          <NewTagModal
            onClose={() => setShowNewTag(false)}
            onCreate={async (name, color) => {
              await createTag(name, color);
              setShowNewTag(false);
            }}
          />
        )}

        {modal?.mode === "create" && (
          <EventModal
            key="create"
            mode="create"
            prefill={modal.prefill}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.mode === "edit" && (
          <EventModal
            key={`edit-${modal.event.id}`}
            mode="edit"
            initial={modal.event}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => setModal(null)}
          />
        )}
      </main>
    </div>
  );
}
