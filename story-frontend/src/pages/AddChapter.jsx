import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createChapter } from "../services/bookService";
import "./addChapter.css";

export default function AddChapter() {
  const { bookId }  = useParams();
  const navigate    = useNavigate();

  const [form, setForm]   = useState({ title: "", content: "", order_number: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState({ show: false, type: "", msg: "" });

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

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
    setLoading(true);
    try {
      await createChapter({
        book_id:      Number(bookId),
        title:        form.title.trim(),
        content:      form.content.trim(),
        order_number: Number(form.order_number),
      });
      showToast("success", "Bölüm eklendi");
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err) {
      console.error(err);
      showToast("error", "Bölüm eklenemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ac-page">
      <div className="ac-card">

        {/* Geri */}
        <button className="ac-back" onClick={() => navigate("/profile")}>
          ← Profile Dön
        </button>

        <p className="ac-eyebrow">Bölüm</p>
        <h1 className="ac-title">Yeni Bölüm Ekle</h1>
        <p className="ac-subtitle">Kitabına yeni bir bölüm eklemek için formu doldur.</p>

        {/* Sıra No */}
        <div className="ac-field">
          <label className="ac-label">Sıra Numarası</label>
          <input
            className="ac-input ac-input-sm"
            type="number"
            min="1"
            placeholder="örn. 1"
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
            placeholder="örn. Birinci Bölüm: Başlangıç"
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

        <button className="ac-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="ac-spinner" /> Ekleniyor…</> : "Bölümü Kaydet"}
        </button>

      </div>

      <div className={`ac-toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </div>
  );
}