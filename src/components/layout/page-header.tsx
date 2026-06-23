import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
