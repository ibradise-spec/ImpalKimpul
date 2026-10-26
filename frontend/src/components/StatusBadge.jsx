export default function StatusBadge({ status, inline = false }) {
  const taken = status === 'taken';
  return (
    <span className={`badge ${taken ? 'badge-taken' : 'badge-available'} ${inline ? 'badge-inline' : ''}`}>
      {taken ? 'Sudah Diambil' : 'Tersedia'}
    </span>
  );
}
