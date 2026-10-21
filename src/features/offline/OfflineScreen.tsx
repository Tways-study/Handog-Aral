"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OfflineArt } from "@/components/art";
import { PageContainer } from "@/components/PageLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { useT } from "@/hooks/useT";

export default function OfflineScreen() {
  const t = useT().shell;
  const router = useRouter();
  return (
    <div className="min-h-dvh">
      <PageContainer className="flex flex-col items-center py-16 text-center">
        <OfflineArt size={200} />
        <h1 className="mt-6 font-heading text-3xl font-bold text-balance">{t.offlinePageTitle}</h1>
        <p className="mt-3 max-w-[36ch] text-lg text-ink-2">{t.offlinePageBody}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {/* A real reload: the service worker serves this page only when the network is unreachable. */}
          <Button size="lg" onClick={() => router.push("/")}>
            {t.offlineRetry}
          </Button>
          <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            {t.offlineHome}
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
