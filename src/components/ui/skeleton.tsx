import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-lg bg-[#1F2937]/50", className)}
      {...props}
    />
  );
}

export { Skeleton };
