import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tail = "left" | "right" | "bottom";

/** Which two borders of the rotated square point out of the bubble. */
const TAIL: Record<Tail, string> = {
  right: "-right-[0.4375rem] bottom-4 border-t-2 border-r-2",
  left: "-left-[0.4375rem] bottom-4 border-b-2 border-l-2",
  bottom: "-bottom-[0.4375rem] right-6 border-r-2 border-b-2",
};

/**
 * The owl's speech tag on the Reader, Scan, Quiz and Words screens: a paper bubble with a small tail that points at
 * the owl. A surface only; the words inside are plain text (a polite status when `role="status"` is passed).
 */
export default function OwlTag({
  tail = "right",
  className,
  children,
  ...rest
}: { tail?: Tail; className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="owl-tag" className={cn("relative rounded-[1.125rem] border-2 border-transparent bg-paper-2 px-3.5 py-2 text-foreground", className)} {...rest}>
      <span aria-hidden="true" className={cn("absolute size-3 rotate-45 rounded-[0.1875rem] border-inherit bg-inherit", TAIL[tail])} />
      {children}
    </div>
  );
}
