import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getAllBooks, getLatestChapters, getActiveAuthors } from "../services/bookService";
import Footer from "../components/Footer.jsx";
import "./home.css";

const CATEGORY_ITEMS = [
  { id: "all", label: "Tümü" },
  { id: "Romantizm", label: "Romantizm" },
  { id: "Genç Kurgu", label: "Genç Kurgu" },
  { id: "Fantastik", label: "Fantastik" },
  { id: "Bilim Kurgu", label: "Bilim Kurgu" },
  { id: "Gizem / Gerilim", label: "Gizem & Gerilim" },
  { id: "Korku", label: "Korku" },
  { id: "Aksiyon / Macera", label: "Aksiyon & Macera" },
  { id: "Tarihi Kurgu", label: "Tarihi Kurgu" },
  { id: "Hayran Kurgu (Fanfiction)", label: "Hayran Kurgu" },
  { id: "Mizah", label: "Mizah" },
  { id: "Kısa Hikaye / Şiir", label: "Kısa Hikaye & Şiir" },
  { id: "Rastgele / Diğer", label: "Diğer" },
];

export default function Home() {
  const { user, requireAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [books, setBooks] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_books");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [latestChapters, setLatestChapters] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_latest_chapters");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [authors, setAuthors] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_authors");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [lastRead, setLastRead] = useState(() => {
    try {
      const raw = localStorage.getItem("@scribe_last_read");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [booksLoading, setBooksLoading]       = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [authorsLoading, setAuthorsLoading]   = useState(true);
  const [showAllLatest, setShowAllLatest]     = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [inlineSearch, setInlineSearch]       = useState("");

  const matchesCategory = (book, catId) => {
    if (catId === "all") return true;
    if (!book.category) return false;
    const cat = book.category.toLowerCase().trim();
    const target = catId.toLowerCase().trim();
    if (cat === target) return true;
    if (catId === "Gizem / Gerilim" && cat.includes("gizem")) return true;
    if (catId === "Aksiyon / Macera" && (cat.includes("aksiyon") || cat.includes("macera"))) return true;
    if (catId === "Hayran Kurgu (Fanfiction)" && cat.includes("hayran")) return true;
    if (catId === "Kısa Hikaye / Şiir" && (cat.includes("kısa") || cat.includes("şiir") || cat.includes("siir"))) return true;
    return false;
  };

  const filteredBooks = books.filter((b) => {
    if (!matchesCategory(b, selectedCategory)) return false;
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase().trim();
      const titleMatch = (b.title || "").toLowerCase().includes(q);
      const authorMatch = (b.author_username || "").toLowerCase().includes(q);
      const catMatch = (b.category || "").toLowerCase().includes(q);
      return titleMatch || authorMatch || catMatch;
    }
    return true;
  });

  // Haftanın Öne Çıkanı: En çok okunan (read_count) veya en zengin içerikli (chapter_count) kitap
  const sortedByPopularity = books.length > 0
    ? [...books].sort((a, b) => {
        const readsA = Number(a.read_count) || 0;
        const readsB = Number(b.read_count) || 0;
        if (readsB !== readsA) return readsB - readsA;
        return (Number(b.chapter_count) || 0) - (Number(a.chapter_count) || 0);
      })
    : [];

  const featuredBook = sortedByPopularity[0] || null;

  useEffect(() => {
    getAllBooks()
      .then(({ data }) => {
        setBooks(data);
        try {
          localStorage.setItem("cached_books", JSON.stringify(data));
        } catch (e) {
          console.error("Failed to cache books:", e);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch books:", err);
      })
      .finally(() => setBooksLoading(false));

    getLatestChapters()
      .then(({ data }) => {
        setLatestChapters(data);
        try {
          localStorage.setItem("cached_latest_chapters", JSON.stringify(data));
        } catch (e) {
          console.error("Failed to cache latest chapters:", e);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch latest chapters:", err);
      })
      .finally(() => setChaptersLoading(false));

    getActiveAuthors()
      .then(({ data }) => {
        setAuthors(data);
        try {
          localStorage.setItem("cached_authors", JSON.stringify(data));
        } catch (e) {
          console.error("Failed to cache authors:", e);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch authors:", err);
      })
      .finally(() => setAuthorsLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  const handleStartWriting = () => {
    requireAuth({
      type: "write",
      title: "Hikaye Yazmak İçin Giriş Yapın",
      message: "Kendi hikayenizi yazabilmek ve Scribe'da yayınlayabilmek için lütfen giriş yapınız veya kayıt olunuz.",
      targetPath: "/add-book",
      onAuthorized: () => navigate("/add-book"),
    });
  };

  return (
    <div className="home">
      {/* HERO BANNER — SCRIBE EDİTÖRYAL ESPRESSO VİTRİN */}
      <section className="hero-banner-section">
        <div className="hero-banner">
          <div className="banner-glow banner-glow-left" />
          <div className="banner-glow banner-glow-right" />

          <div className="hero-banner-inner">
            {/* Sol İçerik */}
            <div className="hero-banner-content">
              <div className="banner-badge">
                <span className="badge-monogram">S.</span>
                <span>EDEBİYAT VE ÖZGÜR KALEMLER TOPLULUĞU</span>
              </div>

              <h1 className="banner-title">
                Yeni Hikayelerin <span className="banner-title-gradient">Başlangıç Noktası</span>
              </h1>

              <p className="banner-desc">
                Sıcak parşömen dokusunda okuyun, ilham geldiğinde yazın ve eserlerinizi Scribe okurlarıyla paylaşın. Web ve mobil uygulamamızda kaldığınız yerden kesintisiz devam edin.
              </p>

              <div className="banner-actions">
                <button className="banner-btn-primary" onClick={handleStartWriting}>
                  <span>Hikaye Yazmaya Başla</span>
                  <span className="btn-arrow">→</span>
                </button>

                {!user ? (
                  <button className="banner-btn-secondary" onClick={() => navigate("/login")}>
                    Giriş Yap
                  </button>
                ) : (
                  <button
                    className="banner-btn-secondary"
                    onClick={() => {
                      const lib = document.getElementById("library-section");
                      if (lib) lib.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Kütüphaneyi Keşfet
                  </button>
                )}
              </div>
            </div>

            {/* Sağ Görsel Vitrin (Mobil FeaturedCarousel & ContinueReadingCard Estetiği) */}
            <div className="hero-banner-showcase">
              <div className="showcase-card-wrapper">
                {featuredBook ? (
                  <div
                    className="showcase-main-card clickable"
                    onClick={() => navigate(`/books/${featuredBook.id}`)}
                    title={`${featuredBook.title} kitabını incele`}
                  >
                    <div className="showcase-top-bar">
                      <span className="showcase-pill">★ HAFTANIN ÖNE ÇIKANI</span>
                      <span className="showcase-rank-badge">#1 Seçki</span>
                    </div>

                    <div className="showcase-book-body">
                      <div className="showcase-cover-3d">
                        {featuredBook.cover_url ? (
                          <img
                            src={featuredBook.cover_url}
                            alt={featuredBook.title}
                            className="showcase-book-cover"
                          />
                        ) : (
                          <div className="showcase-book-placeholder">S.</div>
                        )}
                        <div className="book-cover-spine" />
                        <div className="book-cover-page-edge" />
                      </div>

                      <div className="showcase-book-details">
                        <div className="showcase-tags-wrap">
                          {featuredBook.category && (
                            <span className="showcase-book-tag">{featuredBook.category}</span>
                          )}
                        </div>

                        <h3 className="showcase-book-title">{featuredBook.title}</h3>

                        <p className="showcase-book-author">
                          <span className="feather-sig">✦</span>{" "}
                          {featuredBook.author_username || "Scribe Yazarı"}
                        </p>

                        {featuredBook.description && (
                          <p className="showcase-book-summary">
                            {featuredBook.description}
                          </p>
                        )}

                        <div className="showcase-metrics-footer">
                          <span className="showcase-metric-item">
                            <strong>{featuredBook.chapter_count || 0}</strong> Bölüm
                          </span>
                          <span className="showcase-metric-dot">•</span>
                          <span className="showcase-metric-item">
                            <strong>{featuredBook.read_count || 0}</strong> Okunma
                          </span>
                          <span className="showcase-read-prompt">İncele →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="showcase-main-card">
                    <div className="showcase-top-bar">
                      <span className="showcase-pill">★ EDİTÖRYAL VİTRİN</span>
                    </div>
                    <div className="showcase-book-body">
                      <div className="showcase-cover-3d">
                        <div className="showcase-book-placeholder">S.</div>
                        <div className="book-cover-spine" />
                        <div className="book-cover-page-edge" />
                      </div>
                      <div className="showcase-book-details">
                        <span className="showcase-book-tag">Edebiyat</span>
                        <h3 className="showcase-book-title">Sonsuz Sayfalar</h3>
                        <p className="showcase-book-author">✦ Kendi Dünyanı Yarat</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Yüzen Editöryal Rozetler */}
                <div className="floating-badge badge-top-right">
                  <span className="badge-initial">S.</span>
                  <div className="badge-text-group">
                    <span className="badge-head">Özgür Kalemler</span>
                    <span className="badge-sub">Web & Mobil Senkron</span>
                  </div>
                </div>

                <div className="floating-badge badge-bottom-left">
                  <span className="badge-initial">✦</span>
                  <div className="badge-text-group">
                    <span className="badge-head">Sıcak Parşömen</span>
                    <span className="badge-sub">Göz yormayan okuma</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OKUMA MASAN (Mobil Uygulamadaki ContinueReadingCard Bileşeninin Web Karşılığı) */}
      {lastRead && lastRead.bookId && (
        <section className="reading-desk-section">
          <div className="reading-desk-header">
            <div className="eyebrow-row">
              <span className="eyebrow-icon-box">✦</span>
              <span className="eyebrow-label">OKUMA MASAN</span>
            </div>
            <span className="reading-desk-last-pill">Son okuduğun eser</span>
          </div>

          <div
            className="reading-desk-card"
            onClick={() =>
              navigate(
                lastRead.chapterId
                  ? `/books/${lastRead.bookId}/read/${lastRead.chapterId}`
                  : `/books/${lastRead.bookId}`
              )
            }
          >
            <div className="reading-desk-cover-wrap">
              {lastRead.coverUrl ? (
                <img src={lastRead.coverUrl} alt={lastRead.bookTitle} />
              ) : (
                <div className="reading-desk-cover-placeholder">S.</div>
              )}
              <div className="book-cover-spine" />
              <div className="book-cover-page-edge" />
            </div>

            <div className="reading-desk-info">
              <div className="reading-desk-top">
                <div>
                  <h3 className="reading-desk-title">{lastRead.bookTitle}</h3>
                  <p className="reading-desk-author">{lastRead.authorName || "Scribe Yazarı"}</p>
                </div>
                <span className="reading-desk-chapter-pill">
                  {lastRead.chapterTitle || `Bölüm ${lastRead.chapterOrder || 1}`}
                </span>
              </div>

              <div className="reading-desk-progress-row">
                <div className="reading-desk-progress-labels">
                  <span className="reading-desk-percent">
                    %{lastRead.progressPercent || 100} ilerleme
                  </span>
                  {lastRead.totalChapters > 0 && (
                    <span className="reading-desk-fraction">
                      Bölüm {lastRead.chapterOrder || 1} / {lastRead.totalChapters}
                    </span>
                  )}
                </div>
                <div className="reading-desk-track">
                  <div
                    className="reading-desk-fill"
                    style={{ width: `${lastRead.progressPercent || 100}%` }}
                  />
                </div>
              </div>

              <div className="reading-desk-actions">
                <button type="button" className="reading-desk-resume-btn">
                  <span>Kaldığın Yerden Devam Et</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* KÜTÜPHANE & EDİTÖRYAL VİTRİN */}
      <section className="library" id="library-section">
        <div className="library-header-row">
          <div>
            <div className="eyebrow-row">
              <span className="eyebrow-icon-box">✦</span>
              <span className="eyebrow-label">EDİTÖRYAL VİTRİN</span>
            </div>
            <h2>Kütüphane & Seçki</h2>
            <p className="library-subtitle">İlgi alanına uygun hikayeleri ve dünyaları keşfet</p>
          </div>

          <div className="library-header-right">
            {(selectedCategory !== "all" || inlineSearch.trim() !== "") && (
              <button
                type="button"
                className="clear-category-filter-btn"
                onClick={() => {
                  setSelectedCategory("all");
                  setInlineSearch("");
                }}
              >
                Filtreyi Temizle ({filteredBooks.length} eser)
              </button>
            )}
            <span className="section-count-pill">{filteredBooks.length} Eser</span>
          </div>
        </div>

        {/* Mobil Uygulamadaki CategoryChips Arama + Kategori Çubuğu */}
        <div className="editorial-filter-bar">
          <div className="editorial-search-box">
            <span className="editorial-search-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="editorial-search-input"
              placeholder="Eser, yazar veya edebi tür ara..."
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
            />
            {inlineSearch.length > 0 && (
              <button
                type="button"
                className="editorial-search-clear"
                onClick={() => setInlineSearch("")}
                aria-label="Aramayı Temizle"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Kategori Çipleri */}
        <div className="category-chips-scroll">
          {CATEGORY_ITEMS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = books.filter((b) => matchesCategory(b, cat.id)).length;

            return (
              <button
                key={cat.id}
                type="button"
                className={`category-chip ${isActive ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {isActive && <span className="chip-active-dot" />}
                <span className="chip-label">{cat.label}</span>
                {count > 0 && <span className="chip-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {booksLoading && books.length === 0 ? (
          <div className="home-spinner-wrap">
            <div className="home-spinner" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="category-empty-state">
            <div className="category-empty-icon">S.</div>
            <h4>Bu filtrede henüz eser bulunamadı</h4>
            <p>
              {inlineSearch.trim()
                ? `"${inlineSearch}" aramasıyla eşleşen bir kitap bulamadık.`
                : `"${CATEGORY_ITEMS.find((c) => c.id === selectedCategory)?.label || selectedCategory}" türünde ilk hikayeyi sen yazarak topluluğa öncülük edebilirsin!`}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {(selectedCategory !== "all" || inlineSearch.trim()) && (
                <button
                  type="button"
                  className="clear-category-filter-btn"
                  onClick={() => {
                    setSelectedCategory("all");
                    setInlineSearch("");
                  }}
                >
                  Tüm Eserleri Göster
                </button>
              )}
              <button type="button" className="category-empty-btn" onClick={handleStartWriting}>
                Yeni Eser Yaz
              </button>
            </div>
          </div>
        ) : (
          <div className="book-slider">
            {filteredBooks.map((book) => {
              const popIndex = sortedByPopularity.findIndex((b) => b.id === book.id);
              const isTopPick = popIndex >= 0 && popIndex < 3;

              return (
                <div
                  key={book.id}
                  className="book-card"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <div className="book-card-cover-wrap">
                    {featuredBook && book.id === featuredBook.id ? (
                      <span className="featured-week-card-badge" title="En çok okunan ve etkileşim alan kitap">
                        #1 Haftanın Seçkisi
                      </span>
                    ) : isTopPick ? (
                      <span className="book-rank-badge">#{popIndex + 1} Seçki</span>
                    ) : null}

                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="book-cover-img" />
                    ) : (
                      <div className="book-cover-placeholder">S.</div>
                    )}
                    <div className="book-cover-spine" />
                    <div className="book-cover-page-edge" />
                  </div>

                  <div className="book-card-details">
                    {book.category && (
                      <div className="book-card-genre-row">
                        <span className="book-card-genre-pill">
                          {book.category.split("/")[0].trim()}
                        </span>
                      </div>
                    )}

                    <h3 className="book-card-title" title={book.title}>{book.title}</h3>

                    <p className="book-card-author" title={book.author_username || "Anonim"}>
                      <span className="author-feather">✦</span>
                      <span>{book.author_username || "Anonim"}</span>
                    </p>

                    <div className="book-card-footer">
                      <span className="book-card-chapters">
                        {book.chapter_count ? `${book.chapter_count} Bölüm` : "0 Bölüm"}
                      </span>
                      <span className="book-card-reads" title={`${book.read_count || 0} kez okundu`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{book.read_count || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ÖNE ÇIKAN YAZARLAR */}
      <section className="featured-authors">
        <div className="featured-authors-inner">
          <div className="section-header-row">
            <div>
              <div className="eyebrow-row">
                <span className="eyebrow-icon-box">✦</span>
                <span className="eyebrow-label">YAZARLAR LONCASI</span>
              </div>
              <h2>Öne Çıkan Yazarlar</h2>
              <p className="section-subtitle">Hikayeleriyle ilham veren yetenekli kalemleri keşfedin</p>
            </div>
            <button className="view-all-authors-btn" onClick={() => navigate("/authors")}>
              Tümünü Gör ↗
            </button>
          </div>

          {authorsLoading && authors.length === 0 ? (
            <div className="home-spinner-wrap">
              <div className="home-spinner" />
            </div>
          ) : authors.length === 0 ? (
            <p className="home-empty">Henüz yazar bulunmuyor.</p>
          ) : (
            <div className="authors-slider">
              {authors.map((author, index) => {
                const initial = (author.username || "Y")[0].toUpperCase();
                return (
                  <div
                    key={author.id}
                    className="author-strip-card"
                    onClick={() => navigate(`/author/${author.id}`)}
                  >
                    <div className="author-avatar-wrap">
                      <div className="author-avatar-ring">
                        <div className={`author-avatar-circle avatar-gradient-${index % 5}`}>
                          <span>{initial}</span>
                        </div>
                      </div>
                      {index < 3 && (
                        <span className="author-top-badge" title="Öne Çıkan Yazar">★</span>
                      )}
                    </div>
                    <h4 className="author-strip-name" title={author.username}>{author.username}</h4>
                    <span className="author-strip-books">
                      {author.book_count || 1} Eser
                    </span>
                    <span className="author-strip-link">Profili Gör →</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* EN SON EKLENENLER (Mobil Uygulamadaki LatestStoriesList "KEŞİF RAFI" İle Birebir) */}
      <section className="latest">
        <div className="section-header-row">
          <div>
            <div className="eyebrow-row">
              <span className="eyebrow-icon-box">✦</span>
              <span className="eyebrow-label">KEŞİF RAFI</span>
            </div>
            <h2>En Son Eklenen Bölümler</h2>
            <p className="section-subtitle">Topluluğun yeni yayınlanan en taze bölümlerini keşfedin</p>
          </div>
          {latestChapters.length > 0 && (
            <span className="section-count-pill">{latestChapters.length} Bölüm</span>
          )}
        </div>

        {chaptersLoading && latestChapters.length === 0 ? (
          <div className="home-spinner-wrap">
            <div className="home-spinner" />
          </div>
        ) : latestChapters.length === 0 ? (
          <p className="home-empty">Henüz bölüm eklenmedi.</p>
        ) : (
          <>
            <div className="latest-grid">
              {(showAllLatest ? latestChapters : latestChapters.slice(0, 6)).map((chapter) => (
                <div
                  key={chapter.id}
                  className="latest-card"
                  onClick={() => navigate(`/books/${chapter.book_id}`)}
                >
                  <div className="latest-card-cover-wrap">
                    {chapter.book_cover_url ? (
                      <img
                        src={chapter.book_cover_url}
                        alt={chapter.book_title}
                        className="latest-card-cover"
                      />
                    ) : (
                      <div className="latest-card-placeholder">S.</div>
                    )}
                    <div className="book-cover-spine" />
                    <div className="book-cover-page-edge" />
                  </div>

                  <div className="latest-card-content">
                    <div>
                      <div className="latest-card-meta">
                        {chapter.book_category && (
                          <span className="latest-card-category">
                            {chapter.book_category.split("/")[0].trim()}
                          </span>
                        )}
                        <span className="latest-card-date">
                          {formatDate(chapter.created_at)}
                        </span>
                      </div>

                      <h3 className="latest-card-title" title={chapter.chapter_title}>
                        {chapter.chapter_title}
                      </h3>

                      <p className="latest-card-book-title" title={chapter.book_title}>
                        <span className="author-feather">✦</span>
                        <span>{chapter.book_title}</span>
                      </p>
                    </div>

                    <div className="latest-card-bottom">
                      <span className="latest-card-action">Bölümü Oku</span>
                      <span className="latest-open-arrow-pill">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!showAllLatest && latestChapters.length > 6 && (
              <div className="show-more-wrap">
                <button
                  className="show-more-btn"
                  onClick={() => setShowAllLatest(true)}
                >
                  Daha Fazla Göster ({latestChapters.length - 6} Yeni Bölüm)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* MOBİL UYGULAMA VİTRİNİ (GOOGLE PLAY) */}
      <section className="mobile-app-section">
        <div className="mobile-app-card">
          <div className="app-card-glow-left" />
          <div className="app-card-glow-right" />

          <div className="mobile-app-grid">
            {/* Sol İçerik */}
            <div className="mobile-app-content">
              <div className="mobile-app-badge">
                <span className="mobile-badge-dot" />
                <span>Scribe Mobil ile Tam Entegre</span>
              </div>

              <h2 className="mobile-app-title">
                Scribe Editöryal Deneyimi <span className="mobile-title-highlight">Cebinizde</span>
              </h2>

              <p className="mobile-app-desc">
                Web sitemiz ve Scribe mobil uygulamamız aynı altyapı ve aynı sıcak parşömen tasarım diliyle çalışır. Web'de başladığınız bir kitaba veya taslağa mobilde kaldığınız yerden devam edin.
              </p>

              <div className="mobile-feature-list">
                <div className="mobile-feature-item">
                  <span className="feature-icon-svg">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </span>
                  <div>
                    <h4>Anlık Yeni Bölüm Bildirimleri</h4>
                    <p>Takip ettiğin kitaplara yeni bölüm geldiğinde telefonuna anında bildirim gelsin</p>
                  </div>
                </div>

                <div className="mobile-feature-item">
                  <span className="feature-icon-svg">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </span>
                  <div>
                    <h4>Sıcak Parşömen & Espresso Gece Modu</h4>
                    <p>Gözü yormayan edebi tipografi ve 3 boyutlu kitap kapağı estetiği</p>
                  </div>
                </div>

                <div className="mobile-feature-item">
                  <span className="feature-icon-svg">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                  </span>
                  <div>
                    <h4>Web & Mobil Senkron Yazar Stüdyosu</h4>
                    <p>İster bilgisayarda ister telefonda bölüm yaz, düzenle ve anında yayınla</p>
                  </div>
                </div>
              </div>

              <div className="mobile-app-cta-wrap">
                <div className="google-play-badge-button" title="Google Play'de Scribe">
                  <svg className="gp-icon" viewBox="0 0 24 24" width="28" height="28">
                    <path fill="#4285F4" d="M3.6 1.7L13.8 12 3.6 22.3c-.4-.3-.6-.8-.6-1.5V3.2c0-.7.2-1.2.6-1.5z"/>
                    <path fill="#FBBC05" d="M17.2 8.6L13.8 12l3.4 3.4 3.9-2.2c1.3-.7 1.3-2 0-2.8l-3.9-1.8z"/>
                    <path fill="#34A853" d="M3.6 22.3l10.2-10.3 3.4 3.4-11.8 6.6c-.6.3-1.2.3-1.8.3z"/>
                    <path fill="#EA4335" d="M3.6 1.7c.6 0 1.2 0 1.8.3l11.8 6.6-3.4 3.4L3.6 1.7z"/>
                  </svg>
                  <div className="gp-text">
                    <span className="gp-sub">ANDROID UYGULAMASI</span>
                    <span className="gp-main">Google Play</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Görsel: Scribe Mobil Uygulama Birebir Ekran Mockup'ı */}
            <div className="mobile-app-visual">
              <div className="phone-mockup-frame">
                <div className="phone-notch">
                  <div className="phone-camera" />
                  <div className="phone-speaker" />
                </div>

                <div className="phone-screen-content">
                  {/* Mobil HomeHeader */}
                  <div className="phone-app-header">
                    <div className="phone-user-row">
                      <div className="phone-avatar-ring">
                        <div className="phone-avatar-circle">S</div>
                      </div>
                      <div>
                        <span className="phone-eyebrow">S. SCRIBE KÜTÜPHANESİ</span>
                        <span className="phone-greeting">Merhaba, Okur</span>
                      </div>
                    </div>
                    <span className="phone-bell-btn">🔔</span>
                  </div>

                  {/* Mobil Okuma Masan (Dark Espresso Card) */}
                  <div className="phone-espresso-card">
                    <div className="phone-espresso-cover">
                      <span>S.</span>
                    </div>
                    <div className="phone-espresso-info">
                      <span className="phone-espresso-tag">OKUMA MASAN</span>
                      <h5>{featuredBook ? featuredBook.title : "Gecenin Külleri"}</h5>
                      <p>{featuredBook ? featuredBook.author_username : "Scribe Yazarı"}</p>
                      <div className="phone-progress-bar">
                        <div className="phone-progress-fill" />
                      </div>
                      <span className="phone-resume-btn">Kaldığın Yerden Devam Et →</span>
                    </div>
                  </div>

                  {/* Mobil Kategori Çipleri */}
                  <div className="phone-chips-row">
                    <span className="phone-chip active">• Tümü</span>
                    <span className="phone-chip">Romantizm</span>
                    <span className="phone-chip">Fantastik</span>
                  </div>

                  {/* Mobil Keşif Rafı Kartı */}
                  <div className="phone-book-preview">
                    <div className="phone-book-cover-mock">
                      <span className="phone-book-letter">S.</span>
                    </div>
                    <div className="phone-book-meta">
                      <span className="phone-genre-mini">ROMAN</span>
                      <h5>Sonsuz Sayfalar</h5>
                      <p>✦ Scribe Kalemi</p>
                    </div>
                  </div>

                  {/* Mobil BottomNavBar */}
                  <div className="phone-bottom-nav">
                    <span className="active">Ana Sayfa</span>
                    <span>Keşfet</span>
                    <span>Yaz</span>
                    <span>Kitaplık</span>
                    <span>Profil</span>
                  </div>
                </div>
              </div>

              <div className="phone-floating-pill pill-top">
                <span>★ Editöryal Lüks Tasarım</span>
              </div>
              <div className="phone-floating-pill pill-bottom">
                <span>✦ Web & Mobil Senkron</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
