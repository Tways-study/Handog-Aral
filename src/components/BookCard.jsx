import { memo } from "react";

const BookCard = memo(function BookCard({ book, progress, onClick }) {
  const pct = progress ?? book.progress ?? 0;
  return (
    <button
      onClick={() => onClick(book)}
      className="tappable bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left w-full"
    >
      <div className="flex items-start gap-3">
        <span
          className="text-4xl flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: book.color + "22" }}
        >
          {book.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm text-dark-text truncate">
            {book.title}
          </h3>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: book.color }}
            />
          </div>
          <p className="text-[11px] text-muted-text mt-1">{pct}% natapos na</p>
        </div>
      </div>
    </button>
  );
});

export default BookCard;
