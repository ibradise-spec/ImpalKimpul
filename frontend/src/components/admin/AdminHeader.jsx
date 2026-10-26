import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useClickOutside } from '../../hooks/useClickOutside.js';

export default function AdminHeader() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  async function onLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <header className="admin-header">
      <div className="admin-brand">
        <div className="brand-name">LostNFound</div>
        <div className="brand-sub">Telkom University Surabaya</div>
      </div>
      <div className="admin-actions" ref={ref}>
        <button type="button" className="icon-circle" aria-label="Notifikasi">
          <Bell size={20} />
        </button>
        <button
          type="button"
          className="icon-circle"
          aria-label="Menu akun"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <User size={20} />
        </button>
        {open && (
          <div className="popover" role="menu">
            <div className="popover-info">
              <strong>{admin?.name || 'Admin'}</strong>
              <span>{admin?.email}</span>
            </div>
            <button type="button" role="menuitem" onClick={onLogout}>
              <LogOut size={16} /> Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
