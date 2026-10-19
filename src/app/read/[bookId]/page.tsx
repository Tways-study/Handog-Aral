import { notFound } from "next/navigation";
import { sampleBooks } from "@/data/books";
import ReaderScreen from "@/features/reader/ReaderScreen";

export const dynamicParams = false;

export function generateStaticParams() {
  return sampleBooks.map((b) => ({ bookId: b.id }));
}

export default async function Page({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  if (!sampleBooks.some((b) => b.id === bookId)) notFound();
  return <ReaderScreen bookId={bookId} />;
}
