"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoutiqueAnalyticsOption } from "@/types/analytics";

interface BoutiqueSearchSelectProps {
  boutiques: BoutiqueAnalyticsOption[];
  value: string;
  onChange: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

function formatBoutiqueLabel(boutique: BoutiqueAnalyticsOption) {
  return boutique.location ? `${boutique.name} — ${boutique.location}` : boutique.name;
}

export function BoutiqueSearchSelect({
  boutiques,
  value,
  onChange,
  isLoading,
  className,
}: BoutiqueSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => boutiques.find((b) => b.id === value) ?? null,
    [boutiques, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return boutiques;
    return boutiques.filter((b) => {
      const haystack = `${b.name} ${b.location ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [boutiques, query]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      searchRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full lg:w-auto lg:min-w-[280px]", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isLoading}
        className={cn(
          "focus-gold flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm transition-all duration-200",
          "hover:border-slate-300 focus-visible:border-blue-400",
          open && "border-blue-400 ring-1 ring-blue-100",
          isLoading && "cursor-wait opacity-70",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("truncate text-left", selected ? "text-slate-800" : "text-slate-400")}>
          {isLoading
            ? "Loading boutiques…"
            : selected
              ? formatBoutiqueLabel(selected)
              : "Search boutique…"}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {selected ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear boutique selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-1.5 w-full min-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or location…"
                className="focus-gold h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white"
              />
            </div>
          </div>

          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto p-1"
            aria-label="Boutique options"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                {query.trim() ? "No boutiques match your search" : "No boutiques available"}
              </li>
            ) : (
              filtered.map((boutique) => {
                const isSelected = boutique.id === value;
                return (
                  <li key={boutique.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(boutique.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-blue-50 text-blue-800"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100 text-blue-600" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{boutique.name}</span>
                        {boutique.location ? (
                          <span className="block truncate text-xs text-slate-500">
                            {boutique.location}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
