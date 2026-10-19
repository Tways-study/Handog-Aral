import type { ReactNode } from "react";
import { SettingsLink } from "@/components/AppShell";
import { cn } from "@/lib/utils";

/**
 * Content column for every screen. Centres at ~64rem on lg, owns the horizontal gutters and the
 * clearance under the bottom nav (.pb-nav). Pass `flush` for edge-to-edge sections (pad paper,
 * notebook covers); you then own the gutters.
 */
export function PageContainer({
  children,
  className,
  flush = false,
  nav = true,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
  /** Reserve space for the bottom nav. Turn off for full-bleed routes without it. */
  nav?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[var(--content-max)]", !flush && "px-5 lg:px-8", nav && "pb-nav", className)}>
      {children}
    </div>
  );
}

/**
 * Screen title row: heading, optional subtitle, and a trailing slot. Below lg a Settings gear is
 * added after the trailing slot (the rail has Settings at lg+); pass `hideSettings` to drop it.
 */
export function PageHeader({
  title,
  subtitle,
  trailing,
  hideSettings = false,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  hideSettings?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-3 pt-[max(1rem,env(safe-area-inset-top))] pb-3 lg:pt-8 lg:pb-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-heading text-2xl leading-[1.1] font-bold text-balance lg:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-[0.9375rem] text-ink-2 lg:text-base">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {trailing}
        {!hideSettings && <SettingsLink className="lg:hidden" />}
      </div>
    </header>
  );
}
