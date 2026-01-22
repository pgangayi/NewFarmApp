// Zod Validation Schemas for Farm Management App
// All schemas use snake_case naming convention

import { z } from 'zod';

// Base schemas with common fields
const base_fields = {
  id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
};

// User schemas
export const user_schema = z.object({
  ...base_fields,
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password_hash: z.string().optional(),
  role: z.enum(['user', 'admin', 'manager']).default('user'),
  avatar: z.string().url().optional(),
});

export const create_user_schema = user_schema
  .pick({
    email: true,
    name: true,
    password: true,
  })
  .extend({
    password: z.string().min(8).max(100),
  });

export const update_user_schema = user_schema
  .pick({
    name: true,
    avatar: true,
    role: true,
  })
  .partial();

// Farm schemas
export const farm_schema = z.object({
  ...base_fields,
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  location: z.string().max(500).optional(),
  area_hectares: z.number().positive().optional(),
  size_acres: z.number().positive().optional(),
  farm_type: z.enum(['organic', 'conventional', 'sustainable', 'mixed']).optional(),
  metadata: z.string().optional(),
  owner_id: z.string(),
  timezone: z.string().max(50).optional(),
});

export const create_farm_schema = farm_schema.pick({
  name: true,
  location: true,
  area_hectares: true,
  size_acres: true,
  farm_type: true,
  metadata: true,
  owner_id: true,
  timezone: true,
});

export const update_farm_schema = create_farm_schema.partial();

// Field schemas
export const field_schema = z.object({
  ...base_fields,
  id: z.number().int().positive(),
  farm_id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  area_hectares: z.number().positive().optional(),
  area_sqm: z.number().positive().optional(),
  crop_type: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  location_type: z.enum(['field', 'barn', 'pasture', 'greenhouse']).default('field'),
  soil_type: z.string().max(100).optional(),
  irrigation_type: z.string().max(100).optional(),
});

export const create_field_schema = field_schema.pick({
  farm_id: true,
  name: true,
  area_hectares: true,
  area_sqm: true,
  crop_type: true,
  notes: true,
  location_type: true,
  soil_type: true,
  irrigation_type: true,
});

export const update_field_schema = create_field_schema.partial();

// Animal schemas
export const animal_schema = z.object({
  ...base_fields,
  id: z.number().int().positive(),
  farm_id: z.number().int().positive(),
  name: z.string().max(100).optional(),
  species: z.string().min(1).max(100),
  breed: z.string().max(100).optional(),
  date_of_birth: z.string().date().optional(),
  sex: z.enum(['male', 'female']).optional(),
  identification_tag: z.string().max(50).optional(),
  status: z.enum(['active', 'sold', 'deceased', 'transferred']).default('active'),
  health_status: z.enum(['healthy', 'sick', 'recovering', 'critical']).default('healthy'),
  current_weight: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  location_id: z.string().optional(),
  acquisition_date: z.string().date().optional(),
  acquisition_type: z.enum(['born', 'purchased', 'gift', 'rescue']).optional(),
});

export const create_animal_schema = animal_schema.pick({
  farm_id: true,
  name: true,
  species: true,
  breed: true,
  date_of_birth: true,
  sex: true,
  identification_tag: true,
  status: true,
  health_status: true,
  current_weight: true,
  notes: true,
  location_id: true,
  acquisition_date: true,
  acquisition_type: true,
});

export const update_animal_schema = create_animal_schema.partial();

// Crop schemas
export const crop_schema = z.object({
  ...base_fields,
  id: z.number().int().positive(),
  farm_id: z.number().int().positive(),
  field_id: z.number().int().positive().optional(),
  name: z.string().max(200).optional(),
  crop_type: z.string().min(1).max(100),
  variety: z.string().max(100).optional(),
  planting_date: z.string().date().optional(),
  expected_harvest_date: z.string().date().optional(),
  actual_harvest_date: z.string().date().optional(),
  status: z
    .enum(['planned', 'planted', 'growing', 'ready', 'harvested', 'failed'])
    .default('planned'),
  health_status: z.enum(['healthy', 'stressed', 'diseased', 'pest_damage', 'dead']).optional(),
  area_planted: z.number().positive().optional(),
  expected_yield: z.number().positive().optional(),
  actual_yield: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  irrigation_schedule: z.string().max(500).optional(),
});

export const create_crop_schema = crop_schema.pick({
  farm_id: true,
  field_id: true,
  name: true,
  crop_type: true,
  variety: true,
  planting_date: true,
  expected_harvest_date: true,
  actual_harvest_date: true,
  status: true,
  health_status: true,
  area_planted: true,
  expected_yield: true,
  actual_yield: true,
  notes: true,
  irrigation_schedule: true,
});

export const update_crop_schema = create_crop_schema.partial();

