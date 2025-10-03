import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          `
          flex h-10 w-full px-3 py-2 rounded-md
          text-base md:text-sm
          border border-gray-300 bg-white text-gray-700
          placeholder-gray-400
           focus:outline-none focus:ring-2 focus:ring-primary 
          disabled:cursor-not-allowed disabled:bg-gray-200/60
          transition-all duration-200

          dark:border-gray-700 dark:bg-background dark:text-gray-300
          dark:placeholder-gray-500
          ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground

          file:rounded-sm
        file:bg-white file:text-gray-700
        hover:file:bg-gray-200

        dark:file:bg-gray-800 dark:file:text-gray-300 
        dark:hover:file:bg-gray-700
          `,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
