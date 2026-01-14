// Base UI Components
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Switch } from './switch';
export { Progress } from './progress';
export { Badge } from './badge';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Alert, AlertDescription, AlertTitle } from './alert';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

// Enhanced UI Components
export { UnifiedModal } from './UnifiedModal';
export { UnifiedList } from './UnifiedList';
export { FloatingActionButton } from './FloatingActionButton';

// Centralized State Components
export {
  LoadingSpinner,
  LoadingScreen,
  LoadingCard,
  ErrorState,
  EmptyState,
  LoadingErrorContent,
} from './LoadingStates';

export { useConfirmation, ConfirmDialogs } from './ConfirmationDialog';

// Enhanced Form Components
export {
  TextField,
  SelectField,
  NumberField,
  DateField,
  TextAreaField,
  CheckboxField,
} from './FormFields';

// Validation Components and Utilities
export {
  Validators,
  validateField,
  validateForm,
  ValidationStatus,
  useFormValidation,
  validatePasswordStrength,
  PasswordStrength,
  validatePhoneNumber,
  type ValidationRule,
  type ValidationSchema,
  type ValidationErrors,
} from './Validation';
