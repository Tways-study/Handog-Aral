import type { Metadata } from "next";
import MatchScreen from "@/features/play/MatchScreen";

export const metadata: Metadata = { title: "Memory match" };

export default function Page() {
  return <MatchScreen />;
}
