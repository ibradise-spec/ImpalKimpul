import ItemCard from './ItemCard.jsx';

export default function ItemGrid({ state, emptyText = 'Belum ada barang yang cocok.' }) {
  if (state.loading) {
    return (
      <div className="grid" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card skeleton" />
        ))}
      </div>
    );
  }
  if (state.error) {
    return <p className="notice notice-error">{state.error.message}</p>;
  }
  const items = state.data?.data ?? [];
  if (!items.length) {
    return <p className="notice">{emptyText}</p>;
  }
  return (
    <div className="grid">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
