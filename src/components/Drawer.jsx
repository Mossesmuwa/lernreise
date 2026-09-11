export default function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 top-16 bg-card rounded-t-2xl p-5 overflow-y-auto
                   md:inset-y-0 md:right-0 md:left-auto md:top-0 md:w-96 md:rounded-none md:border-l md:border-mist"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink/50 text-xl leading-none px-2">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
