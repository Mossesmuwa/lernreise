import { useState } from 'react';
import Modal from './Modal';
import { addTeacherClass, rescheduleTeacherClass } from '../lib/api';

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AddEditClassModal({ open, onClose, lessons, teachers, existingClass, onSaved }) {
  const isEdit = Boolean(existingClass);
  const [lessonId, setLessonId] = useState(existingClass?.lesson?.id || '');
  const [teacherId, setTeacherId] = useState(existingClass?.teacher?.id || teachers?.[0]?.id || '');
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(existingClass?.scheduled_at));
  const [mode, setMode] = useState(existingClass?.mode || 'online');
  const [notes, setNotes] = useState(existingClass?.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const iso = new Date(scheduledAt).toISOString();
    if (isEdit) {
      await rescheduleTeacherClass(existingClass.id, iso, existingClass.scheduled_at);
    } else {
      await addTeacherClass({ lessonId, teacherId, scheduledAt: iso, mode, notes: notes || null });
    }
    setSaving(false);
    onSaved?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit class' : 'Add class'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div>
            <label className="block text-xs text-ink/60 mb-1">Lektion</label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              required
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Choose a lektion…
              </option>
              {lessons?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isEdit && (
          <div>
            <label className="block text-xs text-ink/60 mb-1">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            >
              {teachers?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-ink/60 mb-1">Date &amp; time</label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          />
        </div>

        {!isEdit && (
          <div>
            <label className="block text-xs text-ink/60 mb-1">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            >
              <option value="online">Online</option>
              <option value="physical">Physical</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
        >
          {isEdit ? 'Save changes' : 'Add class'}
        </button>
      </form>
    </Modal>
  );
}
