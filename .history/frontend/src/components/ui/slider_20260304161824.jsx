import React from "react";
import { cn } from "../../lib/utils";

const Slider = React.forwardRef(({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const percentage = ((value[0] - min) / (max - min)) * 100;

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onValueChange([newValue]);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="absolute h-full bg-emerald-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        className={cn(
          "absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-400",
          "[&[role=slider]]:bg-emerald-500 [&[role=slider]]:border-emerald-400"
        )}
        {...props}
      />
    </div>
  );
});
Slider.displayName = "Slider";

export { Slider };