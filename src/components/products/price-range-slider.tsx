"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

type PriceRangeSliderProps = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
};

const RANGE_INPUT_CLASS =
  "pointer-events-none absolute top-2 left-0 h-2 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
  "[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full " +
  "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm " +
  "[&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 " +
  "[&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 " +
  "[&::-moz-range-thumb]:border-blue-600 [&::-moz-range-thumb]:bg-white";

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  className,
}: PriceRangeSliderProps) {
  const [low, high] = value;
  const range = Math.max(max - min, 1);
  const lowPercent = ((low - min) / range) * 100;
  const highPercent = ((high - min) / range) * 100;
  const step = range > 100_000 ? 1000 : range > 10_000 ? 500 : 100;

  const updateLow = useCallback(
    (next: number) => {
      onChange([Math.min(next, high - step), high]);
    },
    [high, onChange, step],
  );

  const updateHigh = useCallback(
    (next: number) => {
      onChange([low, Math.max(next, low + step)]);
    },
    [low, onChange, step],
  );

  return (
    <div className={cn("relative w-full px-1 pt-2 pb-1", className)}>
      <div className="relative h-2 w-full rounded-full bg-slate-200">
        <div
          className="absolute top-0 h-2 rounded-full bg-blue-600"
          style={{
            left: `${lowPercent}%`,
            width: `${Math.max(highPercent - lowPercent, 0)}%`,
          }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={(e) => updateLow(Number(e.target.value))}
        aria-label="Minimum price"
        className={RANGE_INPUT_CLASS}
        style={{ zIndex: low > min + range / 2 ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={(e) => updateHigh(Number(e.target.value))}
        aria-label="Maximum price"
        className={RANGE_INPUT_CLASS}
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