// Task schemas
export const task_schema = z.object({
  ...base_fields,
  id: z.number().int().positive(),
  farm_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  assigned_to: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  task_type: z
    .enum(['planting', 'harvesting', 'feeding', 'maintenance', 'inspection', 'other'])
    .optional(),
  related_entity_type: z.enum(['animal', 'crop', 'field', 'equipment']).optional(),
  related_entity_id: z.number().int().positive().optional(),
});

export const create_task_schema = task_schema.pick({
  farm_id: true,
  title: true,
  description: true,
  assigned_to: true,
  status: true,
  priority: true,
  due_date: true,
  task_type: true,
  related_entity_type: true,
  related_entity_id: true,
});

export const update_task_schema = create_task_schema.partial();

// Finance entry schemas
export const finance_entry_schema = z.object({
  ...base_fields,
  id: z.number().int().positive(),
  farm_id: z.number().int().positive(),
  amount: z.number(),
  currency: z.string().length(3).default('USD'),
  entry_type: z.enum(['income', 'expense']),
  category: z.enum(['seeds', 'feed', 'equipment', 'labor', 'sales', 'subsidies', 'other']),
  description: z.string().max(500),
  date: z.string().date(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'check']).optional(),
  reference_number: z.string().max(100).optional(),
  vendor_customer: z.string().max(200).optional(),
});

export const create_finance_entry_schema = finance_entry_schema.pick({
  farm_id: true,
  amount: true,
  currency: true,
  entry_type: true,
  category: true,
  description: true,
  date: true,
  payment_method: true,
  reference_number: true,
  vendor_customer: true,
});

export const update_finance_entry_schema = create_finance_entry_schema.partial();

// Inventory schemas
export const inventory_schema = z.object({
  ...base_fields,
  id: z.number().int().positive(),
  farm_id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  category: z.enum(['seed', 'feed', 'fertilizer', 'pesticide', 'equipment', 'medicine', 'other']),
  quantity: z.number().nonnegative(),
  unit: z.string().max(20),
  unit_cost: z.number().positive().optional(),
  total_cost: z.number().positive().optional(),
  location: z.string().max(200).optional(),
  supplier: z.string().max(200).optional(),
  purchase_date: z.string().date().optional(),
  expiry_date: z.string().date().optional(),
  minimum_quantity: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});

export const create_inventory_schema = inventory_schema.pick({
  farm_id: true,
  name: true,
  category: true,
  quantity: true,
  unit: true,
  unit_cost: true,
  total_cost: true,
  location: true,
  supplier: true,
  purchase_date: true,
  expiry_date: true,
  minimum_quantity: true,
  notes: true,
});

export const update_inventory_schema = create_inventory_schema.partial();

// Authentication schemas
export const login_schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signup_schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

export const password_reset_request_schema = z.object({
  email: z.string().email(),
});

export const password_reset_schema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8).max(100),
});

// API response schemas
export const api_response_schema = <T>(data_schema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: data_schema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const paginated_response_schema = <T>(data_schema: z.ZodType<T>) =>
  z.object({
    success: z.boolean(),
    data: z.array(data_schema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  });

// Export types for use in components
export type User = z.infer<typeof user_schema>;
export type CreateUser = z.infer<typeof create_user_schema>;
export type UpdateUser = z.infer<typeof update_user_schema>;

export type Farm = z.infer<typeof farm_schema>;
export type CreateFarm = z.infer<typeof create_farm_schema>;
export type UpdateFarm = z.infer<typeof update_farm_schema>;

export type Field = z.infer<typeof field_schema>;
export type CreateField = z.infer<typeof create_field_schema>;
export type UpdateField = z.infer<typeof update_field_schema>;

export type Animal = z.infer<typeof animal_schema>;
export type CreateAnimal = z.infer<typeof create_animal_schema>;
export type UpdateAnimal = z.infer<typeof update_animal_schema>;

export type Crop = z.infer<typeof crop_schema>;
export type CreateCrop = z.infer<typeof create_crop_schema>;
export type UpdateCrop = z.infer<typeof update_crop_schema>;

export type Task = z.infer<typeof task_schema>;
export type CreateTask = z.infer<typeof create_task_schema>;
export type UpdateTask = z.infer<typeof update_task_schema>;

export type FinanceEntry = z.infer<typeof finance_entry_schema>;
export type CreateFinanceEntry = z.infer<typeof create_finance_entry_schema>;
export type UpdateFinanceEntry = z.infer<typeof update_finance_entry_schema>;

export type Inventory = z.infer<typeof inventory_schema>;
export type CreateInventory = z.infer<typeof create_inventory_schema>;
export type UpdateInventory = z.infer<typeof update_inventory_schema>;

export type LoginInput = z.infer<typeof login_schema>;
export type SignupInput = z.infer<typeof signup_schema>;
export type PasswordResetRequest = z.infer<typeof password_reset_request_schema>;
export type PasswordReset = z.infer<typeof password_reset_schema>;
