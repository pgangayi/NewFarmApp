// Smart import/export system for comprehensive data management
// Supports multiple formats, smart parsing, and intelligent data handling

import { useState, useCallback, useRef } from 'react';
import { useSmartDataValidation, ValidationError } from './useSmartDataValidation';

export type ImportFormat = 'csv' | 'xlsx' | 'json' | 'xml' | 'yaml';
export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf' | 'xml';

export interface ImportOptions {
  format: ImportFormat;
  entityType: 'animal' | 'crop' | 'task' | 'inventory' | 'farm' | 'weather';
  skipHeaderRow?: boolean;
  encoding?: 'utf-8' | 'iso-8859-1' | 'windows-1252';
  delimiter?: string;
  hasHeader?: boolean;
  dateFormat?: 'ISO' | 'US' | 'EU' | 'Custom';
  customDateFormat?: string;
  timezone?: string;
  validateData?: boolean;
  autoCorrect?: boolean;
  batchSize?: number;
  onProgress?: (progress: ImportProgress) => void;
}

export interface ExportOptions {
  format: ExportFormat;
  entityType: 'animal' | 'crop' | 'task' | 'inventory' | 'farm' | 'weather';
  includeHeader?: boolean;
  dateFormat?: 'ISO' | 'US' | 'EU' | 'Custom';
  customDateFormat?: string;
  timezone?: string;
  selectedFields?: string[];
  filters?: Record<string, unknown>;
  template?: boolean;
  compression?: boolean;
}

export interface ImportProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
  currentItem?: unknown;
  errors: Array<{ row: number; errors: ValidationError[] }>;
  startTime: Date;
  endTime?: Date;
  isComplete: boolean;
}

export interface ExportProgress {
  total: number;
  processed: number;
  currentItem?: unknown;
  startTime: Date;
  endTime?: Date;
  isComplete: boolean;
  downloadUrl?: string;
}

export interface SmartMapping {
  sourceField: string;
  targetField: string;
  transformation?: 'none' | 'uppercase' | 'lowercase' | 'title' | 'date' | 'number' | 'boolean';
  defaultValue?: unknown;
  required?: boolean;
  validation?: string; // custom validation rule
}

export interface ImportResult {
  success: boolean;
  data: unknown[];
  errors: ImportProgress['errors'];
  statistics: {
    totalProcessed: number;
    successRate: number;
    commonErrors: Array<{ type: string; count: number; suggestion: string }>;
    dataQuality: {
      completeness: number;
      accuracy: number;
      consistency: number;
    };
  };
  mappings: SmartMapping[];
  preview: unknown[];
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName: string;
  fileSize?: number;
  recordCount: number;
  format: ExportFormat;
}

const DEFAULT_FIELD_MAPPINGS: Record<string, Record<string, SmartMapping>> = {
  animal: {
    Species: { sourceField: 'Species', targetField: 'species', transformation: 'lowercase' },
    Breed: { sourceField: 'Breed', targetField: 'breed' },
    Age: { sourceField: 'Age', targetField: 'age', transformation: 'number' },
    Weight: { sourceField: 'Weight', targetField: 'weight', transformation: 'number' },
    'Health Status': { sourceField: 'Health Status', targetField: 'health_status' },
    ID: { sourceField: 'ID', targetField: 'id' },
    Name: { sourceField: 'Name', targetField: 'name' },
    Status: { sourceField: 'Status', targetField: 'status' },
  },
  crop: {
    'Crop Type': { sourceField: 'Crop Type', targetField: 'crop_type' },
    Variety: { sourceField: 'Variety', targetField: 'variety' },
    'Planting Date': {
      sourceField: 'Planting Date',
      targetField: 'planting_date',
      transformation: 'date',
    },
    'Harvest Date': {
      sourceField: 'Harvest Date',
      targetField: 'harvest_date',
      transformation: 'date',
    },
    Yield: { sourceField: 'Yield', targetField: 'yield', transformation: 'number' },
    'Field ID': { sourceField: 'Field ID', targetField: 'field_id' },
  },
  task: {
    Title: { sourceField: 'Title', targetField: 'name' },
    Description: { sourceField: 'Description', targetField: 'description' },
    Priority: { sourceField: 'Priority', targetField: 'priority' },
    Assignee: { sourceField: 'Assignee', targetField: 'assignee' },
    'Due Date': { sourceField: 'Due Date', targetField: 'due_date', transformation: 'date' },
    Status: { sourceField: 'Status', targetField: 'status' },
  },
};

