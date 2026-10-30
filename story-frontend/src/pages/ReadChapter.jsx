import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getBookById,
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

  const blocks = text.split(/\r?\n\s*\r?\n/);
  const result = [];
  const ABBREVS = ["dr", "prof", "av", "vb", "vs", "al"];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const oneLine = trimmed.replace(/\r?\n+/g, " ").replace(/\s+/g, " ");
    const rawSentences = oneLine.split(/(?<=[.!?…]["'”’)]?)\s+/);

    const merged = [];
    for (let i = 0; i < rawSentences.length; i++) {
      const s = rawSentences[i].trim();
      if (!s) continue;

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

  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Okuma punto boyutu (16px - 24px)
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(localStorage.getItem("@scribe_reader_font_size"));
    return saved >= 15 && saved <= 26 ? saved : 19;
  });

  // Aktif paragraf paneli: { index }
  const [activePanel, setActivePanel] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profanityWarning, setProfanityWarning] = useState("");

  // Engelleme modalı ve re-render tetikleyicisi
  const [confirmBlockUser, setConfirmBlockUser] = useState(null);
  const [, setBlockedTick] = useState(0);

  // Hangi yoruma yanıt verildiğini tutan state: { commentId, username }
  const [replyTarget, setReplyTarget] = useState(null);

  const changeFontSize = (delta) => {
    setFontSize((prev) => {
      const next = Math.min(24, Math.max(15, prev + delta));
      try {
        localStorage.setItem("@scribe_reader_font_size", String(next));
      } catch { }
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    setActivePanel(null);
    setReplyTarget(null);
    setProfanityWarning("");
    Promise.all([
      getChapterById(chapterId),
      getChaptersByBook(bookId),
      getCommentsByChapter(chapterId),
      getBookById(bookId).catch(() => ({ data: null })),
    ])
      .then(([{ data: ch }, { data: all }, { data: cmts }, { data: bk }]) => {
        setChapter(ch);
        setChapters(all);
        setComments(cmts);
        if (bk) setBook(bk);

        // Okuma Masan (@scribe_last_read) önbelleğini güncelle
        try {
          const idx = all.findIndex((item) => String(item.id) === String(ch.id));
          const orderNum = ch.order_number || (idx >= 0 ? idx + 1 : 1);
          const totalCh = all.length || 1;
          const pct = Math.min(100, Math.max(10, Math.round(((idx >= 0 ? idx + 1 : 1) / totalCh) * 100)));
          localStorage.setItem(
            "@scribe_last_read",
            JSON.stringify({
              bookId: Number(bookId),
              bookTitle: bk?.title || "Scribe Eseri",
              authorName: bk?.author_username || "Scribe Yazarı",
              coverUrl: bk?.cover_url || null,
              chapterId: ch.id,
              chapterTitle: ch.title,
              chapterOrder: orderNum,
              totalChapters: totalCh,
              progressPercent: pct,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch { }
      })
      .finally(() => setLoading(false));
  }, [chapterId, bookId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterId]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setScrollProgress(100);
      } else {
        setScrollProgress(Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100))));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [chapter]);

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
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const paragraphs = chapter.content
    ? splitIntoCommentParagraphs(chapter.content)
    : [];

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
    setBlockedTick((t) => t + 1);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  return (
    <div className="rc-page">
      {/* Üst Okuma İlerleme Çubuğu */}
      <div className="rc-progress-track">
        <div className="rc-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="rc-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Chapters Sidebar */}
      <aside className={`rc-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="rc-sidebar-header">
          <div>
            <span className="rc-sidebar-eyebrow">İÇİNDEKİLER</span>
            <span className="rc-sidebar-title">{book?.title || "Bölümler"}</span>
          </div>
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

      {/* Sticky Reader Top Bar */}
      <div className="rc-topbar">
        <div className="rc-topbar-inner">
          <button className="rc-back-btn" onClick={() => navigate(`/books/${bookId}`)}>
            <span>←</span>
            <span>{book?.title ? book.title : "Kitaba Dön"}</span>
          </button>

          <div className="rc-topbar-controls">
            {/* Punto Boyutu Kontrolleri */}
            <div className="rc-font-controls" title="Yazı Boyutunu Ayarla">
              <button type="button" className="rc-font-btn" onClick={() => changeFontSize(-1)}>
                A-
              </button>
              <span className="rc-font-val">{fontSize}</span>
              <button type="button" className="rc-font-btn" onClick={() => changeFontSize(1)}>
                A+
              </button>
            </div>

            <button className="rc-toc-btn" onClick={() => setSidebarOpen(true)}>
              <span>Bölümler ({chapters.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Content */}
      <article className="rc-content">
        <div className="rc-header-meta">
          <span className="rc-chapter-num">BÖLÜM {chapter.order_number}</span>
          <h1 className="rc-title">{chapter.title}</h1>
          {book?.author_username && (
            <p className="rc-book-author">{book.author_username}</p>
          )}
          <div className="rc-divider" />
        </div>

        <div className="rc-body">
          {paragraphs.length === 0 ? (
            <p className="rc-empty">Bu bölümde henüz içerik yok.</p>
          ) : (
            paragraphs.map((para, i) => {
              const paraCmts = commentsForPara(i);
              const isActive = activePanel?.index === i;
              return (
                <div key={i} className="rc-para-wrap">
                  <div className={`rc-para-row ${isActive ? "active" : ""}`}>
                    <p
                      className="rc-para-text"
                      style={{ fontSize: `${fontSize}px` }}
                      onClick={() => handleParagraphClick(i)}
                    >
                      {para}
                    </p>
                    <button
                      className={`rc-comment-icon ${paraCmts.length > 0 ? "has-comments" : ""} ${isActive ? "active" : ""}`}
                      onClick={() => handleParagraphClick(i)}
                      title="Satır arası yorumları gör / yaz"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
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
                      <div className="rc-comment-panel-head">
                        <span>SATIR ARASI YORUMLAR ({paraCmts.length})</span>
                        <button type="button" onClick={() => setActivePanel(null)}>✕</button>
                      </div>

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

                                  <div className="rc-comment-mod-btns">
                                    {currentUser && Number(currentUser.id) === Number(cmt.user_id) && (
                                      <button
                                        className="rc-comment-delete"
                                        onClick={() => handleDeleteComment(cmt.id)}
                                        title="Yorumumu Sil"
                                      >
                                        Sil
                                      </button>
                                    )}

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

                      {currentUser ? (
                        <div className="rc-comment-input-wrap">
                          <div className="rc-comment-avatar">
                            {currentUser.username?.[0]?.toUpperCase() || "O"}
                          </div>
                          <div className="rc-comment-input-area">
                            {profanityWarning && (
                              <div className="rc-profanity-alert">
                                <span>{profanityWarning}</span>
                              </div>
                            )}

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
                                Vazgeç
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
      </article>

      {/* Alt Gezinme Butonları */}
      <div className="rc-nav">
        <div className="rc-nav-inner">
          <button
            className="rc-nav-btn rc-nav-prev"
            onClick={() => prevChapter && navigate(`/books/${bookId}/read/${prevChapter.id}`)}
            disabled={!prevChapter}
          >
            <span className="rc-nav-arrow">←</span>
            <span className="rc-nav-info">
              <span className="rc-nav-label">Önceki Bölüm</span>
              <span className="rc-nav-name">{prevChapter ? prevChapter.title : "İlk Bölüm"}</span>
            </span>
          </button>
          <button
            className="rc-nav-btn rc-nav-next"
            onClick={() => nextChapter && navigate(`/books/${bookId}/read/${nextChapter.id}`)}
            disabled={!nextChapter}
          >
            <span className="rc-nav-info">
              <span className="rc-nav-label">Sonraki Bölüm</span>
              <span className="rc-nav-name">{nextChapter ? nextChapter.title : "Son Bölüm"}</span>
            </span>
            <span className="rc-nav-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Kullanıcı Engelleme Onay Modalı */}
      {confirmBlockUser && (
        <div className="apm-backdrop" onClick={() => setConfirmBlockUser(null)}>
          <div className="apm-card" onClick={(e) => e.stopPropagation()}>
            <div
              className="apm-icon-wrapper"
              style={{ background: "#FDF2F0", color: "#C93B2B", display: "flex", alignItems: "center", justifyContent: "center" }}
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
                style={{ background: "#C93B2B", color: "#FFFFFF" }}
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
