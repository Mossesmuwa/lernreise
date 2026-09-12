import { useState } from "react";
import { motion } from "motion/react";
import Modal from "./Modal";
import CopyField from "./CopyField";
import { createShareLink } from "../lib/api";

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
  const [format, setFormat] = useState("link"); // link | code | both
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

  function handleClose() {
    setCreated(null);
    setLabel("");
    setExpiresAt("");
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
          {created.code && (
            <CopyField value={created.code} label="Code — enter at /access" />
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
          <label className="block text-xs text-ink/60 mb-1">
            Who is this for?
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          >
            <option value="viewer">Someone to view your progress</option>
            <option value="teacher_editor">
              A teacher, to manage their own schedule
            </option>
          </select>
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

        <div>
          <label className="block text-xs text-ink/60 mb-1">Share as</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          >
            <option value="link">Link only</option>
            <option value="code">Code only</option>
            <option value="both">Both</option>
          </select>
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
