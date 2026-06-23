import type { ReactNode } from "react";

export function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h3>
      {children}
    </section>
  );
}

export function ReviewFieldGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  );
}

export function ReviewField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{value ?? "—"}</div>
    </div>
  );
}
