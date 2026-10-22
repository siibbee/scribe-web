import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./authorDetail.css";

export default function AuthorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        // Yazar bilgisi
        const authorRes = await axios.get(
          `http://localhost:5000/api/users/${id}`,
          { signal: controller.signal }
        );

        // Kitaplar
        const booksRes = await axios.get(
          `http://localhost:5000/api/books/my-books/${id}`,
          { signal: controller.signal }
        );

        setAuthor(authorRes.data);
        setBooks(booksRes.data);
        setLoading(false);
      } catch (err) {
        if (err.name !== "CanceledError") {
          setError("Veriler yüklenirken hata oluştu.");
          console.error(err);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="author-detail-page">
        <div className="author-detail-container">
          <div className="author-header">
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-subtitle"></div>
          </div>
          <div className="books-grid">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="book-card skeleton-card-book">
                <div className="book-cover skeleton-bg"></div>
                <div className="skeleton-text skeleton-book-title"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="author-detail-page"><div className="error">{error}</div></div>;

  return (
    <div className="author-detail-page">
      <div className="author-detail-container">

        {/* Yazar */}
        <div className="author-header">
          <h2>{author?.username}</h2>
          <p>{books.length} kitap</p>
        </div>

        {/* Kitaplar */}
        <div className="books-grid">
          {books.length > 0 ? (
            books.map((book) => (
              <div 
                key={book.id} 
                className="book-card"
                onClick={() => navigate(`/books/${book.id}`)}
              >

                
                <div className="book-cover">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} />
                  ) : (
                    <div className="no-cover">No Cover</div>
                  )}
                </div>

                
                <h3>{book.title}</h3>

              </div>
            ))
          ) : (
            <p>Bu yazarın henüz kitabı yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}