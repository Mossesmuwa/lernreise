import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import TextLink from "../components/TextLink";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
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
import {
  IconBook,
  IconCalendar,
  IconFlame,
  IconPlay,
  IconPlus,
} from "../components/icons";

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
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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
      className="p-4 md:p-0 max-w-5xl mx-auto space-y-8"
    >
      <PageHeader
        eyebrow={new Date().toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={greeting()}
        description="Your next small step is already waiting."
      />

      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-card border border-mist shadow-[var(--lr-shadow-soft)]">
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className={`flex-1 text-center py-2.5 rounded-xl ${lvl.status === "current" ? "bg-pine-soft shadow-sm" : ""}`}
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
        <div className="bg-gradient-to-br from-pine-deep via-pine to-[#2b8d71] text-white rounded-[1.35rem] p-6 md:p-7 shadow-[var(--lr-shadow-lifted)] relative overflow-hidden">
          <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full border border-white/10" />
          <div className="absolute right-10 -bottom-24 w-48 h-48 rounded-full border border-white/10" />
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/65 mb-3">
            Continue learning
          </p>
          <div className="flex gap-4 items-center relative">
            <div className="w-11 h-14 rounded-md bg-paper border border-mist flex items-center justify-center flex-shrink-0 overflow-hidden">
              {course.cover_image_url ? (
                <img
                  src={course.cover_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <IconBook className="text-pine" size={20} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">{course.title}</p>
              <p className="text-sm text-white/70 mb-2">
                {currentLesson?.name ?? "—"} ·{" "}
                {currentLesson ? "in progress" : ""}
              </p>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-white/60 mt-1.5">
                {progressPct}% complete ·{" "}
                {currentLesson?.name ?? "Ready for your next lesson"}
              </p>
            </div>
            <Link
              to="/course"
              aria-label="Continue course"
              className="ml-auto flex-shrink-0 rounded-full bg-white text-pine p-2.5 hover:scale-105"
            >
              <IconPlay size={17} />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Today"
          value={fmtHM(todayMin)}
          detail="Keep the rhythm"
          tone="accent"
        />
        <StatCard
          label="This week"
          value={fmtHM(weekMin)}
          detail={
            lastWeekMin > 0
              ? `${weekDelta >= 0 ? "↑" : "↓"} ${fmtHM(Math.abs(weekDelta))} vs last week`
              : "Your weekly total"
          }
        />
        <StatCard
          label="This month"
          value={fmtHM(monthMin)}
          detail="Time invested"
        />
        <StatCard
          label="All time"
          value={fmtHM(totalMin)}
          detail="Every session counts"
        />
      </div>

      {streak > 0 && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="inline-flex items-center gap-1.5 text-sm text-amber bg-amber-soft rounded-full px-3 py-1.5"
        >
          <IconFlame size={16} /> {streak}-day streak
        </motion.p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-mist bg-card p-5 shadow-[var(--lr-shadow-soft)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-pine">
                Today
              </p>
              <p className="font-display text-lg mt-1">Your activity</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-pine-soft text-pine flex items-center justify-center text-xs">
              {todaysSessions.length + todaysClasses.length}
            </span>
          </div>
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
        </section>

        <section className="rounded-2xl border border-mist bg-card p-5 shadow-[var(--lr-shadow-soft)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-pine">
                Next up
              </p>
              <p className="font-display text-lg mt-1">Upcoming classes</p>
            </div>
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
        </section>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => setRecordOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-pine text-white text-sm font-medium py-3 shadow-[var(--lr-shadow-soft)] hover:bg-pine-deep"
        >
          <IconPlus size={17} /> Record study
        </button>
        <button
          onClick={() => setAddClassOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-mist bg-card text-sm font-medium py-3 hover:border-pine/50 hover:bg-pine-soft/40"
        >
          <IconCalendar size={17} /> Add class
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
