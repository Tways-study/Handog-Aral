import { useApp } from "../context/AppContext";
import { sampleBooks } from "../data/books";
import BookCard from "../components/BookCard";
import Mascot from "../components/Mascot";

export default function BooksScreen({ onNavigate }) {
  const { state, dispatch } = useApp();

  const handleOpenBook = (book) => {
    dispatch({ type: "SET_CURRENT_BOOK", payload: book });
    onNavigate("scan");
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <Mascot size={32} />
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark-text">
            Mga Libro 📚
          </h1>
          <p className="text-muted-text text-xs">Pili-a ang imo basahon!</p>
        </div>
      </div>

      <div className="px-5 space-y-3 animate-fadeUp">
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
