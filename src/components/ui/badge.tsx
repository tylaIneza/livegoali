import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2",
  {
    variants: {
      variant: {
        default: "bg-[#00FF84]/10 text-[#00FF84] border border-[#00FF84]/30",
        secondary: "bg-[#1F2937] text-gray-300 border border-white/10",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/30",
        outline: "border border-white/20 text-white",
        live: "bg-red-500 text-white animate-pulse",
        premium: "bg-gradient-to-r from-yellow-400 to-orange-400 text-black",
        new: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
        hot: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
