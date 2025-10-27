import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  required = false
}: FormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left mb-4"
        >
          {header}
        </button>
      ) : (
        <div className="mb-4">{header}</div>
      )}

      {(!collapsible || isExpanded) && (
        <div className="space-y-4 mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
