import { Link } from "react-router-dom";
import { IconChevronRight } from "./icons";

export default function NavRow({ to, label, subtitle }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between bg-card border border-mist rounded-xl px-4 py-3 transition-colors hover:border-pine/40"
    >
      <div>
        <p className="text-sm">{label}</p>
        {subtitle && <p className="text-xs text-ink/50">{subtitle}</p>}
      </div>
      <IconChevronRight className="text-ink/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-pine" />
    </Link>
  );
}
