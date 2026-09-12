import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-md rounded-2xl border border-mist bg-card p-8 text-center shadow-[var(--lr-shadow-soft)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-pine mb-3">
          Lernreise
        </p>
        <PageHeader
          title="This page has moved"
          description="The address may be incorrect, expired, or no longer available."
        />
        <Link
          to="/welcome"
          className="inline-flex rounded-xl bg-pine px-4 py-2.5 text-sm font-medium text-white hover:bg-pine-deep"
        >
          Back to Lernreise
        </Link>
      </div>
    </div>
  );
}
