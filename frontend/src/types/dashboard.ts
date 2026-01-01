/**
 * Dashboard-specific types and utilities
 * Entity types should be imported from '../types/entities'
 */

// Color variants
export type ColorVariant =
  | 'green'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'emerald'
  | 'yellow'
  | 'red'
  | 'amber';

// Re-export entity types from entities.ts for convenience
export type {
  Farm,
  Crop,
  Animal,
  InventoryItem,
  Task,
  FinanceEntry,
  User,
  Field,
  Location,
  Operation,
  Treatment,
  ApiResponse,
  PaginatedResponse,
  ListOptions,
  ApiErrorResponse,
} from './entities';

// Component interfaces
import type { ComponentType } from 'react';

export interface StatCardProps {
  icon: ComponentType<React.SVGProps<SVGSVGElement>> | string;
  label: string;
  value: string | number;
  sublabel?: string;
  color: ColorVariant;
  onClick?: () => void;
}

export interface TabConfig {
  id: string;
  label: string;
  // Accept any React component that takes SVG props
  icon: ComponentType<React.SVGProps<SVGSVGElement>> | string;
  count?: number | undefined;
}

export interface BackgroundImageState {
  loaded: boolean;
  error: boolean;
  url: string;
}

export interface ColorClasses {
  bg: string;
  text: string;
  icon: string;
}
