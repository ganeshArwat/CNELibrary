import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          `
          flex w-full min-h-[90px] rounded-lg
          border border-gray-300 bg-white
          px-3 py-2 text-sm text-gray-700 dark:text-foreground
          placeholder:text-gray-700

          focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-primary/60 focus-visible:border-primary
          transition-all duration-200

          disabled:cursor-not-allowed disabled:opacity-70
          disabled:bg-gray-100 dark:disabled:bg-gray-800/40

          dark:border-gray-700 dark:bg-background dark:text-gray-200
          dark:placeholder:text-gray-500
          `,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
