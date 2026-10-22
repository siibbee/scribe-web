import Footer from "../components/Footer";
import "./legal.css";

export default function Cookies() {
  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <header className="legal-header">
            <span className="legal-badge">Çerez Bilgilendirmesi</span>
            <h1 className="legal-title">Çerez Politikası</h1>
            <div className="legal-meta">
              <span>Scribe Edebiyat Platformu</span>
              <span>•</span>
              <span>Son Güncelleme: Ekim 2026</span>
            </div>
          </header>

          <main className="legal-content">
            <p className="legal-intro">
              Scribe, kullanıcı deneyiminizi geliştirmek ve oturumunuzun güvenliğini sağlamak amacıyla çerezler (cookies) ve yerel depolama teknolojileri kullanmaktadır.
            </p>

            <section className="legal-section">
              <h2>1. Çerez Nedir?</h2>
              <p>
                Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza kaydedilen küçük metin dosyalarıdır. Tercihlerinizin hatırlanmasına ve oturumunuzun açık kalmasına yardımcı olur.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Kullandığımız Çerez Türleri</h2>
              
              <h3>Zorunlu Çerezler ve Oturum Depolaması</h3>
              <p>
                Platformun temel işlevleri için zorunludur. Güvenli giriş yapma, kimlik doğrulama belirteçleri (JWT token) ve hesap güvenliği için kullanılır.
              </p>

              <h3>İşlevsel Çerezler</h3>
              <p>
                Karanlık / Aydınlık tema tercihinizi ve son okuduğunuz bölüm gibi kişisel ayarlarınızı hatırlamak için kullanılır.
              </p>

              <h3>Performans ve İyileştirme Çerezleri</h3>
              <p>
                Sayfa yüklenme hızlarını optimize etmek ve sunucu kaynaklı hataları tespit etmek amacıyla anonim olarak tutulur.
              </p>
            </section>

            <section className="legal-section">
              <h2>3. Çerezleri Nasıl Yönetebilirsiniz?</h2>
              <p>
                Tarayıcınızın ayarlar menüsünden dilediğiniz zaman çerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu çerezleri devre dışı bırakmanız durumunda platforma giriş yapamayabilirsiniz.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. İletişim</h2>
              <div className="legal-contact-card">
                <p>Çerez politikamızla ilgili sorularınız için:</p>
                <a className="legal-contact-email" href="mailto:iletisim@Scribe.com">
                  iletisim@Scribe.com
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}

