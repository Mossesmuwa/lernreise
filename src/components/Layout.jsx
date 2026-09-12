import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { signOut } from '../features/auth/authApi';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/course', label: 'Course' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/history', label: 'History' },
];

export default function Layout() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-mist md:bg-card md:px-4 md:py-6 md:sticky md:top-0 md:h-screen">
        <p className="font-display text-pine text-lg mb-8 px-2">Lernreise</p>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-pine-soft text-pine-deep font-medium' : 'text-ink/70 hover:bg-paper'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/settings" className="rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-paper">
          Settings
        </Link>
        {session && (
          <button
            onClick={signOut}
            className="text-left rounded-lg px-3 py-2 text-sm text-ink/50 hover:bg-paper"
          >
            Sign out
          </button>
        )}
      </aside>

      {/* Mobile top bar with settings icon — hidden on desktop */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-mist bg-card">
        <p className="font-display text-pine text-base">Lernreise</p>
        <Link to="/settings" aria-label="Settings" className="text-ink/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
          </svg>
        </Link>
      </header>

      <div className="flex-1 min-w-0">
        <main className="pb-20 md:pb-6 md:px-8 md:py-6 md:max-w-3xl">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-mist flex justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `text-xs px-3 py-1 ${isActive ? 'text-pine font-medium' : 'text-ink/50'}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
