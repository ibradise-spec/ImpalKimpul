import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SettingsPage() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <>
      <h1 className="page-title">Pengaturan</h1>
      <div className="panel">
        <h2>Akun</h2>
        <dl className="account-list">
          <dt>Nama</dt>
          <dd>{admin?.name || '-'}</dd>
          <dt>Email</dt>
          <dd>{admin?.email}</dd>
          <dt>Peran</dt>
          <dd>Admin</dd>
        </dl>
        <button type="button" className="btn btn-ghost" onClick={onLogout}>
          Keluar
        </button>
      </div>
    </>
  );
}
