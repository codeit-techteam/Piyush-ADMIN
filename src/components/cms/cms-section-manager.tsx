"use client";

import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import { CmsImageUpload } from "@/components/cms/cms-image-upload";
import { CmsProductPicker } from "@/components/cms/cms-product-picker";
import { useCmsList, useCmsMutations } from "@/hooks/use-cms";
import { getCmsItem, type CmsBase, type CmsPayload } from "@/lib/api/services/cms";
import { cn } from "@/lib/utils";

export interface CmsFieldConfig<T extends CmsBase = CmsBase> {
  key: keyof T | string;
  label: string;
  type?: "text" | "textarea" | "boolean" | "date" | "number" | "image" | "banner";
  helper?: string;
  placeholder?: string;
  /** Folder slug for image uploads (matches backend allowed list). */
  imageFolder?: string;
}

export interface CmsSectionManagerProps<T extends CmsBase = CmsBase> {
  section: string;
  title: string;
  description?: string;
  imageFolder: string;
  /** Column headers for the list table. */
  listColumns: Array<{
    key: string;
    header: string;
    render?: (row: T) => ReactNode;
  }>;
  /** Form fields displayed in the editor sheet. */
  formFields: CmsFieldConfig<T>[];
  /** Whether to render the "Attached products" picker. */
  showProductPicker?: boolean;
  /** Initial draft when creating a new item. */
  defaultDraft?: CmsPayload;
  /** Optional title transformer for the list row (defaults to title || name). */
  rowTitle?: (row: T) => string;
}

function defaultRowTitle(row: CmsBase): string {
  return (
    (row as CmsBase & { title?: string }).title ??
    (row as CmsBase & { name?: string }).name ??
    "Untitled"
  );
}

function inputValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function CmsSectionManager<T extends CmsBase = CmsBase>({
  section,
  title,
  description,
  imageFolder,
  listColumns,
  formFields,
  showProductPicker = true,
  defaultDraft,
  rowTitle = defaultRowTitle,
}: CmsSectionManagerProps<T>) {
  const { data: items = [], isLoading, isError, error, refetch } =
    useCmsList<T>(section);
  const { create, update, remove, reorder } = useCmsMutations(section);

  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<CmsPayload>({});
  const [productIds, setProductIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [items],
  );

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setDraft({
      sort_order: items.length,
      is_active: true,
      ...(defaultDraft ?? {}),
    });
    setProductIds([]);
  }

  async function openEdit(row: T) {
    setCreating(false);
    setEditing(row);
    setDraft({ ...row } as CmsPayload);
    setProductIds(row.product_ids ?? []);
    // Always refresh against the source of truth so the product picker shows
    // every product currently linked in the junction table (even ones added
    // outside the admin, e.g. via the legacy `products.category_id` column).
    try {
      const fresh = await getCmsItem<T>(section, row.id);
      setEditing(fresh);
      setDraft({ ...fresh } as CmsPayload);
      setProductIds(fresh.product_ids ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load latest data");
    }
  }

  function closeEditor() {
    setEditing(null);
    setCreating(false);
    setDraft({});
    setProductIds([]);
  }

  function updateDraft(key: string, value: unknown) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    try {
      const payload: CmsPayload = { ...draft, product_ids: productIds };
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success(`${rowTitle(editing as T)} updated`);
      } else {
        await create.mutateAsync(payload);
        toast.success(`${title} entry created`);
      }
      closeEditor();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: T) {
    if (!window.confirm(`Delete "${rowTitle(row)}"?`)) return;
    try {
      await remove.mutateAsync(row.id);
      toast.success("Deleted");
      if (editing?.id === row.id) closeEditor();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function onToggleActive(row: T) {
    try {
      await update.mutateAsync({
        id: row.id,
        payload: {
          ...row,
          is_active: !row.is_active,
          product_ids: row.product_ids ?? [],
        } as unknown as CmsPayload,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onReorderRows(fromId: string, toId: string) {
    if (fromId === toId) return;
    const fromIndex = sortedItems.findIndex((entry) => entry.id === fromId);
    const toIndex = sortedItems.findIndex((entry) => entry.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...sortedItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    try {
      await reorder.mutateAsync(next.map((item) => ({ id: item.id })));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder failed");
    }
  }

  function handleDragStart(event: DragEvent<HTMLTableRowElement>, rowId: string) {
    setDraggedId(rowId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", rowId);
  }

  function handleDragOver(event: DragEvent<HTMLTableRowElement>, rowId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverId !== rowId) {
      setDragOverId(rowId);
    }
  }

  function handleDrop(event: DragEvent<HTMLTableRowElement>, rowId: string) {
    event.preventDefault();
    const sourceId = draggedId ?? event.dataTransfer.getData("text/plain");
    if (sourceId) {
      void onReorderRows(sourceId, rowId);
    }
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (isError) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add new
        </Button>
      </header>

      <Card className="overflow-x-auto p-0">
        <table className="admin-table min-w-[760px]">
          <thead>
            <tr>
              <th className="w-12 px-3 py-3"></th>
              {listColumns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-3 font-medium text-slate-700"
                >
                  {column.header}
                </th>
              ))}
              <th className="w-32 px-3 py-3 text-right font-medium text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((row) => (
              <tr
                key={row.id}
                draggable
                onDragStart={(event) => handleDragStart(event, row.id)}
                onDragOver={(event) => handleDragOver(event, row.id)}
                onDrop={(event) => handleDrop(event, row.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "border-b border-slate-200/80 hover:bg-slate-50",
                  draggedId === row.id && "opacity-50",
                  dragOverId === row.id &&
                    draggedId &&
                    draggedId !== row.id &&
                    "bg-blue-50 ring-2 ring-inset ring-blue-200",
                )}
              >
                <td className="cursor-grab px-3 py-3 text-slate-500 active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Drag to reorder</span>
                </td>
                {listColumns.map((column) => (
                  <td
                    key={column.key}
                    className="px-3 py-3 text-slate-800 align-middle"
                  >
                    {column.render
                      ? column.render(row)
                      : inputValue(
                          (row as Record<string, unknown>)[column.key],
                        )}
                  </td>
                ))}
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void onToggleActive(row)}
                      title={row.is_active ? "Hide on app" : "Show on app"}
                    >
                      {row.is_active ? (
                        <Eye className="h-4 w-4 text-emerald-700" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void openEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void onDelete(row)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={listColumns.length + 2}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  No entries yet. Click “Add new” to create the first one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      {(creating || editing) ? (
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? `Edit ${rowTitle(editing as T)}` : `Create ${title}`}
            </h2>
            <Button type="button" variant="outline" onClick={closeEditor}>
              Close
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {formFields.map((field) => {
              const value = (draft as Record<string, unknown>)[
                String(field.key)
              ];

              if (field.type === "image" || field.type === "banner") {
                return (
                  <div key={String(field.key)} className="lg:col-span-2">
                    <CmsImageUpload
                      label={field.label}
                      helper={field.helper}
                      folder={field.imageFolder ?? imageFolder}
                      value={typeof value === "string" ? value : ""}
                      onChange={(url) => {
                        const next = url || null;
                        updateDraft(String(field.key), next);
                        // Categories keep a legacy `category_image_url` column; sync it
                        // when admins upload to the `image` field so saves don't ignore CMS uploads.
                        if (String(field.key) === "image") {
                          updateDraft("category_image_url", next);
                        }
                      }}
                    />
                  </div>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={String(field.key)} className="lg:col-span-2">
                    <label className="mb-1 block text-sm text-slate-700">
                      {field.label}
                    </label>
                    {field.helper ? (
                      <p className="mb-1 text-xs text-slate-500">{field.helper}</p>
                    ) : null}
                    <textarea
                      className="min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder={field.placeholder}
                      value={inputValue(value)}
                      onChange={(event) =>
                        updateDraft(String(field.key), event.target.value)
                      }
                    />
                  </div>
                );
              }

              if (field.type === "boolean") {
                const checked = value === true || value === "true";
                return (
                  <label
                    key={String(field.key)}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        updateDraft(String(field.key), event.target.checked)
                      }
                    />
                    {field.label}
                  </label>
                );
              }

              if (field.type === "date") {
                const text = inputValue(value);
                const local = text
                  ? new Date(text).toISOString().slice(0, 16)
                  : "";
                return (
                  <div key={String(field.key)}>
                    <label className="mb-1 block text-sm text-slate-700">
                      {field.label}
                    </label>
                    {field.helper ? (
                      <p className="mb-1 text-xs text-slate-500">{field.helper}</p>
                    ) : null}
                    <Input
                      type="datetime-local"
                      value={local}
                      onChange={(event) =>
                        updateDraft(
                          String(field.key),
                          event.target.value
                            ? new Date(event.target.value).toISOString()
                            : null,
                        )
                      }
                    />
                  </div>
                );
              }

              if (field.type === "number") {
                return (
                  <div key={String(field.key)}>
                    <label className="mb-1 block text-sm text-slate-700">
                      {field.label}
                    </label>
                    {field.helper ? (
                      <p className="mb-1 text-xs text-slate-500">{field.helper}</p>
                    ) : null}
                    <Input
                      type="number"
                      placeholder={field.placeholder}
                      value={inputValue(value)}
                      onChange={(event) =>
                        updateDraft(
                          String(field.key),
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                        )
                      }
                    />
                  </div>
                );
              }

              return (
                <div key={String(field.key)}>
                  <label className="mb-1 block text-sm text-slate-700">
                    {field.label}
                  </label>
                  {field.helper ? (
                    <p className="mb-1 text-xs text-slate-500">{field.helper}</p>
                  ) : null}
                  <Input
                    placeholder={field.placeholder}
                    value={inputValue(value)}
                    onChange={(event) =>
                      updateDraft(String(field.key), event.target.value)
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="rounded-md border border-slate-200 bg-white/40 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={
                  (draft.is_active as boolean | undefined) ?? true
                }
                onChange={(event) =>
                  updateDraft("is_active", event.target.checked)
                }
              />
              Visible on app (active)
            </label>
            <div className="mt-3">
              <label className="mb-1 block text-sm text-slate-700">
                Sort order
              </label>
              <Input
                type="number"
                value={inputValue(draft.sort_order ?? 0)}
                onChange={(event) =>
                  updateDraft("sort_order", Number(event.target.value || 0))
                }
              />
            </div>
          </div>

          {showProductPicker ? (
            <CmsProductPicker value={productIds} onChange={setProductIds} />
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void onSave()}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
