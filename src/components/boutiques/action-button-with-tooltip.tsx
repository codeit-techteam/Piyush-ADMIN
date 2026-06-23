"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ActionButtonWithTooltip({
  children,
  disabled,
  title,
  onClick,
  variant = "outline",
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
}) {
  return (
    <span className="inline-flex" title={disabled && title ? title : undefined}>
      <Button
        size="sm"
        variant={variant}
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {children}
      </Button>
    </span>
  );
}
