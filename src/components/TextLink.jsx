import { Link } from "react-router-dom";
import { IconChevronRight } from "./icons";

export default function TextLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-0.5 text-xs text-pine"
    >
      {children}
      <IconChevronRight
        width={12}
        height={12}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  );
}
