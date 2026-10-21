import type { Metadata } from "next";
import ReaderScreen from "@/features/reader/ReaderScreen";

export const metadata: Metadata = { title: "Scan" };

export default function Page() {
  return <ReaderScreen />;
}
