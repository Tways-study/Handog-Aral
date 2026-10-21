import type { Metadata } from "next";
import StickerBookScreen from "@/features/stickers/StickerBookScreen";

export const metadata: Metadata = { title: "Sticker book" };

export default function Page() {
  return <StickerBookScreen />;
}
