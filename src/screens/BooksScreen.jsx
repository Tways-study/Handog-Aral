import { useApp } from "../context/AppContext";
import { sampleBooks } from "../data/books";
import BookCard from "../components/BookCard";

export default function BooksScreen({ onNavigate }) {
  const { state, dispatch } = useApp();
  const completedCount = Object.values(state.bookProgress).filter(
    (p) => p >= 100
  ).length;
  const inProgressCount = Object.values(state.bookProgress).filter(
    (p) => p > 0 && p < 100
  ).length;

  const handleOpenBook = (book) => {
    dispatch({ type: "SET_CURRENT_BOOK", payload: book });
    onNavigate("scan");
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div
        className="px-5 pt-10 pb-7 rounded-b-[36px]"
        style={{
          background: "linear-gradient(135deg, #FF9F43 0%, #FFD166 100%)",
        }}
      >
        <h1 className="font-heading text-2xl font-bold text-white mb-1">
          Mga Libro 📚
        </h1>
        <p className="text-white/80 text-sm">
          {completedCount > 0
            ? `${completedCount} libro na ang natapos mo!`
            : "Pili-a ang imo basahon!"}
        </p>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/25 rounded-xl p-3 text-center">
            <p className="text-white font-extrabold text-2xl font-heading leading-none">
              {sampleBooks.length}
            </p>
            <p className="text-white/80 text-[10px] font-semibold mt-0.5">
              Mga Libro
            </p>
          </div>
          <div className="bg-white/25 rounded-xl p-3 text-center">
            <p className="text-white font-extrabold text-2xl font-heading leading-none">
              {inProgressCount}
            </p>
            <p className="text-white/80 text-[10px] font-semibold mt-0.5">
              Ginapadayon
            </p>
          </div>
          <div className="bg-white/25 rounded-xl p-3 text-center">
            <p className="text-white font-extrabold text-2xl font-heading leading-none">
              {completedCount}
            </p>
            <p className="text-white/80 text-[10px] font-semibold mt-0.5">
              Natapos
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3 animate-fadeUp">
        {sampleBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            progress={state.bookProgress[book.id]}
            onClick={handleOpenBook}
          />
        ))}
      </div>
    </div>
  );
}
