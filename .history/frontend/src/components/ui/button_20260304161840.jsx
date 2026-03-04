import React from "react";
import { cn } from "../../lib/utils";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500",
        secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 focus-visible:ring-slate-500",
        outline: "border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-200",
        ghost: "hover:bg-slate-800 text-slate-200",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Button.display";

export { Button, buttonVariants };