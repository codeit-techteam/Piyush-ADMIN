import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import BoutiquesPage from "../jeweller-approvals/page";

function BoutiquesPageFallback() {
  return (
    <section className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<BoutiquesPageFallback />}>
      <BoutiquesPage />
    </Suspense>
  );
}
