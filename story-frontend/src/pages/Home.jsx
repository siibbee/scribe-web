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
  const [booksLoading, setBooksLoading]       = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [authorsLoading, setAuthorsLoading]   = useState(true);
  const [showAllLatest, setShowAllLatest]     = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredBooks = selectedCategory === "all"
    ? books
    : books.filter((b) => {
        if (!b.category) return false;
        const cat = b.category.toLowerCase().trim();
        const target = selectedCategory.toLowerCase().trim();
        if (cat === target) return true;
        if (selectedCategory === "Gizem / Gerilim" && cat.includes("gizem")) return true;
        if (selectedCategory === "Aksiyon / Macera" && (cat.includes("aksiyon") || cat.includes("macera"))) return true;
        if (selectedCategory === "Hayran Kurgu (Fanfiction)" && cat.includes("hayran")) return true;
        if (selectedCategory === "Kısa Hikaye / Şiir" && (cat.includes("kısa") || cat.includes("şiir") || cat.includes("siir"))) return true;
        return false;
      });

  // Haftanın Öne Çıkanı: En çok okunan (read_count) veya en zengin içerikli (chapter_count) kitap
  const featuredBook = books.length > 0
    ? [...books].sort((a, b) => {
        const readsA = Number(a.read_count) || 0;
        const readsB = Number(b.read_count) || 0;
        if (readsB !== readsA) return readsB - readsA;
        return (Number(b.chapter_count) || 0) - (Number(a.chapter_count) || 0);
      })[0]
    : null;

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

      {/* HERO BANNER */}
      <section className="hero-banner-section">
        <div className="hero-banner">
          {/* Ambient Glows */}
          <div className="banner-glow banner-glow-left" />
          <div className="banner-glow banner-glow-right" />

          {/* Banner Sol İçerik */}
          <div className="hero-banner-content">
            <div className="banner-badge">
              <span className="badge-dot" /><span>Edebiyat ve Özgür Kalemler Topluluğu</span>
            </div>

            <h1 className="banner-title">
              Yeni Hikayelerin <span className="banner-title-gradient">Başlangıç Noktası</span>
            </h1>

            <p className="banner-desc">
              Okuyun, yazın ve hikayenizi paylaşın. Kütüphanenize ekleyin ve
              dilediğiniz zaman ücretsiz okuyun.
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
                    const lib = document.querySelector(".library");
                    if (lib) lib.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Kütüphaneyi Keşfet
                </button>
              )}
            </div>
          </div>

          {/* Banner Sağ Görsel Vitrin */}
          <div className="hero-banner-showcase">
            <div className="showcase-card-wrapper">
              <div className="showcase-card-glow" />

              {featuredBook ? (
                <div
                  className="showcase-main-card clickable"
                  onClick={() => navigate(`/books/${featuredBook.id}`)}
                  title={`${featuredBook.title} kitabını incele`}
                >
                  <span className="showcase-pill">Haftanın Öne Çıkanı</span>
                  <div className="showcase-book-body">
                    {featuredBook.cover_url ? (
                      <img
                        src={featuredBook.cover_url}
                        alt={featuredBook.title}
                        className="showcase-book-cover"
                      />
                    ) : (
                      <div className="showcase-book-placeholder">S.</div>
                    )}
                    <div className="showcase-book-details">
                      <h3 className="showcase-book-title">{featuredBook.title}</h3>
                      <p className="showcase-book-author">
                        {featuredBook.author_username || "Scribe Yazarı"}
                      </p>
                      <div className="showcase-tags-wrap">
                        {featuredBook.category && (
                          <span className="showcase-book-tag">{featuredBook.category}</span>
                        )}
                        {Number(featuredBook.read_count) > 0 && (
                          <span className="showcase-reads-tag">{featuredBook.read_count} Okunma</span>
                        )}
                      </div>
                      <div className="showcase-read-prompt">Kitabı İncele →</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="showcase-main-card">
                  <span className="showcase-pill">Keşfet</span>
                  <div className="showcase-book-body">
                    <div className="showcase-book-placeholder">S.</div>
                    <div className="showcase-book-details">
                      <h3 className="showcase-book-title">Sonsuz Sayfalar</h3>
                      <p className="showcase-book-author">Kendi Dünyanı Yarat</p>
                      <span className="showcase-book-tag">Edebiyat</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rozetler */}
              <div className="floating-badge badge-top-right">
                <span className="badge-initial">S.</span>
                <div className="badge-text-group">
                  <span className="badge-head">Özgür Kalemler</span>
                  <span className="badge-sub">Her gün yeni bölüm</span>
                </div>
              </div>

              <div className="floating-badge badge-bottom-left">
                <span className="badge-initial">✦</span>
                <div className="badge-text-group">
                  <span className="badge-head">Keyifli Okuma</span>
                  <span className="badge-sub">Sıcak edebi deneyim</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KÜTÜPHANE */}
      <section className="library" id="library-section">
        <div className="library-header-row">
          <div>
            <h2>Kütüphane</h2>
            <p className="library-subtitle">İlgi alanına uygun hikayeleri ve dünyaları keşfet</p>
          </div>
          {selectedCategory !== "all" && (
            <button
              type="button"
              className="clear-category-filter-btn"
              onClick={() => setSelectedCategory("all")}
            >
              Filtreyi Temizle ({filteredBooks.length} kitap)
            </button>
          )}
        </div>

        {/* Kategori Çipleri (Tür Filtresi) */}
        <div className="category-chips-scroll">
          {CATEGORY_ITEMS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = cat.id === "all"
              ? books.length
              : books.filter((b) => {
                  if (!b.category) return false;
                  const c = b.category.toLowerCase().trim();
                  const target = cat.id.toLowerCase().trim();
                  if (c === target) return true;
                  if (cat.id === "Gizem / Gerilim" && c.includes("gizem")) return true;
                  if (cat.id === "Aksiyon / Macera" && (c.includes("aksiyon") || c.includes("macera"))) return true;
                  if (cat.id === "Hayran Kurgu (Fanfiction)" && c.includes("hayran")) return true;
                  if (cat.id === "Kısa Hikaye / Şiir" && (c.includes("kısa") || c.includes("şiir") || c.includes("siir"))) return true;
                  return false;
                }).length;

            return (
              <button
                key={cat.id}
                type="button"
                className={`category-chip ${isActive ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
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
            <div className="category-empty-icon">✦</div>
            <h4>Bu kategoride henüz kitap yok</h4>
            <p>
              "{CATEGORY_ITEMS.find((c) => c.id === selectedCategory)?.label || selectedCategory}" türünde ilk hikayeyi sen yazarak topluluğa öncülük edebilirsin!
            </p>
            <button type="button" className="category-empty-btn" onClick={handleStartWriting}>
              Bu Türde İlk Hikayeyi Yaz
            </button>
          </div>
        ) : (
          <div className="book-slider">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="book-card"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div className="book-card-cover-wrap">
                  {featuredBook && book.id === featuredBook.id && (
                    <span className="featured-week-card-badge" title="En çok okunan ve etkileşim alan kitap">
                      Haftanın Öne Çıkanı
                    </span>
                  )}
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="book-cover-img" />
                  ) : (
                    <div className="book-cover-placeholder">S.</div>
                  )}
                  {book.category && (
                    <span className="book-card-category-badge">{book.category}</span>
                  )}
                </div>

                <div className="book-card-details">
                  <h3 className="book-card-title" title={book.title}>{book.title}</h3>
                  <p className="book-card-author" title={book.author_username || "Anonim"}>
                    <span>{book.author_username || "Anonim"}</span>
                  </p>
                  <div className="book-card-footer">
                    <span className="book-card-chapters">
                      {book.chapter_count ? `${book.chapter_count} Bölüm` : "0 Bölüm"}
                    </span>
                    {Number(book.read_count) > 0 && (
                      <span className="book-card-reads" title={`${book.read_count} kez okundu`}>
                        {book.read_count} okuma
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ÖNE ÇIKAN YAZARLAR */}
      <section className="featured-authors">
        <div className="section-header-row">
          <div>
            <h2>Öne Çıkan Yazarlar</h2>
            <p className="section-subtitle">Hikayeleriyle ilham veren yetenekli kalemleri keşfedin</p>
          </div>
          <button className="view-all-authors-btn" onClick={() => navigate("/authors")}>
            Tümünü Gör →
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
                    <div className={`author-avatar-circle avatar-gradient-${index % 5}`}>
                      <span>{initial}</span>
                    </div>
                    {index < 3 && (
                      <span className="author-top-badge" title="Öne Çıkan Yazar">★</span>
                    )}
                  </div>
                  <h4 className="author-strip-name" title={author.username}>{author.username}</h4>
                  <span className="author-strip-books">
                    {author.book_count || 1} Kitap
                  </span>
                  <span className="author-strip-link">Profili Gör →</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* EN SON EKLENENLER */}
      <section className="latest">
        <div className="section-header-row">
          <div>
            <h2>En Son Eklenenler</h2>
            <p className="section-subtitle">Topluluğun yeni yayınlanan en taze bölümlerini keşfedin</p>
          </div>
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
                  </div>

                  <div className="latest-card-content">
                    <div className="latest-card-meta">
                      {chapter.book_category && (
                        <span className="latest-card-category">{chapter.book_category}</span>
                      )}
                      <span className="latest-card-date">
                        {formatDate(chapter.created_at)}
                      </span>
                    </div>

                    <h3 className="latest-card-title" title={chapter.chapter_title}>
                      {chapter.chapter_title}
                    </h3>

                    <p className="latest-card-book-title" title={chapter.book_title}>
                      <span>{chapter.book_title}</span>
                    </p>

                    <div className="latest-card-action">
                      <span>Bölümü Oku</span>
                      <span className="latest-arrow">→</span>
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

      {/* MOBİL UYGULAMA VİTRİNİ (GOOGLE PLAY ÇOK YAKINDA) */}
      <section className="mobile-app-section">
        <div className="mobile-app-card">
          <div className="app-card-glow-left" />
          <div className="app-card-glow-right" />

          <div className="mobile-app-grid">
            {/* Sol İçerik */}
            <div className="mobile-app-content">
              <div className="mobile-app-badge">
                <span className="mobile-badge-dot" />
                <span>Çok Yakında Google Play'de</span>
              </div>

              <h2 className="mobile-app-title">
                Scribe Deneyimi Artık <span className="mobile-title-highlight">Cebinizde</span>
              </h2>

              <p className="mobile-app-desc">
                Favori yazarlarınızın yeni bölümlerini kaçırmayın. Metroda, otobüste veya kahvenizi yudumlarken göz yormayan edebi okuma modu ve anlık bildirimlerle hikayelerin içine dalın.
              </p>

              {/* Özellik Maddeleri */}
              <div className="mobile-feature-list">
                <div className="mobile-feature-item">
                  <span className="feature-icon-svg">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </span>
                  <div>
                    <h4>Yeni Bölüm Bildirimleri</h4>
                    <p>Takip ettiğin kitaplara yeni bölüm geldiğinde ilk sen oku</p>
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
                    <h4>Sıcak Kağıt & Gece Modu</h4>
                    <p>Gözü yormayan sıcak Terracotta edebi okuma deneyimi</p>
                  </div>
                </div>

                <div className="mobile-feature-item">
                  <span className="feature-icon-svg">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                    </svg>
                  </span>
                  <div>
                    <h4>İlham Geldiğinde Yaz</h4>
                    <p>Telefondan anında taslak oluştur ve yayınla</p>
                  </div>
                </div>
              </div>

              {/* Google Play Rozeti */}
              <div className="mobile-app-cta-wrap">
                <div className="google-play-badge-button" title="Google Play'de Çok Yakında">
                  <svg className="gp-icon" viewBox="0 0 24 24" width="28" height="28">
                    <path fill="#4285F4" d="M3.6 1.7L13.8 12 3.6 22.3c-.4-.3-.6-.8-.6-1.5V3.2c0-.7.2-1.2.6-1.5z"/>
                    <path fill="#FBBC05" d="M17.2 8.6L13.8 12l3.4 3.4 3.9-2.2c1.3-.7 1.3-2 0-2.8l-3.9-1.8z"/>
                    <path fill="#34A853" d="M3.6 22.3l10.2-10.3 3.4 3.4-11.8 6.6c-.6.3-1.2.3-1.8.3z"/>
                    <path fill="#EA4335" d="M3.6 1.7c.6 0 1.2 0 1.8.3l11.8 6.6-3.4 3.4L3.6 1.7z"/>
                  </svg>
                  <div className="gp-text">
                    <span className="gp-sub">ÇOK YAKINDA</span>
                    <span className="gp-main">Google Play</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Görsel: Premium Akıllı Telefon Çerçevesi Mockup */}
            <div className="mobile-app-visual">
              <div className="phone-mockup-frame">
                <div className="phone-notch">
                  <div className="phone-camera" />
                  <div className="phone-speaker" />
                </div>

                <div className="phone-screen-content">
                  <div className="phone-app-header">
                    <span className="phone-brand">Scribe</span>
                    <span className="phone-time">10:42</span>
                  </div>

                  <div className="phone-notif-bubble">
                    <div className="phone-notif-avatar">S.</div>
                    <div className="phone-notif-text">
                      <span className="phone-notif-title">Yeni Bölüm Yayında</span>
                      <span className="phone-notif-desc">Gecenin Külleri • 3. Bölüm</span>
                    </div>
                  </div>

                  <div className="phone-book-preview">
                    <div className="phone-book-cover-mock">
                      <span className="phone-book-letter">S.</span>
                    </div>
                    <div className="phone-book-meta">
                      <h5>Gecenin Külleri</h5>
                      <p>Scribe Yazar</p>
                      <span className="phone-read-pill">Okumaya Devam Et →</span>
                    </div>
                  </div>

                  <div className="phone-bottom-nav">
                    <span>Ana Sayfa</span>
                    <span>Keşfet</span>
                    <span>Yaz</span>
                    <span>Profil</span>
                  </div>
                </div>
              </div>

              <div className="phone-floating-pill pill-top">
                <span>5.0 Kusursuz Deneyim</span>
              </div>
              <div className="phone-floating-pill pill-bottom">
                <span>Kesintisiz Hızlı Okuma</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
