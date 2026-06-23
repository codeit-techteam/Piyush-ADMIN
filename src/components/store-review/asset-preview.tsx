"use client";

import { useState } from "react";
import { ExternalLink, FileText, Maximize2, X } from "lucide-react";
import { isImageUrl, isPdfUrl } from "@/lib/jeweller-documents";
import { Button } from "@/components/ui/button";

type AssetPreviewProps = {
  url: string;
  label: string;
  aspect?: "square" | "wide";
};

export function AssetPreview({ url, label, aspect = "wide" }: AssetPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = isImageUrl(url);
  const isPdf = isPdfUrl(url);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-slate-600"
              onClick={() => setLightboxOpen(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-md px-2 text-slate-600 hover:bg-slate-100 hover:text-blue-600"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className={`block w-full text-left ${aspect === "square" ? "aspect-square max-w-[200px]" : "aspect-[21/9] min-h-[120px]"}`}
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-cover" />
          ) : isPdf ? (
            <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 bg-white p-4">
              <FileText className="h-10 w-10 text-blue-600/80" />
              <span className="text-xs text-slate-600">PDF — click to preview</span>
            </div>
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center bg-white p-4">
              <FileText className="h-8 w-8 text-slate-500" />
            </div>
          )}
        </button>
      </div>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${label} preview`}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 text-slate-700"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col gap-3">
            <p className="text-center text-sm font-medium text-slate-700">{label}</p>
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={label}
                className="max-h-[80vh] w-full object-contain"
              />
            ) : isPdf ? (
              <iframe
                src={url}
                title={label}
                className="h-[80vh] w-full rounded-lg border border-slate-200 bg-white"
              />
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="mb-4 text-slate-700">Preview not available for this file type.</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open document in new tab
                </a>
              </div>
            )}
            <div className="flex justify-center">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                Open in new tab <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
