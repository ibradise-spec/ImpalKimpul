import { useNavigate } from 'react-router-dom';
import { createItem } from '../../api/admin.js';
import { fetchCategories, fetchColors } from '../../api/catalog.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import ItemForm from '../../components/admin/ItemForm.jsx';

export default function AddItemPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const categories = useApi((signal) => fetchCategories(signal), []);
  const colors = useApi((signal) => fetchColors(signal), []);

  return (
    <>
      <h1 className="page-title">Tambahkan Barang Temuan</h1>
      {(categories.loading || colors.loading) && <p>Memuat form...</p>}
      {(categories.error || colors.error) && (
        <p className="alert-error">{(categories.error || colors.error).message}</p>
      )}
      {categories.data && colors.data && (
        <ItemForm
          categories={categories.data.data}
          colors={colors.data.data}
          requirePhoto
          submitLabel="Upload"
          onSubmit={async (formData) => {
            const res = await createItem(formData);
            toast.success(`Barang ${res.data.code} berhasil ditambahkan`);
            navigate('/admin/inventaris');
          }}
          onCancel={() => navigate('/admin')}
        />
      )}
    </>
  );
}
