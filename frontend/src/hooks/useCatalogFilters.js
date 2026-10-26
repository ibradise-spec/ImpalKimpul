import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

function splitCsv(value) {
  return value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];
}

export function useCatalogFilters() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const filters = useMemo(
    () => ({
      search: params.get('search') || '',
      category: splitCsv(params.get('category')),
      subcategory: splitCsv(params.get('subcategory')),
      color: splitCsv(params.get('color')),
      page: Math.max(1, Number(params.get('page')) || 1),
    }),
    [params],
  );

  const setFilters = useCallback(
    (patch) => {
      const next = { ...filters, page: 1, ...patch };
      const sp = new URLSearchParams();
      if (next.search) sp.set('search', next.search);
      if (next.category.length) sp.set('category', next.category.join(','));
      if (next.subcategory.length) sp.set('subcategory', next.subcategory.join(','));
      if (next.color.length) sp.set('color', next.color.join(','));
      if (next.page > 1) sp.set('page', String(next.page));
      navigate({ pathname: '/', search: sp.toString() }, { replace: pathname === '/' });
    },
    [filters, navigate, pathname],
  );

  const hasActive = Boolean(
    filters.search || filters.category.length || filters.subcategory.length || filters.color.length,
  );

  return { filters, setFilters, hasActive };
}
