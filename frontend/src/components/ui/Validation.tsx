import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// Validation Rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
  match?: string; // Field name to match (for password confirmation)
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

export interface ValidationErrors {
  [fieldName: string]: string;
}

// Built-in validation functions
export const Validators = {
  required:
    (message = 'This field is required') =>
    (value: any) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      return null;
    },

  email:
    (message = 'Please enter a valid email address') =>
    (value: string) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return message;
      }
      return null;
    },

  url:
    (message = 'Please enter a valid URL') =>
    (value: string) => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return message;
      }
    },

  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return null;
    if (value.length < min) {
      return message || `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (!value) return null;
    if (value.length > max) {
      return message || `Must be no more than ${max} characters long`;
    }
    return null;
  },

  pattern:
    (pattern: RegExp, message = 'Invalid format') =>
    (value: string) => {
      if (!value) return null;
      if (!pattern.test(value)) {
        return message;
      }
      return null;
    },

  number:
    (message = 'Please enter a valid number') =>
    (value: any) => {
      if (value === null || value === undefined || value === '') return null;
      if (isNaN(Number(value))) {
        return message;
      }
      return null;
    },

  min: (min: number, message?: string) => (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const numValue = Number(value);
    if (isNaN(numValue)) return null;
    if (numValue < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },

  max: (max: number, message?: string) => (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const numValue = Number(value);
    if (isNaN(numValue)) return null;
    if (numValue > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },

  match:
    (fieldName: string, message = 'Fields do not match') =>
    (value: any, values: any) => {
      if (value !== values[fieldName]) {
        return message;
      }
      return null;
    },

  custom:
    (validator: (value: any, values?: any) => string | null, message = 'Invalid value') =>
    (value: any, values?: any) => {
      return validator(value, values);
    },
};

// Main validation function
export function validateField(
  value: any,
  fieldName: string,
  rule: ValidationRule,
  allValues?: any
): string | null {
  // Required validation
  if (rule.required) {
    const requiredError = Validators.required()(value);
    if (requiredError) return requiredError;
  }

  // Skip other validations if field is empty and not required
  if (!value && !rule.required) return null;

  // Type-specific validations
  if (rule.email) {
    const emailError = Validators.email()(value);
    if (emailError) return emailError;
  }

  if (rule.url) {
    const urlError = Validators.url()(value);
    if (urlError) return urlError;
  }

  if (rule.number) {
    const numberError = Validators.number()(value);
    if (numberError) return numberError;
  }

  // Length validations
  if (rule.minLength) {
    const minLengthError = Validators.minLength(rule.minLength)(value);
    if (minLengthError) return minLengthError;
  }

  if (rule.maxLength) {
    const maxLengthError = Validators.maxLength(rule.maxLength)(value);
    if (maxLengthError) return maxLengthError;
  }

  // Pattern validation
  if (rule.pattern) {
    const patternError = Validators.pattern(rule.pattern)(value);
    if (patternError) return patternError;
  }

  // Numeric range validations
  if (rule.min !== undefined) {
    const minError = Validators.min(rule.min)(value);
    if (minError) return minError;
  }

  if (rule.max !== undefined) {
    const maxError = Validators.max(rule.max)(value);
    if (maxError) return maxError;
  }

  // Match validation
  if (rule.match && allValues) {
    const matchError = Validators.match(rule.match)(value, allValues);
    if (matchError) return matchError;
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) return customError;
  }

  return null;
}

// Validate entire form
export function validateForm(values: any, schema: ValidationSchema): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const [fieldName, rule] of Object.entries(schema)) {
    const error = validateField(values[fieldName], fieldName, rule, values);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return errors;
}

// Validation status component
interface ValidationStatusProps {
  errors: ValidationErrors;
  fieldName: string;
  touched: boolean;
  className?: string;
}

export function ValidationStatus({
  errors,
  fieldName,
  touched,
  className = '',
}: ValidationStatusProps) {
  const hasError = touched && errors[fieldName];
  const isValid = touched && !errors[fieldName];

  if (!touched) return null;

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      {hasError && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-600">{errors[fieldName]}</span>
        </>
      )}
      {isValid && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Looks good!</span>
        </>
      )}
    </div>
  );
}

// Form validation hook
export function useFormValidation(initialValues: any, validationSchema: ValidationSchema) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [touched, setTouchedFields] = React.useState<Record<string, boolean>>({});

  const validateSingleField = React.useCallback(
    (fieldName: string, value: any) => {
      const rule = validationSchema[fieldName];
      if (!rule) return null;

      return validateField(value, fieldName, rule, values);
    },
    [validationSchema, values]
  );

  const validateAllFields = React.useCallback(() => {
    const newErrors = validateForm(values, validationSchema);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationSchema]);

  const setValue = React.useCallback(
    (fieldName: string, value: any) => {
      setValues((prev: any) => ({ ...prev, [fieldName]: value }));

      // Clear error when user starts typing
      if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
      }
    },
    [errors]
  );

  const setFieldTouched = React.useCallback((fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const setFieldError = React.useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearError = React.useCallback((fieldName: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  }, []);

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedFields({});
  }, [initialValues]);

  const isValid = React.useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setFieldTouched,
    setFieldError,
    clearError,
    validateField: validateSingleField,
    validateAllFields,
    reset,
  };
}

// Password strength validator
export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  return {
    score,
    feedback,
    isStrong: score >= 4,
  };
}

// Password strength component
interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  const { score, feedback, isStrong } = validatePasswordStrength(password);

  if (!password) return null;

  const getStrengthColor = () => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (score <= 1) return 'Weak';
    if (score <= 2) return 'Fair';
    if (score <= 3) return 'Good';
    return 'Strong';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span
          className={`text-sm font-medium ${
            isStrong ? 'text-green-600' : score <= 2 ? 'text-red-600' : 'text-orange-600'
          }`}
        >
          {getStrengthText()}
        </span>
      </div>

      {feedback.length > 0 && (
        <div className="space-y-1">
          {feedback.map((item, index) => (
            <div key={index} className="flex items-center gap-1 text-sm text-gray-600">
              <Info className="h-3 w-3" />
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Phone number validator
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  if (!phone) return { isValid: true, formatted: '' };

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it's a valid length (10-15 digits)
  if (digits.length < 10 || digits.length > 15) {
    return {
      isValid: false,
      formatted: phone,
      error: 'Phone number must be 10-15 digits',
    };
  }

  // Format the phone number
  let formatted = digits;
  if (digits.length === 10) {
    // US format: (XXX) XXX-XXXX
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US format with country code: +1 (XXX) XXX-XXXX
    formatted = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return {
    isValid: true,
    formatted,
  };
}
