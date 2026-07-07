"use client";

import { Bell } from "lucide-react";

import type { NotificationStyle } from "@/lib/api/services/notification-rules";

interface NotificationCardPreviewProps {
  title: string;
  message: string;
  image?: string | null;
  ctaText?: string | null;
  notificationStyle?: NotificationStyle;
  bannerColor?: string | null;
  timeLabel?: string;
}

/**
 * Renders exactly how the rich notification card will look in the Customer
 * App (large banner, title, description, CTA button, timestamp, unread dot)
 * — used both live in the rule form and in the "Preview Notification" modal
 * so admins see the marketplace-style result before sending.
 */
export function NotificationCardPreview({
  title,
  message,
  image,
  ctaText,
  notificationStyle = "default",
  bannerColor,
  timeLabel = "Just now",
}: NotificationCardPreviewProps) {
  const showLargeImage = Boolean(image) && notificationStyle !== "default";

  return (
    <div
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={bannerColor ? { borderColor: bannerColor } : undefined}
    >
      {showLargeImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image ?? undefined} alt="" className="h-40 w-full object-cover" />
      ) : null}
      <div className="flex gap-3 p-3.5">
        {!showLargeImage ? (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: bannerColor ?? "#eff6ff" }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Bell className="h-5 w-5 text-blue-600" />
            )}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{title || "Notification title"}</p>
            <span className="shrink-0 text-[10px] text-slate-400">{timeLabel}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {message || "Notification message will appear here."}
          </p>
          {ctaText ? (
            <span className="mt-2.5 inline-flex items-center rounded-full bg-slate-900 px-3.5 py-1.5 text-[11px] font-semibold text-white">
              {ctaText}
            </span>
          ) : null}
        </div>
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
      </div>
    </div>
  );
}
