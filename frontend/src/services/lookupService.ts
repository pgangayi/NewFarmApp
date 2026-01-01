import { apiClient } from '../lib/cloudflare';
import { Breed } from '../api/types';

export interface CropVariety {
  id: string;
  crop_type: string;
  name: string;
  description?: string;
  days_to_maturity?: number;
}

export const LookupService = {
  async getBreeds(species?: string): Promise<Breed[]> {
    const params = new URLSearchParams();
    if (species) params.append('species', species);
    const response = await apiClient.get<{ data: any[] }>(
      `/api/lookup/breeds?${params.toString()}`
    );
    return response.data.map(b => ({
      id: String(b.id),
      name: b.name,
      species: b.species,
      characteristics: b.description,
      created_at: b.created_at,
    }));
  },

  async addBreed(breed: Omit<Breed, 'id' | 'created_at' | 'updated_at'>): Promise<Breed> {
    const response = await apiClient.post<{ data: any }>('/api/lookup/breeds', {
      ...breed,
      description: breed.characteristics,
    });
    const b = response.data;
    return {
      id: String(b.id),
      name: b.name,
      species: b.species,
      characteristics: b.description,
      created_at: b.created_at,
    };
  },

  async getCropVarieties(cropType?: string): Promise<CropVariety[]> {
    const params = new URLSearchParams();
    if (cropType) params.append('crop_type', cropType);
    const response = await apiClient.get<{ data: any[] }>(
      `/api/lookup/varieties?${params.toString()}`
    );
    return response.data.map(v => ({
      id: String(v.id),
      crop_type: v.crop_type,
      name: v.name,
      description: v.description,
      days_to_maturity: v.days_to_maturity,
    }));
  },

  async addCropVariety(variety: Omit<CropVariety, 'id'>): Promise<CropVariety> {
    const response = await apiClient.post<{ data: any }>('/api/lookup/varieties', variety);
    const v = response.data;
    return {
      id: String(v.id),
      crop_type: v.crop_type,
      name: v.name,
      description: v.description,
      days_to_maturity: v.days_to_maturity,
    };
  },
};
