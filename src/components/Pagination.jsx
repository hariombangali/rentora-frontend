export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      <PageBtn onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="←" />
      {pages[0] > 1 && (
        <>
          <PageBtn onClick={() => onPageChange(1)} label="1" />
          {pages[0] > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}
      {pages.map((p) => (
        <PageBtn key={p} onClick={() => onPageChange(p)} label={String(p)} active={p === page} />
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
          <PageBtn onClick={() => onPageChange(totalPages)} label={String(totalPages)} />
        </>
      )}
      <PageBtn onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} label="→" />
    </div>
  );
}

function PageBtn({ onClick, disabled, label, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition
        ${active ? "bg-blue-600 text-white shadow" : "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {label}
    </button>
  );
}
