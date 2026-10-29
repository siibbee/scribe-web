import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "./authorDetail.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
        const [authorRes, booksRes] = await Promise.all([
          axios.get(`${API_BASE}/api/users/${id}`, { signal: controller.signal }),
          axios.get(`${API_BASE}/api/books/my-books/${id}`, { signal: controller.signal }),
        ]);

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
          <div className="author-header-card">
            <div className="skeleton-text skeleton-title" />
            <div className="skeleton-text skeleton-subtitle" />
          </div>
          <div className="books-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="book-card skeleton-card-book">
                <div className="book-cover skeleton-bg" />
                <div className="skeleton-text skeleton-book-title" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="author-detail-page">
        <div className="author-detail-container">
          <div className="author-error">{error}</div>
        </div>
      </div>
    );
  }

  const displayName = author?.username || "Scribe Yazarı";
  const initial = displayName.charAt(0).toUpperCase();
  const totalReads = books.reduce((sum, b) => sum + Number(b.read_count || 0), 0);

  return (
    <div className="author-detail-page">
      <div className="author-detail-container">
        <button className="author-back-btn" onClick={() => navigate("/authors")}>
          ← Yazarlar Loncasına Dön
        </button>

        {/* Yazar Profil Kartı */}
        <div className="author-header-card">
          <div className="author-detail-avatar-ring">
            <div className="author-detail-avatar-circle">
              <span>{initial}</span>
            </div>
          </div>
          <span className="author-detail-eyebrow">✦ SCRIBE YAZARI</span>
          <h2>{displayName}</h2>
          <div className="author-detail-stats">
            <span className="author-stat-chip">
              <strong>{books.length}</strong> Yayınlanmış Eser
            </span>
            <span className="author-stat-chip">
              <strong>{totalReads}</strong> Okunma
            </span>
          </div>
        </div>

        {/* Kitaplar */}
        <div className="author-books-section-head">
          <span className="author-books-eyebrow">YAZARIN KÜLLİYATI</span>
          <h3>Yayınlanan Eserler</h3>
        </div>

        {books.length > 0 ? (
          <div className="books-grid">
            {books.map((book) => (
              <div
                key={book.id}
                className="book-card"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div className="book-cover">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} />
                  ) : (
                    <div className="no-cover">S.</div>
                  )}
                  <div className="book-cover-spine" />
                  <div className="book-cover-page-edge" />
                  {book.category && (
                    <span className="author-book-cat">{book.category}</span>
                  )}
                </div>
                <div className="author-book-meta">
                  <h3>{book.title}</h3>
                  <span className="author-book-sub">
                    {book.chapter_count || 0} Bölüm • {book.read_count || 0} Okunma
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="author-empty">Bu yazarın henüz yayınlanmış bir kitabı yok.</div>
        )}
      </div>
      <Footer />
    </div>
  );
}
