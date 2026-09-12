import { useState } from "react";
import { motion } from "motion/react";
import Modal from "./Modal";
import CopyField from "./CopyField";
import SegmentedControl from "./SegmentedControl";
import { createShareLink } from "../lib/api";

const ROLE_OPTIONS = [
  {
    value: "viewer",
    title: "Viewer",
    subtitle: "Someone to see your progress, read-only",
  },
  {
    value: "teacher_editor",
    title: "Teacher",
    subtitle: "Can manage their own class schedule only",
  },
];

export default function NewShareLinkModal({
  open,
  onClose,
  teachers,
  onSaved,
}) {
  const [role, setRole] = useState("viewer");
  const [teacherId, setTeacherId] = useState(teachers?.[0]?.id || "");
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [format, setFormat] = useState("both"); // defaults to both, so a code always exists if wanted
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const link = await createShareLink({
      role,
      teacherId: role === "teacher_editor" ? teacherId : null,
      label: label || null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      withCode: format !== "link",
    });
    setSaving(false);
    setCreated(link);
    onSaved?.();
  }

  function reset() {
    setCreated(null);
    setLabel("");
    setExpiresAt("");
    setRole("viewer");
    setFormat("both");
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (created) {
    const path = created.role === "teacher_editor" ? "teacher" : "shared";
    const url = `${window.location.origin}/${path}/${created.token}`;
    return (
      <Modal open={open} onClose={handleClose} title="Access created">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          <p className="text-sm text-ink/70">
            Send this to whoever should have access.
          </p>
          <CopyField value={url} label="Link" />
          {created.code ? (
            <CopyField value={created.code} label="Code — enter at /access" />
          ) : (
            <p className="text-xs text-ink/40">
              No code for this one — link only, as chosen.
            </p>
          )}
          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 mt-2"
          >
            Done
          </button>
        </motion.div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="New access link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ink/60 mb-2">
            Who is this for?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  role === opt.value
                    ? "border-pine bg-pine-soft"
                    : "border-mist bg-paper"
                }`}
              >
                <p
                  className={`text-sm font-medium ${role === opt.value ? "text-pine-deep" : ""}`}
                >
                  {opt.title}
                </p>
                <p className="text-[11px] text-ink/50 mt-0.5">{opt.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        {role === "teacher_editor" && (
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
          <label className="block text-xs text-ink/60 mb-1">
            Label (optional)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="For Mom"
            className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-ink/60">Share as</label>
          <SegmentedControl
            name="share-format"
            value={format}
            onChange={setFormat}
            options={[
              { value: "link", label: "Link" },
              { value: "code", label: "Code" },
              { value: "both", label: "Both" },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs text-ink/60 mb-1">
            Expires (leave blank for no expiry)
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-pine text-white text-sm font-medium py-2.5 disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create"}
        </button>
      </form>
    </Modal>
  );
}
