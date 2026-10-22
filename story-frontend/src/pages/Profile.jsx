import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getMyBooks,
  updateBook,
  deleteBook,
  uploadCover,
  getChaptersByBook,
  deleteChapter,
} from "../services/bookService";
import { getBlockedUsers, unblockUser } from "../utils/moderation";
import Footer from "../components/Footer";
import "./profile.css";

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
  "Rastgele / Diğer",
];

export default function Profile() {
  const { user }     = useContext(AuthContext);
  const currentUser  = user?.user;
  const navigate     = useNavigate();

  const [activeTab, setActiveTab] = useState("kitaplik");
  const [books, setBooks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Engellenen kullanıcılar
  const [blockedList, setBlockedList] = useState([]);

  // Kitap düzenleme durumu
  const [editModalBook, setEditModalBook]       = useState(null);
  const [editForm, setEditForm]                 = useState({ title: "", description: "", category: "", cover_url: "" });
  const [editCoverFile, setEditCoverFile]       = useState(null);
  const [editCoverPreview, setEditCoverPreview] = useState(null);
  const [editSaving, setEditSaving]             = useState(false);
  const [editError, setEditError]               = useState("");
  const editFileInputRef                        = useRef(null);

  // Kitap silme durumu
  const [deleteModalBook, setDeleteModalBook]   = useState(null);
  const [deleting, setDeleting]                 = useState(false);

  // Bölüm yönetimi modalı durumu
  const [chaptersModalBook, setChaptersModalBook]         = useState(null);
  const [chaptersList, setChaptersList]                   = useState([]);
  const [chaptersLoading, setChaptersLoading]             = useState(false);
  const [confirmChapterDelete, setConfirmChapterDelete]   = useState(null);
  const [deletingChapter, setDeletingChapter]             = useState(false);

  // Toast bildirimi
  const [toast, setToast] = useState({ show: false, type: "", msg: "" });

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    setLoading(true);
    setError(null);
    getMyBooks(currentUser.id)
      .then(({ data }) => setBooks(data))
      .catch(() => setError("Kitaplar yüklenemedi."))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  useEffect(() => {
    setBlockedList(getBlockedUsers());
  }, [activeTab]);

  const handleUnblock = (identifier) => {
    unblockUser(identifier);
    setBlockedList(getBlockedUsers());
    showToast("success", "Kullanıcının engeli kaldırıldı.");
  };

  // Kitap düzenleme modalını aç
  const handleOpenEdit = (e, book) => {
    e.stopPropagation();
    setEditModalBook(book);
    setEditForm({
      title: book.title || "",
      description: book.description || "",
      category: book.category || CATEGORIES[0],
      cover_url: book.cover_url || "",
    });
    setEditCoverFile(null);
    setEditCoverPreview(book.cover_url || null);
    setEditError("");
  };

  const handleCloseEdit = () => {
    if (editSaving) return;
    setEditModalBook(null);
    setEditCoverFile(null);
    setEditCoverPreview(null);
    setEditError("");
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditCoverFile(file);
    setEditCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setEditCoverFile(null);
    setEditCoverPreview(null);
    setEditForm((prev) => ({ ...prev, cover_url: "" }));
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setEditError("Kitap başlığı boş bırakılamaz.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      let finalCoverUrl = editForm.cover_url;
      if (editCoverFile) {
        const { data } = await uploadCover(editCoverFile);
        finalCoverUrl = data.url;
      }

      const updatePayload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        cover_url: finalCoverUrl,
      };

      const { data: updatedBook } = await updateBook(editModalBook.id, updatePayload);

      setBooks((prev) =>
        prev.map((b) => (b.id === editModalBook.id ? { ...b, ...updatedBook } : b))
      );

      try {
        const cached = localStorage.getItem("cached_books");
        if (cached) {
          const parsed = JSON.parse(cached);
          const newCached = parsed.map((b) => (b.id === editModalBook.id ? { ...b, ...updatedBook } : b));
          localStorage.setItem("cached_books", JSON.stringify(newCached));
        }
      } catch (cacheErr) {
        console.error("Cache update error:", cacheErr);
      }

      showToast("success", "Kitap başarıyla güncellendi");
      handleCloseEdit();
    } catch (err) {
      console.error("Kitap güncellenirken hata oluştu:", err);
      setEditError(err.response?.data?.message || "Kitap güncellenirken bir hata oluştu.");
      showToast("error", "Güncelleme başarısız oldu");
    } finally {
      setEditSaving(false);
    }
  };

  // Kitap silme modalını aç
  const handleOpenDelete = (e, book) => {
    e.stopPropagation();
    setDeleteModalBook(book);
  };

  const handleCloseDelete = () => {
    if (deleting) return;
    setDeleteModalBook(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalBook) return;
    setDeleting(true);

    try {
      await deleteBook(deleteModalBook.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleteModalBook.id));

      try {
        const cached = localStorage.getItem("cached_books");
        if (cached) {
          const parsed = JSON.parse(cached);
          const newCached = parsed.filter((b) => b.id !== deleteModalBook.id);
          localStorage.setItem("cached_books", JSON.stringify(newCached));
        }
      } catch (cacheErr) {
        console.error("Cache remove error:", cacheErr);
      }

      showToast("success", "Kitap başarıyla silindi");
      setDeleteModalBook(null);
    } catch (err) {
      console.error("Kitap silinirken hata oluştu:", err);
      showToast("error", "Kitap silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  // Bölüm Yönetimi Fonksiyonları
  const handleOpenChapters = async (e, book) => {
    e.stopPropagation();
    setChaptersModalBook(book);
    setChaptersLoading(true);
    try {
      const { data } = await getChaptersByBook(book.id);
      setChaptersList(data);
    } catch (err) {
      console.error("Bölümler yüklenemedi:", err);
      showToast("error", "Bölümler yüklenemedi");
    } finally {
      setChaptersLoading(false);
    }
  };

  const handleCloseChapters = () => {
    setChaptersModalBook(null);
    setChaptersList([]);
  };

  const handleAddChapter = (bookId) => {
    navigate(`/books/${bookId}/add-chapter`);
  };

  const handleEditChapter = (bookId, chapterId) => {
    navigate(`/books/${bookId}/edit-chapter/${chapterId}`);
  };

  const handleDeleteChapter = async () => {
    if (!confirmChapterDelete) return;
    setDeletingChapter(true);
    try {
      await deleteChapter(confirmChapterDelete.id);
      setChaptersList((prev) => prev.filter((c) => c.id !== confirmChapterDelete.id));
      showToast("success", "Bölüm silindi");
      setConfirmChapterDelete(null);
    } catch (err) {
      console.error("Bölüm silinemedi:", err);
      showToast("error", "Bölüm silinemedi");
    } finally {
      setDeletingChapter(false);
    }
  };

  return (
    <>
      <div className="profile-page">
        {/* Banner */}
        <div className="profile-banner" />

        {/* Profil Bilgisi */}
        <div className="profile-info-row">
          <div className="profile-avatar">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.username} />
            ) : (
              <span className="profile-avatar-icon">S</span>
            )}
          </div>
          <div className="profile-meta">
            <h2 className="profile-username">{currentUser?.username || "Kullanıcı"}</h2>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="profile-tabs-wrap">
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === "kitaplik" ? "active" : ""}`}
              onClick={() => setActiveTab("kitaplik")}
            >
              Kitaplığım
            </button>
            <button
              className={`profile-tab ${activeTab === "engellenenler" ? "active" : ""}`}
              onClick={() => setActiveTab("engellenenler")}
            >
              Engellenenler ({blockedList.length})
            </button>
          </div>
        </div>

        {/* İçerik */}
        <div className="profile-content">
          {activeTab === "kitaplik" && (
            <>
              {loading && (
                <div className="profile-empty"><div className="profile-spinner" /></div>
              )}
              {error && !loading && (
                <div className="profile-empty profile-error"><p>{error}</p></div>
              )}
              {!loading && !error && books.length === 0 && (
                <div className="profile-empty"><p>Henüz kitap eklenmedi.</p></div>
              )}
              {!loading && !error && books.length > 0 && (
                <div className="profile-book-grid">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className="profile-book-card"
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      <div className="profile-book-cover">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} />
                        ) : (
                          <span className="profile-book-emoji">S.</span>
                        )}
                      </div>
                      <div className="profile-book-info">
                        <h4>{book.title}</h4>
                        <span>{book.category}</span>
                      </div>

                      {/* Kitap ve Bölüm Aksiyonları */}
                      <div className="profile-book-card-actions">
                        <button
                          type="button"
                          className="profile-card-btn profile-card-btn-chapters"
                          onClick={(e) => handleOpenChapters(e, book)}
                          title="Bölümleri Yönet ve Bölüm Ekle"
                        >
                          Bölümleri Yönet
                        </button>
                        <div className="profile-card-btn-subrow">
                          <button
                            type="button"
                            className="profile-card-btn profile-card-btn-edit"
                            onClick={(e) => handleOpenEdit(e, book)}
                            title="Kitabı Düzenle"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="profile-card-btn profile-card-btn-delete"
                            onClick={(e) => handleOpenDelete(e, book)}
                            title="Kitabı Sil"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "engellenenler" && (
            <div className="blocked-users-section">
              {blockedList.length === 0 ? (
                <div className="profile-empty">
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#A85D42", marginBottom: "12px" }}>S.</div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>
                    Engellenen Kullanıcı Yok
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13.5px", maxWidth: "420px", margin: "0 auto" }}>
                    Bölüm okurken rahatsız edici veya uygunsuz yorum yapan bir kullanıcıyı engellediğinizde yorumları gizlenir ve burada listelenir.
                  </p>
                </div>
              ) : (
                <div className="blocked-users-list">
                  {blockedList.map((item) => (
                    <div key={item.identifier} className="blocked-user-card">
                      <div className="blocked-user-left">
                        <div className="blocked-user-avatar">
                          {(item.name || "K").charAt(0).toUpperCase()}
                        </div>
                        <div className="blocked-user-info">
                          <h4>@{item.name}</h4>
                          <span>
                            {new Date(item.blockedAt).toLocaleDateString("tr-TR")} tarihinde engellendi
                          </span>
                        </div>
                      </div>

                      <button
                        className="unblock-btn"
                        onClick={() => handleUnblock(item.identifier)}
                      >
                        Engeli Kaldır
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bölüm Yönetimi Modalı */}
        {chaptersModalBook && (
          <div className="profile-modal-overlay" onClick={handleCloseChapters}>
            <div className="profile-modal profile-modal-chapters" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <div className="profile-modal-header-title">
                  <h3>Bölüm Yönetimi</h3>
                  <span className="profile-modal-subtitle">{chaptersModalBook.title}</span>
                </div>
                <button className="profile-modal-close" onClick={handleCloseChapters}>
                  ✕
                </button>
              </div>

              <div className="profile-chapters-toolbar">
                <span className="profile-chapters-count">
                  {chaptersList.length} Bölüm
                </span>
                <button
                  type="button"
                  className="profile-btn-add-chapter"
                  onClick={() => handleAddChapter(chaptersModalBook.id)}
                >
                  + Yeni Bölüm Ekle
                </button>
              </div>

              <div className="profile-chapters-body">
                {chaptersLoading ? (
                  <div className="profile-chapters-loading">
                    <div className="profile-spinner" />
                  </div>
                ) : chaptersList.length === 0 ? (
                  <div className="profile-chapters-empty">
                    <p>Bu kitapta henüz eklenmiş bir bölüm yok.</p>
                    <button
                      type="button"
                      className="profile-btn-add-chapter-lg"
                      onClick={() => handleAddChapter(chaptersModalBook.id)}
                    >
                      + İlk Bölümü Ekle
                    </button>
                  </div>
                ) : (
                  <div className="profile-chapters-list">
                    {chaptersList.map((chapter) => (
                      <div key={chapter.id} className="profile-chapter-row">
                        <div className="profile-chapter-info">
                          <span className="profile-chapter-badge">#{chapter.order_number}</span>
                          <span className="profile-chapter-name">{chapter.title}</span>
                        </div>
                        <div className="profile-chapter-row-actions">
                          <button
                            type="button"
                            className="profile-chapter-act-btn edit"
                            onClick={() => handleEditChapter(chaptersModalBook.id, chapter.id)}
                            title="Bölümü Düzenle"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="profile-chapter-act-btn delete"
                            onClick={() => setConfirmChapterDelete(chapter)}
                            title="Bölümü Sil"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bölüm Silme Onay Modalı */}
        {confirmChapterDelete && (
          <div className="profile-modal-overlay" onClick={() => !deletingChapter && setConfirmChapterDelete(null)}>
            <div className="profile-modal profile-modal-delete" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <h3>Bölümü Sil</h3>
                <button className="profile-modal-close" onClick={() => setConfirmChapterDelete(null)} disabled={deletingChapter}>
                  ✕
                </button>
              </div>
              <div className="profile-modal-body">
                <p>
                  <strong>"{confirmChapterDelete.title}"</strong> bölümünü silmek istediğinize emin misiniz?
                </p>
                <p className="profile-modal-warning">Bu işlem geri alınamaz.</p>
              </div>
              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-modal-btn profile-modal-btn-cancel"
                  onClick={() => setConfirmChapterDelete(null)}
                  disabled={deletingChapter}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="profile-modal-btn profile-modal-btn-delete"
                  onClick={handleDeleteChapter}
                  disabled={deletingChapter}
                >
                  {deletingChapter ? "Siliniyor..." : "Evet, Sil"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kitap Düzenleme Modalı */}
        {editModalBook && (
          <div className="profile-modal-overlay" onClick={handleCloseEdit}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <h3>Kitabı Düzenle</h3>
                <button className="profile-modal-close" onClick={handleCloseEdit} disabled={editSaving}>
                  ✕
                </button>
              </div>

              {editError && <div className="profile-modal-error">{editError}</div>}

              <form onSubmit={handleSaveEdit} className="profile-modal-form">
                {/* Kapak Yükleme */}
                <div className="profile-modal-cover-section">
                  <div className="profile-modal-cover-preview">
                    {editCoverPreview ? (
                      <img src={editCoverPreview} alt="Kapak Önizleme" />
                    ) : (
                      <div className="profile-modal-cover-placeholder">S.</div>
                    )}
                  </div>
                  <div className="profile-modal-cover-controls">
                    <label className="profile-modal-file-btn">
                      {editCoverPreview ? "Kapağı Değiştir" : "Kapak Görseli Seç"}
                      <input
                        type="file"
                        accept="image/*"
                        ref={editFileInputRef}
                        onChange={handleCoverChange}
                        style={{ display: "none" }}
                      />
                    </label>
                    {editCoverPreview && (
                      <button
                        type="button"
                        className="profile-modal-remove-cover-btn"
                        onClick={handleRemoveCover}
                      >
                        Kapağı Kaldır
                      </button>
                    )}
                    <span className="profile-modal-cover-hint">PNG, JPG veya WEBP (Maks 5MB)</span>
                  </div>
                </div>

                {/* Kitap Başlığı */}
                <div className="profile-modal-group">
                  <label htmlFor="edit-title">Kitap Başlığı *</label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={120}
                    placeholder="Kitabınızın başlığı"
                    required
                  />
                </div>

                {/* Kategori */}
                <div className="profile-modal-group">
                  <label htmlFor="edit-category">Kategori *</label>
                  <select
                    id="edit-category"
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Açıklama */}
                <div className="profile-modal-group">
                  <label htmlFor="edit-description">Açıklama</label>
                  <textarea
                    id="edit-description"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    maxLength={600}
                    placeholder="Hikayeniz hakkında kısa bir özet..."
                  />
                  <div className="profile-modal-char-count">{editForm.description.length}/600</div>
                </div>

                <div className="profile-modal-actions">
                  <button
                    type="button"
                    className="profile-modal-btn profile-modal-btn-cancel"
                    onClick={handleCloseEdit}
                    disabled={editSaving}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="profile-modal-btn profile-modal-btn-save"
                    disabled={editSaving}
                  >
                    {editSaving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kitap Silme Onay Modalı */}
        {deleteModalBook && (
          <div className="profile-modal-overlay" onClick={handleCloseDelete}>
            <div className="profile-modal profile-modal-delete" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <h3>Kitabı Sil</h3>
                <button className="profile-modal-close" onClick={handleCloseDelete} disabled={deleting}>
                  ✕
                </button>
              </div>

              <div className="profile-modal-body">
                <p>
                  <strong>"{deleteModalBook.title}"</strong> kitabını ve bu kitaba ait tüm bölümleri kalıcı olarak silmek istediğinizden emin misiniz?
                </p>
                <p className="profile-modal-warning">Bu işlem geri alınamaz.</p>
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-modal-btn profile-modal-btn-cancel"
                  onClick={handleCloseDelete}
                  disabled={deleting}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="profile-modal-btn profile-modal-btn-delete"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Siliniyor..." : "Evet, Sil"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Bildirimi */}
        <div className={`profile-toast ${toast.type} ${toast.show ? "show" : ""}`}>
          {toast.msg}
        </div>
      </div>
      <Footer />
    </>
  );
}
