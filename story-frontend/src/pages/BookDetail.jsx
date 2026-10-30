import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getBookById,
  getChaptersByBook
} from "../services/bookService";
import Footer from "../components/Footer";
import "./bookDetail.css";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useContext(AuthContext);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [lastReadForBook, setLastReadForBook] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("@scribe_last_read");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (String(parsed.bookId) === String(id)) {
          setLastReadForBook(parsed);
        }
      }
    } catch {}
  }, [id]);

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

  const handleReadChapter = (chapter) => {
    const chapterId = typeof chapter === "object" ? chapter.id : chapter;
    const targetPath = `/books/${id}/read/${chapterId}`;
    requireAuth({
      type: "read",
      title: "Kitabı Okumak İçin Giriş Yapın",
      message: `"${book?.title || "Bu"}" kitabının bölümlerini okuyabilmek için lütfen giriş yapınız veya ücretsiz kayıt olunuz.`,
      targetPath,
      onAuthorized: () => navigate(targetPath),
    });
  };

  if (loading) return <div className="bd-loading"><div className="bd-spinner" /></div>;
  if (error)   return <div className="bd-loading"><p className="bd-error-text">{error}</p></div>;

  const authorInitial = (book.author_username || "S")[0].toUpperCase();
  const resumeChapter = lastReadForBook?.chapterId
    ? chapters.find((c) => String(c.id) === String(lastReadForBook.chapterId))
    : null;

  return (
    <>
      <div className="bd-page">
        <div className="bd-top-nav">
          <button type="button" className="bd-back-pill" onClick={() => navigate(-1)}>
            <span>←</span>
            <span>Kütüphaneye Dön</span>
          </button>
        </div>

        <div className="bd-container">
          {/* Sol: 3B Kitap Kapağı Vitrini */}
          <div className="bd-cover-col">
            <div className="bd-cover-wrap">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="bd-cover-img" />
              ) : (
                <div className="bd-cover-placeholder">S.</div>
              )}
              <div className="bd-cover-spine" />
              <div className="bd-cover-page-edge" />
            </div>

            {/* Semantik İstatistik Kartı */}
            <div className="bd-stats-card">
              <div className="bd-stat-box">
                <span className="bd-stat-value">{chapters.length}</span>
                <span className="bd-stat-label">Bölüm</span>
              </div>
              <div className="bd-stat-divider" />
              <div className="bd-stat-box">
                <span className="bd-stat-value">{book.read_count || 0}</span>
                <span className="bd-stat-label">Okunma</span>
              </div>
            </div>
          </div>

          {/* Sağ: Editöryal Detaylar */}
          <div className="bd-info-col">
            <div className="bd-meta-badges">
              <span className="bd-eyebrow-pill">SCRIBE ESERİ</span>
              {book.category && <span className="bd-category">{book.category}</span>}
              {Number(book.read_count) > 0 && (
                <span className="bd-read-badge" title="Toplam Okunma Sayısı">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{book.read_count} Okunma</span>
                </span>
              )}
            </div>

            <h1 className="bd-title">{book.title}</h1>

            {/* Yazar Profil Kartı */}
            {book.author_username && (
              <div
                className={`bd-author-chip ${book.author_id ? "clickable" : ""}`}
                onClick={() => book.author_id && navigate(`/author/${book.author_id}`)}
                title={book.author_id ? `${book.author_username} profilini gör` : undefined}
              >
                <div className="bd-author-ring">
                  <div className="bd-author-avatar">{authorInitial}</div>
                </div>
                <div className="bd-author-text">
                  <span className="bd-author-label">ESER YAZARI</span>
                  <span className="bd-author-name">{book.author_username}</span>
                </div>
                {book.author_id && <span className="bd-author-arrow">Profili Gör →</span>}
              </div>
            )}

            {/* Hemen Oku / Kaldığın Yerden Devam Et CTA */}
            {chapters.length > 0 && (
              <div className="bd-cta-row">
                {resumeChapter ? (
                  <>
                    <button
                      className="bd-read-cta-btn"
                      onClick={() => handleReadChapter(resumeChapter)}
                    >
                      <span>Kaldığın Yerden Devam Et ({resumeChapter.title || `${resumeChapter.order_number}. Bölüm`})</span>
                      <span>→</span>
                    </button>
                    <button
                      className="bd-read-secondary-btn"
                      onClick={() => handleReadChapter(chapters[0])}
                    >
                      Baştan Oku (1. Bölüm)
                    </button>
                  </>
                ) : (
                  <button
                    className="bd-read-cta-btn"
                    onClick={() => handleReadChapter(chapters[0])}
                  >
                    <span>Hemen Okumaya Başla ({chapters[0].title || "1. Bölüm"})</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            )}

            {/* Hikaye Özeti */}
            <div className="bd-section">
              <div className="bd-section-eyebrow">HİKAYE HAKKINDA</div>
              <h3 className="bd-section-title">Eser Özeti</h3>
              <p className="bd-description">{book.description || "Bu eser için henüz bir açıklama eklenmemiş."}</p>
            </div>

            {/* Bölümler Listesi */}
            <div className="bd-section">
              <div className="bd-section-header">
                <div>
                  <div className="bd-section-eyebrow">İÇİNDEKİLER</div>
                  <h3 className="bd-section-title">Yayınlanan Bölümler</h3>
                </div>
                <span className="bd-chapters-count-pill">{chapters.length} Bölüm</span>
              </div>

              {chaptersLoading ? (
                <div className="bd-chapters-empty"><div className="bd-spinner bd-spinner-sm" /></div>
              ) : chapters.length === 0 ? (
                <div className="bd-chapters-empty">
                  <p>Bu esere henüz bölüm eklenmedi veya bölümleri görmek için giriş yapmanız gerekiyor.</p>
                </div>
              ) : (
                <div className="bd-chapter-list">
                  {chapters.map((chapter) => {
                    const isLastRead = resumeChapter && String(resumeChapter.id) === String(chapter.id);
                    return (
                      <div
                        key={chapter.id}
                        className={`bd-chapter-item ${isLastRead ? "is-last-read" : ""}`}
                        onClick={() => handleReadChapter(chapter)}
                      >
                        <div className="bd-chapter-left">
                          <span className="bd-chapter-num">{chapter.order_number}</span>
                          <div className="bd-chapter-text-wrap">
                            <span className="bd-chapter-title">{chapter.title}</span>
                            {isLastRead && (
                              <span className="bd-last-read-tag">Son Okunan Bölüm</span>
                            )}
                          </div>
                        </div>
                        <span className="bd-chapter-read-action">
                          <span>Bölümü Oku</span>
                          <span className="bd-chapter-arrow-circle">→</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
