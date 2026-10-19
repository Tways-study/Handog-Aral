import type { Metadata } from "next";
import OfflineScreen from "@/features/offline/OfflineScreen";

export const metadata: Metadata = { title: "Offline" };

// Precached by the service worker and served when a page cannot be reached.
export default function Page() {
  return <OfflineScreen />;
}
