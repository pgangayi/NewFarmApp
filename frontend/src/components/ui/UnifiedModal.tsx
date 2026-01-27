// Unified Modal Component
// Eliminates 8+ identical modal implementations

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  step?: string;
  min?: string;
  rows?: number;
  creatable?: boolean;
  onAdd?: () => void;
}

export interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  title: string;
  description?: string;
  fields: ModalField[];
  initialData?: any;
  isLoading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

const DEFAULT_INITIAL_DATA = {};

export function UnifiedModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  fields,
  initialData = DEFAULT_INITIAL_DATA,
  isLoading = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  size = 'md',
}: UnifiedModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const defaultData: Record<string, unknown> = {};

      fields.forEach(field => {
        if (field.type === 'checkbox') {
          defaultData[field.name] = initialData[field.name] || false;
        } else {
          defaultData[field.name] = initialData[field.name] || '';
        }
      });

      setFormData(defaultData);
      setErrors({});
    }
  }, [isOpen, initialData, fields]);

  // Handle field change
  const handleFieldChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name] === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (field.type === 'number' && formData[field.name]) {
        const value = formData[field.name] as string;
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          newErrors[field.name] = `${field.label} must be a valid number`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Transform checkbox values
    const submitData: Record<string, unknown> = {};
    Object.keys(formData).forEach(key => {
      const field = fields.find(f => f.name === key);
      if (field?.type === 'checkbox') {
        submitData[key] = formData[key] || false;
      } else if (field?.type === 'number' && formData[key]) {
        submitData[key] = parseFloat(formData[key] as string);
      } else {
        submitData[key] = formData[key];
      }
    });

    onSubmit(submitData);
  };

  // Render field
  const renderField = (field: ModalField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    const baseInputClasses = `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-blue-500 ${
      error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <input
            id={field.name}
            type="text"
            value={(value as string) || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );

      case 'number':
        return (
          <input
            id={field.name}
            type="number"
            value={(value as string) || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            step={field.step}
            min={field.min}
            className={baseInputClasses}
          />
        );

      case 'date':
        return (
          <input
            id={field.name}
            type="date"
            value={(value as string) || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            className={baseInputClasses}
          />
        );

      case 'select':
        return (
          <div className="flex gap-2">
            <select
              id={field.name}
              value={(value as string) || ''}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              className={baseInputClasses}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.creatable && (
              <button
                type="button"
                onClick={field.onAdd}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                title={`Add new ${field.label}`}
                aria-label={`Add new ${field.label}`}
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            id={field.name}
            value={(value as string) || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            className={baseInputClasses}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={field.name}
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={e => handleFieldChange(field.name, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={field.name} className="ml-2 block text-sm text-gray-900">
              {field.placeholder || field.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              disabled={isLoading}
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields
                .filter(field => field.type !== 'checkbox')
                .map(field => (
                  <div key={field.name}>
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                    {errors[field.name] && (
                      <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
            </div>

            {/* Checkbox fields */}
            {fields.filter(field => field.type === 'checkbox').length > 0 && (
              <div className="space-y-3">
                {fields
                  .filter(field => field.type === 'checkbox')
                  .map(field => (
                    <div key={field.name}>
                      {renderField(field)}
                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UnifiedModal;
