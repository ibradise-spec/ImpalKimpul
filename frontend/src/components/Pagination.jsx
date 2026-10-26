export default function Pagination({ meta, onChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      <button type="button" disabled={meta.page <= 1} onClick={() => onChange(meta.page - 1)}>
        Sebelumnya
      </button>
      <span>
        Halaman {meta.page} dari {meta.totalPages}
      </span>
      <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => onChange(meta.page + 1)}>
        Berikutnya
      </button>
    </nav>
  );
}
