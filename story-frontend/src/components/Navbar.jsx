import { useContext, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import CloseIcon from "@mui/icons-material/Close";
import "./navbar.css";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout, requireAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen]           = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showSearch, setShowSearch]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState(searchParams.get("search") || "");
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute("data-theme") || localStorage.getItem("theme") || "light";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (e) {}
    setTheme(nextTheme);
  };

  useEffect(() => {
    const currentApplied = document.documentElement.getAttribute("data-theme");
    if (currentApplied && currentApplied !== theme) {
      setTheme(currentApplied);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
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

  return (
    <>
      {/* HEADER */}
      <header className="header">
        {/* Sol Menü Butonu */}
        <div className="header-left" onClick={() => setMenuOpen(!menuOpen)}>
          <div className={`hamburger ${menuOpen ? "active" : ""}`}>
            <span></span><span></span><span></span>
          </div>
        </div>

        {/* Ortadaki Başlık */}
        <div className="logo" onClick={() => navigate("/")} title="Scribe Ana Sayfa">
          <span className="nav-logo-text">Scribe</span>
        </div>

        <div className="header-right">
          {showSearch ? (
            <form className="nav-search-form" onSubmit={handleSearchSubmit}>
              <input 
                type="text" 
                placeholder="Kitap ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <CloseIcon className="search-close-icon" onClick={() => setShowSearch(false)} />
            </form>
          ) : (
            <SearchIcon onClick={() => setShowSearch(true)} />
          )}
          
          {theme === "dark" ? (
            <LightModeIcon id="theme-toggle-btn" onClick={toggleTheme} style={{ cursor: "pointer" }} />
          ) : (
            <DarkModeIcon id="theme-toggle-btn" onClick={toggleTheme} style={{ cursor: "pointer" }} />
          )}
        </div>
      </header>

      {/* OVERLAY */}
      <div className={`overlay ${menuOpen ? "show" : ""}`} onClick={() => setMenuOpen(false)} />

      {/* SIDEBAR */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        <div className="side-logo">Scribe</div>
        <div className="side-divider"></div>

        <nav>
          <div className="new-book-btn" onClick={handleAddBookClick}>
            + Yeni Kitap Ekle
          </div>

          <p onClick={() => { setMenuOpen(false); navigate("/"); }}>Ana Sayfa</p>
          <p onClick={() => { setMenuOpen(false); navigate("/authors"); }}>Yazarlar</p>

          {!user && (
            <>
              <p onClick={() => { setMenuOpen(false); navigate("/register"); }}>Üye Ol</p>
              <p onClick={() => { setMenuOpen(false); navigate("/login"); }}>Giriş Yap</p>
            </>
          )}

          {user && (
            <>
              <p onClick={() => { setMenuOpen(false); navigate("/profile"); }}>Profilim</p>
              <p onClick={() => { setMenuOpen(false); setConfirmLogout(true); }}>
                Çıkış Yap
              </p>
            </>
          )}
        </nav>
      </div>

      {/* ÇIKIŞ ONAY MODALI */}
      {confirmLogout && (
        <div className="nb-modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Çıkış Yap</h3>
            <p>Çıkış yapmak istediğinize emin misiniz?</p>
            <div className="nb-modal-actions">
              <button className="nb-btn-cancel" onClick={() => setConfirmLogout(false)}>İptal</button>
              <button className="nb-btn-confirm" onClick={handleLogout}>Evet, Çıkış Yap</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
