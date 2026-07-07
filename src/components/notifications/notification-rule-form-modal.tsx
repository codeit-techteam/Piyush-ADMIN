"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CmsImageUpload } from "@/components/cms/cms-image-upload";
import { useBoutiques } from "@/hooks/use-boutiques";
import { useCategories } from "@/hooks/use-categories";
import { useCreateNotificationRule, useUpdateNotificationRule } from "@/hooks/use-notification-rules";
import { useUsers } from "@/hooks/use-users";
import type {
  NotificationRule,
  NotificationRulePriority,
  NotificationRuleType,
  NotificationStyle,
  NotificationTargetType,
  TargetAudienceMode,
} from "@/lib/api/services/notification-rules";
import {
  AUDIENCE_MODE_LABELS,
  AUDIENCE_MODES,
  buildDeepLinkPreview,
  CTA_TEXT_SUGGESTIONS,
  NOTIFICATION_STYLE_LABELS,
  NOTIFICATION_STYLES,
  PRIORITIES,
  PRIORITY_LABELS,
  RULE_TYPE_LABELS,
  RULE_TYPES,
} from "./notification-rule-constants";
import { NotificationTargetPicker } from "./notification-target-picker";
import { NotificationCardPreview } from "./notification-card-preview";

interface NotificationRuleFormModalProps {
  rule?: NotificationRule;
  onClose: () => void;
}

