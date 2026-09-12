import { Link } from "react-router-dom";
import { IconChevronLeft } from "./icons";

export default function BackButton({ to }) {
  return (
    <Link
      to={to}
      aria-label="Back"
      className="inline-flex items-center justify-center w-8 h-8 -ml-1.5 rounded-full text-ink/50 transition-colors hover:bg-paper hover:text-ink"
    >
      <IconChevronLeft />
    </Link>
  );
}
