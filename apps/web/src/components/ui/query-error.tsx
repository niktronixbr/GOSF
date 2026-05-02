interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryError({
  message = "Erro ao carregar dados.",
  onRetry,
}: QueryErrorProps) {
  return (
    <div className="rounded-xl border border-error/30 bg-error-container/30 p-6 text-center">
      <p className="text-sm font-medium text-error mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-error underline-offset-2 hover:underline"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
