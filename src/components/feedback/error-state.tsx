import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-white">
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>
      {title ? <p className="text-sm font-semibold text-red-900">{title}</p> : null}
      <p className="text-sm text-red-800">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
