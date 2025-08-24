import React, { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Button Component with variants
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon: Icon, iconPosition = 'left', children, disabled, ...props }, ref) => {
    const baseClasses = 'btn focus-ring active-scale tap-highlight-none touch-area';
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      danger: 'btn-danger',
      success: 'btn-success',
      warning: 'btn-warning',
      ghost: 'btn-ghost',
      gradient: 'btn-gradient'
    };
    const sizeClasses = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg'
    };

    // Enhanced accessibility props
    const accessibilityProps = {
      'aria-disabled': disabled || loading,
      'aria-busy': loading ? 'true' : undefined,
      'aria-label': loading ? 'Loading...' : props['aria-label'],
      role: 'button',
      tabIndex: disabled ? -1 : 0
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...accessibilityProps}
        {...props}
      >
        {loading && (
          <>
            <div className="spinner mr-2" aria-hidden="true" />
            <span className="sr-only">Loading</span>
          </>
        )}
        {Icon && iconPosition === 'left' && !loading && (
          <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
        )}
        {children}
        {Icon && iconPosition === 'right' && !loading && (
          <Icon className="w-4 h-4 ml-2" aria-hidden="true" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Enhanced Card Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'success' | 'warning' | 'danger' | 'info';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = 'rounded-xl border transition-all duration-200';
    const variantClasses = {
      default: 'card',
      elevated: 'card-elevated',
      interactive: 'card-interactive',
      success: 'card-success',
      warning: 'card-warning',
      danger: 'card-danger',
      info: 'card-info'
    };
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };

    return (
      <div
        className={cn(
          baseClasses,
          variantClasses[variant],
          variant === 'default' ? paddingClasses[padding] : '',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Enhanced Input Component
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  required?: boolean;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, icon: Icon, iconPosition = 'left', required, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    
    // Enhanced accessibility props
    const accessibilityProps = {
      id: inputId,
      'aria-required': required,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': [
        error ? errorId : null,
        helpText ? helpId : null
      ].filter(Boolean).join(' ') || undefined,
    };

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <div className={cn('relative', Icon && 'input-with-icon')}>
          {Icon && iconPosition === 'left' && (
            <Icon className="input-icon" aria-hidden="true" />
          )}
          <input
            className={cn(
              'form-input',
              error && 'error-field border-red-300 focus:ring-red-500',
              Icon && iconPosition === 'left' && 'pl-10',
              Icon && iconPosition === 'right' && 'pr-10',
              className
            )}
            ref={ref}
            {...accessibilityProps}
            {...props}
          />
          {Icon && iconPosition === 'right' && (
            <Icon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
          )}
        </div>
        {error && (
          <div id={errorId} className="error-message" role="alert" aria-live="polite">
            {error}
          </div>
        )}
        {helpText && !error && (
          <div id={helpId} className="form-help">
            {helpText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helpText, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <textarea
          className={cn(
            'form-textarea',
            error && 'border-red-300 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <div className="form-error">{error}</div>}
        {helpText && !error && <div className="form-help">{helpText}</div>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select Component
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helpText, options, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <select
          className={cn(
            'form-select',
            error && 'border-red-300 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <div className="form-error">{error}</div>}
        {helpText && !error && <div className="form-help">{helpText}</div>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'currentColor',
  backgroundColor = '#e5e7eb',
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

// Badge Component
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'badge';
    const variantClasses = {
      primary: 'badge-primary',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      gray: 'badge-gray'
    };
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm'
    };

    return (
      <span
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Alert Component
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  icon?: LucideIcon;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, icon: Icon, dismissible, onDismiss, children, ...props }, ref) => {
    const variantClasses = {
      success: 'alert-success status-success',
      warning: 'alert-warning status-warning',
      danger: 'alert-danger status-error',
      info: 'alert-info status-info'
    };

    // Enhanced accessibility props
    const accessibilityProps = {
      role: variant === 'danger' ? 'alert' : 'status',
      'aria-live': variant === 'danger' ? 'assertive' : 'polite',
      'aria-atomic': 'true',
      'aria-labelledby': title ? 'alert-title' : undefined
    };

    return (
      <div
        className={cn(
          'alert animate-fade-in',
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...accessibilityProps}
        {...props}
      >
        <div className="flex">
          {Icon && (
            <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          )}
          <div className="flex-1">
            {title && (
              <h4 id="alert-title" className="font-medium mb-1">{title}</h4>
            )}
            {children}
          </div>
          {dismissible && (
            <button
              onClick={onDismiss}
              className="ml-3 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded"
              aria-label="Dismiss alert"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'spinner',
    md: 'spinner-lg',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={cn('spinner', sizeClasses[size], className)} />
  );
};

// Empty State Component
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn('empty-state', className)}>
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
};

// Toast Component (for notifications)
interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={cn(
      'fixed top-4 right-4 max-w-sm w-full bg-white border rounded-lg shadow-lg z-50 animate-slide-in-right',
      typeClasses[type]
    )}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {title && (
              <h4 className="font-medium mb-1">{title}</h4>
            )}
            <p className="text-sm">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-3 text-current opacity-70 hover:opacity-100 focus:outline-none"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};