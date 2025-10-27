import React, { useState } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  helpTooltip?: string;
  showValidation?: boolean;
  onValidate?: (value: string) => string | undefined;
  format?: (value: string) => string;
}

export function Input({
  label,
  error,
  helpText,
  helpTooltip,
  showValidation = false,
  onValidate,
  format,
  className = '',
  ...props
}: InputProps) {
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    if (onValidate && showValidation) {
      const error = onValidate(e.target.value);
      setValidationError(error);
    }
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (format) {
      value = format(value);
      e.target.value = value;
    }

    if (onValidate && showValidation && touched) {
      const error = onValidate(value);
      setValidationError(error);
    }

    props.onChange?.(e);
  };

  const displayError = error || (touched && validationError);
  const hasError = Boolean(displayError);

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center gap-2 mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {helpTooltip && (
            <Tooltip content={helpTooltip} position="right">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
            </Tooltip>
          )}
        </div>
      )}

      <input
        {...props}
        className={`
          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors
          ${hasError
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-black focus:border-black'
          }
          ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          ${className}
        `}
        onBlur={handleBlur}
        onChange={handleChange}
      />

      {displayError && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {helpText && !displayError && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
