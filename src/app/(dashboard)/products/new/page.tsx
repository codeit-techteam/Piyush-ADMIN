"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form-lazy";
import { Button } from "@/components/ui/button";

export default function NewProductPage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Create Product</h1>
        <Button onClick={() => router.push("/products")} variant="outline">
          Back
        </Button>
      </div>
      <ProductForm onSaved={(id) => router.push(`/products/${id}`)} />
    </div>
  );
}
