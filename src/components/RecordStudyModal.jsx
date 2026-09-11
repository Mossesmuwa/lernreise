import { useEffect, useState } from 'react';
import Modal from './Modal';
import { getActiveTimer, startTimer, clearTimer, addStudySession } from '../lib/api';

const STALE_THRESHOLD_MINUTES = 180; // flag anything longer than 3 hours

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function RecordStudyModal({ open, onClose, lessons, defaultLessonId, onSaved }) {
  const [tab, setTab] = useState('timer');
  const [lessonId, setLessonId] = useState(defaultLessonId);
  const [timer, setTimer] = useState(null); // { lesson_id, started_at } | null
  const [elapsedMin, setElapsedMin] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [manualDate, setManualDate] = useState(todayISO());
  const [manualMinutes, setManualMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLessonId(defaultLessonId);
    getActiveTimer().then((t) => {
      if (t?.started_at) setTimer(t);
    });
  }, [open, defaultLessonId]);

  useEffect(() => {
    if (!timer?.started_at) return;
    const tick = () => {
      const mins = Math.round((Date.now() - new Date(timer.started_at).getTime()) / 60000);
      setElapsedMin(mins);
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [timer]);

  async function handleStart() {
    await startTimer(lessonId);
    setTimer({ lesson_id: lessonId, started_at: new Date().toISOString() });
  }

  function handleStop() {
    setManualMinutes(String(elapsedMin));
    setManualDate(todayISO());
    setConfirming(true);
  }

  async function handleSaveTimerSession(event) {
    event.preventDefault();
    setSaving(true);
    await addStudySession({
      lessonId: timer.lesson_id,
      sessionDate: manualDate,
      durationMinutes: Number(manualMinutes),
      notes: notes || null,
    });
    await clearTimer();
    setSaving(false);
    setTimer(null);
    setConfirming(false);
    setNotes('');
    onSaved?.();
    onClose();
  }

  async function handleSaveManual(event) {
    event.preventDefault();
    if (!manualMinutes || Number(manualMinutes) <= 0) return;
    setSaving(true);
    await addStudySession({
      lessonId,
      sessionDate: manualDate,
      durationMinutes: Number(manualMinutes),
      notes: notes || null,
    });
    setSaving(false);
    setManualMinutes('');
    setNotes('');
    onSaved?.();
    onClose();
  }

  const lessonSelect = (value, onChange) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
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
  );

  if (confirming) {
    const isStale = Number(manualMinutes) > STALE_THRESHOLD_MINUTES;
    return (
      <Modal open={open} onClose={onClose} title="Save study session">
        <form onSubmit={handleSaveTimerSession} className="space-y-4">
          {isStale && (
            <p className="text-sm bg-amber-soft text-amber rounded-lg px-3 py-2">
              This ran for {Math.floor(manualMinutes / 60)}h {manualMinutes % 60}m — that doesn't look right.
              Enter the actual time below if the timer was left running.
            </p>
          )}
          <div>
            <label className="block text-xs text-ink/60 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              required
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Date</label>
            <input
              type="date"
              required
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
          >
            Save
          </button>
        </form>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Record study">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('timer')}
          className={`text-sm px-3 py-1.5 rounded-lg ${tab === 'timer' ? 'bg-pine-soft text-pine-deep' : 'text-ink/60 border border-mist'}`}
        >
          Timer
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`text-sm px-3 py-1.5 rounded-lg ${tab === 'manual' ? 'bg-pine-soft text-pine-deep' : 'text-ink/60 border border-mist'}`}
        >
          Add manually
        </button>
      </div>

      {tab === 'timer' ? (
        timer ? (
          <div className="text-center space-y-4">
            <p className="font-display text-3xl">
              {String(Math.floor(elapsedMin / 60)).padStart(2, '0')}:{String(elapsedMin % 60).padStart(2, '0')}
            </p>
            <button
              onClick={handleStop}
              className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5"
            >
              Stop
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-ink/60 mb-1">Lektion</label>
              {lessonSelect(lessonId, setLessonId)}
            </div>
            <button
              onClick={handleStart}
              disabled={!lessonId}
              className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
            >
              Start
            </button>
          </div>
        )
      ) : (
        <form onSubmit={handleSaveManual} className="space-y-4">
          <div>
            <label className="block text-xs text-ink/60 mb-1">Lektion</label>
            {lessonSelect(lessonId, setLessonId)}
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              required
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Date</label>
            <input
              type="date"
              required
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
          >
            Save
          </button>
        </form>
      )}
    </Modal>
  );
}
