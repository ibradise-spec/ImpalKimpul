import { fetchCategories, fetchColors } from '../../api/catalog.js';
import { updateItem } from '../../api/admin.js';
import { useApi } from '../../hooks/useApi.js';
import ItemForm from './ItemForm.jsx';
import Modal from './Modal.jsx';

export default function EditItemModal({ item, onClose, onSaved }) {
  const categories = useApi((signal) => fetchCategories(signal), []);
  const colors = useApi((signal) => fetchColors(signal), []);
  const ready = categories.data && colors.data;

  return (
    <Modal title={`Edit ${item.code}`} onClose={onClose} wide>
      {!ready && <p>Memuat form...</p>}
      {ready && (
        <ItemForm
          categories={categories.data.data}
          colors={colors.data.data}
          initial={item}
          submitLabel="Simpan Perubahan"
          onSubmit={async (formData) => {
            await updateItem(item.id, formData);
            onSaved();
          }}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
