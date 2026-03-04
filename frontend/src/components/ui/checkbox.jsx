import React, { useState } from "react";
import { cn } from "../../lib/utils";

const Checkbox = React.forwardRef(({ className, checked: controlledChecked, onCheckedChange, ...props }, ref) => {
  const [internalChecked, setInternalChecked] = useState(props.defaultChecked || false);
  
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleChange = (e) => {
    const newValue = e.target.checked;
    if (!isControlled) {
      setInternalChecked(newValue);
    }
    if (onCheckedChange) {
      onCheckedChange(newValue);
    }
  };

  return (
    <div className="relative">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={handleChange}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded border border-slate-600 bg-transparent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
          className
        )}
        {...props}
      />
      {checked && (
        <svg
          className="absolute top-0 left-0 h-4 w-4 text-white pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };