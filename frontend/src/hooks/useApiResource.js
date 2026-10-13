import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data from the API, then refreshes it on an interval.
 * `loading` is true only for the first load, so panels do not flash skeletons on every refresh.
 */
export function useApiResource(fetcher, intervalMs = 15000) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const data = await fetcherRef.current({ signal: controller.signal });
      setState({ data, error: null, loading: false, updatedAt: new Date() });
    } catch (error) {
      if (error.name === 'AbortError') return;
      // Keep the last good data (if any) so a brief outage does not blank the panel.
      setState((previous) => ({ ...previous, error, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = intervalMs ? setInterval(load, intervalMs) : null;
    return () => {
      if (timer) clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, [load, intervalMs]);

  return { ...state, reload: load };
}
