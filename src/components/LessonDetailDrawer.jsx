import { useEffect, useState } from 'react';
import Drawer from './Drawer';
import { getLessonDetail, updateLessonStatus } from '../lib/api';

export default function LessonDetailDrawer({ open, onClose, lessonId, onRecordStudy, onChanged }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (open && lessonId) getLessonDetail(lessonId).then(setDetail);
  }, [open, lessonId]);

  if (!detail) return <Drawer open={open} onClose={onClose} title="Lektion" children={null} />;

  const { lesson, sessions, classes } = detail;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  async function handleStatusChange(status) {
    await updateLessonStatus(lesson.id, status);
    setDetail((d) => ({ ...d, lesson: { ...d.lesson, status } }));
    onChanged?.();
  }

  return (
    <Drawer open={open} onClose={onClose} title={lesson.name}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-ink/60 mb-1">Status</label>
          <select
            value={lesson.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-ink/60 text-xs">Started</p>
            <p>{lesson.started_at ?? '—'}</p>
          </div>
          <div>
            <p className="text-ink/60 text-xs">Total self-study</p>
            <p>
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </p>
          </div>
        </div>

        <button
          onClick={() => onRecordStudy(lesson.id)}
          className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5"
        >
          Record study
        </button>

        <div>
          <p className="text-xs text-ink/60 mb-2">Study sessions</p>
          {sessions.length === 0 && <p className="text-sm text-ink/40">None yet.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="flex justify-between text-sm py-1.5 border-b border-mist">
              <span>{s.session_date}</span>
              <span>
                {Math.floor(s.duration_minutes / 60)}h {s.duration_minutes % 60}m
              </span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-ink/60 mb-2">Teacher classes</p>
          {classes.length === 0 && <p className="text-sm text-ink/40">None yet.</p>}
          {classes.map((c) => (
            <div key={c.id} className="flex justify-between text-sm py-1.5 border-b border-mist">
              <span>{new Date(c.scheduled_at).toLocaleDateString()}</span>
              <span className="capitalize">{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
