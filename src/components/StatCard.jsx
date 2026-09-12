export default function StatCard({ label, value, detail, tone = "default" }) {
  const toneClass = {
    default: "bg-card border-mist",
    accent: "bg-pine text-white border-pine",
    warm: "bg-amber-soft border-amber/20",
  }[tone];

  return (
    <div
      className={`rounded-xl border p-4 shadow-[var(--lr-shadow-soft)] ${toneClass}`}
    >
      <p
        className={`text-[11px] ${tone === "accent" ? "text-white/70" : "text-ink/60"}`}
      >
        {label}
      </p>
      <p className="font-display text-xl mt-1">{value}</p>
      {detail && (
        <p
          className={`text-[11px] mt-1 ${tone === "accent" ? "text-white/70" : "text-ink/50"}`}
        >
          {detail}
        </p>
      )}
    </div>
  );
}
