import { useEffect, useState } from 'react';
import { listStudySessions, listTeacherClasses } from '../lib/api';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState('all'); // all | study | classes
  const [search, setSearch] = useState('');

  useEffect(() => {
    listStudySessions({ search: search || undefined }).then(setSessions);
    listTeacherClasses({}).then(setClasses);
  }, [search]);

  const items = [
    ...sessions.map((s) => ({
      type: 'study',
      date: s.session_date,
      label: `Study · ${Math.floor(s.duration_minutes / 60)}h ${s.duration_minutes % 60}m`,
      sub: s.lesson?.name,
    })),
    ...classes
      .filter((c) => c.status === 'completed')
      .map((c) => ({
        type: 'classes',
        date: c.scheduled_at.slice(0, 10),
        label: `Teacher class${c.duration_minutes ? ` · ${c.duration_minutes}m` : ''}`,
        sub: `${c.lesson?.name} · ${c.teacher?.name}`,
      })),
  ]
    .filter((i) => filter === 'all' || i.type === filter)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const grouped = items.reduce((acc, item) => {
    (acc[item.date] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg">History</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notes…"
        className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
      />

      <div className="flex gap-2">
        {['all', 'study', 'classes'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg capitalize ${
              filter === f ? 'bg-pine-soft text-pine-deep' : 'border border-mist text-ink/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([date, dayItems]) => (
        <div key={date}>
          <p className="text-xs text-ink/60 mb-1">
            {new Date(date).toLocaleDateString([], { month: 'long', day: 'numeric' })}
          </p>
          {dayItems.map((item, i) => (
            <div key={i} className="py-1.5 border-b border-mist text-sm">
              <p>{item.label}</p>
              <p className="text-xs text-ink/50">{item.sub}</p>
            </div>
          ))}
        </div>
      ))}

      {items.length === 0 && <p className="text-sm text-ink/40">Nothing here yet.</p>}
    </div>
  );
}
