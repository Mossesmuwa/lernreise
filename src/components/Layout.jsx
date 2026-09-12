import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { signOut } from "../features/auth/authApi";
import { getPublicProfile } from "../features/account/accountApi";
import {
  IconBook,
  IconCalendar,
  IconHistory,
  IconHome,
  IconSettings,
} from "./icons";

const navItems = [
  { to: "/", label: "Dashboard", end: true, icon: IconHome },
  { to: "/course", label: "Course", icon: IconBook },
  { to: "/calendar", label: "Calendar", icon: IconCalendar },
  { to: "/history", label: "History", icon: IconHistory },
];

export default function Layout() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getPublicProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  return (
    <div className="min-h-screen md:flex bg-paper">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:bg-[#e8eeea] md:px-5 md:py-7 md:sticky md:top-0 md:h-screen">
        <div className="px-3 mb-10">
          <p className="font-display text-pine-deep text-2xl leading-none">Lernreise</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40 mt-2">Your learning studio</p>
        </div>
        <p className="px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-ink/35 mb-3">Workspace</p>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  isActive
                    ? "bg-white/75 text-pine-deep font-medium shadow-[0_5px_18px_rgba(31,46,41,0.06)]"
                    : "text-ink/60 hover:bg-white/55 hover:text-ink"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink/10 pt-4 mt-6">
          <Link to="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/60 hover:bg-white/55 hover:text-ink">
            <IconSettings size={17} />
            Settings
          </Link>
          {session && (
            <button onClick={signOut} className="w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 text-sm text-ink/40 hover:bg-white/55 hover:text-ink">
              <span className="w-[17px]" />
              Sign out
            </button>
          )}
        </div>
        <Link to="/settings" className="mt-5 flex items-center gap-3 rounded-2xl bg-white/55 border border-white/70 p-3 hover:bg-white/80">
          <div className="w-9 h-9 rounded-full bg-pine-soft border border-white flex items-center justify-center overflow-hidden text-pine font-display">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile?.display_name?.[0] || "L")}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile?.display_name || "Your profile"}</p>
            <p className="text-[11px] text-ink/45 truncate">Personal account</p>
          </div>
        </Link>
      </aside>

      {/* Mobile top bar with settings icon — hidden on desktop */}
      <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-mist bg-card">
        <div>
          <p className="font-display text-pine-deep text-lg leading-none">Lernreise</p>
          <p className="text-[9px] uppercase tracking-[0.16em] text-ink/40 mt-1">Learning studio</p>
        </div>
        <Link to="/settings" aria-label="Settings" className="text-ink/60">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
          </svg>
        </Link>
      </header>

      <div className="flex-1 min-w-0">
        <main className="pb-24 md:pb-10 md:px-10 md:py-9 md:max-w-5xl">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-mist flex justify-around py-2.5 z-20 shadow-[0_-8px_24px_rgba(31,46,41,0.06)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] px-4 py-1.5 rounded-xl ${isActive ? "bg-pine-soft text-pine-deep font-medium" : "text-ink/50"}`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
