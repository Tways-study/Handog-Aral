import type { Metadata } from "next";
import BooksScreen from "@/features/books/BooksScreen";

export const metadata: Metadata = { title: "Books" };

export default function Page() {
  return <BooksScreen />;
}
