import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-white focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 font-figtree font-light resize-none transition-all hover:border-primary/50 dark:border-border-dark dark:bg-muted-dark dark:text-foreground-dark dark:placeholder:text-muted-foreground dark:hover:border-white/60 dark:focus-visible:border-white border-focus-thin",
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
