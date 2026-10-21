import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * `next/dynamic` for OPTIONAL pieces (the 3D owl canvas, the celebration dialog, the sticker backfill).
 * If the chunk cannot be fetched — typically the connection drops right after the first load, before the
 * service worker has cached everything — the piece renders nothing instead of throwing into the error
 * boundary. The page keeps working; the flat owl stays; the next visit loads the chunk from the cache.
 */
export function softDynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> }>) {
  return dynamic<P>(() => loader().catch(() => ({ default: (() => null) as ComponentType<P> })), { ssr: false });
}
