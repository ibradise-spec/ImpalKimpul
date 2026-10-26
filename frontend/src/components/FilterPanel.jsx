import Chip from './Chip.jsx';

export default function FilterPanel({ categories, filters, onChange }) {
  const selected = categories.filter((c) => filters.category.includes(c.name));
  const subOptions = selected.flatMap((c) => c.subcategories);

  function toggleCategory(name) {
    const has = filters.category.includes(name);
    const nextCategories = has ? filters.category.filter((c) => c !== name) : [...filters.category, name];
    const validSubs = new Set(
      categories
        .filter((c) => nextCategories.includes(c.name))
        .flatMap((c) => c.subcategories.map((s) => s.name)),
    );
    onChange({
      category: nextCategories,
      subcategory: filters.subcategory.filter((s) => validSubs.has(s)),
    });
  }

  function toggleSub(name) {
    const has = filters.subcategory.includes(name);
    onChange({
      subcategory: has ? filters.subcategory.filter((s) => s !== name) : [...filters.subcategory, name],
    });
  }

  return (
    <div className="filter-panel" role="group" aria-label="Filter barang">
      <h3>Category</h3>
      <div className="chip-row">
        {categories.map((c) => (
          <Chip key={c.id} checked={filters.category.includes(c.name)} onClick={() => toggleCategory(c.name)}>
            {c.name}
          </Chip>
        ))}
      </div>
      {subOptions.length > 0 && (
        <>
          <h3>Sub Category</h3>
          <div className="chip-row">
            {subOptions.map((s) => (
              <Chip key={s.id} checked={filters.subcategory.includes(s.name)} onClick={() => toggleSub(s.name)}>
                {s.name}
              </Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
