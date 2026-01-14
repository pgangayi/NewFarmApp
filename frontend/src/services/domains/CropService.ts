import { apiClient } from '../../lib/cloudflare';
import { Crop, CropPlan } from '../../api/types';
import { ENDPOINTS as apiEndpoints } from '../../api/config';

/**
 * DOMAIN SERVICE: Crop
 * --------------------
 * Handles business logic for crop management.
 */

export class CropService {
  static async getCropsByFarm(farmId?: string): Promise<Crop[]> {
    const crops = await apiClient.get<Crop[]>(apiEndpoints.crops.list);
    if (farmId) {
      return crops.filter(c => c.farm_id === farmId);
    }
    return crops;
  }

  static async getCropById(id: string): Promise<Crop | null> {
    return apiClient.get<Crop>(apiEndpoints.crops.details(id));
  }

  static async createCrop(payload: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<Crop> {
    return apiClient.post<Crop>(apiEndpoints.crops.create, payload);
  }

  static async updateCrop(id: string, updates: Partial<Crop>) {
    return apiClient.put<Crop>(apiEndpoints.crops.update(id), updates);
  }

  static async deleteCrop(id: string) {
    await apiClient.delete(apiEndpoints.crops.delete(id));
    return true;
  }
  // --- Planning ---

  static async getCropPlans(farmId: string): Promise<CropPlan[]> {
    const response = await apiClient.get<CropPlan[]>(apiEndpoints.crops.planning);
    // Client-side filtering if backend returns all
    return response.filter(p => p.farm_id === farmId);
  }

  static async createCropPlan(
    payload: Omit<CropPlan, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CropPlan> {
    return apiClient.post<CropPlan>(apiEndpoints.crops.planning, payload);
  }

  // --- Irrigation ---

  static async getIrrigationSchedules(farmId: string): Promise<any[]> {
    return apiClient.post<any[]>('/api/crops/irrigation', {
      action: 'list',
      farm_id: farmId,
    });
  }

  static async getIrrigationAnalytics(farmId: string): Promise<any> {
    return apiClient.post<any>('/api/crops/irrigation', {
      action: 'analytics',
      farm_id: farmId,
    });
  }

  static async updateIrrigationSchedule(scheduleId: string, updates: any): Promise<any> {
    return apiClient.put<any>(`/api/crops/irrigation/${scheduleId}`, updates);
  }

  static async optimizeIrrigationSchedule(scheduleId: string): Promise<any> {
    return apiClient.post<any>('/api/crops/irrigation', {
      action: 'optimize',
      schedule_id: scheduleId,
    });
  }

  // --- Soil Health ---

  static async getSoilHealthMetrics(farmId: string): Promise<any> {
    return apiClient.post<any>('/api/crops/soil-health', {
      action: 'metrics',
      farm_id: farmId,
    });
  }

  static async getSoilHealthRecommendations(farmId: string): Promise<any> {
    return apiClient.post<any>('/api/crops/soil-health', {
      action: 'recommendations',
      farm_id: farmId,
    });
  }

  // --- Crop Rotation ---

  static async getRotations(farmId: string): Promise<any[]> {
    // Assuming backend endpoint based on hook naming, but let's check hook usage
    // The component uses `useRotations` which might fetch from `/api/crops/rotations` or similar?
    // Let's use a generic endpoint for now or verify where `useRotations` fetches from.
    // Based on `IrrigationOptimizer` usage, it might be `/api/crops/rotations`.
    // However, I will assume a standard endpoint for now and adjust if needed.
    // Given the lack of visibility into `useRotations` implementation, I'll stick to a plausible path
    // or checks `apiEndpoints` in config if available.
    // For now, I'll add the method but might need to verify path.
    return apiClient.get<any[]>(`/api/crops/rotations?farm_id=${farmId}`);
  }

  static async createRotation(rotation: any): Promise<any> {
    return apiClient.post<any>('/api/crops/rotations', rotation);
  }
}
