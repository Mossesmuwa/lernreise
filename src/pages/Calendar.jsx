import { useEffect, useMemo, useState } from "react";
import { getCurrentCourse, listTeacherClasses, listTeachers } from "../lib/api";
import AddEditClassModal from "../components/AddEditClassModal";
import ClassDetailDrawer from "../components/ClassDetailDrawer";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function startOfWeek(date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function CalendarPage() {
  const [weekCursor, setWeekCursor] = useState(() => new Date());
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);

  const weekStart = useMemo(() => startOfWeek(weekCursor), [weekCursor]);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  async function load() {
    setStatus("loading");
    setError(null);
    try {
      const [classRows, teacherRows, course] = await Promise.all([
        listTeacherClasses({
          from: weekStart.toISOString(),
          to: weekEnd.toISOString(),
        }),
        listTeachers(),
        getCurrentCourse(),
      ]);
      setClasses(classRows);
      setTeachers(teacherRows);
      setLessons(course?.modules?.flatMap((module) => module.lessons) ?? []);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    return day;
  });

  const classesByDay = (day) =>
    classes.filter(
      (item) =>
        new Date(item.scheduled_at).toDateString() === day.toDateString(),
    );

  if (status === "loading")
    return (
      <div className="p-6 text-sm text-ink/50">Loading your schedule...</div>
    );
  if (status === "error")
    return (
      <div className="p-4 md:p-0 max-w-3xl mx-auto">
        <ErrorState
          onRetry={load}
          description={error?.message || "We could not load your schedule."}
        />
      </div>
    );

  return (
    <div className="p-4 md:p-0 max-w-4xl mx-auto space-y-5">
      <PageHeader
        eyebrow="Your schedule"
        title={weekStart.toLocaleDateString([], {
          month: "long",
          year: "numeric",
        })}
        description="Classes, practice time, and what is coming next."
      />
      <div className="flex items-center justify-between rounded-xl border border-mist bg-card p-2">
        <button
          onClick={() =>
            setWeekCursor(
              (date) =>
                new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate() - 7,
                ),
            )
          }
          className="rounded-lg px-3 py-2 text-sm text-ink/60 hover:bg-paper"
        >
          Previous
        </button>
        <button
          onClick={() => setWeekCursor(new Date())}
          className="rounded-lg bg-pine-soft px-3 py-2 text-sm font-medium text-pine-deep"
        >
          Today
        </button>
        <button
          onClick={() =>
            setWeekCursor(
              (date) =>
                new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate() + 7,
                ),
            )
          }
          className="rounded-lg px-3 py-2 text-sm text-ink/60 hover:bg-paper"
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, index) => {
          const hasClass = classesByDay(day).length > 0;
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={day.toISOString()}>
              <p className="text-[10px] text-ink/50 mb-1">
                {DAY_LABELS[index]}
              </p>
              <div
                className={`text-sm py-1.5 rounded-full ${isToday ? "bg-pine-soft text-pine-deep" : ""}`}
              >
                {day.getDate()}
              </div>
              {hasClass && (
                <div className="w-1 h-1 rounded-full bg-pine mx-auto mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
      <div>
        <p className="text-xs text-ink/60 mb-2">This week</p>
        {classes.length === 0 ? (
          <EmptyState
            title="A quiet week"
            description="Schedule a class to keep your learning rhythm visible."
            action={
              <button
                onClick={() => setAddOpen(true)}
                className="rounded-xl bg-pine px-4 py-2.5 text-sm font-medium text-white"
              >
                Add class
              </button>
            }
          />
        ) : (
          classes.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="w-full flex justify-between items-center text-left py-3 border-b border-mist text-sm hover:bg-card"
            >
              <span>
                <span className="mr-2">
                  {new Date(item.scheduled_at).toLocaleDateString([], {
                    weekday: "short",
                    day: "numeric",
                  })}{" "}
                  ·{" "}
                  {new Date(item.scheduled_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-ink/50">{item.lesson?.name}</span>
              </span>
              {item.status === "rescheduled" && (
                <span className="text-[11px] bg-amber-soft text-amber px-2 py-0.5 rounded">
                  Changed
                </span>
              )}
            </button>
          ))
        )}
      </div>
      <button
        onClick={() => setAddOpen(true)}
        className="w-full rounded-xl border border-mist bg-card text-sm font-medium py-3 hover:border-pine/50"
      >
        + Add class
      </button>
      <AddEditClassModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        lessons={lessons}
        teachers={teachers}
        onSaved={load}
      />
      {editing && (
        <AddEditClassModal
          open
          onClose={() => setEditing(null)}
          lessons={lessons}
          teachers={teachers}
          existingClass={editing}
          onSaved={load}
        />
      )}
      <ClassDetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        klass={selected}
        onEdit={(item) => {
          setSelected(null);
          setEditing(item);
        }}
        onSaved={load}
      />
    </div>
  );
}
