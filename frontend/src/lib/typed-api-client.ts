// Type-Safe API Client with Zod Validation
// Uses snake_case naming convention throughout

import { z } from 'zod';
import { apiConfig } from '../config/env';
import {
  user_schema,
  farm_schema,
  field_schema,
  animal_schema,
  crop_schema,
  task_schema,
  finance_entry_schema,
  inventory_schema,
  login_schema,
  signup_schema,
  api_response_schema,
  paginated_response_schema,
  type User,
  type Farm,
  type Field,
  type Animal,
  type Crop,
  type Task,
  type FinanceEntry,
  type Inventory,
  type LoginInput,
  type SignupInput,
} from '../schemas';

// API Response Types
type ApiResponse<T> = z.infer<ReturnType<typeof api_response_schema<T>>>;
type PaginatedResponse<T> = z.infer<ReturnType<typeof paginated_response_schema<T>>>;

// Enhanced API Client with Type Safety
class TypedApiClient {
  private base_url: string;
  private get_auth_token: () => string | null;

  constructor(base_url: string, get_auth_token: () => string | null) {
    this.base_url = base_url;
    this.get_auth_token = get_auth_token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    response_schema?: z.ZodType<T>
  ): Promise<T> {
    const url = `${this.base_url}${endpoint}`;
    const token = this.get_auth_token();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error_data = await response.json().catch(() => ({}));
      throw new Error(error_data.error || `API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response if schema provided
    if (response_schema) {
      return response_schema.parse(data);
    }

    return data as T;
  }

  // Authentication endpoints
  async login(credentials: LoginInput): Promise<ApiResponse<{ user: User; token: string }>> {
    const validated_credentials = login_schema.parse(credentials);
    return this.request(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(validated_credentials),
      },
      api_response_schema(
        z.object({
          user: user_schema,
          token: z.string(),
        })
      )
    );
  }

  async signup(user_data: SignupInput): Promise<ApiResponse<{ user: User; token: string }>> {
    const validated_data = signup_schema.parse(user_data);
    return this.request(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(validated_data),
      },
      api_response_schema(
        z.object({
          user: user_schema,
          token: z.string(),
        })
      )
    );
  }

  async get_current_user(): Promise<ApiResponse<User>> {
    return this.request('/api/auth/me', {}, api_response_schema(user_schema));
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request('/api/auth/logout', {}, api_response_schema(z.null()));
  }

  // Farm endpoints
  async get_farms(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Farm>> {
    const search_params = new URLSearchParams();
    if (params?.page) search_params.set('page', params.page.toString());
    if (params?.limit) search_params.set('limit', params.limit.toString());

    return this.request(`/api/farms?${search_params}`, {}, paginated_response_schema(farm_schema));
  }

  async get_farm(id: number): Promise<ApiResponse<Farm>> {
    return this.request(`/api/farms/${id}`, {}, api_response_schema(farm_schema));
  }

  async create_farm(farm_data: Partial<Farm>): Promise<ApiResponse<Farm>> {
    return this.request(
      '/api/farms',
      {
        method: 'POST',
        body: JSON.stringify(farm_data),
      },
      api_response_schema(farm_schema)
    );
  }

  async update_farm(id: number, farm_data: Partial<Farm>): Promise<ApiResponse<Farm>> {
    return this.request(
      `/api/farms/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(farm_data),
      },
      api_response_schema(farm_schema)
    );
  }

  async delete_farm(id: number): Promise<ApiResponse<null>> {
    return this.request(`/api/farms/${id}`, { method: 'DELETE' }, api_response_schema(z.null()));
  }

  // Field endpoints
  async get_fields(farm_id?: number): Promise<PaginatedResponse<Field>> {
    const params = farm_id ? `?farm_id=${farm_id}` : '';
    return this.request(`/api/fields${params}`, {}, paginated_response_schema(field_schema));
  }

  async create_field(field_data: Partial<Field>): Promise<ApiResponse<Field>> {
    return this.request(
      '/api/fields',
      {
        method: 'POST',
        body: JSON.stringify(field_data),
      },
      api_response_schema(field_schema)
    );
  }

  async update_field(id: number, field_data: Partial<Field>): Promise<ApiResponse<Field>> {
    return this.request(
      `/api/fields/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(field_data),
      },
      api_response_schema(field_schema)
    );
  }

  async delete_field(id: number): Promise<ApiResponse<null>> {
    return this.request(`/api/fields/${id}`, { method: 'DELETE' }, api_response_schema(z.null()));
  }

  // Animal endpoints
  async get_animals(farm_id?: number): Promise<PaginatedResponse<Animal>> {
    const params = farm_id ? `?farm_id=${farm_id}` : '';
    return this.request(`/api/livestock${params}`, {}, paginated_response_schema(animal_schema));
  }

  async get_animal(id: number): Promise<ApiResponse<Animal>> {
    return this.request(`/api/livestock/${id}`, {}, api_response_schema(animal_schema));
  }

  async create_animal(animal_data: Partial<Animal>): Promise<ApiResponse<Animal>> {
    return this.request(
      '/api/livestock',
      {
        method: 'POST',
        body: JSON.stringify(animal_data),
      },
      api_response_schema(animal_schema)
    );
  }

  async update_animal(id: number, animal_data: Partial<Animal>): Promise<ApiResponse<Animal>> {
    return this.request(
      `/api/livestock/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(animal_data),
      },
      api_response_schema(animal_schema)
    );
  }

  async delete_animal(id: number): Promise<ApiResponse<null>> {
    return this.request(
      `/api/livestock/${id}`,
      { method: 'DELETE' },
      api_response_schema(z.null())
    );
  }

  // Crop endpoints
  async get_crops(farm_id?: number): Promise<PaginatedResponse<Crop>> {
    const params = farm_id ? `?farm_id=${farm_id}` : '';
    return this.request(`/api/crops${params}`, {}, paginated_response_schema(crop_schema));
  }

  async get_crop(id: number): Promise<ApiResponse<Crop>> {
    return this.request(`/api/crops/${id}`, {}, api_response_schema(crop_schema));
  }

  async create_crop(crop_data: Partial<Crop>): Promise<ApiResponse<Crop>> {
    return this.request(
      '/api/crops',
      {
        method: 'POST',
        body: JSON.stringify(crop_data),
      },
      api_response_schema(crop_schema)
    );
  }

  async update_crop(id: number, crop_data: Partial<Crop>): Promise<ApiResponse<Crop>> {
    return this.request(
      `/api/crops/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(crop_data),
      },
      api_response_schema(crop_schema)
    );
  }

  async delete_crop(id: number): Promise<ApiResponse<null>> {
    return this.request(`/api/crops/${id}`, { method: 'DELETE' }, api_response_schema(z.null()));
  }

  // Task endpoints
  async get_tasks(farm_id?: number): Promise<PaginatedResponse<Task>> {
    const params = farm_id ? `?farm_id=${farm_id}` : '';
    return this.request(`/api/tasks${params}`, {}, paginated_response_schema(task_schema));
  }

  async get_task(id: number): Promise<ApiResponse<Task>> {
    return this.request(`/api/tasks/${id}`, {}, api_response_schema(task_schema));
  }

  async create_task(task_data: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request(
      '/api/tasks',
      {
        method: 'POST',
        body: JSON.stringify(task_data),
      },
      api_response_schema(task_schema)
    );
  }

  async update_task(id: number, task_data: Partial<Task>): Promise<ApiResponse<Task>> {
    return this.request(
      `/api/tasks/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(task_data),
      },
      api_response_schema(task_schema)
    );
  }

  async delete_task(id: number): Promise<ApiResponse<null>> {
    return this.request(`/api/tasks/${id}`, { method: 'DELETE' }, api_response_schema(z.null()));
  }

  // Finance endpoints
  async get_finance_entries(farm_id?: number): Promise<PaginatedResponse<FinanceEntry>> {
    const params = farm_id ? `?farm_id=${farm_id}` : '';
    return this.request(
      `/api/finance-enhanced${params}`,
      {},
      paginated_response_schema(finance_entry_schema)
    );
  }

  async create_finance_entry(
    entry_data: Partial<FinanceEntry>
  ): Promise<ApiResponse<FinanceEntry>> {
    return this.request(
      '/api/finance-enhanced',
      {
        method: 'POST',
        body: JSON.stringify(entry_data),
      },
      api_response_schema(finance_entry_schema)
    );
  }

  async update_finance_entry(
    id: number,
    entry_data: Partial<FinanceEntry>
  ): Promise<ApiResponse<FinanceEntry>> {
    return this.request(
      `/api/finance-enhanced/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(entry_data),
      },
      api_response_schema(finance_entry_schema)
    );
  }

  async delete_finance_entry(id: number): Promise<ApiResponse<null>> {
    return this.request(
      `/api/finance-enhanced/${id}`,
      { method: 'DELETE' },
      api_response_schema(z.null())
    );
  }

  // Inventory endpoints
  async get_inventory(farm_id?: number): Promise<PaginatedResponse<Inventory>> {
    const params = farm_id ? `?farm_id=${farm_id}` : '';
    return this.request(`/api/inventory${params}`, {}, paginated_response_schema(inventory_schema));
  }

  async get_inventory_item(id: number): Promise<ApiResponse<Inventory>> {
    return this.request(`/api/inventory/${id}`, {}, api_response_schema(inventory_schema));
  }

  async create_inventory_item(inventory_data: Partial<Inventory>): Promise<ApiResponse<Inventory>> {
    return this.request(
      '/api/inventory',
      {
        method: 'POST',
        body: JSON.stringify(inventory_data),
      },
      api_response_schema(inventory_schema)
    );
  }

  async update_inventory_item(
    id: number,
    inventory_data: Partial<Inventory>
  ): Promise<ApiResponse<Inventory>> {
    return this.request(
      `/api/inventory/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(inventory_data),
      },
      api_response_schema(inventory_schema)
    );
  }

  async delete_inventory_item(id: number): Promise<ApiResponse<null>> {
    return this.request(
      `/api/inventory/${id}`,
      { method: 'DELETE' },
      api_response_schema(z.null())
    );
  }

  // Utility methods
  async health_check(): Promise<ApiResponse<{ status: string }>> {
    return this.request(
      '/api/health',
      {},
      api_response_schema(
        z.object({
          status: z.string(),
        })
      )
    );
  }
}

// Create singleton instance
const get_auth_token = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const typed_api_client = new TypedApiClient(apiConfig.baseUrl, get_auth_token);

// Export types for use in components
export type { ApiResponse, PaginatedResponse };
export { TypedApiClient };
