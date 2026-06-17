import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Generic hook for API calls with loading/error/retry state
 */
export function useApi(apiFn, options = {}) {
  const { onSuccess, onError, successMessage, showErrorToast = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      const result = res.data;
      setData(result);
      if (successMessage) toast.success(successMessage);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Something went wrong';
      setError(msg);
      if (showErrorToast) toast.error(msg);
      if (onError) onError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn, onSuccess, onError, successMessage, showErrorToast]);

  return { data, loading, error, execute };
}

/**
 * Hook for data fetching on mount with auto-fetch
 */
export function useFetch(apiFn, deps = [], options = {}) {
  const [data, setData] = useState(options.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, deps);

  return { data, loading, error, refetch: fetch };
}
