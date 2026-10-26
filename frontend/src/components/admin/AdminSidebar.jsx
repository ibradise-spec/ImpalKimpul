import { NavLink } from 'react-router-dom';
import { Archive, ClipboardList, Settings, SquarePlus } from 'lucide-react';

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <nav className="nav" aria-label="Menu admin">
        <NavLink to="/admin" end className="nav-item">
          <ClipboardList size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/admin/add-item" className="nav-item">
          <SquarePlus size={20} />
          Add Item
        </NavLink>
        <NavLink to="/admin/inventaris" className="nav-item">
          <Archive size={20} />
          Inventaris
        </NavLink>
        <NavLink to="/admin/pengaturan" className="nav-item">
          <Settings size={20} />
          Pengaturan
        </NavLink>
      </nav>
    </aside>
  );
}
