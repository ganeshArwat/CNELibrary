import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#134074] text-white hover:bg-[#0f2d5c] shadow-md transition-all duration-200", // Velox Dark Blue
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm transition-all duration-200",
        outline:
          "border border-[#134074] text-[#134074] bg-white hover:bg-[#e6f0ff] hover:text-[#0f2d5c] transition-all duration-200", // Blue outline
        secondary:
          "bg-[#e6f0ff] text-[#134074] hover:bg-[#cce0ff] hover:text-[#0f2d5c] shadow-sm transition-all duration-200", // Light blue
        primary_dark:
          "px-6 h-10 rounded-lg font-semibold bg-[#0f2d5c] text-white shadow-md hover:bg-[#0a1c3f] transition-all duration-200",
        primary:
          "px-6 h-10 rounded-lg font-semibold bg-[#138b46] text-white shadow-md hover:bg-[#0f6e38] transition-all duration-200", // Velox Green
        primary_gradient: `flex items-center gap-2 px-4 py-2 rounded-lg
          bg-gradient-to-r from-[#138b46] to-[#134074]
          hover:from-[#0f6e38] hover:to-[#0f2d5c]
          text-white shadow-md transition-all duration-200`, // Green to Blue gradient
        primary_outline: `px-5 h-10 rounded-lg font-medium
          border border-[#138b46] text-[#138b46] bg-white
          hover:bg-[#e6f0ef] hover:text-[#0f6e38]
          transition-all duration-200 shadow-sm`, // Green outline
        green_outline: `px-3 py-1
          rounded-lg text-sm font-medium
          border border-green-500/30 dark:border-green-500/40 
          text-green-600 dark:text-green-400
          bg-green-500/15 dark:bg-green-500/10
          hover:bg-green-600  hover:text-white dark:hover:bg-green-700
          transition-all duration-200`,
        danger_outline: `px-3 py-1
          rounded-lg text-sm font-medium
          border border-red-500/30 text-red-600
          bg-red-500/5 dark:bg-red-500/10
          hover:bg-red-500 dark:hover:bg-red-500 hover:text-white
          transition-all duration-200`,
        success: `
          px-5 py-2.5 rounded-lg font-medium
          bg-green-600 dark:bg-green-700 
          text-white dark:text-green-300
          hover:bg-green-500
          shadow-sm hover:shadow
          transition duration-150 ease-in-out
        `,
        danger: `
          px-5 py-2.5 rounded-lg font-medium
          bg-red-200 dark:bg-red-700  
          text-red-800 dark:text-red-300
          hover:bg-red-100
          shadow-sm hover:shadow
          transition duration-150 ease-in-out
        `,
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
