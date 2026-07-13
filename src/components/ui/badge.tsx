import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/30",
        secondary: "bg-secondary text-muted-foreground border border-border",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/30",
        outline: "border border-border text-foreground",
        live: "bg-red-500 text-white animate-pulse",
        premium: "bg-gradient-to-r from-warning to-orange-400 text-warning-foreground",
        new: "bg-primary/10 text-primary border border-primary/30",
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
