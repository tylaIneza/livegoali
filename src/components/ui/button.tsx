"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF84] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "gradient-primary text-[#0B0F14] shadow-lg hover:shadow-[0_0_20px_rgba(0,255,132,0.4)] hover:scale-105 active:scale-95",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
        outline:
          "border border-white/10 bg-transparent text-white hover:border-[#00FF84]/50 hover:text-[#00FF84]",
        secondary:
          "bg-[#121821] text-white border border-white/10 hover:border-[#00FF84]/30 hover:bg-[#1F2937]",
        ghost: "text-white hover:bg-white/5 hover:text-[#00FF84]",
        link: "text-[#00FF84] underline-offset-4 hover:underline",
        live: "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]",
        premium:
          "bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-105",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
