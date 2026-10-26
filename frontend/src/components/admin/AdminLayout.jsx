import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader.jsx';
import AdminSidebar from './AdminSidebar.jsx';

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminHeader />
      <div className="admin-body">
        <AdminSidebar />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
