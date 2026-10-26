import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Halaman tidak ditemukan.</p>
      <Link to="/" className="link-inline">
        Kembali ke katalog
      </Link>
    </div>
  );
}
