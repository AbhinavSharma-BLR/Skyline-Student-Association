import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Accessible Input component with label and validation states
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = "", ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
            error
              ? "border-rose-400 focus:border-rose-600 focus:ring-4 focus:ring-rose-100"
              : "border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
