interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4'
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClasses[size]} ${borderClasses[size]} border-purple-600 border-t-transparent rounded-full animate-spin magic-spinner`}></div>
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {message}
        </p>
      )}
    </div>
  );
}