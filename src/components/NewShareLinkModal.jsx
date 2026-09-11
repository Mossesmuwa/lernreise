import { useState } from 'react';
import Modal from './Modal';
import { createShareLink } from '../lib/api';

export default function NewShareLinkModal({ open, onClose, teachers, onSaved }) {
  const [role, setRole] = useState('viewer');
  const [teacherId, setTeacherId] = useState(teachers?.[0]?.id || '');
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [format, setFormat] = useState('link'); // link | code | both
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    await createShareLink({
      role,
      teacherId: role === 'teacher_editor' ? teacherId : null,
      label: label || null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      withCode: format !== 'link',
    });
    setSaving(false);
    onSaved?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New access link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-ink/60 mb-1">Who is this for?</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          >
            <option value="viewer">Someone to view your progress</option>
            <option value="teacher_editor">A teacher, to manage their own schedule</option>
          </select>
        </div>

        {role === 'teacher_editor' && (
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
          <label className="block text-xs text-ink/60 mb-1">Label (optional)</label>
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
          <label className="block text-xs text-ink/60 mb-1">Expires (leave blank for no expiry)</label>
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
          Create
        </button>
      </form>
    </Modal>
  );
}
