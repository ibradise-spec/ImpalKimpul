import { fetchItems } from '../api/catalog.js';
import { useApi } from '../hooks/useApi.js';
import { useCatalogFilters } from '../hooks/useCatalogFilters.js';
import ItemGrid from '../components/ItemGrid.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const { filters, setFilters, hasActive } = useCatalogFilters();
  const filterKey = JSON.stringify(filters);

  const highlight = useApi(
    (signal) => (hasActive ? Promise.resolve(null) : fetchItems({ period: 'week', limit: 8 }, signal)),
    [hasActive],
  );

  const list = useApi(
    (signal) =>
      fetchItems(
        {
          search: filters.search,
          category: filters.category,
          subcategory: filters.subcategory,
          color: filters.color,
          page: filters.page,
          limit: PAGE_SIZE,
        },
        signal,
      ),
    [filterKey],
  );

  const total = list.data?.meta?.total;

  return (
    <>
      {!hasActive && (
        <section className="section">
          <h2>Highlight Barang Hilang Minggu ini</h2>
          <ItemGrid state={highlight} emptyText="Belum ada barang temuan minggu ini." />
        </section>
      )}

      <section className="section">
        <h2>{hasActive ? 'Hasil Pencarian' : 'Semua Barang Temuan'}</h2>
        {hasActive && typeof total === 'number' && !list.loading && (
          <p className="result-count">{total} barang ditemukan</p>
        )}
        <ItemGrid
          state={list}
          emptyText={hasActive ? 'Tidak ada barang yang cocok dengan pencarianmu.' : 'Belum ada barang temuan.'}
        />
        <Pagination meta={list.data?.meta} onChange={(page) => setFilters({ page })} />
      </section>
    </>
  );
}
