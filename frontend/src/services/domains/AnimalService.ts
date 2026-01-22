import { apiClient } from '../../lib/cloudflare';
import {
  Animal,
  AnimalHealth,
  ProductionRecord,
  BreedingRecord,
  QueryFilters,
} from '../../api/types';
import { ENDPOINTS as apiEndpoints } from '../../api/config';

// Define AnimalAnalytics interface since it's not in types.ts
interface AnimalAnalytics {
  total_animals: number;
  healthy_animals: number;
  sick_animals: number;
  production_stats: {
    total_production: number;
    average_production: number;
  };
  breed_distribution: Record<string, number>;
}

/**
 * DOMAIN SERVICE: Animal
 * ----------------------
 * Handles business logic for animal management.
 */

export class AnimalService {
  static async getAnimalsByFarm(farm_id?: string): Promise<Animal[]> {
    const query = farm_id ? `?farm_id=${farm_id}` : '';
    const response = await apiClient.get<{ data: Animal[] }>(
      `${apiEndpoints.animals.list}${query}`
    );
    return response.data || [];
  }

  static async getAnimals(params?: QueryFilters): Promise<Animal[]> {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    const response = await apiClient.get<{ data: Animal[] }>(
      `${apiEndpoints.animals.list}${query}`
    );
    // Backend might return { animals: [...] } or { data: [...] } or just [...]
    // Viewing AnimalBreedingManager: keys off `data.animals`.
    // Viewing AnimalService.getAnimalsByFarm: keys off `response.data`.
    // Let's assume standardized response or handle both given the component's existing code.
    // Component code: const data = await response.json(); return data.animals || [];
    // Cloudflare wrapper types expected response T.
    // If backend returns { animals: [...] }, then T should be { animals: Animal[] }.
    // I'll type it loosely for now to be safe, or check types.ts.
    // The previous getAnimalsByFarm used { data: Animal[] }.
    // Let's stick to returning Animal[] and let apiClient generic handle the shape if possible,
    // but here I need to map whatever the backend returns to Animal[].
    // If we assume standardize API: data property is common.
    // But BreedingManager used `data.animals`.
    // Let's try to handle unknown return and look for data.animals or data.data or data.
    const unknownResponse = response as unknown;
    const animalsResponse = unknownResponse as { animals?: Animal[] };
    const dataResponse = unknownResponse as { data?: Animal[] };
    const arrayResponse = unknownResponse as Animal[];

    return animalsResponse.animals || dataResponse.data || arrayResponse;
  }

  static async getAnalytics(params?: QueryFilters): Promise<AnimalAnalytics> {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return await apiClient.get<AnimalAnalytics>(`${apiEndpoints.animals.analytics}${query}`);
  }

  static async getAnimalById(id: string): Promise<Animal | null> {
    const response = await apiClient.get<{ data: Animal }>(apiEndpoints.animals.details(id));
    return response.data || null;
  }

  static async createAnimal(
    payload: Omit<Animal, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Animal> {
    const response = await apiClient.post<{ data: Animal }>(apiEndpoints.animals.create, payload);
    return response.data;
  }

  static async updateAnimal(id: string, updates: Partial<Animal>) {
    const response = await apiClient.put<{ data: Animal }>(
      apiEndpoints.animals.update(id),
      updates
    );
    return response.data;
  }

  static async deleteAnimal(id: string) {
    await apiClient.delete(apiEndpoints.animals.delete(id));
    return true;
  }

  // --- Health Records ---

  static async getHealthRecords(animalId: string): Promise<AnimalHealth[]> {
    const response = await apiClient.get<{ data: AnimalHealth[] }>(
      apiEndpoints.animals.healthRecords(animalId)
    );
    // Backend responses are wrapped in { data: ... } or sometimes directly returned depending on handling?
    // Cloudflare client wrapper returns response.json().
    // Backend API `handleHealthRecords` returns `createSuccessResponse(data || [])`.
    // createSuccessResponse often wraps in { success: true, data: ... } or just data?
    // Let's assume consistent wrapped response based on `getAnimalsByFarm`.
    return response.data || [];
  }

  static async addHealthRecord(
    animalId: string,
    record: Omit<AnimalHealth, 'id' | 'created_at' | 'updated_at' | 'animal_id'>
  ): Promise<AnimalHealth> {
    const response = await apiClient.post<{ data: AnimalHealth }>(
      apiEndpoints.animals.healthRecords(animalId),
      { ...record, animal_id: animalId }
    );
    return response.data;
  }

  static async updateHealthRecord(
    animalId: string,
    recordId: string,
    updates: Partial<AnimalHealth>
  ): Promise<AnimalHealth> {
    const response = await apiClient.put<{ data: AnimalHealth }>(
      apiEndpoints.animals.healthRecords(animalId, recordId),
      updates
    );
    return response.data;
  }

  static async deleteHealthRecord(animalId: string, recordId: string): Promise<boolean> {
    await apiClient.delete(apiEndpoints.animals.healthRecords(animalId, recordId));
    return true;
  }
  // --- Production Records ---

  static async getProductionRecords(
    animalId: string,
    params?: QueryFilters
  ): Promise<ProductionRecord[]> {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    const response = await apiClient.get<ProductionRecord[]>(
      `${apiEndpoints.animals.production(animalId)}${query}`
    );
    return response || [];
  }

  static async addProductionRecord(
    animalId: string,
    record: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at' | 'animal_id'>
  ): Promise<ProductionRecord> {
    return await apiClient.post<ProductionRecord>(apiEndpoints.animals.production(animalId), {
      ...record,
      animal_id: animalId,
    });
  }

  static async updateProductionRecord(
    animalId: string,
    recordId: string,
    updates: Partial<ProductionRecord>
  ): Promise<ProductionRecord> {
    return await apiClient.put<ProductionRecord>(
      apiEndpoints.animals.production(animalId, recordId),
      updates
    );
  }

  static async deleteProductionRecord(animalId: string, recordId: string): Promise<boolean> {
    await apiClient.delete(apiEndpoints.animals.production(animalId, recordId));
    return true;
  }

  // --- Breeding Records ---

  static async getBreedingRecords(animalId: string): Promise<BreedingRecord[]> {
    const response = await apiClient.get<BreedingRecord[]>(apiEndpoints.animals.breeding(animalId));
    return response || [];
  }

  static async addBreedingRecord(
    animalId: string,
    record: Omit<BreedingRecord, 'id' | 'created_at' | 'updated_at' | 'animal_id'>
  ): Promise<BreedingRecord> {
    return await apiClient.post<BreedingRecord>(apiEndpoints.animals.breeding(animalId), {
      ...record,
      animal_id: animalId,
    });
  }

  static async updateBreedingRecord(
    animalId: string,
    recordId: string,
    updates: Partial<BreedingRecord>
  ): Promise<BreedingRecord> {
    return await apiClient.put<BreedingRecord>(
      apiEndpoints.animals.breeding(animalId, recordId),
      updates
    );
  }

  static async deleteBreedingRecord(animalId: string, recordId: string): Promise<boolean> {
    await apiClient.delete(apiEndpoints.animals.breeding(animalId, recordId));
    return true;
  }
}
