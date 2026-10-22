import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Bölüm ekle
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { book_id, title, content, order_number } = req.body;
    
    // Kitabın sahibi doğrulanıyor
    const bookCheck = await pool.query("SELECT id FROM books WHERE id = $1 AND author_id = $2", [book_id, req.user.id]);
    if (bookCheck.rows.length === 0) {
      return res.status(403).json({ message: "Bu kitaba bölüm ekleme yetkiniz yok" });
    }

    const result = await pool.query(
      `INSERT INTO chapters (book_id, title, content, order_number)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [book_id, title, content || null, order_number]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("CHAPTER CREATE ERROR:", error);
    res.status(500).json({ message: "Bölüm oluşturulamadı" });
  }
});

// En son eklenen bölümler (kitap adıyla birlikte)
router.get("/latest", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.title AS chapter_title, c.content, c.created_at,
              b.id AS book_id, b.title AS book_title, b.category AS book_category, b.cover_url AS book_cover_url
       FROM chapters c
       JOIN books b ON c.book_id = b.id
       ORDER BY c.created_at DESC
       LIMIT 15`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("LATEST CHAPTERS ERROR:", error);
    res.status(500).json({ message: "Son bölümler getirilemedi" });
  }
});

// Kitabın bölümlerini getir
router.get("/book/:book_id", authMiddleware, async (req, res) => {
  try {
    const { book_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM chapters WHERE book_id = $1 ORDER BY order_number ASC`,
      [book_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET CHAPTERS ERROR:", error);
    res.status(500).json({ message: "Bölümler getirilemedi" });
  }
});

// Tekil bölüm getir
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM chapters WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Bölüm bulunamadı" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET CHAPTER ERROR:", error);
    res.status(500).json({ message: "Bölüm getirilemedi" });
  }
});

// Bölüm güncelle
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, order_number } = req.body;
    const result = await pool.query(
      `UPDATE chapters SET title=$1, content=$2, order_number=$3 WHERE id=$4 AND book_id IN (SELECT id FROM books WHERE author_id=$5) RETURNING *`,
      [title, content || null, order_number, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Bölüm bulunamadı veya yetkiniz yok" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("UPDATE CHAPTER ERROR:", error);
    res.status(500).json({ message: "Bölüm güncellenemedi" });
  }
});

// Bölüm sil
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM chapters WHERE id = $1 AND book_id IN (SELECT id FROM books WHERE author_id=$2) RETURNING id`, [id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Bölüm bulunamadı veya yetkiniz yok" });
    res.json({ message: "Bölüm silindi" });
  } catch (error) {
    console.error("DELETE CHAPTER ERROR:", error);
    res.status(500).json({ message: "Bölüm silinemedi" });
  }
});

export default router;