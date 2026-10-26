import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RequireAdmin() {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="fullpage-note">Memeriksa sesi...</div>;
  }
  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
