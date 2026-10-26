import { useEffect } from 'react';

export function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return undefined;
    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) onOutside();
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') onOutside();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, onOutside, active]);
}
