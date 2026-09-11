import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { validateShareToken, getSharedDashboard } from '../lib/api';
import { supabase } from '../lib/supabaseClient';

const STATUS_MARK = { completed: '✓', current: '●', not_started: '○' };

export default function SharedDashboard() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | invalid | ready
  const [data, setData] = useState(null);
  const [share, setShare] = useState(null);
  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    (async () => {
      const validated = await validateShareToken(token);
      if (!validated || validated.role !== 'viewer') {
        setState('invalid');
        return;
      }
      setShare(validated);
      const [dashboard, { data: profile }] = await Promise.all([
        getSharedDashboard(token),
        supabase.from('public_profile').select('display_name').maybeSingle(),
      ]);
      setData(dashboard);
      setDisplayName(profile?.display_name);
      setState('ready');
    })();
  }, [token]);

  if (state === 'loading') return null;
  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-ink/60">This link is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-2 bg-card border border-mist rounded-lg px-3 py-2">
        <span className="text-sm text-ink/60 flex-1">Read-only shared view</span>
      </div>

      <p className="font-display text-lg">{displayName ? `${displayName}'s German journey` : 'German journey'}</p>

      <div className="flex gap-1.5">
        {data.levels.map((lvl) => (
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

      {data.current_course && (
        <div className="bg-card border border-mist rounded-xl p-4">
          <p className="text-xs text-ink/60 mb-1">Currently learning</p>
          <p className="font-medium">{data.current_course.title}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card border border-mist rounded-lg p-3">
          <p className="text-[11px] text-ink/60">This week</p>
          <p className="text-lg font-medium">
            {Math.floor(data.week_minutes / 60)}h {data.week_minutes % 60}m
          </p>
        </div>
        <div className="bg-card border border-mist rounded-lg p-3">
          <p className="text-[11px] text-ink/60">Total</p>
          <p className="text-lg font-medium">
            {Math.floor(data.total_minutes / 60)}h {data.total_minutes % 60}m
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-ink/60 mb-2">Upcoming</p>
        {data.upcoming_classes.length === 0 && <p className="text-sm text-ink/40">Nothing scheduled.</p>}
        {data.upcoming_classes.map((c, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-mist text-sm">
            <span>{new Date(c.scheduled_at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            {c.status === 'rescheduled' && (
              <span className="text-[11px] bg-amber-soft text-amber px-2 py-0.5 rounded">Changed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
