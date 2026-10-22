import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getChapterById,
  getChaptersByBook,
  getCommentsByChapter,
  createComment,
  deleteComment,
  incrementBookReadCount,
} from "../services/bookService";
import { containsProfanity } from "../utils/contentFilter";
import { isUserBlocked, blockUser } from "../utils/moderation";
import "./readChapter.css";

// Metni cümle/nokta sınırlarına göre ayırır (cümlenin ortasında bölünmeyi engeller)
function splitIntoCommentParagraphs(text) {
  if (!text || typeof text !== "string") return [];

  // İki satır boşluk (\n\n) varsa ana paragraflar olarak ayır
  const blocks = text.split(/\r?\n\s*\r?\n/);
  const result = [];
  const ABBREVS = ["dr", "prof", "av", "vb", "vs", "al"];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Satır içi tekil \n'leri boşluk yaparak cümlenin ortasında bölünmesini engelle
    const oneLine = trimmed.replace(/\r?\n+/g, " ").replace(/\s+/g, " ");

    // Nokta (.), ünlem (!), soru işareti (?) veya üç nokta (...) sonrasından ayır
    const rawSentences = oneLine.split(/(?<=[.!?…]["'”’)]?)\s+/);

    const merged = [];
    for (let i = 0; i < rawSentences.length; i++) {
      const s = rawSentences[i].trim();
      if (!s) continue;

      // Son kelime kısaltmaysa (Dr., vb.) bir sonraki parçayla birleştir
      const lastWord = s.replace(/[.!?…]+$/, "").split(/\s+/).pop()?.toLowerCase() || "";
      if (ABBREVS.includes(lastWord) && i < rawSentences.length - 1) {
        rawSentences[i + 1] = s + " " + rawSentences[i + 1];
      } else {
        merged.push(s);
      }
    }

    result.push(...merged);
  }

  return result.length > 0 ? result : [text.trim()];
}

export default function ReadChapter() {
  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const currentUser = user?.user || user;

  const [chapter, setChapter]         = useState(null);
  const [chapters, setChapters]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comments, setComments]       = useState([]);

  // Aktif paragraf paneli: { index }
  const [activePanel, setActivePanel] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [profanityWarning, setProfanityWarning] = useState("");

  // Engelleme modalı ve re-render tetikleyicisi
  const [confirmBlockUser, setConfirmBlockUser] = useState(null);
  const [blockedTick, setBlockedTick]           = useState(0);

  // Hangi yoruma yanıt verildiğini tutan state: { commentId, username }
  const [replyTarget, setReplyTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    setActivePanel(null);
    setReplyTarget(null);
    setProfanityWarning("");
    Promise.all([
      getChapterById(chapterId),
      getChaptersByBook(bookId),
      getCommentsByChapter(chapterId),
    ])
      .then(([{ data: ch }, { data: all }, { data: cmts }]) => {
        setChapter(ch);
        setChapters(all);
        setComments(cmts);
      })
      .finally(() => setLoading(false));
  }, [chapterId, bookId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  // Her bölüm her kullanıcı/cihaz için yalnızca 1 kez okunma sayısına eklenir
  useEffect(() => {
    if (!bookId || !chapterId) return;

    const readKey = currentUser?.id
      ? `@scribe_read_ch_${chapterId}_user_${currentUser.id}`
      : `@scribe_read_ch_${chapterId}_device`;

    try {
      const alreadyRead = localStorage.getItem(readKey);
      if (!alreadyRead) {
        localStorage.setItem(readKey, "1");
        incrementBookReadCount(bookId, chapterId, currentUser?.id);
      }
    } catch {
      incrementBookReadCount(bookId, chapterId, currentUser?.id);
    }
  }, [chapterId, bookId, currentUser?.id]);

  if (loading) return <div className="rc-loading"><div className="rc-spinner" /></div>;
  if (!chapter) return <div className="rc-loading"><p>Bölüm bulunamadı.</p></div>;

  const currentIndex = chapters.findIndex((c) => c.id === chapter.id);
  const prevChapter  = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter  = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const paragraphs = chapter.content
    ? splitIntoCommentParagraphs(chapter.content)
    : [];

  // Paragrafın yorumlarını getir (Engellenen kullanıcıların yorumlarını gizle)
  const commentsForPara = (idx) => {
    return comments.filter((c) => {
      if (c.paragraph_index !== idx) return false;
      if (isUserBlocked(c.user_id) || isUserBlocked(c.username)) {
        return false;
      }
      return true;
    });
  };

  const handleParagraphClick = (idx) => {
    setActivePanel(activePanel?.index === idx ? null : { index: idx });
    setCommentText("");
    setProfanityWarning("");
    setReplyTarget(null);
  };

  const handleReplyClick = (commentId, username) => {
    setReplyTarget({ commentId, username });
    setCommentText(`@${username} `);
    setProfanityWarning("");
  };

  const handleSubmit = async (paraIdx) => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (!currentUser) {
      setProfanityWarning("Yorum yapabilmek için lütfen giriş yapınız.");
      return;
    }

    // 1. Küfür ve Topluluk Kuralları Denetimi
    if (containsProfanity(trimmed)) {
      setProfanityWarning(
        "Yorumunuz topluluk kurallarımıza aykırı uygunsuz veya kırıcı kelimeler içeriyor. Lütfen saygılı bir dil kullanınız."
      );
      return;
    }

    setProfanityWarning("");
    setSubmitting(true);
    try {
      const { data } = await createComment({
        chapter_id: chapter.id,
        paragraph_index: paraIdx,
        user_id: currentUser.id,
        username: currentUser.username || "Okur",
        content: trimmed,
        parent_id: replyTarget ? replyTarget.commentId : null,
      });
      setComments((prev) => [...prev, data]);
      setCommentText("");
      setReplyTarget(null);
    } catch (err) {
      console.error("Yorum gönderme hatası:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error || "Yorum gönderilemedi. Lütfen tekrar deneyiniz.";
      setProfanityWarning(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleBlockConfirm = () => {
    if (!confirmBlockUser) return;
    blockUser({
      identifier: confirmBlockUser.identifier,
      name: confirmBlockUser.name,
    });
    setConfirmBlockUser(null);
    setBlockedTick((t) => t + 1); // Listeyi güncelle
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  return (
    <div className="rc-page">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="rc-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Chapters Sidebar */}
      <aside className={`rc-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="rc-sidebar-header">
          <span className="rc-sidebar-title">Bölümler</span>
          <button className="rc-sidebar-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>
        <div className="rc-chapter-list">
          {chapters.map((ch) => (
            <div
              key={ch.id}
              className={`rc-chapter-item ${ch.id === chapter.id ? "active" : ""}`}
              onClick={() => {
                setSidebarOpen(false);
                navigate(`/books/${bookId}/read/${ch.id}`);
              }}
            >
              <span className="rc-ch-num">{ch.order_number}</span>
              <span className="rc-ch-title">{ch.title}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Top Bar */}
      <div className="rc-topbar">
        <button className="rc-back-btn" onClick={() => navigate(`/books/${bookId}`)}>
          ← Kitaba Dön
        </button>
        <button className="rc-toc-btn" onClick={() => setSidebarOpen(true)}>
          Bölümler ({chapters.length})
        </button>
      </div>

      {/* Chapter Content */}
      <div className="rc-content">
        <p className="rc-chapter-num">Bölüm {chapter.order_number}</p>
        <h1 className="rc-title">{chapter.title}</h1>
        <div className="rc-divider" />

        <div className="rc-body">
          {paragraphs.length === 0 ? (
            <p className="rc-empty">Bu bölümde henüz içerik yok.</p>
          ) : (
            paragraphs.map((para, i) => {
              const paraCmts = commentsForPara(i);
              const isActive = activePanel?.index === i;
              return (
                <div key={i} className="rc-para-wrap">
                  {/* Paragraf + yorum butonu */}
                  <div className={`rc-para-row ${isActive ? "active" : ""}`}>
                    <p className="rc-para-text" onClick={() => handleParagraphClick(i)}>
                      {para}
                    </p>
                    <button
                      className={`rc-comment-icon ${paraCmts.length > 0 ? "has-comments" : ""} ${isActive ? "active" : ""}`}
                      onClick={() => handleParagraphClick(i)}
                      title="Yorumları gör / Yaz"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ display: "block" }}
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      {paraCmts.length > 0 && (
                        <span className="rc-comment-count">{paraCmts.length}</span>
                      )}
                    </button>
                  </div>

                  {/* Yorum Paneli */}
                  {isActive && (
                    <div className="rc-comment-panel">
                      {/* Mevcut yorumlar */}
                      {paraCmts.length > 0 && (
                        <div className="rc-comments-list">
                          {paraCmts.map((cmt) => (
                            <div
                              key={cmt.id}
                              className={`rc-comment-item ${cmt.parent_id ? "rc-reply-item" : ""}`}
                            >
                              <div className="rc-comment-avatar">
                                {cmt.username?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="rc-comment-body">
                                <div className="rc-comment-header">
                                  <span className="rc-comment-username">{cmt.username}</span>
                                  <span className="rc-comment-date">{formatDate(cmt.created_at)}</span>

                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {currentUser && Number(currentUser.id) === Number(cmt.user_id) && (
                                      <button
                                        className="rc-comment-delete"
                                        onClick={() => handleDeleteComment(cmt.id)}
                                        title="Yorumumu Sil"
                                      >
                                        Sil
                                      </button>
                                    )}

                                    {/* Kullanıcıyı Engelle Butonu */}
                                    {currentUser && Number(currentUser.id) !== Number(cmt.user_id) && (
                                      <button
                                        className="rc-comment-block-btn"
                                        onClick={() =>
                                          setConfirmBlockUser({
                                            identifier: cmt.user_id || cmt.username,
                                            name: cmt.username,
                                          })
                                        }
                                        title="Bu kullanıcıyı engelle"
                                      >
                                        Engelle
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="rc-comment-text">
                                  {cmt.content.startsWith("@") ? (
                                    <>
                                      <span className="rc-mention">{cmt.content.split(" ")[0]}</span>
                                      {" " + cmt.content.split(" ").slice(1).join(" ")}
                                    </>
                                  ) : (
                                    cmt.content
                                  )}
                                </p>

                                {/* Yanıtla Butonu */}
                                {currentUser && (
                                  <button
                                    className="rc-reply-btn"
                                    onClick={() => handleReplyClick(cmt.id, cmt.username)}
                                  >
                                    Yanıtla
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Yorum / Yanıt Yazma Alanı */}
                      {currentUser ? (
                        <div className="rc-comment-input-wrap">
                          <div className="rc-comment-avatar">
                            {currentUser.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="rc-comment-input-area">
                            {/* Küfür / Topluluk Kuralı Uyarısı */}
                            {profanityWarning && (
                              <div className="rc-profanity-alert">
                                <span>{profanityWarning}</span>
                              </div>
                            )}

                            {/* Yanıt bilgisi */}
                            {replyTarget && (
                              <div className="rc-reply-indicator">
                                <span>@{replyTarget.username} kullanıcısına yanıt veriliyor</span>
                                <button
                                  onClick={() => {
                                    setReplyTarget(null);
                                    setCommentText("");
                                    setProfanityWarning("");
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            <textarea
                              className="rc-comment-textarea"
                              placeholder={
                                replyTarget
                                  ? "Yanıtınızı yazın..."
                                  : "Bu paragraf hakkında düşüncenizi paylaşın..."
                              }
                              value={commentText}
                              onChange={(e) => {
                                setCommentText(e.target.value);
                                if (profanityWarning) setProfanityWarning("");
                              }}
                              rows={2}
                            />
                            <div className="rc-comment-actions">
                              <button
                                className="rc-comment-cancel"
                                onClick={() => {
                                  setActivePanel(null);
                                  setReplyTarget(null);
                                  setProfanityWarning("");
                                }}
                              >
                                İptal
                              </button>
                              <button
                                className="rc-comment-submit"
                                onClick={() => handleSubmit(i)}
                                disabled={!commentText.trim() || submitting}
                              >
                                {submitting ? "..." : replyTarget ? "Yanıtla" : "Gönder"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="rc-login-hint">
                          Yorum yapmak için{" "}
                          <span onClick={() => navigate("/login")}>giriş yapın</span>.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Alt Gezinme Butonları */}
      <div className="rc-nav">
        <button
          className="rc-nav-btn rc-nav-prev"
          onClick={() => prevChapter && navigate(`/books/${bookId}/read/${prevChapter.id}`)}
          disabled={!prevChapter}
        >
          <span className="rc-nav-arrow">←</span>
          <span className="rc-nav-info">
            <span className="rc-nav-label">Önceki Bölüm</span>
            <span className="rc-nav-name">{prevChapter ? prevChapter.title : "—"}</span>
          </span>
        </button>
        <button
          className="rc-nav-btn rc-nav-next"
          onClick={() => nextChapter && navigate(`/books/${bookId}/read/${nextChapter.id}`)}
          disabled={!nextChapter}
        >
          <span className="rc-nav-info">
            <span className="rc-nav-label">Sonraki Bölüm</span>
            <span className="rc-nav-name">{nextChapter ? nextChapter.title : "—"}</span>
          </span>
          <span className="rc-nav-arrow">→</span>
        </button>
      </div>

      {/* Kullanıcı Engelleme Onay Modalı */}
      {confirmBlockUser && (
        <div className="apm-backdrop" onClick={() => setConfirmBlockUser(null)}>
          <div className="apm-card" onClick={(e) => e.stopPropagation()}>
            <div
              className="apm-icon-wrapper"
              style={{ background: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
            <h3 className="apm-title">Kullanıcıyı Engelle</h3>
            <p className="apm-message">
              <strong>@{confirmBlockUser.name}</strong> adlı kullanıcıyı engellemek istediğinize emin misiniz?
              <br />
              Bu kullanıcının yaptığı tüm yorumlar sizin için anında gizlenecektir.
            </p>
            <div className="apm-actions">
              <button
                className="apm-btn apm-btn-primary"
                style={{ background: "#DC2626", color: "#FFFFFF" }}
                onClick={handleBlockConfirm}
              >
                Evet, Kullanıcıyı Engelle
              </button>
              <button className="apm-btn-cancel" onClick={() => setConfirmBlockUser(null)}>
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
