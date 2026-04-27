export default function ConfirmModal({ isOpen, title, message, confirmLabel = "Confirm", confirmClass = "bg-red-600 hover:bg-red-700", onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-[22px] text-ink">{title}</h3>
        {message && <p className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{message}</p>}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center px-5 py-2.5 rounded-full text-paper text-sm font-medium transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
