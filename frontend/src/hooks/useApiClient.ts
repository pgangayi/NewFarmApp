import { useMemo } from 'react';
import { createApiClient } from '../lib/api/client';
import { useAuth } from './AuthContext';

/**
 * Hook that provides an API client with auth headers automatically included
 * This ensures all API requests include the user's authentication token
 */
export function useApiClient() {
  const { getAuthHeaders } = useAuth();

  const apiClient = useMemo(() => {
    return createApiClient(getAuthHeaders);
  }, [getAuthHeaders]);

  return apiClient;
}
