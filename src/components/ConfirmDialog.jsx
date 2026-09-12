import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
}) {
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title}>
      <p className="text-sm text-ink/70">{description}</p>
      <div className="flex gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="flex-1 rounded-xl border border-mist py-2.5 text-sm disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50 ${danger ? "bg-red-700" : "bg-pine"}`}
        >
          {busy ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
