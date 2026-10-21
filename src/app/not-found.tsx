import type { Metadata } from "next";
import SystemPage from "./_system/SystemPage";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <SystemPage kind="notFound" />;
}
