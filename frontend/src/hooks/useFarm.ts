import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Farm {
  id: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  area_hectares?: number;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

interface UseFarmReturn {
  currentFarm: Farm | null;
  farms: Farm[];
  setCurrentFarm: (farm: Farm | null) => void;
  isLoading: boolean;
  error: string | null;
  createFarm: (farmData: Omit<Farm, 'id' | 'created_at'>) => Promise<void>;
  updateFarm: (id: string, updates: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  getFarms: () => Promise<Farm[]>;
}

export function useFarm(): UseFarmReturn {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load farms on mount if authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      getFarms();
    }
  }, [isAuthenticated]);

  const getFarms = async (): Promise<Farm[]> => {
    if (!isAuthenticated()) return [];

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/farms', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch farms');

      const farmList = await response.json();

      setFarms(farmList);

      // Set current farm to first farm if none selected
      if (!currentFarm && farmList.length > 0) {
        setCurrentFarm(farmList[0]);
      }

      return farmList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load farms';
      setError(errorMessage);
      console.error('Error loading farms:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createFarm = async (farmData: Omit<Farm, 'id' | 'created_at'>) => {
    if (!isAuthenticated()) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/farms', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(farmData),
      });

      if (!response.ok) throw new Error('Failed to create farm');

      const newFarm = await response.json();

      const updatedFarms = [...farms, newFarm];
      setFarms(updatedFarms);

      // Set new farm as current farm
      setCurrentFarm(newFarm);

      return newFarm;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create farm';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFarm = async (id: string, updates: Partial<Farm>) => {
    if (!isAuthenticated()) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farms/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update farm');

      const updatedFarm = await response.json();

      const updatedFarms = farms.map(farm => (farm.id === id ? { ...farm, ...updatedFarm } : farm));
      setFarms(updatedFarms);

      // Update current farm if it's the one being updated
      if (currentFarm?.id === id) {
        setCurrentFarm({ ...currentFarm, ...updatedFarm });
      }

      return updatedFarm;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update farm';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFarm = async (id: string) => {
    if (!isAuthenticated()) throw new Error('Not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farms/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete farm');

      const updatedFarms = farms.filter(farm => farm.id !== id);
      setFarms(updatedFarms);

      // Clear current farm if it was deleted
      if (currentFarm?.id === id) {
        setCurrentFarm(updatedFarms.length > 0 ? updatedFarms[0] : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete farm';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentFarm,
    farms,
    setCurrentFarm,
    isLoading,
    error,
    createFarm,
    updateFarm,
    deleteFarm,
    getFarms,
  };
}
