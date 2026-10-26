import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Funnel, Search } from 'lucide-react';
import { fetchCategories, fetchColors } from '../api/catalog.js';
import { useApi } from '../hooks/useApi.js';
import { useCatalogFilters } from '../hooks/useCatalogFilters.js';
import { useDebouncedEffect } from '../hooks/useDebouncedEffect.js';
import FilterPanel from './FilterPanel.jsx';
import ColorChips from './ColorChips.jsx';

export default function Hero() {
  const { filters, setFilters } = useCatalogFilters();
  const categories = useApi((signal) => fetchCategories(signal), []);
  const colors = useApi((signal) => fetchColors(signal), []);

  const [text, setText] = useState(filters.search);
  const lastSubmitted = useRef(filters.search);
  const [open, setOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (filters.search !== lastSubmitted.current) {
      lastSubmitted.current = filters.search;
      setText(filters.search);
    }
  }, [filters.search]);

  useDebouncedEffect(
    () => {
      const next = text.trim();
      if (next !== lastSubmitted.current) {
        lastSubmitted.current = next;
        setFilters({ search: next });
      }
    },
    [text],
    400,
  );

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggleColor(name) {
    const has = filters.color.includes(name);
    setFilters({ color: has ? filters.color.filter((c) => c !== name) : [...filters.color, name] });
  }

  const activeCount = filters.category.length + filters.subcategory.length;

  return (
    <header className="hero">
      <h1>Temukan Barangmu yang Hilang !</h1>
      <p>
        Cari berdasarkan nama, kategori, atau warna. Jika menemukan barang yang cocok, datang langsung ke Logistik
        untuk mengambilnya.
      </p>

      <div className="search-row">
        <label className="search-box">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search"
            aria-label="Cari barang"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        <div className="filter-wrap" ref={filterRef}>
          <button
            type="button"
            className="filter-button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <Funnel size={20} aria-hidden="true" />
            <span className="grow">Filter{activeCount ? ` (${activeCount})` : ''}</span>
            <ChevronDown size={20} aria-hidden="true" />
          </button>
          {open && categories.data && (
            <FilterPanel categories={categories.data.data} filters={filters} onChange={setFilters} />
          )}
        </div>
      </div>

      <ColorChips colors={colors.data?.data ?? []} selected={filters.color} onToggle={toggleColor} />
    </header>
  );
}
