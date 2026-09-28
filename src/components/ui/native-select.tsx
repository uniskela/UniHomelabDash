import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Native select keeps OS pickers on phones. Explicit option colours and
 * `color-scheme` keep the popup readable in dark mode, where some browsers
 * would otherwise render light text on a light list.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <span className="relative flex w-full">
      <select
        data-slot="native-select"
        className={cn(
          "h-8 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-base text-foreground transition-colors outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm pointer-coarse:h-10 dark:bg-input/30 dark:[color-scheme:dark] [&>option]:bg-popover [&>option]:text-popover-foreground",
          className
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  )
}

export { NativeSelect }
