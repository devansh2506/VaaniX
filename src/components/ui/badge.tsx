import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold leading-5",
  {
    variants: {
      variant: {
        default: "bg-light border-border text-gray",
        teal: "bg-teal-tint border-teal/20 text-teal-dark",
        outline: "bg-transparent border-border text-navy",
        critical: "bg-red-tint border-red/30 text-red-text",
        danger: "bg-red-tint border-red/30 text-red-text",
        warning: "bg-[#FEF6E7] border-[#F5C26B] text-[#9E6200]",
        positive: "bg-green-tint border-green/30 text-green-text",
        success: "bg-green-tint border-green/30 text-green-text",
        navy: "bg-navy border-transparent text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
