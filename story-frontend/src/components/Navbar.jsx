import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import "./navbar.css";
import { AuthContext } from "../context/AuthContext.jsx";

function cleanDisplayName(name) {
  if (!name || typeof name !== "string" || !name.trim()) return "Okur";
  let cleaned = name.trim();
  if (cleaned.includes("@")) {
    cleaned = cleaned.split("@")[0].replace(/[._-]/g, " ");
  }
  return cleaned;
}

export default function Navbar() {
  const { user, logout, requireAuth } = useContext(AuthContext);
  const currentUser = user?.user || user;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen]           = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showSearch, setShowSearch]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState(searchParams.get("q") || searchParams.get("search") || "");
  const [theme, setTheme] = useState(() => {
    return (
      document.documentElement.getAttribute("data-theme") ||
      localStorage.getItem("theme") ||
      (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
  });

  const applyTheme = (nextTheme) => {
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body.setAttribute("data-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (e) {}
    setTheme(nextTheme);
  };

  const toggleTheme = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const currentApplied =
      document.documentElement.getAttribute("data-theme") ||
      localStorage.getItem("theme") ||
      theme;
    applyTheme(currentApplied);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/search`);
    }
  };

  const handleAddBookClick = () => {
    setMenuOpen(false);
    requireAuth({
      type: "write",
      title: "Kitap Yazmak İçin Giriş Yapın",
      message: "Kendi hikayenizi yazabilmek ve Scribe'da yayınlayabilmek için giriş yapmanız lazım.",
      targetPath: "/add-book",
      onAuthorized: () => navigate("/add-book"),
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setConfirmLogout(false);
    setMenuOpen(false);
  };

  const displayName = cleanDisplayName(currentUser?.username || currentUser?.name || currentUser?.email);
  const userInitial = displayName.charAt(0).toUpperCase();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          {/* Sol: Menü Butonu & Scribe Marka Monogramı */}
          <div className="header-left-group">
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menüyü Aç"
            >
              <div className={`hamburger ${menuOpen ? "active" : ""}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>

            <div className="logo" onClick={() => navigate("/")} title="Scribe Ana Sayfa">
              <div className="nav-monogram-box">
                <span className="nav-monogram-letter">S.</span>
              </div>
              <div className="nav-brand-stack">
                <span className="nav-brand-eyebrow">HİKAYE & KİTAP</span>
                <span className="nav-logo-text">Scribe</span>
              </div>
            </div>
          </div>

          {/* Orta: Masaüstü Gezinme */}
          <nav className="header-center-nav" aria-label="Ana Gezinme">
            <button
              type="button"
              className={`header-nav-pill ${isActive("/") ? "active" : ""}`}
              onClick={() => navigate("/")}
            >
              Ana Sayfa
            </button>
            <button
              type="button"
              className={`header-nav-pill ${isActive("/authors") || isActive("/author/") ? "active" : ""}`}
              onClick={() => navigate("/authors")}
            >
              Yazarlar
            </button>
            <button
              type="button"
              className={`header-nav-pill header-nav-write ${isActive("/add-book") ? "active" : ""}`}
              onClick={handleAddBookClick}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Kitap Yaz</span>
            </button>
          </nav>

          {/* Sağ: Arama, Tema Değiştirici ve Kullanıcı Profili */}
          <div className="header-right">
            {showSearch ? (
              <form className="nav-search-form" onSubmit={handleSearchSubmit}>
                <SearchIcon className="nav-search-inline-icon" />
                <input
                  type="text"
                  placeholder="Kitap veya yazar ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <CloseIcon
                  className="search-close-icon"
                  onClick={() => setShowSearch(false)}
                />
              </form>
            ) : (
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setShowSearch(true)}
                title="Eser Ara"
                aria-label="Eser Ara"
              >
                <SearchIcon fontSize="small" />
              </button>
            )}

            <button
              type="button"
              id="theme-toggle-btn"
              className="header-icon-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Açık Moda Geç" : "Gece Moduna Geç"}
              aria-label="Tema Değiştir"
            >
              {theme === "dark" ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </button>

            {currentUser ? (
              <button
                type="button"
                className="header-profile-chip"
                onClick={() => navigate("/profile")}
                title="Profilim ve Eserlerim"
              >
                <span className="header-avatar-ring">
                  <span className="header-avatar-circle">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={displayName} />
                    ) : (
                      userInitial
                    )}
                  </span>
                </span>
                <span className="header-profile-name">{displayName}</span>
              </button>
            ) : (
              <button
                type="button"
                className="header-login-btn"
                onClick={() => navigate("/login")}
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </header>

      {/* OVERLAY */}
      <div className={`overlay ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} />

      {/* SIDEBAR (Mobil Uygulama Stili Editöryal Çekmece) */}
      <aside className={`side-menu ${menuOpen ? "open" : ""}`}>
        <div className="side-menu-top">
          <div className="side-brand-row">
            <div className="nav-monogram-box">
              <span className="nav-monogram-letter">S.</span>
            </div>
            <div>
              <span className="side-brand-eyebrow">EDİTÖRYAL PLATFORM</span>
              <div className="side-logo">Scribe</div>
            </div>
          </div>
          <button className="close-btn" onClick={() => setMenuOpen(false)} aria-label="Kapat">
            ✕
          </button>
        </div>

        {/* Kullanıcı Karşılama Kartı (Mobil HomeHeader İle Uyumlu) */}
        <div
          className="side-user-card"
          onClick={() => {
            setMenuOpen(false);
            navigate(currentUser ? "/profile" : "/login");
          }}
        >
          <div className="side-avatar-ring">
            <div className="side-avatar-circle">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={displayName} />
              ) : (
                <span>{currentUser ? userInitial : "S"}</span>
              )}
            </div>
          </div>
          <div className="side-user-meta">
            <span className="side-user-greeting">
              {currentUser ? `Merhaba, ${displayName}` : "Scribe'a Hoş Geldin"}
            </span>
            <span className="side-user-sub">
              {currentUser ? "Profilini ve eserlerini yönet →" : "Okumak ve yazmak için giriş yap →"}
            </span>
          </div>
        </div>

        <div className="new-book-btn" onClick={handleAddBookClick}>
          <span>+ Yeni Kitap Ekle</span>
        </div>

        <div className="side-divider"></div>

        <nav className="side-nav-list">
          <p
            className={isActive("/") ? "active" : ""}
            onClick={() => { setMenuOpen(false); navigate("/"); }}
          >
            <span>Ana Sayfa & Vitrin</span>
            <span className="side-nav-arrow">→</span>
          </p>
          <p
            className={isActive("/authors") ? "active" : ""}
            onClick={() => { setMenuOpen(false); navigate("/authors"); }}
          >
            <span>Yazarlar Loncası</span>
            <span className="side-nav-arrow">→</span>
          </p>
          <p
            className={isActive("/search") ? "active" : ""}
            onClick={() => { setMenuOpen(false); navigate("/search"); }}
          >
            <span>Kütüphanede Ara</span>
            <span className="side-nav-arrow">→</span>
          </p>

          {!user && (
            <>
              <div className="side-divider"></div>
              <p onClick={() => { setMenuOpen(false); navigate("/register"); }}>
                <span>Ücretsiz Üye Ol</span>
                <span className="side-nav-arrow">→</span>
              </p>
              <p onClick={() => { setMenuOpen(false); navigate("/login"); }}>
                <span>Giriş Yap</span>
                <span className="side-nav-arrow">→</span>
              </p>
            </>
          )}

          {user && (
            <>
              <div className="side-divider"></div>
              <p
                className={isActive("/profile") ? "active" : ""}
                onClick={() => { setMenuOpen(false); navigate("/profile"); }}
              >
                <span>Profilim & Kitaplığım</span>
                <span className="side-nav-arrow">→</span>
              </p>
              <p
                className="side-logout-item"
                onClick={() => { setMenuOpen(false); setConfirmLogout(true); }}
              >
                <span>Çıkış Yap</span>
              </p>
            </>
          )}
        </nav>

        {/* Editöryal Tema Değiştirici Bölümü (Açık Parşömen / Gece Espresso) */}
        <div className="side-theme-section">
          <div className="side-theme-card" onClick={toggleTheme} title="Temayı Değiştir">
            <div className="side-theme-meta">
              <span className="side-theme-eyebrow">GÖRÜNÜM TERCİHİ</span>
              <span className="side-theme-title">
                {theme === "dark" ? "Gece Modu" : "Sıcak Parşömen"}
              </span>
            </div>
            <div className={`side-theme-toggle-pill ${theme === "dark" ? "dark" : ""}`}>
              {theme === "dark" ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ÇIKIŞ ONAY MODALI */}
      {confirmLogout && (
        <div className="nb-modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nb-modal-monogram">S.</div>
            <h3>Oturumu Kapat</h3>
            <p>Scribe hesabınızdan çıkış yapmak istediğinize emin misiniz?</p>
            <div className="nb-modal-actions">
              <button className="nb-btn-cancel" onClick={() => setConfirmLogout(false)}>Vazgeç</button>
              <button className="nb-btn-confirm" onClick={handleLogout}>Evet, Çıkış Yap</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
