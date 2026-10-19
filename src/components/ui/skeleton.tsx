import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-accent motion-safe:animate-[ui-pulse_1.6s_ease-in-out_infinite]", className)}
      {...props}
    />
  )
}

export { Skeleton }
