import { useEffect, useState } from 'react';

export function useApi(fetcher, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcher(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ data: null, error, loading: false });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
