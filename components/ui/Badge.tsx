import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
}

/**
 * Reusable Status Badge component
 * Used across tickets, dues, claims, and membership cards
 */
export function Badge({
  children,
  variant = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide";

  const variantStyles = {
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    danger: "bg-rose-100 text-rose-800 border border-rose-200",
    info: "bg-[#E8F0FF] text-[#0047AB] border border-[#0047AB]/20",
    neutral: "bg-[#F7F8FA] text-[#64748B] border border-[#E5E7EB]",
    primary: "bg-[#E8F0FF] text-[#0047AB] border border-[#0047AB]/30 font-semibold",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