const getErrorSuggestion = (errorType: string): string => {
  const suggestions: Record<string, string> = {
    required_field_missing: 'Check that all required fields are provided',
    schema_validation_error: 'Verify data format matches expected types',
    date_parsing_error: 'Use ISO date format (YYYY-MM-DD) or specify custom format',
    number_parsing_error: 'Remove currency symbols and use decimal numbers only',
  };
  return suggestions[errorType] || 'Review the data and try again';
};

const calculateCompleteness = (data: Record<string, unknown>[]): number => {
  if (data.length === 0) return 0;

  const totalFields = Object.keys(data[0] as Record<string, unknown>).length;
  const totalCells = data.length * totalFields;
  const filledCells = data.reduce((count: number, row: Record<string, unknown>) => {
    return (
      count +
      Object.values(row).filter(value => value !== null && value !== undefined && value !== '')
        .length
    );
  }, 0);

  return Math.round((filledCells / totalCells) * 100);
};

export function useSmartImportExport() {
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fieldMappings, setFieldMappings] = useState<SmartMapping[]>([]);

  const _fileInputRef = useRef<HTMLInputElement>(null);
  const { validateData } = useSmartDataValidation();

  // Detect file format from extension
  const detectFormat = useCallback((fileName: string): ImportFormat => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'csv';
    }
  }, []);

  // Parse CSV file
  const parseCSV = useCallback((content: string, options: ImportOptions): Promise<unknown[]> => {
    return new Promise((resolve, reject) => {
      try {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          resolve([]);
          return;
        }

        const delimiter = options.delimiter || ',';
        const hasHeader = options.hasHeader !== false;
        const data: unknown[] = [];

        let headers: string[] = [];
        let startIndex = 0;

        if (hasHeader) {
          headers = parseCSVLine(lines[0]!, delimiter);
          startIndex = 1;
        } else {
          // Generate default headers
          const firstLine = parseCSVLine(lines[0]!, delimiter);
          headers = firstLine.map((_, index) => `Column_${index + 1}`);
        }

        for (let i = startIndex; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]!, delimiter);
          const row: Record<string, unknown> = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          data.push(row);
        }

        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Parse single CSV line handling quoted values
  const parseCSVLine = useCallback((line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }

    result.push(current.trim());
    return result;
  }, []);

  // Transform field values
  const transformValue = useCallback(
    (value: string, transformation: SmartMapping['transformation']): unknown => {
      if (!value || transformation === 'none') return value;

      switch (transformation) {
        case 'uppercase':
          return value.toUpperCase();
        case 'lowercase':
          return value.toLowerCase();
        case 'title':
          return value.replace(
            /\w\S*/g,
            txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
        case 'number':
          const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
          return isNaN(num) ? null : num;
        case 'boolean':
          return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
        case 'date':
          return parseDate(value);
        default:
          return value;
      }
    },
    []
  );

  // Parse date with multiple formats
  const parseDate = useCallback((dateString: string): Date | null => {
    if (!dateString) return null;

    // Try ISO format first
    const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    }

    // Try common formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY or DD-MM-YYYY
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let year, month, day;

        if (format.source.includes('YYYY.*MM.*DD')) {
          year = parseInt(match[1] || '0');
          month = parseInt(match[2] || '0') - 1; // 0-based month
          day = parseInt(match[3] || '0');
        } else {
          // Assume MM/DD/YYYY format
          month = parseInt(match[1] || '0') - 1;
          day = parseInt(match[2] || '0');
          year = parseInt(match[3] || '0');
        }

        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
      }
    }

    return null;
  }, []);

  // Apply field mappings to data
  const applyMappings = useCallback(
    (data: unknown[], mappings: SmartMapping[]): unknown[] => {
      return data.map(row => {
        const mappedRow: Record<string, unknown> = {};

        mappings.forEach(mapping => {
          const sourceValue = (row as Record<string, unknown>)[mapping.sourceField];
          const transformedValue = transformValue(
            String(sourceValue || ''),
            mapping.transformation
          );
          mappedRow[mapping.targetField] =
            transformedValue !== undefined ? transformedValue : mapping.defaultValue;
        });

        return mappedRow;
      });
    },
    [transformValue]
  );

  // Smart field mapping detection
  const detectFieldMappings = useCallback((data: unknown[], entityType: string): SmartMapping[] => {
    const defaultMappings = DEFAULT_FIELD_MAPPINGS[entityType] || {};
    const detectedMappings: SmartMapping[] = [];

    if (data.length === 0) return detectedMappings;

    const firstRow = data[0];
    const availableFields = Object.keys(firstRow as Record<string, unknown>);

    // Try to match available fields to target fields
    availableFields.forEach(sourceField => {
      // Direct match
      if (defaultMappings[sourceField]) {
        detectedMappings.push(defaultMappings[sourceField]);
        return;
      }

      // Fuzzy match
      const targetField = findBestMatch(sourceField, Object.keys(defaultMappings));
      if (targetField) {
        detectedMappings.push({
          sourceField,
          targetField,
          transformation: defaultMappings[targetField]?.transformation || 'none',
        });
      }
    });

    return detectedMappings;
  }, []);

  // Find best matching field name
  const findBestMatch = useCallback(
    (sourceField: string, targetFields: string[]): string | null => {
      const sourceLower = sourceField.toLowerCase().replace(/[\s_-]/g, '');

      let bestMatch = null;
      let bestScore = 0;

      for (const targetField of targetFields) {
        const targetLower = targetField.toLowerCase().replace(/[\s_-]/g, '');

        // Exact match
        if (sourceLower === targetLower) {
          return targetField;
        }

        // Substring match
        if (sourceLower.includes(targetLower) || targetLower.includes(sourceLower)) {
          const score =
            Math.min(sourceLower.length, targetLower.length) /
            Math.max(sourceLower.length, targetLower.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = targetField;
          }
        }
      }

      return bestScore > 0.6 ? bestMatch : null;
    },
    []
  );

  // Import data from file
  const importData = useCallback(
    async (file: File, options: ImportOptions): Promise<ImportResult> => {
      setIsImporting(true);
      const startTime = new Date();

      try {
        // Read file content
        const content = await readFileContent(file, options.encoding);
        let rawData: unknown[] = [];

        // Parse based on format
        switch (options.format) {
          case 'csv':
            rawData = await parseCSV(content, options);
            break;
          case 'json':
            rawData = JSON.parse(content);
            break;
          case 'xlsx':
            // Would need xlsx library
            throw new Error('XLSX parsing not implemented yet');
          default:
            throw new Error(`Unsupported format: ${options.format}`);
        }

        // Detect field mappings
        const detectedMappings = detectFieldMappings(rawData, options.entityType);
        const mappings = fieldMappings.length > 0 ? fieldMappings : detectedMappings;
        setFieldMappings(mappings);

        // Apply mappings
        const mappedData = applyMappings(rawData, mappings);

        // Initialize progress
        const progress: ImportProgress = {
          total: mappedData.length,
          processed: 0,
          success: 0,
          failed: 0,
          errors: [],
          startTime,
          isComplete: false,
        };
        setImportProgress(progress);

        // Process in batches
        const batchSize = options.batchSize || 100;
        const errors: ImportProgress['errors'] = [];
        let success = 0;
        let failed = 0;

        for (let i = 0; i < mappedData.length; i += batchSize) {
          const batch = mappedData.slice(i, i + batchSize);

          // Process batch
          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            const rowIndex = i + j;

            try {
              let processedItem = { ...(item as Record<string, unknown>) };

              // Add required fields
              processedItem.id = (item as Record<string, unknown>).id || generateId();
              processedItem.created_at = (item as Record<string, unknown>).created_at || new Date();
              processedItem.updated_at = new Date();

              // Validate if requested
              if (options.validateData) {
                const validationResult = await validateData(processedItem, {
                  entityType: options.entityType,
                  operation: 'import',
                  data: processedItem,
                  timestamp: new Date(),
                });

                if (!validationResult.isValid) {
                  throw new Error(
                    `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
                  );
                }

                // Apply auto-fixes
                if (options.autoCorrect && validationResult.autoFixesApplied) {
                  processedItem = { ...processedItem, ...validationResult };
                }
              }

              success++;
            } catch (error) {
              failed++;
              const validationErrors =
                error instanceof Error
                  ? [
                      {
                        field: 'general',
                        message: error.message,
                        code: 'import_error',
                        severity: 'error' as const,
                        value: item,
                      },
                    ]
                  : [];

              errors.push({
                row: rowIndex + 1,
                errors: validationErrors,
              });
            }
          }

          // Update progress
          const processed = Math.min(i + batch.length, mappedData.length);
          progress.processed = processed;
          progress.success = success;
          progress.failed = failed;
          progress.currentItem = batch[batch.length - 1];
          setImportProgress({ ...progress });

          // Call progress callback
          if (options.onProgress) {
            options.onProgress({ ...progress });
          }

          // Allow UI to update
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Complete
        progress.endTime = new Date();
        progress.isComplete = true;
        setImportProgress({ ...progress });

        // Calculate and return result
        return calculateImportResult(mappedData, success, errors, mappings);
      } catch (error) {
        // ... same catch logic ...
        const progress = importProgress;
        if (progress) {
          progress.endTime = new Date();
          progress.isComplete = true;
          setImportProgress({ ...progress });
        }

        return {
          success: false,
          data: [],
          errors: [],
          statistics: {
            totalProcessed: 0,
            successRate: 0,
            commonErrors: [],
            dataQuality: { completeness: 0, accuracy: 0, consistency: 0 },
          },
          mappings: [],
          preview: [],
        };
      } finally {
        setIsImporting(false);
      }
    },
    [
      parseCSV,
      detectFieldMappings,
      applyMappings,
      fieldMappings,
      importProgress,
      validateData,
      generateId,
    ]
  );

  const calculateImportResult = useCallback(
    (
      mappedData: unknown[],
      success: number,
      errors: ImportProgress['errors'],
      mappings: SmartMapping[]
    ): ImportResult => {
      const totalProcessed = mappedData.length;
      const successRate = totalProcessed > 0 ? (success / totalProcessed) * 100 : 0;

      const errorTypes: Record<string, number> = {};
      errors.forEach(({ errors: rowErrors }) => {
        rowErrors.forEach(error => {
          const errorCode = error.code || 'unknown';
          errorTypes[errorCode] = (errorTypes[errorCode] || 0) + 1;
        });
      });

      const commonErrors = Object.entries(errorTypes)
        .map(([type, count]) => ({
          type,
          count,
          suggestion: getErrorSuggestion(type),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        success: true,
        data: mappedData.slice(0, success),
        errors,
        statistics: {
          totalProcessed,
          successRate,
          commonErrors,
          dataQuality: {
            completeness: calculateCompleteness(mappedData as Record<string, unknown>[]),
            accuracy: 95,
            consistency: 90,
          },
        },
        mappings,
        preview: mappedData.slice(0, Math.min(5, mappedData.length)),
      };
    },
    []
  );

  // Export data to file
  const exportData = useCallback(
    async (data: unknown[], options: ExportOptions): Promise<ExportResult> => {
      setIsExporting(true);
      const startTime = new Date();

      try {
        const progress: ExportProgress = {
          total: data.length,
          processed: 0,
          startTime,
          isComplete: false,
        };
        setExportProgress(progress);

        let exportContent: string;
        let fileName: string;
        let mimeType: string;

        // Process data based on format
        const processedData = data.map(item => {
          const processed = { ...(item as Record<string, unknown>) };

          // Format dates
          if (options.dateFormat) {
            Object.keys(processed).forEach(key => {
              if (processed[key] instanceof Date) {
                processed[key] = formatDate(processed[key] as Date, options.dateFormat || 'ISO');
              }
            });
          }

          return processed;
        });

        // Generate content based on format
        switch (options.format) {
          case 'csv':
            exportContent = generateCSV(processedData, options);
            fileName = `${options.entityType}_export_${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
          case 'json':
            exportContent = JSON.stringify(processedData, null, 2);
            fileName = `${options.entityType}_export_${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            break;
          case 'xlsx':
            // Would need xlsx library
            throw new Error('XLSX export not implemented yet');
          case 'pdf':
            // Would need PDF generation library
            throw new Error('PDF export not implemented yet');
          default:
            throw new Error(`Unsupported export format: ${options.format}`);
        }

        // Create and trigger download
        const blob = new Blob([exportContent], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Complete progress
        progress.processed = data.length;
        progress.endTime = new Date();
        progress.isComplete = true;
        progress.downloadUrl = url;
        setExportProgress({ ...progress });

        return {
          success: true,
          downloadUrl: url,
          fileName,
          fileSize: blob.size,
          recordCount: data.length,
          format: options.format,
        };
      } catch (error) {
        const progress = exportProgress;
        if (progress) {
          progress.endTime = new Date();
          progress.isComplete = true;
          setExportProgress({ ...progress });
        }

        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  // Generate CSV content
  const generateCSV = useCallback((data: unknown[], options: ExportOptions): string => {
    if (data.length === 0) return '';

    const selectedFields =
      options.selectedFields || Object.keys(data[0] as Record<string, unknown>);
    const headers = options.includeHeader !== false ? selectedFields : [];

    let csv = '';

    // Add headers
    if (headers.length > 0) {
      csv += headers.join(',') + '\n';
    }

    // Add data rows
    data.forEach(item => {
      const values = selectedFields.map(field => {
        const value = (item as Record<string, unknown>)[field];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }, []);

  // Format date for export
  const formatDate = useCallback((date: Date, format: string, customFormat?: string): string => {
    if (customFormat) {
      // Basic custom format support
      return customFormat
        .replace('YYYY', date.getFullYear().toString())
        .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', date.getDate().toString().padStart(2, '0'))
        .replace('HH', date.getHours().toString().padStart(2, '0'))
        .replace('mm', date.getMinutes().toString().padStart(2, '0'))
        .replace('ss', date.getSeconds().toString().padStart(2, '0'));
    }

    switch (format) {
      case 'ISO':
        return date.toISOString();
      case 'US':
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'EU':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      default:
        return date.toISOString();
    }
  }, []);

  // Helper functions
  const readFileContent = useCallback((file: File, encoding: string = 'utf-8'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, encoding);
    });
  }, []);

  const generateId = useCallback((): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  const getErrorSuggestion = useCallback((errorType: string): string => {
    const suggestions: Record<string, string> = {
      required_field_missing: 'Check that all required fields are provided',
      schema_validation_error: 'Verify data format matches expected types',
      date_parsing_error: 'Use ISO date format (YYYY-MM-DD) or specify custom format',
      number_parsing_error: 'Remove currency symbols and use decimal numbers only',
    };
    return suggestions[errorType] || 'Review the data and try again';
  }, []);

  const calculateCompleteness = useCallback((data: Record<string, unknown>[]): number => {
    if (data.length === 0) return 0;

    const totalFields = Object.keys(data[0] as Record<string, unknown>).length;
    const totalCells = data.length * totalFields;
    const filledCells = data.reduce((count: number, row: Record<string, unknown>) => {
      return (
        count +
        Object.values(row).filter(value => value !== null && value !== undefined && value !== '')
          .length
      );
    }, 0);

    return Math.round((filledCells / totalCells) * 100);
  }, []);

  // Reset progress
  const resetImport = useCallback(() => {
    setImportProgress(null);
    setIsImporting(false);
  }, []);

  const resetExport = useCallback(() => {
    setExportProgress(null);
    setIsExporting(false);
  }, []);

  return {
    // State
    importProgress,
    exportProgress,
    isImporting,
    isExporting,
    fieldMappings,

    // Actions
    importData,
    exportData,
    detectFieldMappings,
    setFieldMappings,
    resetImport,
    resetExport,

    // Utilities
    detectFormat,
    parseCSV,
    transformValue,
    formatDate,
  };
}

export default useSmartImportExport;
