"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  clearProductFlag,
  flagProduct,
  reinstateProduct,
  requestProductCorrection,
  resolveCorrectionRequest,
  suspendProduct,
  type CorrectionFieldName,
  type FlagReasonCode,
  type ProductGovernanceState,
} from "@/lib/api/services/product-governance";

const FLAG_REASONS: { value: FlagReasonCode; label: string }[] = [
  { value: "PRICE_SUSPICIOUS", label: "Price suspicious" },
  { value: "IMAGE_VIOLATION", label: "Image violation" },
  { value: "DESCRIPTION_MISLEADING", label: "Misleading description" },
  { value: "OTHER", label: "Other" },
];

const CORRECTION_FIELDS: { value: CorrectionFieldName; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "description", label: "Description" },
  { value: "name", label: "Title / Name" },
  { value: "images", label: "Images" },
  { value: "specifications", label: "Specifications" },
  { value: "price_breakup", label: "Price break-up" },
];

const textareaClassName =
  "focus-gold min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-400 focus-visible:outline-none";

interface ProductOversightActionsProps {
  productId: string;
  productStatus: string;
  governance?: ProductGovernanceState;
  onChanged: () => Promise<void> | void;
}

export function ProductOversightActions({
  productId,
  productStatus,
  governance,
  onChanged,
}: ProductOversightActionsProps) {
  const [flagReason, setFlagReason] = useState<FlagReasonCode>("PRICE_SUSPICIOUS");
  const [flagMessage, setFlagMessage] = useState("");
  const [flagAutoResolve, setFlagAutoResolve] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [correctionField, setCorrectionField] = useState<CorrectionFieldName>("price");
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [correctionAutoResolve, setCorrectionAutoResolve] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const activeFlag = governance?.active_flag;
  const activeSuspension = governance?.active_suspension;
  const openCorrections = governance?.open_correction_requests ?? [];

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3 border-amber-200 bg-amber-50/40 p-4">
        <h3 className="font-semibold text-amber-800">Flag Product</h3>
        <p className="text-sm text-slate-600">
          Product stays visible to customers but jeweller sees the flag in their dashboard.
        </p>
        {activeFlag ? (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-medium text-amber-900">Active flag: {activeFlag.reason_code}</p>
            {activeFlag.reason_text ? (
              <p className="text-slate-700">{activeFlag.reason_text}</p>
            ) : null}
            <Button
              disabled={busy === "clear-flag"}
              onClick={() =>
                run("clear-flag", async () => {
                  await clearProductFlag(productId);
                  toast.success("Flag cleared");
                })
              }
              size="sm"
              variant="outline"
            >
              Clear Flag
            </Button>
          </div>
        ) : (
          <>
            <Select
              className="w-full"
              onChange={(e) => setFlagReason(e.target.value as FlagReasonCode)}
              value={flagReason}
            >
              {FLAG_REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <textarea
              className={textareaClassName}
              onChange={(e) => setFlagMessage(e.target.value)}
              placeholder="Message to jeweller (optional)"
              value={flagMessage}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                checked={flagAutoResolve}
                onChange={(e) => setFlagAutoResolve(e.target.checked)}
                type="checkbox"
              />
              Auto-resolve when jeweller edits
            </label>
            <Button
              disabled={busy === "flag"}
              onClick={() =>
                run("flag", async () => {
                  await flagProduct(productId, {
                    reason_code: flagReason,
                    reason_text: flagMessage || undefined,
                    auto_resolve: flagAutoResolve,
                  });
                  toast.success("Product flagged");
                })
              }
            >
              Flag Product
            </Button>
          </>
        )}
      </Card>

      <Card className="space-y-3 border-red-200 bg-red-50/40 p-4">
        <h3 className="font-semibold text-red-800">Suspend Product</h3>
        <p className="text-sm text-slate-600">
          Immediately hides product from the customer app.
        </p>
        {activeSuspension || productStatus === "SUSPENDED" ? (
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm">
            <p className="font-medium text-red-900">Currently suspended</p>
            {activeSuspension?.reason_text ? (
              <p className="text-slate-700">{activeSuspension.reason_text}</p>
            ) : null}
            <Button
              disabled={busy === "reinstate"}
              onClick={() =>
                run("reinstate", async () => {
                  await reinstateProduct(productId);
                  toast.success("Product reinstated");
                })
              }
              size="sm"
              variant="outline"
            >
              Reinstate
            </Button>
          </div>
        ) : (
          <>
            <textarea
              className={textareaClassName}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Suspension reason (required)"
              value={suspendReason}
            />
            <Button
              disabled={busy === "suspend" || !suspendReason.trim()}
              onClick={() =>
                run("suspend", async () => {
                  await suspendProduct(productId, suspendReason.trim());
                  toast.success("Product suspended");
                  setSuspendReason("");
                })
              }
              variant="destructive"
            >
              Suspend Product
            </Button>
          </>
        )}
      </Card>

      <Card className="space-y-3 border-yellow-200 bg-yellow-50/40 p-4">
        <h3 className="font-semibold text-yellow-800">Request Correction</h3>
        <p className="text-sm text-slate-600">
          Ask the jeweller to fix a specific field. They must make the change themselves.
        </p>
        {openCorrections.length > 0 ? (
          <div className="space-y-2">
            {openCorrections.map((req) => (
              <div
                key={req.id}
                className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm"
              >
                <p className="font-medium text-yellow-900">Pending: {req.field_name}</p>
                <p className="text-slate-700">{req.message}</p>
                <Button
                  className="mt-2"
                  disabled={busy === `resolve-${req.id}`}
                  onClick={() =>
                    run(`resolve-${req.id}`, async () => {
                      await resolveCorrectionRequest(productId, req.id);
                      toast.success("Correction marked resolved");
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  Mark Resolved
                </Button>
              </div>
            ))}
          </div>
        ) : null}
        <Select
          className="w-full"
          onChange={(e) => setCorrectionField(e.target.value as CorrectionFieldName)}
          value={correctionField}
        >
          {CORRECTION_FIELDS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <textarea
          className={textareaClassName}
          onChange={(e) => setCorrectionMessage(e.target.value)}
          placeholder="Explain what needs fixing"
          value={correctionMessage}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            checked={correctionAutoResolve}
            onChange={(e) => setCorrectionAutoResolve(e.target.checked)}
            type="checkbox"
          />
          Auto-resolve when jeweller edits
        </label>
        <Button
          disabled={busy === "correction" || !correctionMessage.trim()}
          onClick={() =>
            run("correction", async () => {
              await requestProductCorrection(productId, {
                field_name: correctionField,
                message: correctionMessage.trim(),
                auto_resolve: correctionAutoResolve,
              });
              toast.success("Correction request sent");
              setCorrectionMessage("");
            })
          }
          variant="outline"
        >
          Send Correction Request
        </Button>
      </Card>
    </div>
  );
}
