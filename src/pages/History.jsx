import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { listStudySessions, listTeacherClasses } from "../lib/api";
import HistorySkeleton from "../components/HistorySkeleton";

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

  async function load() {
    setStatus("loading");
    try {
      const [s, c] = await Promise.all([
        listStudySessions({ search: search || undefined }),
        listTeacherClasses({}),
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
  }, [search]);

  if (status === "loading") return <HistorySkeleton />;

  if (status === "error") {
    return (
      <div className="p-4 max-w-md mx-auto text-center space-y-3 pt-10">
        <p className="font-display text-lg">Couldn't load your history</p>
        <p className="text-sm text-ink/60">This may be temporary.</p>
        <button
          onClick={load}
          className="text-sm text-pine underline underline-offset-2"
        >
          Retry
        </button>
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

  return (
    <div className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg">History</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notes…"
        className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
      />

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
        <p className="text-sm text-ink/40">
          {!hasAnyDataAtAll
            ? "Nothing recorded yet — record a study session or mark a class completed to see it here."
            : "No results for this filter or search."}
        </p>
      )}
    </div>
  );
}
