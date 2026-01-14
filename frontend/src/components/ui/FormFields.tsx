import React, { useState } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { ChevronDown, Search, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ERROR_INPUT_CLASSES = 'border-red-500 focus:ring-red-500';
const DEFAULT_BORDER_CLASS = 'border-gray-300';

interface BaseFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  showPasswordToggle?: boolean;
  icon?: React.ReactNode;
}

export function TextField({
  label,
  name,
  required,
  error,
  helpText,
  className = '',
  type = 'text',
  placeholder,
  value,
  onChange,
  showPasswordToggle = false,
  icon,
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const baseInputClasses = `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-blue-500 transition-colors ${
    error ? ERROR_INPUT_CLASSES : DEFAULT_BORDER_CLASS
  } ${icon ? 'pl-10' : ''} ${className}`;

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <Input
          id={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={baseInputClasses}
        />

        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {helpText && !error && <p className="text-gray-500 text-sm">{helpText}</p>}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  searchable?: boolean;
  loading?: boolean;
}

export function SelectField({
  label,
  name,
  required,
  error,
  helpText,
  className = '',
  options,
  placeholder = 'Select an option',
  value,
  onChange,
  searchable = false,
  loading = false,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = searchable
    ? options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const baseSelectClasses = `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-blue-500 transition-colors cursor-pointer ${
    error ? ERROR_INPUT_CLASSES : DEFAULT_BORDER_CLASS
  } ${className}`;

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        <div
          className={`${baseSelectClasses} ${isOpen ? 'ring-2 ring-blue-500' : ''} flex items-center justify-between`}
          onClick={() => !loading && setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {loading ? 'Loading...' : selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {isOpen && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  {searchable ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      option.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'
                    } ${value === option.value ? 'bg-blue-50 text-blue-700' : ''}`}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {value === option.value && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {helpText && !error && <p className="text-gray-500 text-sm">{helpText}</p>}
    </div>
  );
}

interface NumberFieldProps extends BaseFieldProps {
  placeholder?: string;
  value?: number | string;
  onChange?: (value: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  allowNegative?: boolean;
}

export function NumberField({
  label,
  name,
  required,
  error,
  helpText,
  className = '',
  placeholder,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  allowNegative = true,
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Handle empty input
    if (newValue === '') {
      onChange?.(newValue);
      return;
    }

    // Validate negative numbers
    if (!allowNegative && newValue.startsWith('-')) {
      return;
    }

    // Validate numeric input
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      // Validate min/max
      if (min !== undefined && numValue < min) return;
      if (max !== undefined && numValue > max) return;

      onChange?.(numValue);
    }
  };

  const baseInputClasses = `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-blue-500 transition-colors ${
    error ? ERROR_INPUT_CLASSES : DEFAULT_BORDER_CLASS
  } ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${className}`;

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </div>
        )}

        <Input
          id={name}
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={baseInputClasses}
        />

        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {helpText && !error && <p className="text-gray-500 text-sm">{helpText}</p>}
    </div>
  );
}

interface DateFieldProps extends BaseFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  showTime?: boolean;
}

export function DateField({
  label,
  name,
  required,
  error,
  helpText,
  className = '',
  placeholder,
  value,
  onChange,
  minDate,
  maxDate,
  showTime = false,
}: DateFieldProps) {
  const inputType = showTime ? 'datetime-local' : 'date';

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <Input
        id={name}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        min={minDate}
        max={maxDate}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-blue-500 transition-colors ${
          error ? ERROR_INPUT_CLASSES : DEFAULT_BORDER_CLASS
        } ${className}`}
      />

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {helpText && !error && <p className="text-gray-500 text-sm">{helpText}</p>}
    </div>
  );
}

interface TextAreaFieldProps extends BaseFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  maxLength?: number;
  showCharCount?: boolean;
}

export function TextAreaField({
  label,
  name,
  required,
  error,
  helpText,
  className = '',
  placeholder,
  value,
  onChange,
  rows = 3,
  resize = 'vertical',
  maxLength,
  showCharCount = false,
}: TextAreaFieldProps) {
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  const charCount = value?.length || 0;

  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <Textarea
        id={name}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-blue-500 transition-colors resize-none ${
          error ? ERROR_INPUT_CLASSES : DEFAULT_BORDER_CLASS
        } ${resizeClasses[resize]} ${className}`}
      />

      <div className="flex items-center justify-between">
        <div>
          {error && (
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {helpText && !error && <p className="text-gray-500 text-sm">{helpText}</p>}
        </div>

        {showCharCount && maxLength && (
          <span
            className={`text-sm ${charCount > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  description?: string;
}

export function CheckboxField({
  label,
  name,
  required,
  error,
  helpText,
  className = '',
  checked = false,
  onChange,
  description,
}: CheckboxFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <input
          id={name}
          type="checkbox"
          checked={checked}
          onChange={e => onChange?.(e.target.checked)}
          className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
            error ? 'border-red-500' : ''
          } ${className}`}
        />
        <div className="flex-1">
          <Label htmlFor={name} className="flex items-center gap-1 cursor-pointer">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>

          {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm ml-7">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {helpText && !error && <p className="text-gray-500 text-sm ml-7">{helpText}</p>}
    </div>
  );
}
