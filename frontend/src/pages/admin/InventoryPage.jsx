import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, HandHelping, Pencil, Search, Trash2, Undo2 } from 'lucide-react';
import { deleteItem, fetchAdminItems, revertHandover } from '../../api/admin.js';
import { fetchCategories } from '../../api/catalog.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect.js';
import { formatDateTime } from '../../utils/format.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import EditItemModal from '../../components/admin/EditItemModal.jsx';
import HandoverModal from '../../components/admin/HandoverModal.jsx';
import RowMenu from '../../components/admin/RowMenu.jsx';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const PAGE_SIZE = 15;

function SortHeader({ label, field, sort, order, onSort }) {
  const active = sort === field;
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sort-btn" onClick={() => onSort(field)}>
        {label}
        <Icon size={14} aria-hidden="true" />
      </button>
    </th>
  );
}

export default function InventoryPage() {
  const toast = useToast();
  const [query, setQuery] = useState({ search: '', status: 'all', category: '', sort: 'date', order: 'desc', page: 1 });
  const [searchText, setSearchText] = useState('');
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [dialog, setDialog] = useState(null);

  const categories = useApi((signal) => fetchCategories(signal), []);
  const list = useApi(
    (signal) => fetchAdminItems({ ...query, limit: PAGE_SIZE }, signal),
    [JSON.stringify(query), reload],
  );

  useDebouncedEffect(
    () => {
      const next = searchText.trim();
      setQuery((q) => (q.search === next ? q : { ...q, search: next, page: 1 }));
    },
    [searchText],
    400,
  );

  useEffect(() => {
    setSelected(new Set());
  }, [list.data]);

  useEffect(() => {
    if (list.data && list.data.data.length === 0 && query.page > 1) {
      setQuery((q) => ({ ...q, page: Math.max(1, list.data.meta.totalPages) }));
    }
  }, [list.data, query.page]);

  const items = list.data?.data ?? [];
  const meta = list.data?.meta;
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));

  function setFilter(patch) {
    setQuery((q) => ({ ...q, ...patch, page: 1 }));
  }

  function onSort(field) {
    setQuery((q) => ({
      ...q,
      sort: field,
      order: q.sort === field && q.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  function toggleRow(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function closeDialog() {
    setDialog(null);
  }

  function done(message) {
    closeDialog();
    toast.success(message);
    setReload((n) => n + 1);
  }

  function actionsFor(item) {
    const actions = [
      { label: 'Edit', icon: <Pencil size={16} />, onClick: () => setDialog({ type: 'edit', item }) },
    ];
    if (item.status === 'available') {
      actions.push({
        label: 'Tandai Diambil',
        icon: <HandHelping size={16} />,
        onClick: () => setDialog({ type: 'handover', item }),
      });
    } else {
      actions.push({
        label: 'Batalkan Serah Terima',
        icon: <Undo2 size={16} />,
        onClick: () => setDialog({ type: 'revert', item }),
      });
    }
    actions.push({ label: 'Lihat di Katalog', icon: <ExternalLink size={16} />, href: `/items/${item.id}` });
    actions.push({
      label: 'Hapus',
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => setDialog({ type: 'delete', item }),
    });
    return actions;
  }

  async function bulkDelete() {
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map((id) => deleteItem(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    closeDialog();
    if (failed) {
      toast.error(`${ids.length - failed} barang dihapus, ${failed} gagal`);
    } else {
      toast.success(`${ids.length} barang dihapus`);
    }
    setReload((n) => n + 1);
  }

  return (
    <>
      <h1 className="page-title">Inventaris</h1>

      <div className="toolbar">
        <label className="search-box search-box-light">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search"
            aria-label="Cari di inventaris"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>
        <select
          className="select"
          aria-label="Filter status"
          value={query.status}
          onChange={(event) => setFilter({ status: event.target.value })}
        >
          <option value="all">Semua status</option>
          <option value="available">Tersedia</option>
          <option value="taken">Sudah diambil</option>
        </select>
        <select
          className="select"
          aria-label="Filter kategori"
          value={query.category}
          onChange={(event) => setFilter({ category: event.target.value })}
        >
          <option value="">Semua kategori</option>
          {(categories.data?.data ?? []).map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar" role="status">
          <span>{selected.size} barang dipilih</span>
          <button type="button" className="btn btn-danger" onClick={() => setDialog({ type: 'bulkDelete' })}>
            Hapus terpilih
          </button>
        </div>
      )}

      {list.error && <p className="alert-error">{list.error.message}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="col-check">
                <input type="checkbox" aria-label="Pilih semua" checked={allSelected} onChange={toggleAll} />
              </th>
              <SortHeader label="Kode" field="code" sort={query.sort} order={query.order} onSort={onSort} />
              <SortHeader label="Nama Barang" field="name" sort={query.sort} order={query.order} onSort={onSort} />
              <SortHeader label="Tanggal" field="date" sort={query.sort} order={query.order} onSort={onSort} />
              <th>Lokasi Penemuan</th>
              <SortHeader label="Status" field="status" sort={query.sort} order={query.order} onSort={onSort} />
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.loading && (
              <tr>
                <td colSpan={7} className="table-note">
                  Memuat data...
                </td>
              </tr>
            )}
            {!list.loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="table-note">
                  Tidak ada barang yang cocok.
                </td>
              </tr>
            )}
            {!list.loading &&
              items.map((item) => (
                <tr key={item.id}>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      aria-label={`Pilih ${item.name}`}
                      checked={selected.has(item.id)}
                      onChange={() => toggleRow(item.id)}
                    />
                  </td>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{formatDateTime(item.foundAt)}</td>
                  <td>{item.foundLocation}</td>
                  <td>
                    <StatusBadge status={item.status} inline />
                    {item.handover && (
                      <small className="taker-note">
                        {item.handover.takerName} ({item.handover.takerNim})
                      </small>
                    )}
                  </td>
                  <td className="col-action">
                    <RowMenu label={`Aksi untuk ${item.name}`} actions={actionsFor(item)} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onChange={(page) => setQuery((q) => ({ ...q, page }))} />

      {dialog?.type === 'edit' && (
        <EditItemModal item={dialog.item} onClose={closeDialog} onSaved={() => done('Perubahan disimpan')} />
      )}
      {dialog?.type === 'handover' && (
        <HandoverModal
          item={dialog.item}
          onClose={closeDialog}
          onDone={() => done(`${dialog.item.name} ditandai sudah diambil`)}
        />
      )}
      {dialog?.type === 'revert' && (
        <ConfirmDialog
          title="Batalkan Serah Terima"
          message={`Status ${dialog.item.name} akan dikembalikan menjadi tersedia dan data pengambil dihapus.`}
          confirmLabel="Batalkan Serah Terima"
          onCancel={closeDialog}
          onConfirm={async () => {
            await revertHandover(dialog.item.id);
            done('Serah terima dibatalkan');
          }}
        />
      )}
      {dialog?.type === 'delete' && (
        <ConfirmDialog
          title="Hapus Barang"
          message={`Hapus ${dialog.item.name}? Barang akan hilang dari katalog.`}
          confirmLabel="Hapus"
          danger
          onCancel={closeDialog}
          onConfirm={async () => {
            await deleteItem(dialog.item.id);
            done('Barang dihapus');
          }}
        />
      )}
      {dialog?.type === 'bulkDelete' && (
        <ConfirmDialog
          title="Hapus Barang Terpilih"
          message={`Hapus ${selected.size} barang yang dipilih? Barang akan hilang dari katalog.`}
          confirmLabel="Hapus Semua"
          danger
          onCancel={closeDialog}
          onConfirm={bulkDelete}
        />
      )}
    </>
  );
}
