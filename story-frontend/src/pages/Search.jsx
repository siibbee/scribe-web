import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getAllBooks } from "../services/bookService";
import "./search.css";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) {
      setBooks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getAllBooks(query)
      .then(({ data }) => setBooks(data))
      .catch((err) => console.error("Search error:", err))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="search-page">
      <h2>Arama Sonuçları: "{query}"</h2>
      
      {loading ? (
        <div className="search-spinner" />
      ) : books.length === 0 ? (
        <p className="search-empty">"{query}" ile eşleşen bir kitap bulunamadı.</p>
      ) : (
        <div className="search-grid">
          {books.map((book) => (
            <div
              key={book.id}
              className="search-book-card"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="search-book-cover" />
              ) : (
                <div className="search-book-placeholder">
                  {/* Ham emoji yerine asil bir SVG kitap ikonu */}
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              )}
              <div className="search-book-title">{book.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}