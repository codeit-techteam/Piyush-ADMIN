import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "focus-gold h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition-all duration-200",
          "hover:border-slate-300 focus-visible:border-blue-400",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
