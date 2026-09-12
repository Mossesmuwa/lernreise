export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-mist bg-card/60 px-6 py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-pine-soft text-pine mx-auto flex items-center justify-center text-lg">
        <span aria-hidden="true">+</span>
      </div>
      <p className="font-display text-lg mt-4">{title}</p>
      {description && (
        <p className="text-sm text-ink/60 mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
