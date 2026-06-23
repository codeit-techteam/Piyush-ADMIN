"use client";

import { useState } from "react";
import { toast } from "sonner";
import { uploadCmsImage } from "@/lib/api/services/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CmsImageUploadProps {
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  helper?: string;
}

export function CmsImageUpload({
  value,
  onChange,
  folder,
  label = "Image",
  helper,
}: CmsImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function onPickFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadCmsImage(file, folder, setProgress);
      onChange(uploaded.url);
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-slate-700">{label}</label>
      {helper ? (
        <p className="text-xs text-slate-500">{helper}</p>
      ) : null}
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-md border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={label}
              src={value}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.opacity = "0.3";
              }}
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-slate-200 text-xs text-slate-500">
            No image
          </div>
        )}
        <div className="flex-1 space-y-2">
          <label
            className="block cursor-pointer rounded-md border border-dashed border-slate-200 p-3 text-center text-sm text-slate-700 hover:bg-slate-50"
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
            {uploading ? `Uploading... ${progress}%` : "Click or drop to upload"}
          </label>
          <Input
            placeholder="…or paste an image URL"
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
          />
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
            >
              Remove image
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
