import { useState, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { createBook, uploadCover } from "../services/bookService";
import "./addBook.css";

const CATEGORIES = [
  "Romantizm",
  "Genç Kurgu",
  "Fantastik",
  "Bilim Kurgu",
  "Gizem / Gerilim",
  "Korku",
  "Aksiyon / Macera",
  "Tarihi Kurgu",
  "Hayran Kurgu (Fanfiction)",
  "Mizah",
  "Kısa Hikaye / Şiir",
  "Rastgele / Diğer"
];

export default function AddBook() {
  const { user } = useContext(AuthContext);
  const currentUser = user?.user;

  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "", msg: "" });
  const fileInputRef = useRef();

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Kitap adı zorunludur.";
    if (!form.description.trim()) e.description = "Açıklama zorunludur.";
    if (!form.category) e.category = "Kategori seçiniz.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: "" }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let cover_url = null;
      if (coverFile) {
        const { data } = await uploadCover(coverFile);
        cover_url = data.url;
      }
      await createBook({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        status: "active",
        author_id: currentUser?.id,
        cover_url,
      });
      showToast("success", "Kitap başarıyla eklendi");
      setForm({ title: "", description: "", category: "" });
      setCoverFile(null);
      setCoverPreview(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      showToast("error", "Bir hata oluştu, tekrar deneyin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="addbook-page">
      <div className="addbook-card">

        <h1 className="addbook-title">Yeni Kitap Ekle</h1>
        <p className="addbook-subtitle">
          Koleksiyonuna yeni bir kitap eklemek için aşağıdaki formu doldur.
        </p>

        {/* Kapak Görseli */}
        <div className="addbook-field">
          <label className="addbook-label">Kapak Görseli</label>
          <div
            className={`addbook-cover-zone ${coverPreview ? "has-preview" : ""}`}
            onClick={() => !coverPreview && fileInputRef.current.click()}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Kapak önizleme" className="addbook-cover-preview" />
                <button
                  className="addbook-cover-remove"
                  onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}
                >
                  ✕ Kaldır
                </button>
              </>
            ) : (
              <div className="addbook-cover-placeholder">
                <span className="addbook-cover-icon">S.</span>
                <p>Kapak görseli yükle</p>
                <span>PNG, JPG — maks. 5MB</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleCoverChange}
          />
        </div>

        {/* Kitap Adı */}
        <div className="addbook-field">
          <label className="addbook-label">Kitap Adı</label>
          <input
            className="addbook-input"
            placeholder="örn. Suç ve Ceza"
            value={form.title}
            onChange={handleChange("title")}
            maxLength={120}
          />
          {errors.title && <p className="addbook-field-err">{errors.title}</p>}
        </div>

        {/* Açıklama */}
        <div className="addbook-field">
          <label className="addbook-label">Açıklama</label>
          <textarea
            className="addbook-textarea"
            placeholder="Kitap hakkında kısa bir açıklama yazın…"
            value={form.description}
            onChange={handleChange("description")}
            maxLength={500}
          />
          <p className="addbook-char-count">{form.description.length} / 500</p>
          {errors.description && <p className="addbook-field-err">{errors.description}</p>}
        </div>

        {/* Kategori */}
        <div className="addbook-field">
          <label className="addbook-label">Kategori</label>
          <div className="addbook-select-wrap">
            <select
              className="addbook-select"
              value={form.category}
              onChange={handleChange("category")}
            >
              <option value="">Kategori seçin…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {errors.category && <p className="addbook-field-err">{errors.category}</p>}
        </div>

        <div className="addbook-divider" />

        <button className="addbook-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="addbook-spinner" /> Ekleniyor…</> : "Kitabı Kaydet"}
        </button>

      </div>

      <div className={`addbook-toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
}