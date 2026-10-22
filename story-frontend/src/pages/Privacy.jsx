import Footer from "../components/Footer";
import "./legal.css";

export default function Privacy() {
  return (
    <>
      <div className="legal-page">
        <div className="legal-container">
          <header className="legal-header">
            <span className="legal-badge">Güvenlik ve Gizlilik</span>
            <h1 className="legal-title">Gizlilik Politikası</h1>
            <div className="legal-meta">
              <span>Scribe Edebiyat Platformu</span>
              <span>•</span>
              <span>Son Güncelleme: Ekim 2026</span>
            </div>
          </header>

          <main className="legal-content">
            <p className="legal-intro">
              Scribe olarak yazarlarımızın ve okuyucularımızın kişisel verilerinin gizliliğine ve güvenliğine en üst düzeyde önem veriyoruz. Bu Gizlilik Politikası, web sitemizi ve mobil uygulamamızı kullanırken hangi verilerinizin toplandığını, nasıl korunduğunu ve haklarınızı açıklamaktadır.
            </p>

            <section className="legal-section">
              <h2>1. Toplanan Bilgiler</h2>
              <p>Hizmetlerimizden yararlanabilmeniz için aşağıdaki bilgiler toplanabilir:</p>
              <ul>
                <li><strong>Hesap Bilgileri:</strong> Kayıt olurken sağladığınız kullanıcı adı, e-posta adresi ve güvenli şekilde şifrelenmiş (bcrypt) parola.</li>
                <li><strong>Yazar & İçerik Verileri:</strong> Yayınladığınız kitap başlıkları, açıklamalar, bölümler, yorumlar ve yüklediğiniz kitap kapakları/profil görselleri.</li>
                <li><strong>Cihaz ve Kullanım Verileri:</strong> Uygulama performansını iyileştirmek için IP adresi, cihaz türü, işletim sistemi sürümü ve temel kullanım istatistikleri.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>2. Verilerin Kullanım Amacı</h2>
              <p>Toplanan kişisel verileriniz yalnızca aşağıdaki meşru amaçlarla işlenir:</p>
              <ul>
                <li>Okuma ve yazma hizmetlerinin kesintisiz sağlanması,</li>
                <li>Favori kitaplarınızın ve okuma ilerlemenizin senkronize edilmesi,</li>
                <li>Takip ettiğiniz yazarlar yeni bölüm yayınladığında bildirim iletilmesi (isteğe bağlı),</li>
                <li>Platform güvenliğinin sağlanması, spam ve kötüye kullanımın engellenmesi.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Veri Paylaşımı ve Üçüncü Taraflar</h2>
              <p>
                Scribe, kullanıcı verilerini <strong>asla üçüncü taraf reklam veya veri şirketlerine satmaz, kiralamaz ve pazarlamaz</strong>.
              </p>
              <p>
                Görseller güvenli bulut sağlayıcıları (Cloudinary) üzerinden optimize edilerek sunulur; verileriniz SSL/TLS şifreli sunucularda saklanır.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Google Play Uyumlu: Hesap ve Veri Silme Hakkı</h2>
              <div className="legal-highlight-box">
                <h3>Verilerinizi ve Hesabınızı Kalıcı Olarak Silme</h3>
                <p>
                  Google Play ve KVKK/GDPR gereklilikleri uyarınca, kullanıcılarımız diledikleri zaman tüm kişisel verilerini ve hesaplarını silme hakkına sahiptir.
                </p>
                <p><strong>Nasıl Silebilirsiniz?</strong></p>
                <ul>
                  <li><strong>Uygulama İçinden:</strong> Mobil uygulamada veya web sitemizde <em>Profil → Ayarlar</em> menüsüne giderek <strong>"Hesabımı Kalıcı Olarak Sil"</strong> butonuna dokunabilirsiniz.</li>
                  <li><strong>E-posta ile Talep:</strong> Hesabınıza kayıtlı e-posta adresinizden <a href="mailto:iletisim@Scribe.com">iletisim@Scribe.com</a> adresine <em>"Hesap Silme Talebi"</em> konulu bir e-posta gönderebilirsiniz. Talebiniz en geç 24 saat içinde işleme alınır.</li>
                </ul>
                <p>
                  Hesap silme işlemi onaylandığında; kullanıcı hesabınız, profil bilgileriniz, yayınladığınız hikayeler, bölümler ve yorumlarınız veritabanımızdan kalıcı ve geri döndürülemez biçimde tamamen silinir.
                </p>
              </div>
            </section>

            <section className="legal-section">
              <h2>5. İçerik Denetimi ve Topluluk Güvenliği</h2>
              <p>
                Topluluğumuzun huzurlu ve nezih kalması için Scribe bünyesinde otomatik <strong>Küfür ve Nefret Söylemi Filtresi</strong> aktif olarak çalışmaktadır.
              </p>
              <p>
                Kullanıcılar rahatsız edici buldukları diğer kullanıcıları tek tıkla engelleyebilir (<em>Engellenen Kullanıcılar</em>) veya içerikleri moderatörlerimize şikayet edebilir.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Çocuk Güvenliği ve Yaş Sınırı</h2>
              <p>
                Scribe, 13 yaşın altındaki çocuklardan bilerek kişisel veri toplamaz. 13 yaşından küçük bir bireye ait veri toplandığı tespit edilirse söz konusu hesap ve veriler ivedilikle silinir.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. İletişim</h2>
              <div className="legal-contact-card">
                <p>Gizlilik politikamız veya kişisel verilerinizle ilgili her türlü soru ve talebiniz için bize ulaşabilirsiniz:</p>
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

