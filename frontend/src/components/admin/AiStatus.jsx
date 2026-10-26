import { LoaderCircle, Sparkles, TriangleAlert } from 'lucide-react';

export default function AiStatus({ ai }) {
  if (ai.status === 'idle') return null;

  if (ai.status === 'loading') {
    return (
      <p className="ai-status" role="status">
        <LoaderCircle size={18} className="ai-spin" aria-hidden="true" />
        Mengenali foto...
      </p>
    );
  }

  if (ai.status === 'unavailable') {
    return (
      <p className="ai-status ai-status-warn" role="status">
        <TriangleAlert size={18} aria-hidden="true" />
        AI tidak tersedia saat ini. Isi detail secara manual.
      </p>
    );
  }

  if (ai.status === 'none') {
    return (
      <p className="ai-status ai-status-warn" role="status">
        <TriangleAlert size={18} aria-hidden="true" />
        AI tidak mengenali objek di foto. Isi detail secara manual.
      </p>
    );
  }

  const { draft } = ai;
  const percent = Math.round((draft.aiConfidence ?? 0) * 100);
  return (
    <div className={`ai-status ${draft.lowConfidence ? 'ai-status-warn' : ''}`} role="status">
      {draft.lowConfidence ? <TriangleAlert size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
      <div className="ai-status-lines">
        <span>
          AI mengisi otomatis: {draft.name} ({percent}%). Periksa dan ubah jika perlu.
        </span>
        {draft.lowConfidence && <span>Keyakinan AI rendah, periksa kembali semua isian.</span>}
        {draft.colorName && !draft.colorId && (
          <span>Warna terdeteksi {draft.colorName}, tetapi belum tersedia di daftar warna.</span>
        )}
      </div>
    </div>
  );
}
