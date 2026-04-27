import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1} icon={<ChevronLeft className="w-3.5 h-3.5" />} />
      {pages[0] > 1 && (
        <>
          <PageBtn onClick={() => onPageChange(1)} label="1" />
          {pages[0] > 2 && <span className="px-1.5 text-[color:var(--muted)]">…</span>}
        </>
      )}
      {pages.map((p) => (
        <PageBtn key={p} onClick={() => onPageChange(p)} label={String(p)} active={p === page} />
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1.5 text-[color:var(--muted)]">…</span>}
          <PageBtn onClick={() => onPageChange(totalPages)} label={String(totalPages)} />
        </>
      )}
      <PageBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} icon={<ChevronRight className="w-3.5 h-3.5" />} />
    </div>
  );
}

function PageBtn({ onClick, disabled, label, active, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[36px] h-9 px-3 rounded-full text-[13px] font-medium transition flex items-center justify-center
        ${active
          ? "bg-ink text-paper"
          : "bg-card border border-rule text-ink hover:border-ink"}
        ${disabled ? "opacity-40 cursor-not-allowed hover:border-rule" : "cursor-pointer"}`}
    >
      {icon || label}
    </button>
  );
}
