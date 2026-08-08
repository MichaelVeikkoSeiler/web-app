import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sage text-forest hover:bg-sage-dark hover:text-warm-white disabled:opacity-50",
  secondary:
    "bg-warm-white text-forest border border-border hover:bg-cream disabled:opacity-50",
  ghost: "text-forest-muted hover:text-forest hover:bg-cream",
  danger: "bg-attention/40 text-attention-text hover:bg-attention/60",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className = "", variant = "primary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});
