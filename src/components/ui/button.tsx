import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-dark focus-visible:ring-offset-2 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-teal-dark text-white hover:opacity-95",
        navy: "bg-navy text-white hover:bg-navy/90",
        secondary: "bg-light border border-border text-navy hover:bg-border/40",
        outline: "border-2 border-border bg-surface text-navy hover:bg-light",
        ghost: "bg-transparent text-navy hover:bg-light",
        danger: "bg-red text-white hover:bg-red/90",
        destructive: "bg-red text-white hover:bg-red/90",
        success: "bg-green-text text-white hover:bg-green-text/90",
        link: "text-teal-dark underline-offset-4 hover:underline p-0 h-auto rounded-none",
        pill: "bg-teal-tint text-teal-dark hover:bg-teal-tint/80 font-bold tracking-wider uppercase text-xs",
      },
      size: {
        default: "h-11 px-6 text-[15px]",
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        lg: "h-13 px-8 text-base font-semibold [&_svg]:size-5",
        icon: "h-10 w-10 p-0 [&_svg]:size-5",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:size-4",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
