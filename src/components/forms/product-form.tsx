"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoutiques } from "@/hooks/use-boutiques";
import { useCategories } from "@/hooks/use-categories";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  uploadProductVideo,
} from "@/lib/api/services/products";
import { compressImageFileIfNeeded } from "@/lib/utils/compress-image";
import { captureVideoFrameAsJpegBlob } from "@/lib/utils/video-poster";
import type { Product, ProductSpecifications } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical, Star } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const METAL_OPTIONS = [
  "Gold",
  "Rose Gold",
  "White Gold",
  "Platinum",
] as const;

const SIZE_PRESETS_BY_KEYWORD: Record<string, string[]> = {
  ring: ["14", "15", "16", "17", "18", "19", "20"],
  bracelet: ["6", "6.5", "7", "7.5", "8"],
  necklace: ["16", "18", "20", "22"],
  bangle: ["2.4", "2.6", "2.8", "3.0"],
  anklet: ["8", "9", "10", "11", "12"],
};

function optionalNum(v: unknown) {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const schema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters"),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  category_id: z
    .string()
    .uuid("Select valid category")
    .optional()
    .or(z.literal("")),
  boutique_id: z
    .string()
    .uuid("Select valid boutique")
    .optional()
    .or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  is_trending: z.boolean().default(false),
  images: z.array(z.string().url()).default([]),
  video_url: z.string().url().optional().or(z.literal("")),
  video_thumbnail: z.string().url().optional().or(z.literal("")),
  rating: z.preprocess(optionalNum, z.number().min(0).max(5)).optional(),
  reviews_count: z.preprocess(
    (v) => (v === "" || v == null ? 0 : optionalNum(v) ?? 0),
    z.number().min(0),
  ).optional(),
  discount_percentage: z.preprocess(
    (v): number | null => {
      const n = optionalNum(v);
      return n === undefined ? null : n;
    },
    z.union([z.number().min(0).max(100), z.null()]),
  ),
  gender: z.string().optional(),
  occasion: z.string().optional(),
  style: z.string().optional(),
  collection_name: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ProductFormProps {
  product?: Product | null;
  onSaved?: (productId: string) => void;
}

function suggestSizes(categoryName: string): string[] {
  const norm = categoryName.toLowerCase();
  for (const [key, sizes] of Object.entries(SIZE_PRESETS_BY_KEYWORD)) {
    if (norm.includes(key)) return sizes;
  }
  return [...SIZE_PRESETS_BY_KEYWORD.ring];
}

export function ProductForm({ product, onSaved }: ProductFormProps) {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: boutiques = [] } = useBoutiques();

  const relationSorted = [...(product?.product_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const initialImages =
    relationSorted?.map((item) => item.image_url)?.filter(Boolean) ??
    product?.images ??
    [];
  const initialPrimary =
    relationSorted?.find((p) => p.is_primary)?.image_url ??
    initialImages[0] ??
    "";

  const [sizes, setSizes] = useState<string[]>(() =>
    product?.available_sizes?.length
      ? [...product.available_sizes]
      : suggestSizes(product?.category_name ?? ""),
  );
  const [newSizeDraft, setNewSizeDraft] = useState("");
  const [selectedMetals, setSelectedMetals] = useState<Set<string>>(() => {
    if (product && Array.isArray(product.available_metals)) {
      return new Set(product.available_metals.map(String));
    }
    return new Set(METAL_OPTIONS);
  });
  const [specifications, setSpecifications] =
    useState<ProductSpecifications>(() => ({
      metal: product?.specifications?.metal ?? "",
      approxWeight: product?.specifications?.approxWeight ?? "",
      diamondCarat: product?.specifications?.diamondCarat ?? "",
      dimensions: product?.specifications?.dimensions ?? "",
    }));
  const [priceGold, setPriceGold] = useState(
    String(product?.price_breakup?.gold ?? ""),
  );
  const [priceGemstone, setPriceGemstone] = useState(
    String(product?.price_breakup?.gemstone ?? ""),
  );
  const [priceMaking, setPriceMaking] = useState(
    String(product?.price_breakup?.makingCharge ?? ""),
  );
  const [priceGst, setPriceGst] = useState(
    String(product?.price_breakup?.gst ?? ""),
  );
  const [priceTotal, setPriceTotal] = useState(
    String(product?.price_breakup?.total ?? ""),
  );

  const [primaryImageUrl, setPrimaryImageUrl] = useState(initialPrimary);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [lastVideoFile, setLastVideoFile] = useState<File | null>(null);
  const [videoUploadController, setVideoUploadController] =
    useState<AbortController | null>(null);
  const [posterWorking, setPosterWorking] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState,
    setValue,
    watch,
    getValues,
    control,
  } = useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: {
        name: product?.name ?? "",
        price: product?.price ?? 0,
        category_id: product?.category_id ?? "",
        boutique_id: product?.boutique_id ?? product?.primary_boutique_id ?? "",
        image: product?.image ?? initialImages[0] ?? "",
        description: product?.description ?? "",
        is_trending: Boolean(product?.is_trending ?? product?.trending),
        status: product?.status ?? "active",
        images: initialImages,
        video_url: product?.video_url ?? "",
        video_thumbnail: product?.video_thumbnail ?? "",
        rating: product?.rating ?? undefined,
        reviews_count: product?.reviews_count ?? 0,
        discount_percentage: product?.discount_percentage ?? null,
        gender: product?.gender ?? "",
        occasion: product?.occasion ?? "",
        style: product?.style ?? "",
        collection_name: product?.collection_name ?? "",
      },
    });

  const watchedCategoryId = watch("category_id");
  const images = watch("images");
  const discountPctWatch = watch("discount_percentage");

  const selectedCategoryName = useMemo(() => {
    const c = categories.find((x) => x.id === watchedCategoryId);
    return c?.name ?? "";
  }, [categories, watchedCategoryId]);

  const applyCategoryPresets = useCallback(() => {
    const nextSizes = suggestSizes(selectedCategoryName);
    setSizes(nextSizes.length ? [...nextSizes] : [...SIZE_PRESETS_BY_KEYWORD.ring]);
    toast.success("Loaded suggested sizes for this category");
  }, [selectedCategoryName]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const orderedImages = values.images ?? [];
      const metals = METAL_OPTIONS.filter((m) => selectedMetals.has(m));
      const primary =
        primaryImageUrl &&
        orderedImages.includes(primaryImageUrl)
          ? primaryImageUrl
          : orderedImages[0] ??
            null;

      const specsClean: Record<string, string> = {};
      for (const [k, v] of Object.entries(specifications)) {
        const t = typeof v === "string" ? v.trim() : "";
        if (t) specsClean[k] = t;
      }

      const pb: Record<string, number> = {};
      const g = parseFloat(priceGold);
      const gem = parseFloat(priceGemstone);
      const mc = parseFloat(priceMaking);
      const gst = parseFloat(priceGst);
      const tot = parseFloat(priceTotal);
      if (Number.isFinite(g)) pb.gold = g;
      if (Number.isFinite(gem)) pb.gemstone = gem;
      if (Number.isFinite(mc)) pb.makingCharge = mc;
      if (Number.isFinite(gst)) pb.gst = gst;
      if (Number.isFinite(tot)) pb.total = tot;

      const fixedImages = orderedImages.map((imageUrl, index) => ({
        image_url: imageUrl,
        sort_order: index,
        is_primary: primary === imageUrl,
      }));

      const payload = {
        name: values.name,
        price: values.price,
        category_id: values.category_id || null,
        boutique_id: values.boutique_id || null,
        primary_boutique_id: values.boutique_id || null,
        image: primary ?? values.image ?? null,
        description: values.description || null,
        is_trending: values.is_trending,
        status: values.status,
        primary_image: primary,
        video_url: values.video_url || null,
        video_thumbnail: values.video_thumbnail || null,
        images: orderedImages,
        product_images: fixedImages,
        rating: values.rating ?? null,
        reviews_count: values.reviews_count ?? 0,
        discount_percentage: values.discount_percentage ?? null,
        available_sizes: sizes,
        available_metals: metals,
        specifications: specsClean as ProductSpecifications,
        price_breakup: Object.keys(pb).length ? pb : {},
        gender: values.gender?.trim() || null,
        occasion: values.occasion?.trim() || null,
        style: values.style?.trim() || null,
        collection_name: values.collection_name?.trim() || null,
      };

      const saved = product?.id
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["products", "trending"] });
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", "stats"],
      });
      if (product?.id) {
        await queryClient.invalidateQueries({
          queryKey: ["products", product.id],
        });
      }
      toast.success("Product saved successfully");
      onSaved?.(saved.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save product";
      setSubmitError(message);
      toast.error(message);
    }
  };

  const onPickFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const compressed = await compressImageFileIfNeeded(file);
      const uploaded = await uploadProductImage(compressed, {
        productId: product?.id,
        onProgress: setUploadProgress,
      });
      const currentImages = getValues("images") ?? [];
      const next = [...new Set([...currentImages, uploaded.url])];
      setValue("images", next, { shouldDirty: true, shouldValidate: true });
      setValue("image", next[0] ?? uploaded.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (!primaryImageUrl || !next.includes(primaryImageUrl)) {
        setPrimaryImageUrl(next[0] ?? uploaded.url);
      }
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onPickVideoFile = async (file?: File | null) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Maximum video size is 50MB");
      return;
    }
    setVideoUploading(true);
    setVideoUploadProgress(0);
    setLastVideoFile(file);
    const controller = new AbortController();
    setVideoUploadController(controller);
    try {
      const uploaded = await uploadProductVideo(file, {
        productId: product?.id,
        onProgress: setVideoUploadProgress,
        signal: controller.signal,
      });
      setValue("video_url", uploaded.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Video uploaded");
      await generatePosterFromFile(file);
    } catch (error) {
      if (error instanceof Error && error.name === "CanceledError") {
        toast.error("Video upload cancelled");
      } else {
        toast.error(
          error instanceof Error ? error.message : "Video upload failed",
        );
      }
    } finally {
      setVideoUploading(false);
      setVideoUploadController(null);
    }
  };

  const toggleMetal = (m: string) => {
    setSelectedMetals((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const addSizeChip = () => {
    const t = newSizeDraft.trim();
    if (!t) return;
    if (!sizes.includes(t)) setSizes((s) => [...s, t]);
    setNewSizeDraft("");
  };

  const reorderImages = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const list = [...(getValues("images") ?? [])];
    const [removed] = list.splice(from, 1);
    list.splice(to, 0, removed);
    setValue("images", list, { shouldDirty: true, shouldValidate: true });
    setValue("image", list[0] ?? "", { shouldDirty: true, shouldValidate: true });
    setPrimaryImageUrl((cur: string) =>
      cur && list.includes(cur) ? cur : (list[0] ?? ""),
    );
  };

  const videoUrl = watch("video_url");
  const videoThumbnailUrl = watch("video_thumbnail");

  const generatePosterFromFile = useCallback(
    async (file: File) => {
      setPosterWorking(true);
      try {
        const blob = await captureVideoFrameAsJpegBlob(file, 1);
        const posterFile = new File([blob], "video-poster.jpg", {
          type: "image/jpeg",
        });
        const compressed = await compressImageFileIfNeeded(posterFile);
        const uploaded = await uploadProductImage(compressed, {
          productId: product?.id,
        });
        setValue("video_thumbnail", uploaded.url, {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast.success("Video thumbnail generated from video");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not generate thumbnail from video",
        );
      } finally {
        setPosterWorking(false);
      }
    },
    [product?.id, setValue],
  );

  const onPickCustomPoster = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setPosterWorking(true);
    try {
      const compressed = await compressImageFileIfNeeded(file);
      const uploaded = await uploadProductImage(compressed, {
        productId: product?.id,
      });
      setValue("video_thumbnail", uploaded.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Custom video thumbnail uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Thumbnail upload failed",
      );
    } finally {
      setPosterWorking(false);
    }
  };

  const discountPreview =
    discountPctWatch != null &&
    Number.isFinite(Number(discountPctWatch)) &&
    Number(discountPctWatch) > 0 ? (
      <p className="text-xs text-blue-700/90">
        On the app shoppers will see:{" "}
        <span className="font-semibold">
          {Number(discountPctWatch)}% OFF on Making Charges
        </span>
      </p>
    ) : null;

  return (
    <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          Core
        </h3>
        <div>
          <label className="mb-1 block text-sm text-slate-700">Name</label>
          <Input placeholder="Product name" {...register("name")} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-700">Description</label>
          <textarea
            className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            placeholder="Description"
            {...register("description")}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Price</label>
            <Input
              placeholder="Price"
              type="number"
              step="any"
              {...register("price", { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Status</label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              {...register("status")}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          Category & Boutique
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Category</label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              {...register("category_id")}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button
              className="mt-2"
              type="button"
              variant="ghost"
              onClick={() => applyCategoryPresets()}
            >
              Apply suggested sizes for category
            </Button>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">
              Boutique (primary)
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              {...register("boutique_id")}
            >
              <option value="">Select boutique</option>
              {boutiques.map((boutique) => (
                <option key={boutique.id} value={boutique.id}>
                  {boutique.name}
                  {boutique.location ? ` — ${boutique.location}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Listing name, logo, rating and location sync from this boutique on
              the app.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white/60 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          Size Manager
        </h3>
        <p className="text-xs text-slate-500">
          Chips drive the product detail selector. Supports rings, bracelets,
          necklaces, bangles and anklets via presets above.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {sizes.map((s, index) => (
            <div
              key={`${s}-${index}`}
              className="group flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1"
            >
              <button
                type="button"
                className="px-2 text-xs font-semibold text-blue-700"
                aria-label={`Move ${s} left`}
                onClick={() =>
                  index > 0 &&
                  setSizes((arr) => {
                    const next = [...arr];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    return next;
                  })
                }
              >
                ‹
              </button>
              <span className="text-sm text-blue-800">{s}</span>
              <button
                type="button"
                className="px-2 text-xs font-semibold text-blue-700"
                aria-label={`Move ${s} right`}
                onClick={() =>
                  index < sizes.length - 1 &&
                  setSizes((arr) => {
                    const next = [...arr];
                    [next[index], next[index + 1]] = [
                      next[index + 1],
                      next[index],
                    ];
                    return next;
                  })
                }
              >
                ›
              </button>
              <button
                type="button"
                className="rounded-full px-2 text-[10px] font-bold text-red-300 hover:bg-red-950/50"
                onClick={() =>
                  setSizes((arr) => arr.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-[120px]"
            placeholder="New"
            value={newSizeDraft}
            onChange={(e) => setNewSizeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSizeChip();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addSizeChip}>
            + Add size
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white/60 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          Metal Options
        </h3>
        <div className="flex flex-wrap gap-2">
          {METAL_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMetal(m)}
              className={
                selectedMetals.has(m)
                  ? "rounded-full border border-blue-400 bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-800"
                  : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500"
              }
            >
              {selectedMetals.has(m) ? "✓ " : ""}
              {m}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
            Discount %
          </h3>
          <Input type="number" step="0.1" min={0} max={100} {...register("discount_percentage")} />
          {discountPreview}
        </div>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
            Ratings
          </h3>
          <label className="block text-xs text-slate-600">Rating (0–5)</label>
          <Input type="number" step="0.1" {...register("rating")} />
          <label className="block text-xs text-slate-600">Reviews count</label>
          <Input type="number" {...register("reviews_count")} />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white/40 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          Specifications
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Metal</label>
            <Input
              value={specifications.metal ?? ""}
              onChange={(e) =>
                setSpecifications((spec) => ({
                  ...spec,
                  metal: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">
              Approx weight
            </label>
            <Input
              value={specifications.approxWeight ?? ""}
              placeholder="e.g. 3.10 g"
              onChange={(e) =>
                setSpecifications((spec) => ({
                  ...spec,
                  approxWeight: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">
              Diamond carat
            </label>
            <Input
              value={specifications.diamondCarat ?? ""}
              placeholder="e.g. 0.12 CT"
              onChange={(e) =>
                setSpecifications((spec) => ({
                  ...spec,
                  diamondCarat: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">
              Dimensions
            </label>
            <Input
              value={specifications.dimensions ?? ""}
              placeholder="e.g. 20mm x 5mm"
              onChange={(e) =>
                setSpecifications((spec) => ({
                  ...spec,
                  dimensions: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white/40 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          Price Break-up (₹)
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Gold</label>
            <Input
              type="number"
              value={priceGold}
              onChange={(e) => setPriceGold(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Gemstone</label>
            <Input
              type="number"
              value={priceGemstone}
              onChange={(e) => setPriceGemstone(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">
              Making charge
            </label>
            <Input
              type="number"
              value={priceMaking}
              onChange={(e) => setPriceMaking(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">GST</label>
            <Input
              type="number"
              value={priceGst}
              onChange={(e) => setPriceGst(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-600">Total</label>
            <Input
              type="number"
              value={priceTotal}
              onChange={(e) => setPriceTotal(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-700">Gender</label>
          <Input {...register("gender")} placeholder="Women / Men …" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-700">Occasion</label>
          <Input {...register("occasion")} placeholder="Engagement …" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-700">Style</label>
          <Input {...register("style")} placeholder="Contemporary …" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-700">
            Collection name
          </label>
          <Input {...register("collection_name")} placeholder="" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
          Images & Video
        </h3>
        <div>
          <label className="mb-2 block text-sm text-slate-700">
            Image Upload (JPEG / PNG / Webp — lightly compressed client-side when
            large)
          </label>
          <label
            className="block cursor-pointer rounded-md border border-dashed border-slate-200 p-4 text-center text-sm text-slate-700 hover:bg-slate-50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void onPickFile(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => void onPickFile(event.target.files?.[0])}
            />
            {uploading ? "Uploading..." : "Drag/Drop or click to upload"}
          </label>
          {uploading ? (
            <p className="mt-1 text-xs text-slate-600">
              Upload progress: {uploadProgress}%
            </p>
          ) : null}
        </div>
        <Input placeholder="Featured image URL" {...register("image")} />

        {images?.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {images.map((url, index) => (
              <div
                key={url}
                draggable
                onDragStart={() => setDragFrom(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragFrom == null || dragFrom === index) return;
                  reorderImages(dragFrom, index);
                  setDragFrom(null);
                }}
                className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="mt-8 h-5 w-5 shrink-0 cursor-grab text-slate-600" aria-hidden />
                  <div className="relative flex-1">
                    {/* Preview only; external Supabase URLs */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      className="h-32 w-full rounded-md object-cover"
                      src={url}
                      draggable={false}
                      onError={(event) => {
                        event.currentTarget.src =
                          "https://placehold.co/240x160/0f172a/e2e8f0?text=No+Image";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPrimaryImageUrl(url)}
                      className={`absolute right-2 top-2 rounded-full bg-black/50 p-1.5 ${
                        primaryImageUrl === url
                          ? "text-blue-600"
                          : "text-white/70"
                      }`}
                      title="Primary"
                    >
                      <Star
                        size={18}
                        className={
                          primaryImageUrl === url ? "fill-blue-500" : ""
                        }
                      />
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reorderImages(index, Math.max(0, index - 1));
                  }}
                  disabled={index === 0}
                >
                  Move up
                </Button>
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reorderImages(
                      index,
                      Math.min((images ?? []).length - 1, index + 1),
                    );
                  }}
                  disabled={index >= (images?.length ?? 0) - 1}
                >
                  Move down
                </Button>
                <Button
                  className="w-full"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const next = (images ?? []).filter((item) => item !== url);
                    setValue("images", next, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue("image", next[0] ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setPrimaryImageUrl((prev: string) =>
                      prev === url ? next[0] ?? "" : prev,
                    );
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm text-slate-700">
            Video Upload (MP4)
          </label>
          <label
            className="block cursor-pointer rounded-md border border-dashed border-slate-200 p-4 text-center text-sm text-slate-700 hover:bg-slate-50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void onPickVideoFile(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              className="hidden"
              type="file"
              accept="video/mp4"
              onChange={(event) => void onPickVideoFile(event.target.files?.[0])}
            />
            {videoUploading
              ? "Uploading video..."
              : "Click to upload product video"}
          </label>
          {videoUploading ? (
            <>
              <p className="mt-1 text-xs text-slate-600">
                Upload progress: {videoUploadProgress}%
              </p>
              <Button
                className="mt-2"
                type="button"
                variant="outline"
                onClick={() => videoUploadController?.abort()}
              >
                Cancel Upload
              </Button>
            </>
          ) : null}
          {!videoUploading && lastVideoFile ? (
            <Button
              className="mt-2"
              type="button"
              variant="ghost"
              onClick={() => void onPickVideoFile(lastVideoFile)}
            >
              Retry Last Video Upload
            </Button>
          ) : null}
        </div>
        <Input placeholder="Video URL" {...register("video_url")} />
        {videoUrl ? (
          <div className="space-y-3 rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-600">Video preview</p>
            <video
              className="h-48 w-full rounded-md bg-black object-contain"
              controls
              preload="metadata"
              src={videoUrl}
              playsInline
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-700">
                  App gallery thumbnail
                </p>
                <p className="mb-2 text-[11px] text-slate-500">
                  Must match this video. Shoppers never see a mismatched still.
                </p>
                {videoThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="Video thumbnail"
                    className="h-32 w-full rounded-md border border-slate-600 object-cover"
                    src={videoThumbnailUrl}
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-600 text-xs text-slate-500">
                    No thumbnail yet — generate from video or upload one.
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-end gap-2">
                <Button
                  className="w-full"
                  disabled={
                    posterWorking || !lastVideoFile || videoUploading
                  }
                  type="button"
                  variant="outline"
                  onClick={() =>
                    lastVideoFile
                      ? void generatePosterFromFile(lastVideoFile)
                      : undefined
                  }
                >
                  {posterWorking ? "Working…" : "Regenerate from video"}
                </Button>
                <label className="block cursor-pointer rounded-md border border-dashed border-slate-600 px-3 py-2 text-center text-xs text-slate-700 hover:bg-slate-50">
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void onPickCustomPoster(event.target.files?.[0])
                    }
                  />
                  Upload custom thumbnail (optional)
                </label>
              </div>
            </div>
            <Button
              className="w-full"
              type="button"
              variant="ghost"
              onClick={() => {
                setValue("video_url", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("video_thumbnail", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setLastVideoFile(null);
              }}
            >
              Remove Video
            </Button>
          </div>
        ) : null}
      </section>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <Controller
          name="is_trending"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        Trending
      </label>

      {formState.errors.name ? (
        <p className="text-xs text-red-400">{formState.errors.name.message}</p>
      ) : null}
      {formState.errors.price ? (
        <p className="text-xs text-red-400">{formState.errors.price.message}</p>
      ) : null}
      {submitError ? (
        <p className="text-xs text-red-400">{submitError}</p>
      ) : null}
      <Button
        disabled={
          formState.isSubmitting ||
          uploading ||
          videoUploading ||
          posterWorking
        }
        type="submit"
      >
        {formState.isSubmitting ? "Saving..." : "Save Product"}
      </Button>
    </form>
  );
}
