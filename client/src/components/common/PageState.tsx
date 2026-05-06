import { Loader2, AlertCircle, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Loading ────────────────────────────────────────────────────────────────
interface LoadingProps {
  text?: string;
  className?: string;
}
export function LoadingState({ text, className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground", className)}>
      <Loader2 className="w-8 h-8 animate-spin" />
      {text && <p className="text-sm">{text}</p>}
    </div>
  );
}

// ─── Error ───────────────────────────────────────────────────────────────────
interface ErrorProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}
export function ErrorState({ message, onRetry, retryLabel = "Thử lại", className }: ErrorProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 gap-4 text-center", className)}>
      <AlertCircle className="w-10 h-10 text-destructive" />
      {message && <p className="text-sm text-destructive max-w-sm">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// ─── Empty ───────────────────────────────────────────────────────────────────
interface EmptyProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}
export function EmptyState({ icon, title, description, action, className }: EmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 gap-3 text-center", className)}>
      <div className="text-muted-foreground">
        {icon ?? <PackageOpen className="w-12 h-12" />}
      </div>
      {title && <h3 className="font-medium text-lg">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
