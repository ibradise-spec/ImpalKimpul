import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.jsx';
import { ToastProvider } from '../../context/ToastContext.jsx';

export default function AdminRoot() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </ToastProvider>
  );
}
