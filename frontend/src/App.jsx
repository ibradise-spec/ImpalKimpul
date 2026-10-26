import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import AdminRoot from './components/admin/AdminRoot.jsx';
import RequireAdmin from './components/admin/RequireAdmin.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ItemDetailPage from './pages/ItemDetailPage.jsx';
import PosLocationPage from './pages/PosLocationPage.jsx';
import ManualBookPage from './pages/ManualBookPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/admin/LoginPage.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import AddItemPage from './pages/admin/AddItemPage.jsx';
import InventoryPage from './pages/admin/InventoryPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route path="pos-location" element={<PosLocationPage />} />
        <Route path="manual-book" element={<ManualBookPage />} />
      </Route>

      <Route path="admin" element={<AdminRoot />}>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="add-item" element={<AddItemPage />} />
            <Route path="inventaris" element={<InventoryPage />} />
            <Route path="pengaturan" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
