import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { validateShareToken, getTeacherClassesForToken, teacherRescheduleClass } from '../lib/api';

export default function TeacherView() {
  const { token } = useParams();
  const [state, setState] = useState('loading');
  const [classes, setClasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newTime, setNewTime] = useState('');

  async function load() {
    const validated = await validateShareToken(token);
    if (!validated || validated.role !== 'teacher_editor') {
      setState('invalid');
      return;
    }
    setClasses(await getTeacherClassesForToken(token));
    setState('ready');
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleSave(classId) {
    await teacherRescheduleClass(token, classId, new Date(newTime).toISOString());
    setEditingId(null);
    load();
  }

  if (state === 'loading') return null;
  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-ink/60">This link is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <p className="font-display text-lg">Your classes</p>
      <p className="text-xs text-ink/60">You can update the time for any of your upcoming classes below.</p>

      {classes.map((c) => (
        <div key={c.id} className="bg-card border border-mist rounded-xl p-3">
          <p className="text-sm font-medium">{c.lesson_name}</p>
          <p className="text-sm text-ink/60 mb-2">
            {new Date(c.scheduled_at).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {' · '}
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
              <button onClick={() => handleSave(c.id)} className="text-sm px-3 rounded-lg bg-pine text-white">
                Save
              </button>
            </div>
          ) : (
            <button onClick={() => setEditingId(c.id)} className="text-xs px-2 py-1 rounded border border-mist">
              Change time
            </button>
          )}
        </div>
      ))}
      {classes.length === 0 && <p className="text-sm text-ink/40">No classes yet.</p>}
    </div>
  );
}
