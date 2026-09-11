export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative w-full md:max-w-sm bg-card rounded-t-2xl md:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
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
