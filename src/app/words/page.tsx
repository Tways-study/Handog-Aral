import type { Metadata } from "next";
import VocabularyScreen from "@/features/vocabulary/VocabularyScreen";

export const metadata: Metadata = { title: "Words" };

export default function Page() {
  return <VocabularyScreen />;
}
