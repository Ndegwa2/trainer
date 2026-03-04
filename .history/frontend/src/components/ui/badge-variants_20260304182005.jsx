import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-emerald-500 text-white",
        secondary: "border-transparent bg-slate-800 text-slate-200",
        destructive: "border-transparent bg-red-500 text-white",
        outline: "text-slate-200 border-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);