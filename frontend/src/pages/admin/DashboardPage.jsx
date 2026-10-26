import { Link } from 'react-router-dom';
import { fetchStats } from '../../api/admin.js';
import { useApi } from '../../hooks/useApi.js';

function StatCard({ label, value, loading }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{loading ? '-' : value}</strong>
    </div>
  );
}

export default function DashboardPage() {
  const { data, error, loading } = useApi((signal) => fetchStats(signal), []);
  const stats = data?.data;

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      {error && <p className="alert-error">{error.message}</p>}
      <div className="stats-grid">
        <StatCard label="TOTAL BARANG" value={stats?.total} loading={loading} />
        <StatCard label="BELUM DIAMBIL" value={stats?.available} loading={loading} />
        <StatCard label="SUDAH DIAMBIL" value={stats?.taken} loading={loading} />
      </div>
      <div className="quick-actions">
        <Link to="/admin/add-item" className="btn btn-primary">
          Tambah Barang Temuan
        </Link>
        <Link to="/admin/inventaris" className="btn btn-ghost">
          Lihat Inventaris
        </Link>
      </div>
    </>
  );
}
