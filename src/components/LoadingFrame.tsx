"use client";

import { usePathname } from "next/navigation";
import { PeekOverNotebook } from "@/components/art";
import { HomeSkeleton, ListSkeleton } from "@/components/PageSkeleton";
import { useT } from "@/hooks/useT";

const LIST_ROUTES = new Set(["/words", "/books", "/stickers", "/quiz"]);

/**
 * First paint while the settings and progress stores hydrate, rendered in the server HTML. Routes
 * with a known shape (Home and the list screens) show that shape in static bars; every other route
 * gets the owl peeking over notebook lines. Nothing loops, so it is calm on a slow phone too.
 */
export default function LoadingFrame() {
  const t = useT();
  const pathname = usePathname()?.replace(/\/$/, "") || "/";
  if (pathname === "/") return <HomeSkeleton label={t.shell.loading} />;
  if (LIST_ROUTES.has(pathname)) return <ListSkeleton label={t.shell.loading} />;
  return (
    <div className="pad grid min-h-dvh place-items-center" role="status" aria-busy="true">
      <div className="skeleton-in flex flex-col items-center gap-3 px-6 text-center">
        <PeekOverNotebook size={176} />
        <p className="font-heading text-lg font-bold text-ink-2">{t.shell.loading}</p>
      </div>
    </div>
  );
}
