"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSendNotification } from "@/hooks/use-notifications-admin";
import { useUsers } from "@/hooks/use-users";
import { ROUTES } from "@/lib/constants/routes";
import type { NotificationAudience, NotificationType } from "@/lib/api/services/notifications";

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
  { value: "selected", label: "Selected Customers" },
];

export default function SendNotificationPage() {
  const { data: users = [] } = useUsers();
  const sendMutation = useSendNotification();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("offer");
  const [audience, setAudience] = useState<NotificationAudience>("all");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const customers = users;

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => {
      const haystack = [customer.name, customer.phone, customer.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [customers, customerSearch]);

  const selectedCustomersLabel = useMemo(() => {
    if (selectedCustomerIds.length === 0) return "No customers selected";
    const names = customers
      .filter((customer) => selectedCustomerIds.includes(customer.id))
      .map((customer) => customer.name)
      .slice(0, 3);
    const suffix =
      selectedCustomerIds.length > names.length
        ? ` +${selectedCustomerIds.length - names.length} more`
        : "";
    return `${names.join(", ")}${suffix}`;
  }, [selectedCustomerIds, customers]);

  const toggleCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((customerId) => customerId !== id) : [...prev, id],
    );
  };

  const handleSend = async () => {
    setFeedback(null);
    if (!title.trim() || !message.trim()) {
      setFeedback("Title and message are required.");
      return;
    }
    if (audience === "selected" && selectedCustomerIds.length === 0) {
      setFeedback("Select at least one customer for the selected audience.");
      return;
    }

    try {
      const result = await sendMutation.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        type,
        audience,
        selectedUserIds: audience === "selected" ? selectedCustomerIds : undefined,
        metadata: { source_event: "admin_broadcast" },
      });

      setFeedback(`Sent to ${result.recipientCount} customers successfully.`);
      setTitle("");
      setMessage("");
      setSelectedCustomerIds([]);
      setCustomerSearch("");
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
          <p className="text-sm text-slate-600">Broadcast a message to your audience.</p>
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
          <div className="space-y-3 rounded-md border border-slate-200 p-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Select customers
              </label>
              <Input
                className="mt-1"
                placeholder="Search by name or phone…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-600">{selectedCustomersLabel}</p>
            <div className="max-h-48 overflow-y-auto">
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
                      checked={selectedCustomerIds.includes(customer.id)}
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

        {feedback ? <p className="text-sm text-blue-600">{feedback}</p> : null}

        <div className="pt-2">
          <Button type="button" onClick={() => void handleSend()} disabled={sendMutation.isPending}>
            <Send className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? "Sending..." : "Send Notification"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
