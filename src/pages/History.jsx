import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { listStudySessions, listTeacherClasses } from "../lib/api";
import HistorySkeleton from "../components/HistorySkeleton";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

const list = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const row = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function History() {
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState("all"); // all | study | classes
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");

  function getRange() {
    if (range === "all") return {};
    const end = new Date();
    const start = new Date();
    start.setDate(
      start.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : 90),
    );
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    };
  }

  async function load() {
    setStatus("loading");
    try {
      const dateRange = getRange();
      const [s, c] = await Promise.all([
        listStudySessions({ ...dateRange, search: search || undefined }),
        listTeacherClasses(dateRange),
      ]);
      setSessions(s);
      setClasses(c);
      setStatus("ready");
    } catch (err) {
      console.error("Failed to load history", err);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, range]);

  if (status === "loading") return <HistorySkeleton />;

  if (status === "error") {
    return (
      <div className="p-4 md:p-0 max-w-3xl mx-auto">
        <ErrorState
          onRetry={load}
          description="We could not load your learning history."
        />
      </div>
    );
  }

  const hasAnyDataAtAll =
    sessions.length > 0 || classes.some((c) => c.status === "completed");

  const items = [
    ...sessions.map((s) => ({
      type: "study",
      icon: "📚",
      date: s.session_date,
      label: `Study · ${Math.floor(s.duration_minutes / 60)}h ${s.duration_minutes % 60}m`,
      sub: s.lesson?.name,
    })),
    ...classes
      .filter((c) => c.status === "completed")
      .map((c) => ({
        type: "classes",
        icon: "🎓",
        date: c.scheduled_at.slice(0, 10),
        label: `Teacher class${c.duration_minutes ? ` · ${c.duration_minutes}m` : ""}`,
        sub: `${c.lesson?.name} · ${c.teacher?.name}`,
      })),
  ]
    .filter((i) => filter === "all" || i.type === filter)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const grouped = items.reduce((acc, item) => {
    (acc[item.date] ??= []).push(item);
    return acc;
  }, {});
  const studyMinutes = sessions.reduce(
    (sum, session) => sum + session.duration_minutes,
    0,
  );
  const completedClasses = classes.filter(
    (item) => item.status === "completed",
  );
  const averageSession = sessions.length
    ? Math.round(studyMinutes / sessions.length)
    : 0;

  return (
    <div className="p-4 md:p-0 max-w-4xl mx-auto space-y-5">
      <PageHeader
        eyebrow="Your progress"
        title="History"
        description="A record of the time and effort behind your journey."
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notes…"
        className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-mist bg-card p-3">
          <p className="text-[10px] text-ink/50">Study time</p>
          <p className="font-display text-lg">
            {Math.floor(studyMinutes / 60)}h {studyMinutes % 60}m
          </p>
        </div>
        <div className="rounded-xl border border-mist bg-card p-3">
          <p className="text-[10px] text-ink/50">Sessions</p>
          <p className="font-display text-lg">{sessions.length}</p>
        </div>
        <div className="rounded-xl border border-mist bg-card p-3">
          <p className="text-[10px] text-ink/50">Avg. session</p>
          <p className="font-display text-lg">{averageSession}m</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "study", "classes"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
              filter === f
                ? "bg-pine-soft text-pine-deep"
                : "border border-mist text-ink/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink/50">Showing {items.length} activities</p>
        <select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="rounded-lg border border-mist bg-card px-3 py-2 text-xs"
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <motion.div variants={list} initial="hidden" animate="visible">
        {Object.entries(grouped).map(([date, dayItems]) => (
          <div key={date} className="mb-3">
            <p className="text-xs text-ink/60 mb-1">
              {new Date(date).toLocaleDateString([], {
                month: "long",
                day: "numeric",
              })}
            </p>
            {dayItems.map((item, i) => (
              <motion.div
                key={i}
                variants={row}
                className="flex items-start gap-2 py-1.5 border-b border-mist text-sm"
              >
                <span aria-hidden="true">{item.icon}</span>
                <div>
                  <p>{item.label}</p>
                  <p className="text-xs text-ink/50">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </motion.div>

      {items.length === 0 && (
        <EmptyState
          title={
            !hasAnyDataAtAll ? "Your story starts here" : "No matching activity"
          }
          description={
            !hasAnyDataAtAll
              ? "Record a study session or complete a class to begin building your history."
              : "Try another filter or time range."
          }
          action={
            hasAnyDataAtAll ? (
              <button
                onClick={() => {
                  setFilter("all");
                  setRange("all");
                  setSearch("");
                }}
                className="text-sm font-medium text-pine underline underline-offset-4"
              >
                Reset filters
              </button>
            ) : null
          }
        />
      )}
    </div>
  );
}
