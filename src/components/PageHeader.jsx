export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-pine mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl leading-tight text-ink">{title}</h1>
        {description && <p className="text-sm text-ink/60 mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
