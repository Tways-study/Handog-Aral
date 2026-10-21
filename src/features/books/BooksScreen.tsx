"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, BookOpen, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/PageLayout";
import BookCover from "@/components/BookCover";
import { EmptyShelf } from "@/components/art";
import { sampleBooks } from "@/data/books";
import { useT } from "@/hooks/useT";
import { useSavedWords } from "@/hooks/useSavedWords";
import { bookOpenThen, pageIn } from "@/lib/motionPages";
import { useProgress } from "@/stores/progress";
import ShelfBar from "./ShelfBar";
import { bookStatus, type BookStatus } from "./status";

const STATUS_ICON = { new: Sparkles, progress: BookOpen, done: CircleCheck } as const;

export default function BooksScreen() {
  const t = useT();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const cancelOpen = useRef<(() => void) | null>(null);
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

  useEffect(() => pageIn(rootRef.current), []);
  useEffect(() => () => cancelOpen.current?.(), []);

  // The jacket tilts as the book opens (about 200 ms, skipped with reduced motion). Modified clicks keep their normal behaviour.
  const open = (e: React.MouseEvent<HTMLAnchorElement>, href: string, jacket: HTMLElement | null) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    cancelOpen.current?.();
    cancelOpen.current = bookOpenThen(jacket, () => router.push(href));
  };

  return (
    <PageContainer>
      <div ref={rootRef}>
        <div data-rise>
          <PageHeader title={t.books.title} subtitle={doneCount > 0 ? t.books.subtitleDone(doneCount) : t.books.subtitleNew} />
        </div>
        {sampleBooks.length === 0 ? (
          <div data-rise className="flex flex-col items-center gap-3 py-12 text-center">
            <EmptyShelf size={200} />
            <p className="font-heading text-xl font-bold">{t.books.emptyTitle}</p>
            <p className="max-w-[28ch] text-ink-2">{t.books.emptyBody}</p>
          </div>
        ) : (
          <ul aria-label={t.books.shelfLabel} className="grid grid-cols-2 gap-x-4 gap-y-8 pt-2 sm:gap-x-8 lg:grid-cols-3">
            {sampleBooks.map((book) => {
              const pct = Math.max(0, Math.min(100, bookProgress[book.id] ?? 0));
              const status = bookStatus(pct);
              const Icon = STATUS_ICON[status];
              const count = wordsByBook.get(book.id) ?? 0;
              const href = `/read/${book.id}`;
              return (
                <li key={book.id} data-rise>
                  <Link
                    href={href}
                    onClick={(e) => open(e, href, e.currentTarget.querySelector<HTMLElement>("[data-jacket]"))}
                    className="group flex flex-col gap-3 rounded-lg outline-none focus-visible:outline-solid focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <div
                      data-jacket
                      className="@container relative mx-auto w-full max-w-[16rem] transition-transform duration-150 motion-safe:group-hover:-translate-y-0.5"
                    >
                      <BookCover coverId={book.coverId} jacket={book.jacket} label={false} className="drop-shadow-md" />
                      <div className="absolute top-[9.5%] left-[21.25%] flex h-[21.9%] w-[62.5%] items-center overflow-hidden rounded-[0.5625rem] border-2 border-black/10 bg-label-paper px-[4%]">
                        <span className="line-clamp-3 font-heading leading-[1.1] font-bold text-label-ink text-[clamp(0.8125rem,8.5cqw,1.25rem)]">{book.title}</span>
                      </div>
                    </div>
                    <div className="min-w-0 px-1">
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
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
