/**
 * Testing Utilities and Configuration
 * Standardized testing patterns, mocks, and utilities
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import type { ReactElement } from 'react';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

// Create a new QueryClient for each test
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// CUSTOM RENDER FUNCTIONS
// ============================================================================

interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

function TestWrapper({ children, queryClient = createTestQueryClient() }: TestWrapperProps) {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(BrowserRouter, null, children)
  );
}

export interface CustomRenderOptions {
  queryClient?: QueryClient;
  route?: string;
}

function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => {
      const wrapperProps = { queryClient, children };
      return React.createElement(TestWrapper, wrapperProps);
    },
    ...renderOptions,
  });
}

function customRenderHook<Result, Props>(
  hook: (props: Props) => Result,
  options: {
    initialProps?: Props;
    queryClient?: QueryClient;
  } = {}
) {
  const { queryClient = createTestQueryClient(), ...renderHookOptions } = options;

  return renderHook(hook, {
    wrapper: ({ children }) => {
      const wrapperProps = { queryClient, children };
      return React.createElement(TestWrapper, wrapperProps);
    },
    ...renderHookOptions,
  });
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

import type {
  User,
  Farm,
  Animal,
  Field,
  Task,
  InventoryItem,
  ApiResponse,
} from '../types/entities';

export interface TestUser {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'user' | 'farmer';
}

export interface TestFarm {
  id: string;
  name: string;
  owner_id: string;
  location?: string;
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '',
    ...overrides,
  } as User;
}

export function createMockFarm(overrides: Partial<Farm> = {}): Farm {
  return {
    id: 'farm-1',
    name: 'Test Farm',
    location: 'Test Location',
    area_hectares: 100,
    owner_id: 'user-1',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '',
    ...overrides,
  } as Farm;
}

export function createMockAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    id: 'animal-1',
    farm_id: 'farm-1',
    name: 'Test Animal',
    species: 'cattle',
    breed: 'Holstein',
    identification_tag: 'TAG001',
    birth_date: '2023-01-01',
    sex: 'female',
    health_status: 'healthy',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '',
    ...overrides,
  } as Animal;
}

export function createMockField(overrides: Partial<Field> = {}): Field {
  return {
    id: 'field-1',
    farm_id: 'farm-1',
    name: 'Test Field',
    area_hectares: 10,
    crop_type: 'corn',
    soil_type: 'loam',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '',
    ...overrides,
  } as Field;
}

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    farm_id: 'farm-1',
    title: 'Test Task',
    description: 'Test task description',
    task_type: 'maintenance',
    status: 'pending',
    priority: 'normal',
    due_date: '2024-12-31',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '',
    ...overrides,
  } as Task;
}

export function createMockInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    farm_id: 'farm-1',
    name: 'Test Item',
    category: 'feed',
    qty: 100,
    unit: 'kg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '',
    ...overrides,
  } as InventoryItem;
}

// ============================================================================
// API MOCKING UTILITIES
// ============================================================================

export function createMockApiResponse<T>(
  data: T,
  overrides: Partial<ApiResponse<T>> = {}
): ApiResponse<T> {
  return {
    data,
    success: true,
    message: 'Success',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockApiError(
  message: string = 'An error occurred',
  _statusCode: number = 500,
  error: string = 'INTERNAL_ERROR'
): ApiResponse<null> {
  return {
    data: null,
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// AUTH MOCKING
// ============================================================================

export function mockAuthContext(user: User | null = createMockUser()) {
  const mockUseAuth = vi.fn(() => ({
    user,
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    isAuthenticated: !!user,
  }));

  return mockUseAuth;
}

// ============================================================================
// LOCAL STORAGE MOCKING
// ============================================================================

export function mockLocalStorage() {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  return localStorageMock;
}

// ============================================================================
// FETCH MOCKING
// ============================================================================

export function mockFetch(response: unknown, status: number = 200) {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
  };

  Object.defineProperty(globalThis, 'fetch', {
    writable: true,
    value: vi.fn().mockResolvedValue(mockResponse),
  });

  return globalThis.fetch as ReturnType<typeof vi.fn>;
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

export function waitForNextTick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function waitForMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export function setupTestEnvironment() {
  // Mock console methods to reduce noise
  const originalConsole = { ...console };

  beforeAll(() => {
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });

  // Clean up after each test
  afterEach(() => {
    vi.clearAllMocks();
  });
}

// ============================================================================
// EXPORT CUSTOM RENDER FUNCTIONS
// ============================================================================

export { customRender as render, customRenderHook as renderHook };
