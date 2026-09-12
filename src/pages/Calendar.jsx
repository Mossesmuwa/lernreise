import { useEffect, useState } from "react";
import { listTeacherClasses, listTeachers, getCurrentCourse } from "../lib/api";
import AddEditClassModal from "../components/AddEditClassModal";
import ClassDetailDrawer from "../components/ClassDetailDrawer";
import PageHeader from "../components/PageHeader";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);

  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  async function load() {
    const [cls, tchrs, course] = await Promise.all([
      listTeacherClasses({
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
      }),
      listTeachers(),
      getCurrentCourse(),
    ]);
    setClasses(cls);
    setTeachers(tchrs);
    setLessons(course?.modules?.flatMap((m) => m.lessons) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const classesByDay = (d) =>
    classes.filter(
      (c) => new Date(c.scheduled_at).toDateString() === d.toDateString(),
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

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => {
          const hasClass = classesByDay(d).length > 0;
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <div key={i}>
              <p className="text-[10px] text-ink/50 mb-1">{DAY_LABELS[i]}</p>
              <div
                className={`text-sm py-1.5 rounded-full ${isToday ? "bg-pine-soft text-pine-deep" : ""}`}
              >
                {d.getDate()}
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
        {classes.length === 0 && (
          <p className="text-sm text-ink/40">Nothing scheduled.</p>
        )}
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="w-full flex justify-between items-center text-left py-2 border-b border-mist text-sm"
          >
            <span>
              <span className="mr-2">
                {new Date(c.scheduled_at).toLocaleDateString([], {
                  weekday: "short",
                  day: "numeric",
                })}{" "}
                ·{" "}
                {new Date(c.scheduled_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-ink/50">{c.lesson?.name}</span>
            </span>
            {c.status === "rescheduled" && (
              <span className="text-[11px] bg-amber-soft text-amber px-2 py-0.5 rounded">
                Changed
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="w-full rounded-lg border border-mist text-sm font-medium py-2.5"
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
          open={Boolean(editing)}
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
        onEdit={(c) => {
          setSelected(null);
          setEditing(c);
        }}
        onSaved={load}
      />
    </div>
  );
}