export function NotificationRuleFormModal({ rule, onClose }: NotificationRuleFormModalProps) {
  const isEdit = Boolean(rule);
  const createMutation = useCreateNotificationRule();
  const updateMutation = useUpdateNotificationRule();
  const { data: categories = [] } = useCategories();
  const { data: boutiques = [] } = useBoutiques();
  const { data: users = [] } = useUsers();

  const [title, setTitle] = useState(rule?.title ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [type, setType] = useState<NotificationRuleType>(rule?.type ?? "new_product");
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [priority, setPriority] = useState<NotificationRulePriority>(rule?.priority ?? "medium");
  const [templateTitle, setTemplateTitle] = useState(rule?.template.title ?? "");
  const [templateMessage, setTemplateMessage] = useState(rule?.template.message ?? "");
  const [templateImage, setTemplateImage] = useState(rule?.template.image ?? "");
  const [ctaText, setCtaText] = useState(rule?.ctaText ?? "");
  const [ctaLink, setCtaLink] = useState(rule?.ctaLink ?? "");
  const [targetType, setTargetType] = useState<NotificationTargetType>(rule?.targetType ?? "none");
  const [targetId, setTargetId] = useState<string | null>(rule?.targetId ?? null);
  const [notificationStyle, setNotificationStyle] = useState<NotificationStyle>(
    rule?.notificationStyle ?? "large_image",
  );
  const [bannerColor, setBannerColor] = useState(rule?.bannerColor ?? "");
  const [showPreview, setShowPreview] = useState(false);

  const hasConcreteTarget = targetType !== "none" && Boolean(targetId) && targetType !== "url";
  const deepLinkPreview = buildDeepLinkPreview(targetType, targetId);
  const ctaSuggestions = CTA_TEXT_SUGGESTIONS[targetType] ?? [];

  const [audienceMode, setAudienceMode] = useState<TargetAudienceMode>(rule?.targetAudience.mode ?? "all");
  const [city, setCity] = useState(rule?.targetAudience.city ?? "");
  const [boutiqueId, setBoutiqueId] = useState(rule?.targetAudience.boutiqueId ?? "");
  const [categoryId, setCategoryId] = useState(rule?.targetAudience.categoryId ?? "");
  const [keyword, setKeyword] = useState(rule?.targetAudience.keyword ?? "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    rule?.targetAudience.selectedUserIds ?? [],
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((customer) =>
      [customer.name, customer.phone].filter(Boolean).join(" ").toLowerCase().includes(query),
    );
  }, [users, customerSearch]);

  const toggleCustomer = (id: string) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) return setError("Title is required.");
    if (!templateTitle.trim() || !templateMessage.trim()) {
      return setError("Notification title and message are required.");
    }
    if (audienceMode === "selected" && selectedUserIds.length === 0) {
      return setError("Select at least one customer.");
    }
    if (audienceMode === "city" && !city.trim()) {
      return setError("Enter a city.");
    }
    if (audienceMode === "boutique_followers" && !boutiqueId) {
      return setError("Select a boutique.");
    }
    if ((audienceMode === "category_interested" || audienceMode === "wishlist_users") && !categoryId) {
      return setError("Select a category.");
    }
    if (audienceMode === "keyword_interested" && !keyword.trim()) {
      return setError("Enter a keyword.");
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      enabled,
      priority,
      template: {
        title: templateTitle.trim(),
        message: templateMessage.trim(),
        image: templateImage.trim() || null,
      },
      ctaText: ctaText.trim() || null,
      // Deep link is auto-generated once a concrete target is selected; the
      // manual ctaLink field is only used for legacy/dynamic (templated) rules.
      ctaLink: hasConcreteTarget ? deepLinkPreview : ctaLink.trim() || null,
      targetType,
      targetId: targetType === "none" ? null : targetId,
      notificationStyle,
      bannerColor: bannerColor.trim() || null,
      targetAudience: {
        mode: audienceMode,
        selectedUserIds: audienceMode === "selected" ? selectedUserIds : undefined,
        city: audienceMode === "city" ? city.trim() : undefined,
        boutiqueId: audienceMode === "boutique_followers" ? boutiqueId : undefined,
        categoryId:
          audienceMode === "category_interested" || audienceMode === "wishlist_users" ? categoryId : undefined,
        keyword: audienceMode === "keyword_interested" ? keyword.trim() : undefined,
      },
    };

    try {
      if (isEdit && rule) {
        await updateMutation.mutateAsync({ id: rule.id, patch: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notification rule.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <Card className="relative my-4 w-full max-w-2xl space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Notification Rule" : "New Notification Rule"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Title</label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Notification Type
            </label>
            <Select
              className="mt-1 w-full"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationRuleType)}
              disabled={isEdit}
            >
              {RULE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {RULE_TYPE_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Description (internal)
          </label>
          <textarea
            className="mt-1 min-h-[64px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Notification Copy
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Use placeholders like {"{{productName}}"}, {"{{boutiqueName}}"}, {"{{discountPercent}}"} — they
            are filled in automatically when the notification is sent.
          </p>
          <div className="mt-3 space-y-3">
            <Input
              placeholder="✨ New Arrival"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
            />
            <textarea
              className="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="A new {{productName}} has been added by {{boutiqueName}}."
              value={templateMessage}
              onChange={(e) => setTemplateMessage(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Notification Banner</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload a custom image, or pick a Product/Collection target below to auto-fill it from the
            product photo / collection banner.
          </p>
          <div className="mt-3">
            <CmsImageUpload
              value={templateImage}
              onChange={(url) => setTemplateImage(url)}
              folder="notifications"
              label="Banner image"
              helper="Recommended: 1200×800, used as the large card image in the Customer App."
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Notification Target</p>
          <p className="mt-1 text-xs text-slate-500">
            What the CTA button opens in the Customer App. Only one target is selectable — the deep link is
            generated automatically.
          </p>
          <div className="mt-3">
            <NotificationTargetPicker
              targetType={targetType}
              targetId={targetId}
              onChange={(next) => {
                setTargetType(next.targetType);
                setTargetId(next.targetId);
              }}
              onAutoImage={(url) => setTemplateImage(url)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">CTA Configuration</p>
          <div className="mt-3 space-y-3">
            <div>
              <Input
                list="cta-text-suggestions"
                placeholder="CTA text (e.g. Buy Now)"
                value={ctaText ?? ""}
                onChange={(e) => setCtaText(e.target.value)}
              />
              <datalist id="cta-text-suggestions">
                {ctaSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {ctaSuggestions.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ctaSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setCtaText(suggestion)}
                      className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:border-blue-400 hover:text-blue-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">
                {hasConcreteTarget ? "Deep link (auto-generated)" : "CTA link"}
              </label>
              <Input
                className="mt-1"
                placeholder="e.g. /product/{{productId}}"
                value={hasConcreteTarget ? (deepLinkPreview ?? "") : ctaLink ?? ""}
                onChange={(e) => setCtaLink(e.target.value)}
                disabled={hasConcreteTarget}
                readOnly={hasConcreteTarget}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Notification Style
            </label>
            <Select
              className="mt-1 w-full"
              value={notificationStyle}
              onChange={(e) => setNotificationStyle(e.target.value as NotificationStyle)}
            >
              {NOTIFICATION_STYLES.map((item) => (
                <option key={item} value={item}>
                  {NOTIFICATION_STYLE_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Accent Color (optional)
            </label>
            <Input
              className="mt-1"
              type="text"
              placeholder="#1e40af"
              value={bannerColor ?? ""}
              onChange={(e) => setBannerColor(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Priority</label>
            <Select
              className="mt-1 w-full"
              value={priority}
              onChange={(e) => setPriority(e.target.value as NotificationRulePriority)}
            >
              {PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {PRIORITY_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enabled
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Target Audience
          </label>
          <Select
            className="mt-1 w-full"
            value={audienceMode}
            onChange={(e) => setAudienceMode(e.target.value as TargetAudienceMode)}
          >
            {AUDIENCE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {AUDIENCE_MODE_LABELS[mode]}
              </option>
            ))}
          </Select>

          {audienceMode === "city" ? (
            <Input
              className="mt-3"
              placeholder="e.g. Mumbai"
              value={city ?? ""}
              onChange={(e) => setCity(e.target.value)}
            />
          ) : null}

          {audienceMode === "boutique_followers" ? (
            <Select
              className="mt-3 w-full"
              value={boutiqueId ?? ""}
              onChange={(e) => setBoutiqueId(e.target.value)}
            >
              <option value="">Select boutique…</option>
              {boutiques.map((boutique) => (
                <option key={boutique.id} value={boutique.id}>
                  {boutique.name}
                </option>
              ))}
            </Select>
          ) : null}

          {audienceMode === "category_interested" || audienceMode === "wishlist_users" ? (
            <Select
              className="mt-3 w-full"
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          ) : null}

          {audienceMode === "keyword_interested" ? (
            <Input
              className="mt-3"
              placeholder="e.g. diamond ring"
              value={keyword ?? ""}
              onChange={(e) => setKeyword(e.target.value)}
            />
          ) : null}

          {audienceMode === "selected" ? (
            <div className="mt-3 space-y-2">
              <Input
                placeholder="Search customers by name or phone…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              <p className="text-xs text-slate-500">{selectedUserIds.length} selected</p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 p-2">
                {filteredCustomers.length === 0 ? (
                  <p className="py-2 text-sm text-slate-500">No customers match your search.</p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <label
                      key={customer.id}
                      className="flex cursor-pointer items-center gap-2 py-1 text-sm text-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(customer.id)}
                        onChange={() => toggleCustomer(customer.id)}
                      />
                      <span>
                        {customer.name}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Preview Notification
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Exactly how this will appear in the Customer App notification list.
          </p>
          {showPreview ? (
            <div className="mt-3 flex justify-center rounded-md bg-slate-100 p-4">
              <NotificationCardPreview
                title={templateTitle}
                message={templateMessage}
                image={templateImage}
                ctaText={ctaText}
                notificationStyle={notificationStyle}
                bannerColor={bannerColor || null}
              />
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Create Rule"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
