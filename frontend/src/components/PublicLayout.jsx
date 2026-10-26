import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Hero from './Hero.jsx';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const showSearch = pathname === '/' || pathname.startsWith('/items/');

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        {showSearch && <Hero />}
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
