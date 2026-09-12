import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import {
  listDeletedStudySessions,
  listDeletedTeacherClasses,
  restoreStudySession,
  restoreTeacherClass,
} from "../lib/api";

export default function Trash() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);

  async function load() {
    setSessions(await listDeletedStudySessions());
    setClasses(await listDeletedTeacherClasses());
  }

  useEffect(() => {
    load();
  }, []);

  const empty = sessions.length === 0 && classes.length === 0;

  return (
    <div className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <BackButton to="/settings" />
        <p className="font-display text-lg">Trash</p>
      </div>

      <p className="text-xs text-ink/60">
        Deleted study sessions and classes stay here until restored — nothing is
        ever removed for good from here.
      </p>

      {empty && <p className="text-sm text-ink/40">Nothing in the trash.</p>}

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
