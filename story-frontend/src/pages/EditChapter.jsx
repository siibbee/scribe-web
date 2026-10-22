import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChapterById, updateChapter } from "../services/bookService";
import "./addChapter.css"; // Aynı stil dosyasını kullanıyoruz

export default function EditChapter() {
  const { bookId, chapterId } = useParams();
  const navigate              = useNavigate();

  const [form, setForm]       = useState({ title: "", content: "", order_number: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [toast, setToast]     = useState({ show: false, type: "", msg: "" });

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  useEffect(() => {
    getChapterById(chapterId)
      .then(({ data }) => {
        setForm({
          title:        data.title,
          content:      data.content || "",
          order_number: String(data.order_number),
        });
      })
      .catch(() => showToast("error", "Bölüm yüklenemedi"))
      .finally(() => setLoading(false));
  }, [chapterId]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Bölüm adı zorunludur.";
    if (!form.order_number || isNaN(form.order_number) || Number(form.order_number) < 1)
      e.order_number = "Geçerli bir sıra numarası girin.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: "" }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateChapter(chapterId, {
        title:        form.title.trim(),
        content:      form.content.trim(),
        order_number: Number(form.order_number),
      });
      showToast("success", "Bölüm güncellendi");
      setTimeout(() => navigate("/profile"), 1200);
    } catch {
      showToast("error", "Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  // Ortak yükleme ekranı (Mavi borderTopColor kaldırıldı, addChapter.css'teki .ac-spinner rengi geçerli olur)
  if (loading) return (
    <div className="ac-page">
      <div className="ac-card ac-loading-flex">
        <div className="ac-spinner ac-spinner-lg" />
      </div>
    </div>
  );

  return (
    <div className="ac-page">
      <div className="ac-card">

        <button className="ac-back" onClick={() => navigate("/profile")}>
          ← Profile Dön
        </button>

        <p className="ac-eyebrow">Bölüm</p>
        <h1 className="ac-title">Bölümü Düzenle</h1>
        <p className="ac-subtitle">Bölüm bilgilerini güncelleyebilirsin.</p>

        {/* Sıra No */}
        <div className="ac-field">
          <label className="ac-label">Sıra Numarası</label>
          <input
            className="ac-input ac-input-sm"
            type="number"
            min="1"
            value={form.order_number}
            onChange={handleChange("order_number")}
          />
          {errors.order_number && <p className="ac-field-err">{errors.order_number}</p>}
        </div>

        {/* Bölüm Adı */}
        <div className="ac-field">
          <label className="ac-label">Bölüm Adı</label>
          <input
            className="ac-input"
            placeholder="Bölüm adı"
            value={form.title}
            onChange={handleChange("title")}
            maxLength={150}
          />
          {errors.title && <p className="ac-field-err">{errors.title}</p>}
        </div>

        {/* İçerik */}
        <div className="ac-field">
          <label className="ac-label">Bölüm İçeriği</label>
          <textarea
            className="ac-textarea"
            placeholder="Bölüm içeriğini buraya yazın…"
            value={form.content}
            onChange={handleChange("content")}
          />
          <p className="ac-char-count">{form.content.length} karakter</p>
        </div>

        <div className="ac-divider" />

        <button className="ac-btn" onClick={handleSubmit} disabled={saving}>
          {saving ? <><span className="ac-spinner" /> Kaydediliyor…</> : "Değişiklikleri Kaydet"}
        </button>

      </div>

      <div className={`ac-toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
}