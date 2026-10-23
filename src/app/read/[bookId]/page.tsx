import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allBooks } from "@/data/books";
import ReaderScreen from "@/features/reader/ReaderScreen";

export const metadata: Metadata = { title: "Read" };

export const dynamicParams = false;

export function generateStaticParams() {
  return allBooks.map((b) => ({ bookId: b.id }));
}

export default async function Page({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  if (!allBooks.some((b) => b.id === bookId)) notFound();
  return <ReaderScreen bookId={bookId} />;
}
