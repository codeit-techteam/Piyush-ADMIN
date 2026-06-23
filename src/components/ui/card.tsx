import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "premium-card rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
