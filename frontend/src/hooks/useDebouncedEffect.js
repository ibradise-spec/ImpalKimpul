import { useEffect } from 'react';

export function useDebouncedEffect(callback, deps, delay) {
  useEffect(() => {
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
