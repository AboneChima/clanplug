import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-caption animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-2xl p-8 shadow-brand-lg border border-border animate-fade-in">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
};

export const InlineLoader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-surface rounded w-3/4"></div>
        <div className="h-3 bg-surface rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-surface rounded"></div>
          <div className="h-3 bg-surface rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;