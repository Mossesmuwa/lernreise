import { useEffect, useState } from 'react';
import { getLevels, getCurrentCourse, markLevelComplete, setLevelCurrent } from '../lib/api';
import LessonDetailDrawer from '../components/LessonDetailDrawer';
import RecordStudyModal from '../components/RecordStudyModal';

const STATUS_MARK = { completed: '✓', in_progress: '●', not_started: '○' };

export default function Course() {
  const [levels, setLevels] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [recordLessonId, setRecordLessonId] = useState(null);

  async function load() {
    const [lvls, crs] = await Promise.all([getLevels(), getCurrentCourse()]);
    setLevels(lvls);
    setCurrentCourse(crs);
  }

  useEffect(() => {
    load();
  }, []);

  const allLessons = currentCourse?.modules?.flatMap((m) => m.lessons) ?? [];

  return (
    <div className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-3">
      <p className="font-display text-lg mb-1">Course</p>

      {levels.map((level) => {
        const isCurrent = level.status === 'current';
        const courseSummary = level.courses?.[0]; // title-only, from getLevels()

        if (!isCurrent) {
          return (
            <div key={level.id} className="flex items-center gap-3 bg-card border border-mist rounded-xl px-4 py-3 opacity-75">
              <span className="text-ink/40">{level.status === 'completed' ? '✓' : '○'}</span>
              <div className="flex-1">
                <p className="text-sm">
                  {level.name} {courseSummary ? `· ${courseSummary.title}` : ''}
                </p>
                <p className="text-xs text-ink/50 capitalize">{level.status.replace('_', ' ')}</p>
              </div>
              {level.status === 'not_started' && (
                <button
                  onClick={async () => {
                    await setLevelCurrent(level.id);
                    load();
                  }}
                  className="text-xs px-2 py-1 rounded border border-mist"
                >
                  Set as current
                </button>
              )}
            </div>
          );
        }

        return (
          <div key={level.id} className="border border-mist rounded-xl p-4 bg-card">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium">
                {level.name} {currentCourse ? `· ${currentCourse.title}` : ''}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-pine-soft text-pine-deep px-2 py-0.5 rounded">Current</span>
                <button
                  onClick={async () => {
                    await markLevelComplete(level.id);
                    load();
                  }}
                  className="text-xs px-2 py-1 rounded border border-mist"
                >
                  Mark complete
                </button>
              </div>
            </div>

            {currentCourse?.modules
              ?.slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((module) => (
                <div key={module.id} className="mb-2">
                  <p className="text-xs text-ink/60 mb-1">{module.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    {module.lessons
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={
                            lesson.status === 'in_progress' ? 'text-pine' : lesson.status === 'not_started' ? 'text-ink/40' : ''
                          }
                        >
                          {STATUS_MARK[lesson.status]} {lesson.name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        );
      })}

      <LessonDetailDrawer
        open={Boolean(selectedLessonId)}
        onClose={() => setSelectedLessonId(null)}
        lessonId={selectedLessonId}
        onChanged={load}
        onRecordStudy={(lessonId) => {
          setSelectedLessonId(null);
          setRecordLessonId(lessonId);
        }}
      />
      <RecordStudyModal
        open={Boolean(recordLessonId)}
        onClose={() => setRecordLessonId(null)}
        lessons={allLessons}
        defaultLessonId={recordLessonId}
        onSaved={load}
      />
    </div>
  );
}
