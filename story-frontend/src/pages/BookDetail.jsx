import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getBookById,
  getChaptersByBook
} from "../services/bookService";
import "./bookDetail.css";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, requireAuth } = useContext(AuthContext);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getBookById(id)
      .then(({ data }) => {
        setBook(data);
      })
      .catch(() => setError("Kitap bulunamadı."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setChaptersLoading(true);
    getChaptersByBook(id)
      .then(({ data }) => setChapters(data))
      .catch(() => {})
      .finally(() => setChaptersLoading(false));
  }, [id]);

  const handleReadChapter = (chapterId) => {
    const targetPath = `/books/${id}/read/${chapterId}`;
    requireAuth({
      type: "read",
      title: "Kitabı Okumak İçin Giriş Yapın",
      message: `"${book?.title || 'Bu'}" kitabının bölümlerini okuyabilmek için lütfen giriş yapınız veya ücretsiz kayıt olunuz.`,
      targetPath,
      onAuthorized: () => navigate(targetPath),
    });
  };

  if (loading) return <div className="bd-loading"><div className="bd-spinner" /></div>;
  if (error)   return <div className="bd-loading"><p className="bd-error-text">{error}</p></div>;

  return (
    <div className="bd-page">
      <div className="bd-container">

        {/* Sol: Kapak */}
        <div className="bd-cover-col">
          <div className="bd-cover-wrap">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="bd-cover-img" />
            ) : (
              <div className="bd-cover-placeholder">S.</div>
            )}
          </div>
        </div>

        {/* Sağ: Bilgi */}
        <div className="bd-info-col">
          <div className="bd-meta-badges">
            {book.category && <span className="bd-category">{book.category}</span>}
            {Number(book.read_count) > 0 && (
              <span className="bd-read-badge" title="Toplam Okunma Sayısı">{book.read_count} Okunma</span>
            )}
          </div>
          <h1 className="bd-title">{book.title}</h1>

          {/* Yazar adı */}
          {book.author_username && (
            <p className="bd-author">Yazar: {book.author_username}</p>
          )}

          {/* Hemen Oku Butonu */}
          {chapters.length > 0 && (
            <button
              className="bd-read-cta-btn"
              onClick={() => handleReadChapter(chapters[0].id)}
            >
              Hemen Okumaya Başla ({chapters[0].title || '1. Bölüm'})
            </button>
          )}

          <div className="bd-section">
            <h3 className="bd-section-title">Açıklama</h3>
            <p className="bd-description">{book.description || "Açıklama eklenmemiş."}</p>
          </div>

          <div className="bd-section">
            <div className="bd-section-header">
              <h3 className="bd-section-title">Bölümler ({chapters.length})</h3>
            </div>

            {chaptersLoading ? (
              <div className="bd-chapters-empty"><div className="bd-spinner bd-spinner-sm" /></div>
            ) : chapters.length === 0 ? (
              <div className="bd-chapters-empty"><p>Henüz bölüm eklenmedi.</p></div>
            ) : (
              <div className="bd-chapter-list">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="bd-chapter-item"
                    onClick={() => handleReadChapter(chapter.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="bd-chapter-left">
                      <span className="bd-chapter-num">{chapter.order_number}</span>
                      <span className="bd-chapter-title">{chapter.title}</span>
                    </div>
                    <span className="bd-chapter-read-action">Oku →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
