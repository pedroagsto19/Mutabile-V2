import React from 'react';

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className = '', showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={`relative ${className}`}>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-black rounded-full transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600 mt-1 block">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}