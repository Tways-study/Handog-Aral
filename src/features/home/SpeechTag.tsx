import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tail = "left" | "right" | "bottom";
type Tone = "paper" | "label";

const TONE: Record<Tone, string> = {
  paper: "border-transparent bg-paper-2 text-foreground",
  label: "border-black/10 bg-label-paper text-label-ink",
};

/** Which two borders of the rotated square point out of the bubble. */
const TAIL: Record<Tail, string> = {
  right: "-right-[0.4375rem] bottom-5 border-t-2 border-r-2",
  left: "-left-[0.4375rem] bottom-5 border-b-2 border-l-2",
  bottom: "-bottom-[0.4375rem] right-8 border-r-2 border-b-2",
};

/**
 * The owl's speech tag: a paper bubble with a small tail that points at the owl. The bubble is only a
 * surface; put a real <button>/<p> inside it. The tail is decorative.
 */
export default function SpeechTag({
  tail = "right",
  tone = "paper",
  className,
  children,
  ...rest
}: { tail?: Tail; tone?: Tone; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative rounded-[1.125rem] border-2", TONE[tone], className)} {...rest}>
      <span aria-hidden="true" className={cn("absolute size-3.5 rotate-45 rounded-[0.1875rem] border-inherit bg-inherit", TAIL[tail])} />
      {children}
    </div>
  );
}
