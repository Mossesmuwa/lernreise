import { useEffect, useState } from "react";
import Drawer from "./Drawer";
import { getLevelDetail } from "../lib/api";

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString([], {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not added yet";
}

export default function LevelDetailDrawer({ open, onClose, levelId }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (open && levelId) {
      setDetail(null);
      getLevelDetail(levelId).then(setDetail);
    }
  }, [open, levelId]);

  if (!open) return null;

  return (
    <Drawer open={open} onClose={onClose} title={detail?.level.name ?? ""}>
      {!detail ? (
        <div className="space-y-3 animate-pulse" aria-hidden="true">
          <div className="h-4 w-32 bg-mist/60 rounded" />
          <div className="h-4 w-48 bg-mist/60 rounded" />
          <div className="h-4 w-40 bg-mist/60 rounded" />
        </div>
      ) : detail.course ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-ink/60">Course</p>
            <p className="text-sm">{detail.course.title}</p>
          </div>
          <div>
            <p className="text-xs text-ink/60">Institution</p>
            <p className="text-sm">
              {detail.course.institution?.name ?? "Not added yet"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-ink/60">Started</p>
              <p className="text-sm">{fmtDate(detail.course.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-ink/60">
                {detail.course.end_date ? "Ended" : "Estimated end"}
              </p>
              <p className="text-sm">
                {fmtDate(
                  detail.course.end_date ?? detail.course.estimated_end_date,
                )}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-ink/60 mb-1">Teachers</p>
            {detail.teachers.length === 0 && (
              <p className="text-sm text-ink/40">Not added yet</p>
            )}
            {detail.teachers.map((t) => (
              <div
                key={t.id}
                className="flex justify-between py-1.5 border-b border-mist text-sm"
              >
                <span>{t.name}</span>
                <span className="text-ink/40">
                  {t.contact ?? "No contact added"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink/40 pt-2">
            Detailed session-by-session records for this level haven't been
            added — this shows what's on file so far.
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink/40">
          No course details added yet for this level.
        </p>
      )}
    </Drawer>
  );
}
