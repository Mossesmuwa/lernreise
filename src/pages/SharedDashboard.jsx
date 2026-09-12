import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  claimShareLink,
  ensureShareSession,
  validateShareToken,
  getSharedDashboard,
} from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import JourneyPath from "../components/JourneyPath";
import SharedDashboardSkeleton from "../components/SharedDashboardSkeleton";

function relativeExpiry(expiresAt) {
  if (!expiresAt) return "No expiry";
  const days = Math.ceil((new Date(expiresAt) - new Date()) / 86_400_000);
  if (days <= 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function StatusMessage({ icon, title, subtitle, action }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-3 max-w-xs">
        <div className="w-12 h-12 rounded-full bg-card border border-mist flex items-center justify-center mx-auto text-xl">
          {icon}
        </div>
        <p className="font-display text-lg">{title}</p>
        {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
        {action}
      </div>
    </div>
  );
}

export default function SharedDashboard() {
  const { token } = useParams();
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState("loading"); // loading | invalid | error | ready
  const [data, setData] = useState(null);
  const [share, setShare] = useState(null);
  const [profile, setProfile] = useState(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      await ensureShareSession();
      const claimed = await claimShareLink(token);
      if (!claimed || claimed.role !== "viewer") {
        setState("invalid");
        return;
      }
      const validated = await validateShareToken(token);
      if (!validated || validated.role !== "viewer") {
        setState("invalid");
        return;
      }
      setShare(validated);
      const [dashboard, { data: publicProfile }] = await Promise.all([
        getSharedDashboard(token),
        supabase
          .from("public_profile")
          .select("display_name, avatar_url")
          .maybeSingle(),
      ]);
      setData(dashboard);
      setProfile(publicProfile);
      setState("ready");
    } catch (err) {
      console.error("Failed to load shared dashboard", err);
      setState("error");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") return <SharedDashboardSkeleton />;

  if (state === "invalid") {
    return (
      <StatusMessage
        icon="🔒"
        title="This link is no longer active"
        subtitle="It may have expired or been revoked. Ask for a new one if you still need access."
      />
    );
  }

  if (state === "error") {
    return (
      <StatusMessage
        icon="⚠️"
        title="This shared view could not open"
        subtitle="The link may need to be claimed again, Anonymous Sign-Ins may be disabled, or the share-link migration has not been applied."
        action={
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={load}
              className="text-sm text-pine underline underline-offset-2"
            >
              Retry
            </button>
            <Link
              to="/welcome"
              className="text-xs text-ink/50 underline underline-offset-2"
            >
              Return to Lernreise
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <motion.div
      className="p-4 max-w-md mx-auto space-y-5"
      variants={reduceMotion ? undefined : container}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div
        variants={reduceMotion ? undefined : item}
        className="flex items-center gap-2 bg-card border border-mist rounded-lg px-3 py-2"
      >
        <span aria-hidden="true">👁</span>
        <span className="text-sm text-ink/60 flex-1">
          Read-only shared view
        </span>
        <span className="text-xs text-ink/40">
          {relativeExpiry(share?.expires_at)}
        </span>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : item}
        className="flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-full bg-card border border-mist flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-mist"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
            </svg>
          )}
        </div>
        <p className="font-display text-lg">
          {profile?.display_name
            ? `${profile.display_name}'s German journey`
            : "German journey"}
        </p>
      </motion.div>

      <motion.div variants={reduceMotion ? undefined : item}>
        <JourneyPath levels={data.levels} />
      </motion.div>

      {data.current_course && (
        <motion.div
          variants={reduceMotion ? undefined : item}
          className="bg-card border border-mist rounded-xl p-4 flex gap-3 items-center"
        >
          <div className="w-10 h-13 rounded-md bg-paper border border-mist flex items-center justify-center flex-shrink-0 overflow-hidden">
            {data.current_course.cover_image_url ? (
              <img
                src={data.current_course.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-ink/30 text-xs">📖</span>
            )}
          </div>
          <div>
            <p className="text-xs text-ink/60">Currently learning</p>
            <p className="font-medium">{data.current_course.title}</p>
          </div>
        </motion.div>
      )}

      <motion.div
        variants={reduceMotion ? undefined : item}
        className="grid grid-cols-2 gap-2"
      >
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
      </motion.div>

      <motion.div variants={reduceMotion ? undefined : item}>
        <p className="text-xs text-ink/60 mb-2">Upcoming</p>
        {data.upcoming_classes.length === 0 && (
          <p className="text-sm text-ink/40">Nothing scheduled.</p>
        )}
        {data.upcoming_classes.map((c, i) => (
          <div
            key={i}
            className="flex justify-between py-2 border-b border-mist text-sm"
          >
            <span>
              {new Date(c.scheduled_at).toLocaleString([], {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {c.status === "rescheduled" && (
              <span className="text-[11px] bg-amber-soft text-amber px-2 py-0.5 rounded">
                Changed
              </span>
            )}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
