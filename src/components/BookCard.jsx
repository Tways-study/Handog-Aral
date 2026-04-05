import { memo } from "react";
import { ChevronRight } from "lucide-react";

const BookCard = memo(function BookCard({ book, progress, onClick }) {
  const pct = progress ?? book.progress ?? 0;
  const levelLabel =
    pct === 0 ? "Bag-o" : pct < 50 ? "Ginapadayon" : pct < 100 ? "Malapit na!" : "Natapos! 🎉";
  const levelColor =
    pct === 0 ? "#64748B" : pct < 50 ? "#F97316" : pct < 100 ? "#0EA5A0" : "#34D399";

  return (
    <button
      onClick={() => onClick(book)}
      className="tappable bg-white rounded-2xl shadow-sm border border-gray-100 text-left w-full overflow-hidden"
    >
      {/* Color accent top bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: book.color }} />

      <div className="p-4 flex items-center gap-4">
        {/* Book cover */}
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${book.color}33, ${book.color}66)`,
          }}
        >
          <span className="text-4xl">{book.emoji}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm text-dark-text leading-tight mb-1.5">
            {book.title}
          </h3>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-2"
            style={{ backgroundColor: levelColor + "22", color: levelColor }}
          >
            {levelLabel}
          </span>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, backgroundColor: book.color }}
            />
          </div>
          <p className="text-[11px] text-muted-text mt-1">{pct}% natapos na</p>
        </div>

        <ChevronRight size={16} className="text-muted-text flex-shrink-0" />
      </div>
    </button>
  );
});

export default BookCard;
