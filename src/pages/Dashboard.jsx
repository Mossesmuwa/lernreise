import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLevels, getCurrentCourse, listStudySessions, listTeacherClasses, listTeachers } from '../lib/api';
import RecordStudyModal from '../components/RecordStudyModal';
import AddEditClassModal from '../components/AddEditClassModal';
import ClassDetailDrawer from '../components/ClassDetailDrawer';

const STATUS_MARK = { completed: '✓', current: '●', not_started: '○' };

function startOfWeekISO() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
function startOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function fmtHM(min) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export default function Dashboard() {
  const [levels, setLevels] = useState([]);
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [recordOpen, setRecordOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  async function load() {
    const [lvls, crs, monthSessions, everySessionEver, clsList, tchrs] = await Promise.all([
      getLevels(),
      getCurrentCourse(),
      listStudySessions({ from: startOfMonthISO() }),
      listStudySessions({}),
      listTeacherClasses({ from: new Date().toISOString() }),
      listTeachers(),
    ]);
    setLevels(lvls);
    setCourse(crs);
    setSessions(monthSessions);
    setAllSessions(everySessionEver);
    setClasses(clsList);
    setTeachers(tchrs);
  }

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeekISO();

  const todayMin = sessions.filter((s) => s.session_date === today).reduce((a, s) => a + s.duration_minutes, 0);
  const weekMin = sessions.filter((s) => s.session_date >= weekStart).reduce((a, s) => a + s.duration_minutes, 0);
  const monthMin = sessions.reduce((a, s) => a + s.duration_minutes, 0);
  const totalMin = allSessions.reduce((a, s) => a + s.duration_minutes, 0);

  const allLessons = course?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentLesson = allLessons.find((l) => l.status === 'in_progress');
  const completedCount = allLessons.filter((l) => l.status === 'completed').length;
  const progressPct = allLessons.length ? Math.round((completedCount / allLessons.length) * 100) : 0;

  const todaysClasses = classes.filter((c) => c.scheduled_at.slice(0, 10) === today);
  const upcoming = classes.filter((c) => c.scheduled_at.slice(0, 10) !== today).slice(0, 3);

  return (
    <div className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink/60">Guten Tag</p>
          <p className="font-display text-lg">Your German journey</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className={`flex-1 text-center py-2 rounded-lg ${lvl.status === 'current' ? 'bg-pine-soft' : 'bg-card border border-mist'}`}
          >
            <p className={`text-[11px] ${lvl.status === 'current' ? 'text-pine-deep' : 'text-ink/50'}`}>{lvl.name}</p>
            <p className={`text-sm mt-0.5 ${lvl.status === 'current' ? 'text-pine' : 'text-ink/40'}`}>
              {STATUS_MARK[lvl.status]}
            </p>
          </div>
        ))}
      </div>

      {course && (
        <div className="bg-card border border-mist rounded-xl p-4">
          <p className="text-xs text-ink/60 mb-2">Currently learning</p>
          <div className="flex gap-3 items-center">
            <div className="w-11 h-14 rounded-md bg-paper border border-mist flex items-center justify-center flex-shrink-0 overflow-hidden">
              {course.cover_image_url ? (
                <img src={course.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-ink/30 text-xs">📖</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{course.title}</p>
              <p className="text-sm text-ink/60 mb-2">
                {currentLesson?.name ?? '—'} · {currentLesson ? 'in progress' : ''}
              </p>
              <div className="h-1.5 bg-paper rounded-full overflow-hidden">
                <div className="h-full bg-pine" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {[
          ['Today', todayMin],
          ['This week', weekMin],
          ['This month', monthMin],
          ['Total', totalMin],
        ].map(([label, min]) => (
          <div key={label} className="bg-card border border-mist rounded-lg p-3">
            <p className="text-[11px] text-ink/60">{label}</p>
            <p className="text-lg font-medium">{fmtHM(min)}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs text-ink/60 mb-2">Today</p>
        {sessions
          .filter((s) => s.session_date === today)
          .map((s) => (
            <div key={s.id} className="py-2 border-b border-mist text-sm">
              {fmtHM(s.duration_minutes)} studied · {s.lesson?.name}
            </div>
          ))}
        {todaysClasses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c)}
            className="w-full text-left py-2 border-b border-mist text-sm"
          >
            German class · {new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
            {c.lesson?.name}
          </button>
        ))}
        {sessions.filter((s) => s.session_date === today).length === 0 && todaysClasses.length === 0 && (
          <p className="text-sm text-ink/40 py-2">Nothing yet today.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-ink/60">Upcoming</p>
          <Link to="/calendar" className="text-xs text-pine">
            View calendar →
          </Link>
        </div>
        {upcoming.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c)}
            className="w-full flex justify-between items-center text-left py-2 border-b border-mist text-sm"
          >
            <span>
              {new Date(c.scheduled_at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
              {new Date(c.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {c.status === 'rescheduled' && (
              <span className="text-[11px] bg-amber-soft text-amber px-2 py-0.5 rounded">Changed</span>
            )}
          </button>
        ))}
        {upcoming.length === 0 && <p className="text-sm text-ink/40 py-2">Nothing scheduled.</p>}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setRecordOpen(true)}
          className="flex-1 rounded-lg bg-pine text-white text-sm font-medium py-2.5"
        >
          + Record study
        </button>
        <button
          onClick={() => setAddClassOpen(true)}
          className="flex-1 rounded-lg border border-mist text-sm font-medium py-2.5"
        >
          Add class
        </button>
      </div>

      <RecordStudyModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        lessons={allLessons}
        defaultLessonId={currentLesson?.id}
        onSaved={load}
      />
      <AddEditClassModal
        open={addClassOpen}
        onClose={() => setAddClassOpen(false)}
        lessons={allLessons}
        teachers={teachers}
        onSaved={load}
      />
      <ClassDetailDrawer
        open={Boolean(selectedClass)}
        onClose={() => setSelectedClass(null)}
        klass={selectedClass}
        onEdit={(c) => {
          setSelectedClass(null);
          setEditingClass(c);
        }}
        onSaved={load}
      />
      {editingClass && (
        <AddEditClassModal
          open={Boolean(editingClass)}
          onClose={() => setEditingClass(null)}
          lessons={allLessons}
          teachers={teachers}
          existingClass={editingClass}
          onSaved={load}
        />
      )}
    </div>
  );
}
