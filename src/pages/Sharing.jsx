import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listShareLinks, listTeachers, revokeShareLink } from '../lib/api';
import NewShareLinkModal from '../components/NewShareLinkModal';

export default function Sharing() {
  const [links, setLinks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    const [l, t] = await Promise.all([listShareLinks(), listTeachers()]);
    setLinks(l);
    setTeachers(t);
  }

  useEffect(() => {
    load();
  }, []);

  const teacherLinks = links.filter((l) => l.role === 'teacher_editor');
  const viewerLinks = links.filter((l) => l.role === 'viewer');

  function status(link) {
    if (link.revoked) return 'Revoked';
    if (link.expires_at && new Date(link.expires_at) < new Date()) return 'Expired';
    return 'Active';
  }

  function LinkCard({ link }) {
    return (
      <div className="border border-mist rounded-xl p-3 mb-2">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm">{link.label || link.teacher?.name || 'Untitled link'}</p>
          <span className="text-[11px] bg-pine-soft text-pine-deep px-2 py-0.5 rounded">
            {link.role === 'teacher_editor' ? 'Editor · Schedule only' : 'Viewer'}
          </span>
        </div>
        <p className="text-xs text-ink/50 mb-2">
          {link.expires_at ? `Expires ${new Date(link.expires_at).toLocaleDateString()}` : 'No expiry'} · {status(link)}
        </p>
        {!link.revoked && (
          <button
            onClick={async () => {
              await revokeShareLink(link.id);
              load();
            }}
            className="text-xs px-2 py-1 rounded border border-mist"
          >
            Revoke
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0 max-w-md md:max-w-none mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link to="/settings" className="text-ink/50">
          ←
        </Link>
        <p className="font-display text-lg">Sharing</p>
      </div>

      <section>
        <p className="text-xs text-ink/60 mb-2">Teachers</p>
        {teacherLinks.length === 0 && <p className="text-sm text-ink/40">None yet.</p>}
        {teacherLinks.map((l) => (
          <LinkCard key={l.id} link={l} />
        ))}
      </section>

      <section>
        <p className="text-xs text-ink/60 mb-2">Shared views</p>
        {viewerLinks.length === 0 && <p className="text-sm text-ink/40">None yet.</p>}
        {viewerLinks.map((l) => (
          <LinkCard key={l.id} link={l} />
        ))}
      </section>

      <button
        onClick={() => setCreateOpen(true)}
        className="w-full rounded-lg border border-mist text-sm font-medium py-2.5"
      >
        + New access link
      </button>

      <NewShareLinkModal open={createOpen} onClose={() => setCreateOpen(false)} teachers={teachers} onSaved={load} />
    </div>
  );
}
