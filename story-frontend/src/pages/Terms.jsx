import Footer from "../components/Footer";
import "./legal.css";

export default function Terms() {
  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <header className="legal-header">
            <span className="legal-badge">Kullanım Şartları</span>
            <h1 className="legal-title">Kullanım Koşulları</h1>
            <div className="legal-meta">
              <span>Scribe Edebiyat Platformu</span>
              <span>•</span>
              <span>Son Güncelleme: Ekim 2026</span>
            </div>
          </header>

          <main className="legal-content">
            <p className="legal-intro">
              Scribe'a hoş geldiniz. Web sitemizi veya mobil uygulamamızı kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Lütfen dikkatlice okuyunuz.
            </p>

            <section className="legal-section">
              <h2>1. Hizmet Tanımı</h2>
              <p>
                Scribe, yazarların özgün hikaye ve kitaplar yayınlayabileceği, okurların ise bu eserleri keşfedip okuyabileceği edebi bir dijital platformdur.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Hesap ve Güvenlik</h2>
              <ul>
                <li>Kayıt işlemi için doğru ve geçerli bilgiler vermeniz gerekmektedir.</li>
                <li>Hesabınızın giriş bilgilerinin gizliliğini korumak sizin sorumluluğunuzdadır.</li>
                <li>13 yaşından küçük bireyler platformda hesap oluşturamaz.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. İçerik ve Topluluk Kuralları</h2>
              <p>Platformda paylaşılan tüm hikaye, bölüm ve yorumlar aşağıdaki kurallara uygun olmalıdır:</p>
              <ul>
                <li><strong>Özgünlük ve Telif:</strong> Yalnızca kendinize ait veya yayın hakkına sahip olduğunuz eserleri paylaşabilirsiniz. Başkasına ait eserlerin izinsiz kopyalanması yasaktır.</li>
                <li><strong>Nezaket ve Saygı:</strong> Küfür, hakaret, nefret söylemi, ırkçılık veya kişileri hedef alan taciz içerikli paylaşımlar sistem tarafından engellenir veya kaldırılır.</li>
                <li><strong>Spam ve Reklam:</strong> Ticari reklam, spam veya yanıltıcı bağlantılar paylaşmak yasaktır.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Fikri Mülkiyet Hakları</h2>
              <p>
                Yayınladığınız tüm hikayelerin ve eserlerin telif hakkı tamamen <strong>size</strong> aittir. Scribe'a yalnızca içeriğinizi platformda okuyuculara sunma ve görüntüleme lisansı vermiş olursunuz.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Sorumluluk Sınırı ve Hizmet Değişiklikleri</h2>
              <p>
                Scribe platformu kesintisiz ve hatasız hizmet sunmak için azami gayreti göstermekle birlikte, teknik aksaklıklar veya bakım süreçlerinden doğabilecek geçici kesintilerden sorumlu tutulamaz.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. İletişim</h2>
              <div className="legal-contact-card">
                <p>Kullanım koşullarımızla ilgili soru ve geri bildirimleriniz için:</p>
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

