import "./footer.css";
import InstagramIcon from '@mui/icons-material/Instagram';
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer-banner">
      <div className="footer-content">
        
        {/* SOL: Yasal Linkler */}
        <div className="footer-left">
          <Link to="/privacy">Gizlilik Politikası</Link>
          <Link to="/cookies">Çerez Politikası</Link>
          <Link to="/terms">Kullanım Koşulları</Link>
        </div>

        {/* ORTA: Sosyal Medya ve Mesaj */}
        <div className="footer-center">
          <h2>
            Bizi sosyal medyada<br />
            takip edin
          </h2>
          <div className="footer-socials">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/scribe_book"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @scribe_book"
              title="Instagram @scribe_book"
            >
              <InstagramIcon fontSize="large" />
            </a>

            <span className="separator">/</span>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@scribe_book"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok @scribe_book"
              title="TikTok @scribe_book"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ display: "block" }}
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.84a4.85 4.85 0 0 1-1-.15z" />
              </svg>
            </a>
          </div>
        </div>

        {/* SAĞ: Copyright */}
        <div className="footer-right">
          <p>Scribe © {new Date().getFullYear()}</p>
          <p>Tüm Hakları Saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
