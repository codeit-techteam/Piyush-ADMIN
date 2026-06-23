import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "btn-gold focus-gold shadow-sm",
        outline:
          "btn-glass border-slate-200 text-slate-700 hover:text-blue-700 focus-gold",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-gold",
        destructive:
          "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:scale-[1.02] focus-gold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
