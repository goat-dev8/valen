import { ApiClientError } from '@/lib/api-client';

type QueryStateProps = {
  isLoading: boolean;
  error: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'No data found',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="app-card flex items-center justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#007dfc] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    const message = error instanceof ApiClientError ? error.message : error.message;
    return (
      <div className="app-card border-red-200 bg-red-50 py-8 text-center">
        <p className="text-sm font-medium text-red-700">{message}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="app-card py-12 text-center">
        <p className="text-sm text-[#64748b]">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
