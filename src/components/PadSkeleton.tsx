import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Fixed, varied widths so the placeholder reads as handwriting and SSR and CSR agree.
const WORD_W = ["w-24", "w-32", "w-20", "w-28", "w-36", "w-24", "w-32", "w-28"];
const MEANING_W = ["w-40", "w-32", "w-48", "w-36", "w-28", "w-44", "w-36", "w-32"];

interface PadSkeletonProps {
  /** How many word rows (each two rules tall: a word line and a meaning line). */
  rows?: number;
  /** Announced to assistive tech while the real rows load. */
  label: string;
  className?: string;
}

/**
 * Placeholder for a ruled list that is still reading from the database: static bars sitting on the
 * rules where the words will be written, inside the same ruled page, so nothing jumps when they arrive.
 * It fades in once; it never shimmers or loops.
 */
export default function PadSkeleton({ rows = 6, label, className }: PadSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label={label} data-slot="pad-skeleton" className={cn("pad", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-[calc(var(--pitch)*2)] pr-6">
          <div className="pad-line flex items-center">
            <Skeleton className={cn("h-4", WORD_W[i % WORD_W.length])} />
          </div>
          <div className="pad-line flex items-center">
            <Skeleton className={cn("h-3", MEANING_W[i % MEANING_W.length])} />
          </div>
        </div>
      ))}
    </div>
  );
}
