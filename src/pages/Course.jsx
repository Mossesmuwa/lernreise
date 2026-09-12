import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  getLevels,
  getCurrentCourse,
  markLevelComplete,
  setLevelCurrent,
} from "../lib/api";
import { IconChevronRight } from "../components/icons";
import LessonDetailDrawer from "../components/LessonDetailDrawer";
import LevelDetailDrawer from "../components/LevelDetailDrawer";
import RecordStudyModal from "../components/RecordStudyModal";
import CourseSkeleton from "../components/CourseSkeleton";
import PageHeader from "../components/PageHeader";

const STATUS_MARK = { completed: "✓", in_progress: "●", not_started: "○" };

const list = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const row = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function Course() {
  const [status, setStatus] = useState("loading");
  const [levels, setLevels] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [recordLessonId, setRecordLessonId] = useState(null);
  const [selectedLevelId, setSelectedLevelId] = useState(null);

  async function load() {
    setStatus("loading");
    try {
      const [lvls, crs] = await Promise.all([getLevels(), getCurrentCourse()]);
      setLevels(lvls);
      setCurrentCourse(crs);
      setStatus("ready");
    } catch (err) {
      console.error("Failed to load course data", err);
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <CourseSkeleton />;
  if (status === "error") {
    return (
      <div className="p-4 max-w-md mx-auto text-center space-y-3 pt-10">
        <p className="font-display text-lg">Something went wrong</p>
        <button
          onClick={load}
          className="text-sm text-pine underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const allLessons = currentCourse?.modules?.flatMap((m) => m.lessons) ?? [];

  return (
    <motion.div
      variants={list}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-0 max-w-4xl mx-auto space-y-4"
    >
      <PageHeader
        eyebrow="Your learning path"
        title="Course"
        description="Move through each level at your own pace."
      />

      {levels.map((level) => {
        const isCurrent = level.status === "current";
        const courseSummary = level.courses?.[0]; // title-only, from getLevels()

        if (!isCurrent) {
          return (
            <motion.button
              key={level.id}
              variants={row}
              onClick={() => setSelectedLevelId(level.id)}
              className="w-full flex items-center gap-3 bg-card border border-mist rounded-xl px-4 py-3 opacity-75 text-left hover:opacity-100 transition-opacity"
            >
              <span className="text-ink/40">
                {level.status === "completed" ? "✓" : "○"}
              </span>
              <div className="flex-1">
                <p className="text-sm">
                  {level.name} {courseSummary ? `· ${courseSummary.title}` : ""}
                </p>
                <p className="text-xs text-ink/50 capitalize">
                  {level.status.replace("_", " ")}
                </p>
              </div>
              {level.status === "not_started" || level.status === "completed" ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await setLevelCurrent(level.id);
                    load();
                  }}
                  className="text-xs px-2 py-1 rounded border border-mist"
                >
                  {level.status === "completed" ? "Reopen level" : "Set as current"}
                </span>
              ) : (
                <IconChevronRight className="text-ink/30" />
              )}
            </motion.button>
          );
        }

        return (
          <motion.div
            key={level.id}
            variants={row}
            className="border border-mist rounded-xl p-4 bg-card"
          >
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium">
                {level.name} {currentCourse ? `· ${currentCourse.title}` : ""}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-pine-soft text-pine-deep px-2 py-0.5 rounded">
                  Current
                </span>
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
                            lesson.status === "in_progress"
                              ? "text-pine"
                              : lesson.status === "not_started"
                                ? "text-ink/40"
                                : ""
                          }
                        >
                          {STATUS_MARK[lesson.status]} {lesson.name}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </motion.div>
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
      <LevelDetailDrawer
        open={Boolean(selectedLevelId)}
        onClose={() => setSelectedLevelId(null)}
        levelId={selectedLevelId}
      />
      <RecordStudyModal
        open={Boolean(recordLessonId)}
        onClose={() => setRecordLessonId(null)}
        lessons={allLessons}
        defaultLessonId={recordLessonId}
        onSaved={load}
      />
    </motion.div>
  );
}
