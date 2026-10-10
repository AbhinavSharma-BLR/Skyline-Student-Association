import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

/**
 * Reusable Button component aligned with Skyline Design System
 * Primary accent: Indigo / Coral CTA
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  const variantStyles = {
    primary:
      "bg-[#0047AB] text-white shadow-sm hover:bg-[#003785] active:bg-[#002B66]",
    secondary:
      "bg-[#0A0A0A] text-white hover:bg-[#262626] active:bg-black",
    outline:
      "border border-[#E5E7EB] bg-white text-[#0A0A0A] hover:bg-[#F7F8FA] hover:border-[#0047AB]",
    ghost:
      "text-[#64748B] hover:bg-[#E8F0FF] hover:text-[#0047AB]",
    danger:
      "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
