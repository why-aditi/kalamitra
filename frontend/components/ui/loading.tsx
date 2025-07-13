export function LoadingSpinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100 ${className}`}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    </div>
  );
}