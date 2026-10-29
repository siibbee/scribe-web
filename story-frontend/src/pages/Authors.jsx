import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "./authors.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    const fetchAuthors = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/users?has_book=true`,
          { signal: controller.signal }
        );
        setAuthors(response.data);
        setLoading(false);
      } catch (err) {
        if (err.name !== "CanceledError") {
          setError("Yazarlar yüklenirken bir hata oluştu.");
          setLoading(false);
          console.error(err);
        }
      }
    };

    fetchAuthors();

    return () => controller.abort();
  }, []);

  return (
    <div className="authors-page">
      <div className="authors-container">
        <div className="authors-editorial-header">
          <span className="authors-eyebrow">✦ YAZARLAR LONCASI</span>
          <h1 className="authors-title">Scribe Yazarları</h1>
          <p className="authors-subtitle">
            Orijinal dünyalar kuran, kelimeleriyle ilham veren Scribe hikaye anlatıcılarını keşfedin.
          </p>
        </div>

        {loading && (
          <div className="authors-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="author-card skeleton-card">
                <div className="skeleton-avatar" />
                <div className="skeleton-text" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="authors-error">{error}</div>
        )}

        {!loading && !error && authors.length === 0 && (
          <div className="authors-loading">Henüz yazar bulunamadı.</div>
        )}

        {!loading && !error && authors.length > 0 && (
          <div className="authors-grid">
            {authors.map((author) => {
              const displayName = author.username || "Bilinmeyen Yazar";
              const initial = displayName.charAt(0).toUpperCase();
              return (
                <div
                  key={author.id}
                  className="author-card"
                  onClick={() => navigate(`/author/${author.id}`)}
                >
                  <div className="author-avatar-ring">
                    <div className="author-avatar-circle">
                      <span>{initial}</span>
                    </div>
                  </div>
                  <h3 className="author-name">{displayName}</h3>
                  <span className="author-badge">
                    {author.book_count ? `${author.book_count} Eser` : "✦ Scribe Yazarı"}
                  </span>
                  <span className="author-cta">Eserleri İncele →</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
