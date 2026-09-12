import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  claimShareLink,
  ensureShareSession,
  validateShareToken,
  getTeacherClassesForToken,
  teacherCompleteClass,
  teacherRescheduleClass,
} from "../lib/api";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

export default function TeacherView() {
  const { token } = useParams();
  const [state, setState] = useState("loading");
  const [classes, setClasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTime, setNewTime] = useState("");
  const [durationId, setDurationId] = useState(null);
  const [duration, setDuration] = useState("");
  const [error, setError] = useState(null);

  async function load() {
    try {
      await ensureShareSession();
      const validated = await validateShareToken(token);
      if (!validated || validated.role !== "teacher_editor") {
        setState("invalid");
        return;
      }
      const claimed = await claimShareLink(token);
      if (!claimed || claimed.role !== "teacher_editor") {
        setState("invalid");
        return;
      }
      setClasses(await getTeacherClassesForToken(token));
      setState("ready");
    } catch (loadError) {
      setError(loadError);
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleSave(classId) {
    try {
      await teacherRescheduleClass(
        token,
        classId,
        new Date(newTime).toISOString(),
      );
      setEditingId(null);
      await load();
    } catch (saveError) {
      setError(saveError);
      setState("error");
    }
  }

  async function handleComplete(classId) {
    try {
      await teacherCompleteClass(
        token,
        classId,
        duration ? Number(duration) : null,
      );
      setDurationId(null);
      setDuration("");
      await load();
    } catch (completeError) {
      setError(completeError);
      setState("error");
    }
  }

  if (state === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-ink/50">
        Loading your classes...
      </div>
    );
  if (state === "error")
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ErrorState
          onRetry={load}
          description="The link may need to be claimed again, Anonymous Sign-Ins may be disabled, or the share-link migration has not been applied."
        />
        <Link
          to="/welcome"
          className="text-xs text-ink/50 underline underline-offset-2"
        >
          Return to Lernreise
        </Link>
      </div>
    );
  if (state === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-ink/60">This link is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <PageHeader
        eyebrow="Teacher access"
        title="Your classes"
        description="Update a time or mark a class complete."
      />

      {classes.map((c) => (
        <div key={c.id} className="bg-card border border-mist rounded-xl p-3">
          <p className="text-sm font-medium">{c.lesson_name}</p>
          <p className="text-sm text-ink/60 mb-2">
            {new Date(c.scheduled_at).toLocaleString([], {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            <span className="capitalize">{c.status}</span>
          </p>

          {editingId === c.id ? (
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 rounded-lg border border-mist bg-paper px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => handleSave(c.id)}
                className="text-sm px-3 rounded-lg bg-pine text-white"
              >
                Save
              </button>
            </div>
          ) : durationId === c.id ? (
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Minutes"
                className="flex-1 rounded-lg border border-mist bg-paper px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => handleComplete(c.id)}
                className="text-sm px-3 rounded-lg bg-pine text-white"
              >
                Save
              </button>
              <button
                onClick={() => setDurationId(null)}
                className="text-sm px-3 rounded-lg border border-mist"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {c.status !== "completed" && (
                <button
                  onClick={() => setDurationId(c.id)}
                  className="text-xs px-2 py-1 rounded border border-mist"
                >
                  Mark completed
                </button>
              )}
              <button
                onClick={() => setEditingId(c.id)}
                className="text-xs px-2 py-1 rounded border border-mist"
              >
                Change time
              </button>
            </div>
          )}
        </div>
      ))}
      {classes.length === 0 && (
        <EmptyState
          title="No classes yet"
          description="There are no classes assigned to this teacher link."
        />
      )}
    </div>
  );
}
