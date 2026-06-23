"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  hint?: string;
}

export function EmptyState({ icon: Icon, title, description, hint }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-12 shadow-sm"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />

      <motion.div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <motion.div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 shadow-sm"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Icon className="h-8 w-8 text-blue-600" strokeWidth={1.25} />
        </motion.div>

        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
        {hint ? (
          <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
            {hint}
          </p>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
