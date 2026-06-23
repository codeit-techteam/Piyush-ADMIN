import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  compact?: boolean;
  className?: string;
}

export function Logo({ compact, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm"
        aria-hidden
      >
        <Gem className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight text-slate-900">GehnaHub</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-600">
            Admin Console
          </p>
        </div>
      ) : null}
    </div>
  );
}
