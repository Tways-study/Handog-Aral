import { PageContainer } from "@/components/PageLayout";
import PadSkeleton from "@/components/PadSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  /** Announced to assistive tech while the real page loads. */
  label: string;
  className?: string;
}

/**
 * Home's shape in static bars: greeting, two chips, the notebook cover with its label and two
 * buttons, and a row of shelf covers. Same radii and gutters as HomeScreen so nothing jumps when
 * the real page replaces it. It fades in once and never shimmers.
 */
export function HomeSkeleton({ label, className }: SkeletonProps) {
  return (
    <PageContainer className={className}>
      <div role="status" aria-busy="true" aria-label={label} data-slot="home-skeleton" className="grid gap-5 lg:grid-cols-2 lg:gap-8">
        <div className="grid content-start gap-3 lg:col-span-2">
          <div className="page-band grid gap-3 pt-6 pb-7 lg:pt-10">
            <Skeleton className="h-9 w-3/5 max-w-sm rounded-lg bg-white/30" />
            <Skeleton className="h-4 w-2/5 max-w-[14rem] bg-white/30" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
        <div className="skeleton-in relative flex min-h-[21rem] flex-col gap-4 rounded-[0.375rem_1.375rem_1.375rem_0.375rem] bg-paper-2 py-5 pr-5 pl-9 lg:min-h-[30rem]">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-4 rounded-l-[0.375rem] bg-line lg:w-5" />
          <div className="rounded-[0.625rem] border-2 border-line bg-paper px-3.5 py-3">
            <Skeleton className="h-5 w-4/5 bg-paper-2" />
            <Skeleton className="mt-2.5 h-4 w-3/5 bg-paper-2" />
          </div>
          <div className="flex-1" />
          <Skeleton className="h-3 w-full rounded-full bg-paper" />
          <Skeleton className="h-14 w-full rounded-full bg-paper" />
          <Skeleton className="h-12 w-full rounded-full bg-paper" />
        </div>
        <div className="grid content-start gap-3">
          <Skeleton className="h-6 w-2/5 max-w-[10rem]" />
          <PadSkeleton rows={4} label={label} className="rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-7 lg:col-span-2 lg:grid-cols-3 lg:gap-x-8">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className={cn("aspect-[3/4] rounded-[0.25rem_0.75rem_0.75rem_0.25rem]", i === 2 && "hidden lg:block")} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

/** A page title band and a list of word rows (Words, Books, Stickers and Quiz while their data loads). */
export function ListSkeleton({ label, className }: SkeletonProps) {
  return (
    <PageContainer className={className}>
      <div className="grid gap-4">
        <div className="page-band pt-6 pb-7 lg:pt-10">
          <Skeleton className="h-9 w-1/2 max-w-xs rounded-lg bg-white/30" />
        </div>
        <Skeleton className="h-11 w-full max-w-md rounded-full" />
        <PadSkeleton rows={6} label={label} className="rounded-xl" />
      </div>
    </PageContainer>
  );
}
