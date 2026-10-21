"use client";

import Link from "next/link";
import { RotateCcw, ScanLine } from "lucide-react";
import { NotFoundArt } from "@/components/art";
import Mascot from "@/components/Mascot";
import { PageContainer } from "@/components/PageLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { useT } from "@/hooks/useT";

/**
 * Calm in-world failure page on pad paper: the owl looking around (not found) or thinking (error), one sentence of what happened,
 * and a clear way back. Used by not-found.tsx and error.tsx (both render inside the app shell,
 * so the navigation stays). Never shows technical detail.
 */
export default function SystemPage({ kind, onRetry }: { kind: "notFound" | "error"; onRetry?: () => void }) {
  const t = useT().system;
  const title = kind === "notFound" ? t.notFoundTitle : t.errorTitle;
  const body = kind === "notFound" ? t.notFoundBody : t.errorBody;
  return (
    <div className="pad min-h-dvh" data-system-page={kind}>
      <PageContainer className="flex flex-col items-center py-16 text-center">
        {kind === "notFound" ? <NotFoundArt size={200} /> : <Mascot mood="think" size={120} />}
        <h1 className="mt-6 font-heading text-3xl font-bold text-balance">{title}</h1>
        <p className="mt-3 max-w-[36ch] text-lg text-ink-2">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <Button size="lg" onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              {t.tryAgain}
            </Button>
          )}
          {/* One orange action: "try again" on an error, "back home" on a missing page; the rest are paper. */}
          <Link href="/" className={buttonVariants({ variant: onRetry ? "secondary" : "default", size: "lg" })}>
            {t.goHome}
          </Link>
          <Link href="/scan" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            <ScanLine aria-hidden="true" />
            {t.openScan}
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
