// Smart data validation hook for unified CRUD operations
// Provides data validation and sanitization services

import { useCallback } from 'react';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[] | undefined;
}

export interface ValidationContext {
  entityType: string;
  operation: 'create' | 'update' | 'delete' | 'list';
  data: unknown;
  timestamp: Date;
}

export function useSmartDataValidation() {
  const validateData = useCallback(
    async (data: unknown, context: ValidationContext): Promise<ValidationResult> => {
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // Basic validation for common data types
      if (context.operation === 'create' || context.operation === 'update') {
        if (typeof data === 'object' && data !== null) {
          const dataObj = data as Record<string, unknown>;

          // Check for required fields based on entity type
          switch (context.entityType) {
            case 'farm':
              if (!dataObj['name'] || typeof dataObj['name'] !== 'string') {
                errors.push({
                  field: 'name',
                  message: 'Farm name is required',
                  code: 'REQUIRED_FIELD',
                });
              }
              break;

            case 'field':
              if (!dataObj['name'] || typeof dataObj['name'] !== 'string') {
                errors.push({
                  field: 'name',
                  message: 'Field name is required',
                  code: 'REQUIRED_FIELD',
                });
              }
              if (!dataObj['farm_id']) {
                errors.push({
                  field: 'farm_id',
                  message: 'Farm ID is required',
                  code: 'REQUIRED_FIELD',
                });
              }
              break;

            case 'task':
              if (!dataObj['title'] || typeof dataObj['title'] !== 'string') {
                errors.push({
                  field: 'title',
                  message: 'Task title is required',
                  code: 'REQUIRED_FIELD',
                });
              }
              break;

            case 'crop':
              if (!dataObj['name'] || typeof dataObj['name'] !== 'string') {
                errors.push({
                  field: 'name',
                  message: 'Crop name is required',
                  code: 'REQUIRED_FIELD',
                });
              }
              break;

            case 'inventory':
              if (!dataObj['name'] || typeof dataObj['name'] !== 'string') {
                errors.push({
                  field: 'name',
                  message: 'Inventory item name is required',
                  code: 'REQUIRED_FIELD',
                });
              }
              break;

            default:
              // Generic validation for unknown entity types
              warnings.push({
                field: 'general',
                message: `No specific validation rules for ${context.entityType}`,
                code: 'NO_VALIDATION_RULES',
              });
          }

          // Check for suspicious patterns
          if (dataObj['name'] && typeof dataObj['name'] === 'string') {
            if (dataObj['name'].length > 255) {
              warnings.push({
                field: 'name',
                message: 'Name is very long, consider shortening',
                code: 'LONG_FIELD',
              });
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    },
    []
  );

  return {
    validateData,
  };
}

export default useSmartDataValidation;
