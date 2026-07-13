import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  action?: React.ReactNode;
}

export function SectionHeader({
  icon: Icon,
  iconClassName = "bg-primary/10 text-primary",
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View All",
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${iconClassName}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>
      </div>
      {action ?? (viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-primary transition-colors shrink-0"
        >
          {viewAllLabel} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ))}
    </div>
  );
}
