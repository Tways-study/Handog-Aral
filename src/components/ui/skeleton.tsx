import { cn } from "@/lib/utils"

/** A static placeholder bar. It fades in once when it mounts (reduced motion: instant) and never loops. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("skeleton-in rounded-md bg-line", className)} {...props} />
}

export { Skeleton }
