import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import {
  listDeletedStudySessions,
  listDeletedTeacherClasses,
  restoreStudySession,
  restoreTeacherClass,
} from "../lib/api";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";

export default function Trash() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  async function load() {
    setStatus("loading");
    try {
      const [sessionRows, classRows] = await Promise.all([
        listDeletedStudySessions(),
        listDeletedTeacherClasses(),
      ]);
      setSessions(sessionRows);
      setClasses(classRows);
      setStatus("ready");
    } catch (loadError) {
      setError(loadError);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const empty = sessions.length === 0 && classes.length === 0;

  if (status === "loading")
    return <div className="p-6 text-sm text-ink/50">Loading trash...</div>;
  if (status === "error")
    return (
      <div className="p-4 md:p-0 max-w-3xl mx-auto">
        <ErrorState
          onRetry={load}
          description={error?.message || "We could not load your trash."}
        />
      </div>
    );

  return (
    <div className="p-4 md:p-0 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <BackButton to="/settings" />
      </div>

      <PageHeader
        eyebrow="Keep your records tidy"
        title="Trash"
        description="Deleted sessions and classes can be restored whenever you need them."
      />

      <p className="text-xs text-ink/60">
        Deleted study sessions and classes stay here until restored — nothing is
        ever removed for good from here.
      </p>

      {empty && (
        <EmptyState
          title="Nothing in the trash"
          description="Deleted sessions and classes will appear here so you can restore them."
        />
      )}

      {sessions.map((s) => (
        <div
          key={s.id}
          className="flex justify-between items-center bg-card border border-mist rounded-lg px-4 py-2.5"
        >
          <div className="text-sm">
            <p>
              Study · {s.session_date} · {s.duration_minutes}m
            </p>
            <p className="text-xs text-ink/50">{s.lesson?.name}</p>
          </div>
          <button
            onClick={async () => {
              await restoreStudySession(s.id);
              load();
            }}
            className="text-xs px-2 py-1 rounded border border-mist"
          >
            Restore
          </button>
        </div>
      ))}

      {classes.map((c) => (
        <div
          key={c.id}
          className="flex justify-between items-center bg-card border border-mist rounded-lg px-4 py-2.5"
        >
          <div className="text-sm">
            <p>Class · {new Date(c.scheduled_at).toLocaleDateString()}</p>
            <p className="text-xs text-ink/50">{c.lesson?.name}</p>
          </div>
          <button
            onClick={async () => {
              await restoreTeacherClass(c.id);
              load();
            }}
            className="text-xs px-2 py-1 rounded border border-mist"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
