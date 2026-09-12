import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import BackButton from "../components/BackButton";
import CopyField from "../components/CopyField";
import SharingSkeleton from "../components/SharingSkeleton";
import {
  listShareLinks,
  listTeachers,
  revokeShareLink,
  updateShareLink,
} from "../lib/api";
import NewShareLinkModal from "../components/NewShareLinkModal";
import PageHeader from "../components/PageHeader";

function relativeExpiry(expiresAt) {
  if (!expiresAt) return "No expiry";
  const days = Math.ceil((new Date(expiresAt) - new Date()) / 86_400_000);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

const list = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const row = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function Sharing() {
  const [links, setLinks] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editExpiry, setEditExpiry] = useState("");

  async function load() {
    const [l, t] = await Promise.all([listShareLinks(), listTeachers()]);
    setLinks(l);
    setTeachers(t);
  }

  useEffect(() => {
    load();
  }, []);

  if (links === null) return <SharingSkeleton />;

  const teacherLinks = links.filter((l) => l.role === "teacher_editor");
  const viewerLinks = links.filter((l) => l.role === "viewer");

  function visibleLinks(source) {
    return source.filter((link) => {
      const expired = link.expires_at && new Date(link.expires_at) < new Date();
      if (filter === "active") return !link.revoked && !expired;
      if (filter === "expired") return expired || link.revoked;
      return true;
    });
  }

  function status(link) {
    if (link.revoked) return "Revoked";
    if (link.expires_at && new Date(link.expires_at) < new Date())
      return "Expired";
    return "Active";
  }

  function LinkCard({ link }) {
    const path = link.role === "teacher_editor" ? "teacher" : "shared";
    const url = `${window.location.origin}/${path}/${link.token}`;
    const confirming = confirmingId === link.id;
    const accessCount = link.share_access_log?.length ?? 0;

    return (
      <motion.div
        variants={row}
        className="border border-mist rounded-xl p-3 mb-2 space-y-2"
      >
        <div className="flex justify-between items-center">
          <p className="text-sm">
            {link.label || link.teacher?.name || "Untitled link"}
          </p>
          <span className="text-[11px] bg-pine-soft text-pine-deep px-2 py-0.5 rounded">
            {link.role === "teacher_editor"
              ? "Editor · Schedule only"
              : "Viewer"}
          </span>
        </div>
        <p className="text-xs text-ink/50">
          {relativeExpiry(link.expires_at)} · {status(link)} · {accessCount}{" "}
          access{accessCount === 1 ? "" : "es"}
        </p>

        {editingId === link.id && !link.revoked ? (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={editExpiry}
              onChange={(event) => setEditExpiry(event.target.value)}
              className="flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            />
            <button
              onClick={async () => {
                await updateShareLink(link.id, {
                  expires_at: editExpiry
                    ? new Date(editExpiry).toISOString()
                    : null,
                });
                setEditingId(null);
                load();
              }}
              className="rounded-lg bg-pine px-3 py-2 text-xs text-white"
            >
              Save
            </button>
          </div>
        ) : null}

        {!link.revoked && (
          <>
            <CopyField value={url} label="Link" />
            {link.code && (
              <CopyField value={link.code} label="Code — enter at /access" />
            )}

            {editingId !== link.id && (
              <button
                onClick={() => {
                  setEditingId(link.id);
                  setEditExpiry(
                    link.expires_at ? link.expires_at.slice(0, 10) : "",
                  );
                }}
                className="text-xs px-2 py-1 rounded border border-mist"
              >
                Edit expiry
              </button>
            )}

            <AnimatePresence mode="wait">
              {confirming ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 overflow-hidden"
                >
                  <button
                    onClick={async () => {
                      await revokeShareLink(link.id);
                      setConfirmingId(null);
                      load();
                    }}
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-700"
                  >
                    Confirm revoke
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="text-xs px-2 py-1 rounded border border-mist"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="revoke"
                  onClick={() => setConfirmingId(link.id)}
                  className="text-xs px-2 py-1 rounded border border-mist"
                >
                  Revoke
                </motion.button>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <div className="p-4 md:p-0 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <BackButton to="/settings" />
      </div>
      <PageHeader
        eyebrow="Invite with confidence"
        title="Sharing"
        description="Give teachers or viewers the right level of access to your journey."
      />

      <section>
        <p className="text-xs text-ink/60 mb-2">Teachers</p>
        {visibleLinks(teacherLinks).length === 0 && (
          <p className="text-sm text-ink/40">None yet.</p>
        )}
        <motion.div variants={list} initial="hidden" animate="visible">
          {visibleLinks(teacherLinks).map((l) => (
            <LinkCard key={l.id} link={l} />
          ))}
        </motion.div>
      </section>

      <section>
        <p className="text-xs text-ink/60 mb-2">Shared views</p>
        {visibleLinks(viewerLinks).length === 0 && (
          <p className="text-sm text-ink/40">None yet.</p>
        )}
        <motion.div variants={list} initial="hidden" animate="visible">
          {visibleLinks(viewerLinks).map((l) => (
            <LinkCard key={l.id} link={l} />
          ))}
        </motion.div>
      </section>

      <div className="flex items-center justify-between rounded-xl border border-mist bg-card p-2">
        <p className="text-xs text-ink/50">{links.length} total links</p>
        <div className="flex gap-1">
          {["all", "active", "expired"].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-xs capitalize ${filter === value ? "bg-pine-soft text-pine-deep font-medium" : "text-ink/50"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setCreateOpen(true)}
        className="w-full rounded-lg border border-mist text-sm font-medium py-2.5"
      >
        + New access link
      </button>

      <NewShareLinkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        teachers={teachers}
        onSaved={load}
      />
    </div>
  );
}
