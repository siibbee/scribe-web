import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const STRICT_PROFANITY_PATTERNS = [
  /\b(a[\s.*_-]*m[\s.*_-]*k|a[\s.*_-]*q|a[\s.*_-]*m[\s.*_-]*q)\b/i,
  /\b(o[\s.*_-]*r[\s.*_-]*o[\s.*_-]*s[\s.*_-]*p[\s.*_-]*u)[\w]*/i,
  /\borospu[\w]*/i,
  /\bp[iİ*]ç[\w]*/i,
  /\b(s[\s.*_-]*[iİ1*][\s.*_-]*k)(?:[iİe][a-z0-9]*)?\b/i,
  /\bsik(?:tir|ik|erim|eyim|tim|iş|eceğim|ici)[\w]*/i,
  /\byarr?ak[\w]*/i,
  /\b(g[\s.*_-]*ö[\s.*_-]*t)(?:ten|ü|e|ün|veren|oğlanı|oğlan)?\b/i,
  /\bgöt[\w]*/i,
  /\bamcık[\w]*/i,
  /\byavşak[\w]*/i,
  /\bpezevenk[\w]*/i,
  /\bkahpe[\w]*/i,
  /\bibne[\w]*/i,
  /\bgavat[\w]*/i,
  /\bpuşt[\w]*/i,
  /\bsürtük[\w]*/i,
  /\bfuck[\w]*/i,
  /\bbitch[\w]*/i,
  /\basshole[\w]*/i,
];

function isProfane(text) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return STRICT_PROFANITY_PATTERNS.some((pat) => pat.test(normalized));
}

// Yorum ekle
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { chapter_id, paragraph_index, username, content, parent_id } = req.body;
    const user_id = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Yorum içeriği boş olamaz" });
    }

    // Küfür & Nefret Söylemi Filtresi
    if (isProfane(content)) {
      return res.status(400).json({
        message: "Yorumunuz topluluk kurallarına aykırı uygunsuz ifadeler içeriyor.",
      });
    }

    let authorName = username;
    if (!authorName) {
      const uRes = await pool.query("SELECT username FROM users WHERE id = $1", [user_id]);
      authorName = uRes.rows[0]?.username || "Okur";
    }

    const result = await pool.query(
      `INSERT INTO comments (chapter_id, paragraph_index, user_id, username, content, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [chapter_id, Number(paragraph_index) || 0, user_id, authorName, content.trim(), parent_id ? Number(parent_id) : null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("COMMENT CREATE ERROR:", err);
    res.status(500).json({ message: "Yorum eklenemedi: " + (err.message || "") });
  }
});

// Bölümün yorumlarını getir
router.get("/chapter/:chapter_id", async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM comments WHERE chapter_id = $1 ORDER BY created_at ASC`,
      [chapter_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    res.status(500).json({ message: "Yorumlar getirilemedi" });
  }
});

// Yorum sil
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Yorum bulunamadı veya yetkiniz yok" });
    }
    res.json({ message: "Yorum silindi" });
  } catch (err) {
    console.error("DELETE COMMENT ERROR:", err);
    res.status(500).json({ message: "Yorum silinemedi" });
  }
});

export default router;
