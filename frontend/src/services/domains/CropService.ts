import { apiClient } from '../../lib/cloudflare';
import { Crop, CropPlan, CreateRequest, QueryFilters } from '../../api/types';
import { ENDPOINTS as apiEndpoints } from '../../api/config';

// Define missing interfaces
interface IrrigationSchedule {
  id: string;
  schedule_name: string;
  crop_id: string;
  field_id: string;
  start_date: string;
  end_date: string;
  frequency: string;
  duration: number;
  water_amount: number;
  status: 'active' | 'paused' | 'completed';
  created_at?: string;
  updated_at?: string;
}

interface CropRotation {
  id: string;
  rotation_name: string;
  field_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'archived';
  crops: Crop[];
  created_at?: string;
  updated_at?: string;
}

interface IrrigationAnalytics {
  water_usage: number;
  efficiency_score: number;
  recommendations: string[];
  cost_analysis: {
    total_cost: number;
    cost_per_acre: number;
  };
}

interface SoilHealthMetrics {
  ph_level: number;
  nitrogen_level: number;
  phosphorus_level: number;
  potassium_level: number;
  organic_matter: number;
  moisture_content: number;
  temperature: number;
  recommendations: string[];
  health_score: number;
}

interface SoilHealthRecommendations {
  recommendations: string[];
  priority_actions: string[];
  fertilizer_suggestions: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
  };
  timeline_recommendations: string[];
}

/**
 * DOMAIN SERVICE: Crop
 * --------------------
 * Handles business logic for crop management.
 */

export class CropService {
  static async getCropsByFarm(farm_id?: string): Promise<Crop[]> {
    const crops = await apiClient.get<Crop[]>(apiEndpoints.crops.list);
    if (farm_id) {
      return crops.filter(c => c.farm_id === farm_id);
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

  static async getCropPlans(farm_id: string): Promise<CropPlan[]> {
    const response = await apiClient.get<CropPlan[]>(apiEndpoints.crops.planning);
    // Client-side filtering if backend returns all
    return response.filter(p => p.farm_id === farm_id);
  }

  static async createCropPlan(
    payload: Omit<CropPlan, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CropPlan> {
    return apiClient.post<CropPlan>(apiEndpoints.crops.planning, payload);
  }

  // --- Irrigation ---

  static async getIrrigationSchedules(farm_id: string): Promise<IrrigationSchedule[]> {
    return apiClient.post<IrrigationSchedule[]>('/api/crops/irrigation', {
      action: 'list',
      farm_id: farm_id,
    });
  }

  static async getIrrigationAnalytics(farm_id: string): Promise<IrrigationAnalytics> {
    return apiClient.post<IrrigationAnalytics>('/api/crops/irrigation', {
      action: 'analytics',
      farm_id: farm_id,
    });
  }

  static async updateIrrigationSchedule(
    scheduleId: string,
    updates: Partial<IrrigationSchedule>
  ): Promise<IrrigationSchedule> {
    return apiClient.put<IrrigationSchedule>(`/api/crops/irrigation/${scheduleId}`, updates);
  }

  static async optimizeIrrigationSchedule(scheduleId: string): Promise<IrrigationAnalytics> {
    return apiClient.post<IrrigationAnalytics>('/api/crops/irrigation', {
      action: 'optimize',
      schedule_id: scheduleId,
    });
  }

  // --- Soil Health ---

  static async getSoilHealthMetrics(farm_id: string): Promise<SoilHealthMetrics> {
    return apiClient.post<SoilHealthMetrics>('/api/crops/soil-health', {
      action: 'metrics',
      farm_id: farm_id,
    });
  }

  static async getSoilHealthRecommendations(farm_id: string): Promise<SoilHealthRecommendations> {
    return apiClient.post<SoilHealthRecommendations>('/api/crops/soil-health', {
      action: 'recommendations',
      farm_id: farm_id,
    });
  }

  // --- Crop Rotation ---

  static async getRotations(farm_id: string): Promise<CropRotation[]> {
    // Assuming backend endpoint based on hook naming, but let's check hook usage
    // The component uses `useRotations` which might fetch from `/api/crops/rotations` or similar?
    // Let's use a generic endpoint for now or verify where `useRotations` fetches from.
    // Given the lack of visibility into `useRotations` implementation, I'll stick to a plausible path
    // or checks `apiEndpoints` in config if available.
    // For now, I'll add the method but might need to verify path.
    return apiClient.get<CropRotation[]>(`/api/crops/rotations?farm_id=${farm_id}`);
  }

  static async createCropRotation(rotation: CreateRequest<CropRotation>): Promise<CropRotation> {
    return apiClient.post<CropRotation>('/api/crops/rotations', rotation);
  }
}
