import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [a1Institution, setA1Institution] = useState('');
  const [a1Teacher, setA1Teacher] = useState('');
  const [a1Start, setA1Start] = useState('');
  const [a1End, setA1End] = useState('');

  const [a2Title, setA2Title] = useState('');
  const [a2Teacher, setA2Teacher] = useState('');
  const [a2Start, setA2Start] = useState('');

  async function handleFinish(event) {
    event.preventDefault();
    setSaving(true);

    const { data: language } = await supabase
      .from('languages')
      .insert({ name: 'German', code: 'de', sort_order: 1 })
      .select()
      .single();

    const levelRows = [
      { name: 'A1', sort_order: 1, status: 'completed', language_id: language.id },
      { name: 'A2', sort_order: 2, status: 'current', language_id: language.id },
      { name: 'B1', sort_order: 3, status: 'not_started', language_id: language.id },
      { name: 'B2', sort_order: 4, status: 'not_started', language_id: language.id },
    ];
    const { data: levels } = await supabase.from('levels').insert(levelRows).select();
    const levelA1 = levels.find((l) => l.name === 'A1');
    const levelA2 = levels.find((l) => l.name === 'A2');

    if (a1Institution || a1Teacher) {
      let institutionId = null;
      if (a1Institution) {
        const { data: inst } = await supabase.from('institutions').insert({ name: a1Institution }).select().single();
        institutionId = inst.id;
      }
      if (a1Teacher) {
        await supabase.from('teachers').insert({ name: a1Teacher, institution_id: institutionId });
      }
      await supabase.from('courses').insert({
        level_id: levelA1.id,
        institution_id: institutionId,
        title: a1Institution || 'A1',
        status: 'completed',
        start_date: a1Start || null,
        end_date: a1End || null,
      });
    }

    let a2TeacherId = null;
    if (a2Teacher) {
      const { data: t } = await supabase.from('teachers').insert({ name: a2Teacher }).select().single();
      a2TeacherId = t.id;
    }
    const { data: courseA2 } = await supabase
      .from('courses')
      .insert({
        level_id: levelA2.id,
        title: a2Title || 'A2',
        status: 'current',
        start_date: a2Start || null,
      })
      .select()
      .single();

    const { data: module1 } = await supabase
      .from('modules')
      .insert({ course_id: courseA2.id, name: 'Module 1', sort_order: 1 })
      .select()
      .single();
    await supabase.from('lessons').insert({ module_id: module1.id, name: 'Lektion 1', sort_order: 1, status: 'in_progress' });

    setSaving(false);
    navigate('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-mist rounded-2xl p-8">
        <p className="font-display text-pine text-sm mb-6">Lernreise</p>
        <h1 className="font-display text-xl mb-1">Set up your journey</h1>
        <p className="text-sm text-ink/60 mb-6">Just once — this creates A1 through B2 and your starting course.</p>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-ink/70">First, your completed A1 (leave blank if not applicable).</p>
            <input
              placeholder="Institution (e.g. Goethe-Institut)"
              value={a1Institution}
              onChange={(e) => setA1Institution(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
            <input
              placeholder="Teacher"
              value={a1Teacher}
              onChange={(e) => setA1Teacher(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={a1Start}
                onChange={(e) => setA1Start(e.target.value)}
                className="flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={a1End}
                onChange={(e) => setA1End(e.target.value)}
                className="flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
              />
            </div>
            <button onClick={() => setStep(2)} className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5">
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleFinish} className="space-y-4">
            <p className="text-sm text-ink/70">Now your current A2 course.</p>
            <input
              required
              placeholder="Book/course title (e.g. Momente A2 Kursbuch)"
              value={a2Title}
              onChange={(e) => setA2Title(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
            <input
              placeholder="Teacher"
              value={a2Teacher}
              onChange={(e) => setA2Teacher(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={a2Start}
              onChange={(e) => setA2Start(e.target.value)}
              className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
            >
              {saving ? 'Setting up…' : 'Finish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
