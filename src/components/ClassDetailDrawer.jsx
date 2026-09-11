import { useState } from 'react';
import Drawer from './Drawer';
import { markClassCompleted, softDeleteTeacherClass } from '../lib/api';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClassDetailDrawer({ open, onClose, klass, onEdit, onSaved }) {
  const [duration, setDuration] = useState('');
  const [completing, setCompleting] = useState(false);

  if (!klass) return null;

  async function handleComplete() {
    await markClassCompleted(klass.id, duration ? Number(duration) : null);
    setCompleting(false);
    onSaved?.();
    onClose();
  }

  async function handleDelete() {
    await softDeleteTeacherClass(klass.id);
    onSaved?.();
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title="German class">
      <div className="space-y-1 mb-4">
        <p className="text-lg">{formatDateTime(klass.scheduled_at)}</p>
        {klass.original_scheduled_at && (
          <p className="text-xs text-amber">Originally: {formatDateTime(klass.original_scheduled_at)}</p>
        )}
        <p className="text-sm text-ink/60">
          {klass.lesson?.name} · {klass.teacher?.name}
        </p>
        <p className="text-sm text-ink/60 capitalize">{klass.mode}</p>
        <p className="text-sm">
          Status: <span className="capitalize">{klass.status}</span>
        </p>
        {klass.notes && <p className="text-sm text-ink/70 mt-2">{klass.notes}</p>}
      </div>

      {completing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-ink/60 mb-1">Duration (minutes, optional)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>
          <button onClick={handleComplete} className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5">
            Confirm completed
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => onEdit(klass)} className="flex-1 rounded-lg border border-mist text-sm py-2">
            Edit
          </button>
          {klass.status !== 'completed' && (
            <button onClick={() => setCompleting(true)} className="flex-1 rounded-lg bg-pine text-white text-sm py-2">
              Mark completed
            </button>
          )}
          <button onClick={handleDelete} className="flex-1 rounded-lg border border-mist text-sm py-2 text-red-700">
            Delete
          </button>
        </div>
      )}
    </Drawer>
  );
}
