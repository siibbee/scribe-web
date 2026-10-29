import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getAllBooks } from "../services/bookService";
import Footer from "../components/Footer";
import "./search.css";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState(query);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInputVal(query);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() });
    }
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-header">
          <span className="search-eyebrow">✦ KÜTÜPHANE ARAMASI</span>
          <h2>{query ? `"${query}" için Sonuçlar` : "Scribe Kütüphanesinde Ara"}</h2>

          <form className="search-inline-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Eser adı, yazar veya kategori ara..."
            />
            <button type="submit">Ara</button>
          </form>
        </div>

        {loading ? (
          <div className="search-spinner" />
        ) : books.length === 0 ? (
          <div className="search-empty-card">
            <div className="search-empty-monogram">S.</div>
            <p className="search-empty">
              {query
                ? `"${query}" ile eşleşen bir eser bulunamadı.`
                : "Aramak istediğiniz kelimeyi yukarıdaki alana yazın."}
            </p>
          </div>
        ) : (
          <div className="search-grid">
            {books.map((book) => (
              <div
                key={book.id}
                className="search-book-card"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div className="search-book-cover-wrap">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="search-book-cover" />
                  ) : (
                    <div className="search-book-placeholder">
                      <span>S.</span>
                    </div>
                  )}
                  <div className="book-cover-spine" />
                  <div className="book-cover-page-edge" />
                  {book.category && (
                    <span className="search-book-cat">{book.category}</span>
                  )}
                </div>
                <div className="search-book-title">{book.title}</div>
                {book.author_username && (
                  <div className="search-book-author">✦ {book.author_username}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
