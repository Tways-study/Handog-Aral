"use client";

import Link from "next/link";
import { CircleCheck, BookOpen, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import BookCover from "@/components/BookCover";
import { Progress } from "@/components/ui/progress";
import { sampleBooks } from "@/data/books";
import { useT } from "@/hooks/useT";
import { useProgress } from "@/stores/progress";
import { bookStatus, type BookStatus } from "./status";

const STATUS_ICON = { new: Sparkles, progress: BookOpen, done: CircleCheck } as const;

export default function BooksScreen() {
  const t = useT();
  const bookProgress = useProgress((s) => s.bookProgress);
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
          return (
            <li key={book.id}>
              <Link
                href={`/read/${book.id}`}
                aria-label={t.books.openBook(book.title, label[status])}
                className="group flex items-center gap-5 rounded-lg outline-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring sm:flex-col sm:items-stretch sm:gap-3"
              >
                <div className="@container relative w-[11.5rem] shrink-0 transition-transform duration-150 motion-safe:group-hover:-translate-y-0.5 sm:mx-auto sm:w-full sm:max-w-[16rem]">
                  <BookCover coverId={book.coverId} jacket={book.jacket} label={false} className="drop-shadow-md" />
                  <div className="absolute top-[9.5%] left-[21.25%] flex h-[21.9%] w-[62.5%] items-center overflow-hidden rounded-[0.5625rem] border-2 border-black/10 bg-[#FFFDF7] px-[4%]">
                    <span className="line-clamp-3 font-heading leading-[1.1] font-bold text-[#1D2340] text-[max(1rem,8cqw)]">{book.title}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 sm:flex-none sm:px-1">
                  <p className="flex items-center gap-1.5 font-bold">
                    <Icon className="size-5" aria-hidden="true" />
                    {label[status]}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={pct} aria-label={t.bookCard.progressText(pct)} />
                    <span aria-hidden="true" className="text-sm font-bold text-ink-2">{pct}%</span>
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
