import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavRow from "../components/NavRow";
import Toggle from "../components/Toggle";
import SegmentedControl from "../components/SegmentedControl";
import SettingsSkeleton from "../components/SettingsSkeleton";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import {
  getSettings,
  updateSettings,
  getPublicProfile,
  updatePublicProfile,
  listStudySessions,
  listTeacherClasses,
} from "../lib/api";

function toCSV(sessions, classes) {
  const rows = [
    ["type", "date", "duration_minutes", "lesson", "teacher", "notes"],
  ];
  sessions.forEach((s) =>
    rows.push([
      "study",
      s.session_date,
      s.duration_minutes,
      s.lesson?.name ?? "",
      "",
      s.notes ?? "",
    ]),
  );
  classes.forEach((c) =>
    rows.push([
      "class",
      c.scheduled_at.slice(0, 10),
      c.duration_minutes ?? "",
      c.lesson?.name ?? "",
      c.teacher?.name ?? "",
      c.notes ?? "",
    ]),
  );
  return rows
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

function SavedFlash({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-xs text-pine"
        >
          Saved
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function Settings() {
  const { session } = useAuth();
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    getPublicProfile().then((p) => {
      setProfile(p);
      setDisplayName(p?.display_name ?? "");
    });
  }, []);

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  async function handleThemeChange(theme) {
    setSettings((s) => ({ ...s, theme }));
    applyTheme(theme);
    await updateSettings({ theme });
  }

  async function handleLangChange(ui_language) {
    setSettings((s) => ({ ...s, ui_language }));
    await updateSettings({ ui_language });
  }

  async function handleReminderChange(remind_before_minutes) {
    setSettings((s) => ({ ...s, remind_before_minutes }));
    await updateSettings({
      remind_before_minutes: Number(remind_before_minutes),
    });
  }

  async function handleWeeklyToggle(next) {
    setSettings((s) => ({ ...s, weekly_summary_enabled: next }));
    await updateSettings({ weekly_summary_enabled: next });
  }

  async function handleSaveDisplayName() {
    await updatePublicProfile({ display_name: displayName });
    setProfile((p) => ({ ...p, display_name: displayName }));
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 1500);
  }

  async function handlePasswordChange(event) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordError(Boolean(error));
    setPasswordMsg(error ? "Something went wrong." : "Password updated.");
    setNewPassword("");
    setTimeout(() => setPasswordMsg(null), 2500);
  }

  async function handleExport() {
    const [sessions, classes] = await Promise.all([
      listStudySessions({}),
      listTeacherClasses({}),
    ]);
    const blob = new Blob([toCSV(sessions, classes)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lernreise-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!settings || !profile) return <SettingsSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-6"
    >
      <p className="font-display text-lg">Settings</p>

      <section>
        <p className="text-xs text-ink/60 mb-2">Account</p>
        <div className="bg-card border border-mist rounded-xl p-4 space-y-3">
          <p className="text-sm">{session?.user?.email}</p>
          <div>
            <label className="block text-xs text-ink/60 mb-1">
              Display name
            </label>
            <div className="flex gap-2 items-center">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
              />
              <button
                onClick={handleSaveDisplayName}
                className="text-sm px-3 py-2 rounded-lg border border-mist"
              >
                Save
              </button>
              <SavedFlash show={nameSaved} />
            </div>
          </div>
          <form
            onSubmit={handlePasswordChange}
            className="flex gap-2 items-center"
          >
            <input
              type="password"
              placeholder="New password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="text-sm px-3 py-2 rounded-lg border border-mist"
            >
              Change
            </button>
          </form>
          <AnimatePresence>
            {passwordMsg && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-xs ${passwordError ? "text-red-700" : "text-pine"}`}
              >
                {passwordMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section>
        <p className="text-xs text-ink/60 mb-2">Appearance</p>
        <div className="bg-card border border-mist rounded-xl divide-y divide-mist">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm">Theme</span>
            <SegmentedControl
              name="theme"
              value={settings.theme}
              onChange={handleThemeChange}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm">Language</span>
            <SegmentedControl
              name="lang"
              value={settings.ui_language}
              onChange={handleLangChange}
              options={[
                { value: "de", label: "Deutsch" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <NavRow
          to="/settings/sharing"
          label="Sharing"
          subtitle="Access links for viewers and teachers"
        />
        <NavRow
          to="/settings/trash"
          label="Trash"
          subtitle="Restore deleted sessions and classes"
        />
      </div>

      <section>
        <p className="text-xs text-ink/60 mb-2">Notifications</p>
        <div className="bg-card border border-mist rounded-xl divide-y divide-mist">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm">Class reminders</span>
            <select
              value={settings.remind_before_minutes}
              onChange={(e) => handleReminderChange(e.target.value)}
              className="text-sm bg-transparent"
            >
              <option value={15}>15 min before</option>
              <option value={30}>30 min before</option>
              <option value={60}>60 min before</option>
              <option value={120}>2 hours before</option>
            </select>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm">Weekly summary</span>
            <Toggle
              checked={settings.weekly_summary_enabled}
              onChange={handleWeeklyToggle}
              label="Weekly summary emails"
            />
          </div>
        </div>
      </section>

      <button
        onClick={handleExport}
        className="w-full rounded-lg border border-mist text-sm font-medium py-2.5"
      >
        Export data (CSV)
      </button>
      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full rounded-lg border border-mist text-sm font-medium py-2.5 text-red-700"
      >
        Sign out
      </button>
    </motion.div>
  );
}
