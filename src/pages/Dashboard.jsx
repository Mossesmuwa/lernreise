import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import TextLink from "../components/TextLink";
import DashboardSkeleton from "../components/DashboardSkeleton";
import {
  getLevels,
  getCurrentCourse,
  listStudySessions,
  listTeacherClasses,
  listTeachers,
} from "../lib/api";
import { calculateStreak } from "../lib/streak";
import RecordStudyModal from "../components/RecordStudyModal";
import AddEditClassModal from "../components/AddEditClassModal";
import ClassDetailDrawer from "../components/ClassDetailDrawer";

const STATUS_MARK = { completed: "✓", current: "●", not_started: "○" };

function startOfWeek(offsetWeeks = 0) {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function fmtHM(min) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function Dashboard() {
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [levels, setLevels] = useState([]);
  const [course, setCourse] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [recordOpen, setRecordOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  async function load() {
    setStatus("loading");
    try {
      const [lvls, crs, everySessionEver, clsList, tchrs] = await Promise.all([
        getLevels(),
        getCurrentCourse(),
        listStudySessions({}),
        listTeacherClasses({ from: new Date().toISOString() }),
        listTeachers(),
      ]);
      setLevels(lvls);
      setCourse(crs);
      setAllSessions(everySessionEver);
      setClasses(clsList);
      setTeachers(tchrs);
      setStatus("ready");
    } catch (err) {
      console.error("Failed to load dashboard", err);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <DashboardSkeleton />;

  if (status === "error") {
    return (
      <div className="p-4 max-w-md mx-auto text-center space-y-3 pt-10">
        <p className="font-display text-lg">Something went wrong</p>
        <p className="text-sm text-ink/60">
          Couldn't load your dashboard — this may be temporary.
        </p>
        <button
          onClick={load}
          className="text-sm text-pine underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const thisWeekStart = startOfWeek(0).toISOString().slice(0, 10);
  const lastWeekStart = startOfWeek(-1).toISOString().slice(0, 10);
  const monthStart = startOfMonthISO();

  const todayMin = allSessions
    .filter((s) => s.session_date === today)
    .reduce((a, s) => a + s.duration_minutes, 0);
  const weekMin = allSessions
    .filter((s) => s.session_date >= thisWeekStart)
    .reduce((a, s) => a + s.duration_minutes, 0);
  const lastWeekMin = allSessions
    .filter(
      (s) => s.session_date >= lastWeekStart && s.session_date < thisWeekStart,
    )
    .reduce((a, s) => a + s.duration_minutes, 0);
  const monthMin = allSessions
    .filter((s) => s.session_date >= monthStart)
    .reduce((a, s) => a + s.duration_minutes, 0);
  const totalMin = allSessions.reduce((a, s) => a + s.duration_minutes, 0);
  const streak = calculateStreak(allSessions.map((s) => s.session_date));

  const weekDelta = weekMin - lastWeekMin;

  const allLessons = course?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentLesson = allLessons.find((l) => l.status === "in_progress");
  const completedCount = allLessons.filter(
    (l) => l.status === "completed",
  ).length;
  const progressPct = allLessons.length
    ? Math.round((completedCount / allLessons.length) * 100)
    : 0;

  const todaysClasses = classes.filter(
    (c) => c.scheduled_at.slice(0, 10) === today,
  );
  const upcoming = classes
    .filter((c) => c.scheduled_at.slice(0, 10) !== today)
    .slice(0, 3);
  const todaysSessions = allSessions.filter((s) => s.session_date === today);

  if (levels.length === 0) {
    return (
      <div className="p-4 max-w-md mx-auto text-center space-y-3 pt-10">
        <p className="font-display text-lg">Let's set up your journey</p>
        <p className="text-sm text-ink/60">
          No course data yet — a quick one-time setup gets you started.
        </p>
        <Link
          to="/onboarding"
          className="inline-block rounded-lg bg-pine text-white text-sm font-medium px-4 py-2.5"
        >
          Get started
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink/60">Guten Tag</p>
          <p className="font-display text-lg">Your German journey</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className={`flex-1 text-center py-2 rounded-lg ${lvl.status === "current" ? "bg-pine-soft" : "bg-card border border-mist"}`}
          >
            <p
              className={`text-[11px] ${lvl.status === "current" ? "text-pine-deep" : "text-ink/50"}`}
            >
              {lvl.name}
            </p>
            <p
              className={`text-sm mt-0.5 ${lvl.status === "current" ? "text-pine" : "text-ink/40"}`}
            >
              {STATUS_MARK[lvl.status]}
            </p>
          </div>
        ))}
      </div>

      {course && (
        <div className="bg-card border border-mist rounded-xl p-4">
          <p className="text-xs text-ink/60 mb-2">Currently learning</p>
          <div className="flex gap-3 items-center">
            <div className="w-11 h-14 rounded-md bg-paper border border-mist flex items-center justify-center flex-shrink-0 overflow-hidden">
              {course.cover_image_url ? (
                <img
                  src={course.cover_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-ink/30 text-xs">📖</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{course.title}</p>
              <p className="text-sm text-ink/60 mb-2">
                {currentLesson?.name ?? "—"} ·{" "}
                {currentLesson ? "in progress" : ""}
              </p>
              <div className="h-1.5 bg-paper rounded-full overflow-hidden">
                <div
                  className="h-full bg-pine transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card border border-mist rounded-lg p-3">
          <p className="text-[11px] text-ink/60">Today</p>
          <p className="text-lg font-medium">{fmtHM(todayMin)}</p>
        </div>
        <div className="bg-card border border-mist rounded-lg p-3">
          <p className="text-[11px] text-ink/60">This week</p>
          <p className="text-lg font-medium">{fmtHM(weekMin)}</p>
          {lastWeekMin > 0 && (
            <p
              className={`text-[11px] mt-0.5 ${weekDelta >= 0 ? "text-pine" : "text-ink/40"}`}
            >
              {weekDelta >= 0 ? "↑" : "↓"} {fmtHM(Math.abs(weekDelta))} vs last
              week
            </p>
          )}
        </div>
        <div className="bg-card border border-mist rounded-lg p-3">
          <p className="text-[11px] text-ink/60">This month</p>
          <p className="text-lg font-medium">{fmtHM(monthMin)}</p>
        </div>
        <div className="bg-card border border-mist rounded-lg p-3">
          <p className="text-[11px] text-ink/60">Total</p>
          <p className="text-lg font-medium">{fmtHM(totalMin)}</p>
        </div>
      </div>

      {streak > 0 && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="text-sm text-amber inline-block"
        >
          🔥 {streak}-day streak
        </motion.p>
      )}

      <div>
        <p className="text-xs text-ink/60 mb-2">Today</p>
        {todaysSessions.map((s) => (
          <div key={s.id} className="py-2 border-b border-mist text-sm">
            {fmtHM(s.duration_minutes)} studied · {s.lesson?.name}
          </div>
        ))}
        {todaysClasses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c)}
            className="w-full text-left py-2 border-b border-mist text-sm"
          >
            German class ·{" "}
            {new Date(c.scheduled_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {c.lesson?.name}
          </button>
        ))}
        {todaysSessions.length === 0 && todaysClasses.length === 0 && (
          <p className="text-sm text-ink/40 py-2">Nothing yet today.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-ink/60">Upcoming</p>
          <TextLink to="/calendar">View calendar</TextLink>
        </div>
        {upcoming.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c)}
            className="w-full flex justify-between items-center text-left py-2 border-b border-mist text-sm"
          >
            <span>
              {new Date(c.scheduled_at).toLocaleDateString([], {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              ·{" "}
              {new Date(c.scheduled_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {c.status === "rescheduled" && (
              <span className="text-[11px] bg-amber-soft text-amber px-2 py-0.5 rounded">
                Changed
              </span>
            )}
          </button>
        ))}
        {upcoming.length === 0 && (
          <p className="text-sm text-ink/40 py-2">Nothing scheduled.</p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setRecordOpen(true)}
          className="flex-1 rounded-lg bg-pine text-white text-sm font-medium py-2.5"
        >
          + Record study
        </button>
        <button
          onClick={() => setAddClassOpen(true)}
          className="flex-1 rounded-lg border border-mist text-sm font-medium py-2.5"
        >
          Add class
        </button>
      </div>

      <RecordStudyModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        lessons={allLessons}
        defaultLessonId={currentLesson?.id}
        onSaved={load}
      />
      <AddEditClassModal
        open={addClassOpen}
        onClose={() => setAddClassOpen(false)}
        lessons={allLessons}
        teachers={teachers}
        onSaved={load}
      />
      <ClassDetailDrawer
        open={Boolean(selectedClass)}
        onClose={() => setSelectedClass(null)}
        klass={selectedClass}
        onEdit={(c) => {
          setSelectedClass(null);
          setEditingClass(c);
        }}
        onSaved={load}
      />
      {editingClass && (
        <AddEditClassModal
          open={Boolean(editingClass)}
          onClose={() => setEditingClass(null)}
          lessons={allLessons}
          teachers={teachers}
          existingClass={editingClass}
          onSaved={load}
        />
      )}
    </motion.div>
  );
}
