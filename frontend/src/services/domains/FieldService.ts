import { apiClient } from '../../lib/cloudflare';
import { ENDPOINTS as apiEndpoints } from '../../api/config';
import { Field } from '../../api/types';

/**
 * DOMAIN SERVICE: Field
 * ---------------------
 * Handles field management operations.
 */

export class FieldService {
  static async getFieldsByFarm(farmId: string): Promise<Field[]> {
    const response = await apiClient.get<Field[]>(apiEndpoints.fields.list);
    // If the backend doesn't filter by farm_id on the list endpoint automatically (based on user context),
    // we might need to pass it as query param if the API supports it.
    // Based on previous code, it seems we often pass `?farm_id=...`
    // Let's implement client-side filtering or assume query param support if `list` endpoint is generic.
    // Ideally backend filters by user's access, but specific farm filter is useful if user has multiple farms.
    return response.filter(f => f.farm_id === farmId);
  }

  static async getFields(farmId?: string): Promise<Field[]> {
    const url = farmId ? `${apiEndpoints.fields.list}?farm_id=${farmId}` : apiEndpoints.fields.list;
    return apiClient.get<Field[]>(url);
  }

  static async getFieldById(id: string): Promise<Field | null> {
    return apiClient.get<Field>(apiEndpoints.fields.details(id));
  }

  static async createField(
    payload: Omit<Field, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Field> {
    return apiClient.post<Field>(apiEndpoints.fields.create, payload);
  }

  static async updateField(id: string, updates: Partial<Field>) {
    return apiClient.put<Field>(apiEndpoints.fields.update(id), updates);
  }

  static async deleteField(id: string) {
    await apiClient.delete(apiEndpoints.fields.delete(id));
    return true;
  }

  static async getSoilAnalysis(fieldId: string) {
    return apiClient.get<any>(`${apiEndpoints.fields.soilAnalysis}?field_id=${fieldId}`);
  }
}
