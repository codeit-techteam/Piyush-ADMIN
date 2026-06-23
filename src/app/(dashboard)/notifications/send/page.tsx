"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Eye, Send } from "lucide-react";

import { CmsImageUpload } from "@/components/cms/cms-image-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSendNotification } from "@/hooks/use-notifications-admin";
import { useUsers } from "@/hooks/use-users";
import { ROUTES } from "@/lib/constants/routes";
import type {
  NotificationActionType,
  NotificationAudience,
  NotificationType,
} from "@/lib/api/services/notifications";

const TYPES: NotificationType[] = [
  "offer",
  "appointment",
  "callback",
  "system",
  "gold_rate",
  "collection",
  "promotion",
  "profile",
];

const AUDIENCES: { value: NotificationAudience; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "customers", label: "Customers" },
  { value: "boutique_owners", label: "Boutique Owners" },
  { value: "selected", label: "Selected Users" },
];

const ACTION_TYPES: { value: NotificationActionType; label: string }[] = [
  { value: "none", label: "No action" },
  { value: "offer", label: "Open Offer" },
  { value: "appointment", label: "Open Appointment" },
  { value: "collection", label: "Open Collection" },
  { value: "boutique", label: "Open Boutique" },
  { value: "url", label: "Custom URL" },
];

export default function SendNotificationPage() {
  const { data: users = [] } = useUsers();
  const sendMutation = useSendNotification();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("offer");
  const [audience, setAudience] = useState<NotificationAudience>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [actionType, setActionType] = useState<NotificationActionType>("none");
  const [actionId, setActionId] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedUsersLabel = useMemo(() => {
    if (selectedUserIds.length === 0) return "No users selected";
    const names = users
      .filter((u) => selectedUserIds.includes(u.id))
      .map((u) => u.name)
      .slice(0, 3);
    const suffix =
      selectedUserIds.length > names.length
        ? ` +${selectedUserIds.length - names.length} more`
        : "";
    return `${names.join(", ")}${suffix}`;
  }, [selectedUserIds, users]);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  };

  const handleSend = async () => {
    setFeedback(null);
    if (!title.trim() || !message.trim()) {
      setFeedback("Title and message are required.");
      return;
    }
    if (audience === "selected" && selectedUserIds.length === 0) {
      setFeedback("Select at least one user for the selected audience.");
      return;
    }

    try {
      const metadata =
        actionType === "url" && customUrl.trim()
          ? { route: customUrl.trim(), source_event: "admin_broadcast" }
          : { source_event: "admin_broadcast" };

      const result = await sendMutation.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        type,
        audience,
        selectedUserIds: audience === "selected" ? selectedUserIds : undefined,
        imageUrl: imageUrl.trim() || null,
        actionType,
        actionId: actionId.trim() || null,
        metadata,
      });

      setFeedback(`Sent to ${result.recipientCount} users successfully.`);
      setTitle("");
      setMessage("");
      setImageUrl("");
      setSelectedUserIds([]);
      setShowPreview(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to send notification.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.notifications}
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 hover:bg-slate-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Send Notification</h1>
          <p className="text-sm text-slate-600">Preview before broadcasting to your audience.</p>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Title
          </label>
          <Input
            className="mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="🔥 New Offer Available"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Message
          </label>
          <textarea
            className="mt-1 min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Exclusive festive jewellery offers are now live."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Notification Type
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            >
              {TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Target Audience
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={audience}
              onChange={(e) => setAudience(e.target.value as NotificationAudience)}
            >
              {AUDIENCES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {audience === "selected" ? (
          <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 p-3">
            <p className="mb-2 text-xs text-slate-600">{selectedUsersLabel}</p>
            {users.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                />
                <span>
                  {user.name} {user.phone ? `· ${user.phone}` : ""}
                </span>
              </label>
            ))}
          </div>
        ) : null}

        <CmsImageUpload
          label="Banner image (optional)"
          helper="Upload from your device or paste an image URL. JPG, PNG, or WebP up to 8MB."
          folder="notifications"
          value={imageUrl || null}
          onChange={setImageUrl}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Action Type
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={actionType}
              onChange={(e) => setActionType(e.target.value as NotificationActionType)}
            >
              {ACTION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Action ID
            </label>
            <Input
              className="mt-1"
              value={actionId}
              onChange={(e) => setActionId(e.target.value)}
              placeholder="UUID or slug"
              disabled={actionType === "none" || actionType === "url"}
            />
          </div>
        </div>

        {actionType === "url" ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Custom URL / deep link
            </label>
            <Input
              className="mt-1"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="/(app)/home or https://..."
            />
          </div>
        ) : null}

        {feedback ? <p className="text-sm text-blue-600">{feedback}</p> : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => setShowPreview((v) => !v)}>
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button type="button" onClick={() => void handleSend()} disabled={sendMutation.isPending}>
            <Send className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? "Sending..." : "Send Notification"}
          </Button>
        </div>
      </Card>

      {showPreview ? (
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="mb-3 h-28 w-full rounded-lg object-cover"
              />
            ) : null}
            <p className="text-base font-semibold text-slate-900">{title || "Notification title"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {message || "Notification message will appear here."}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {type} · {audience}
              {actionType !== "none" ? ` · action: ${actionType}` : ""}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
