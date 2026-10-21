"use client";

import Link from "next/link";
import { CircleCheck, BookOpen, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import BookCover from "@/components/BookCover";
import { sampleBooks } from "@/data/books";
import { useT } from "@/hooks/useT";
import { useSavedWords } from "@/hooks/useSavedWords";
import { useProgress } from "@/stores/progress";
import ShelfBar from "./ShelfBar";
import { bookStatus, type BookStatus } from "./status";

const STATUS_ICON = { new: Sparkles, progress: BookOpen, done: CircleCheck } as const;

export default function BooksScreen() {
  const t = useT();
  const bookProgress = useProgress((s) => s.bookProgress);
  const words = useSavedWords();
  const wordsByBook = new Map<string, number>();
  for (const w of words ?? []) if (w.bookId) wordsByBook.set(w.bookId, (wordsByBook.get(w.bookId) ?? 0) + 1);
  const label: Record<BookStatus, string> = {
    new: t.bookCard.statusNew,
    progress: t.bookCard.statusInProgress,
    done: t.bookCard.statusDone,
  };
  const doneCount = sampleBooks.filter((b) => (bookProgress[b.id] ?? 0) >= 100).length;

  return (
    <PageContainer>
      <PageHeader title={t.books.title} subtitle={doneCount > 0 ? t.books.subtitleDone(doneCount) : t.books.subtitleNew} />
      <ul aria-label={t.books.shelfLabel} className="grid grid-cols-1 gap-x-8 gap-y-8 pt-2 sm:grid-cols-2 lg:grid-cols-3">
        {sampleBooks.map((book) => {
          const pct = Math.max(0, Math.min(100, bookProgress[book.id] ?? 0));
          const status = bookStatus(pct);
          const Icon = STATUS_ICON[status];
          const count = wordsByBook.get(book.id) ?? 0;
          return (
            <li key={book.id}>
              <Link
                href={`/read/${book.id}`}
                className="group flex flex-col gap-3 rounded-lg min-[26rem]:flex-row min-[26rem]:items-center min-[26rem]:gap-5 outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:flex-col sm:items-stretch sm:gap-3"
              >
                <div className="@container relative w-[min(11.5rem,60%)] shrink-0 min-[26rem]:w-[min(11.5rem,42vw)] transition-transform duration-150 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-active:translate-y-0 motion-safe:group-active:scale-[0.98] sm:mx-auto sm:w-full sm:max-w-[16rem]">
                  <BookCover coverId={book.coverId} jacket={book.jacket} label={false} className="drop-shadow-md" />
                  <div className="absolute top-[9.5%] left-[21.25%] flex h-[21.9%] w-[62.5%] items-center overflow-hidden rounded-[0.5625rem] border-2 border-black/10 bg-label-paper px-[4%]">
                    <span className="line-clamp-3 hidden font-heading leading-[1.1] font-bold text-label-ink text-[max(1rem,8cqw)] sm:inline">{book.title}</span>
                    <span aria-hidden="true" className="h-0 w-full border-b-[1.5px] border-label-rule sm:hidden" />
                  </div>
                </div>
                <div className="min-w-0 flex-1 sm:flex-none sm:px-1">
                  <p className="font-heading text-lg leading-tight font-bold text-pretty sm:hidden">{book.title}</p>
                  <div className="mt-1.5 sm:mt-0">
                    <p className="flex items-center gap-1.5 font-bold">
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                      {label[status]}
                    </p>
                    {words !== null && <p className="mt-0.5 text-[0.9375rem] text-ink-2">{t.books.wordCount(count)}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <ShelfBar pct={pct} label={t.bookCard.progressText(pct)} />
                      <span aria-hidden="true" className="w-11 shrink-0 text-right text-sm whitespace-nowrap font-bold text-ink-2 tabular-nums">{pct}%</span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
