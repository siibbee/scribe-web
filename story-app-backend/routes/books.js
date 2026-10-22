import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Tüm kitapları getir (herkese açık)
router.get("/all", async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
       SELECT b.*, u.username as author_username,
              COALESCE((SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id), 0)::int as chapter_count
       FROM books b
       LEFT JOIN users u ON b.author_id = u.id
    `;
    const params = [];
    
    if (search && search.trim() !== "") {
      const searchTerms = search.trim().split(/\s+/);
      const conditions = [];

      searchTerms.forEach((term) => {
        params.push(`%${term}%`);
        const p = `$${params.length}`;
        // YALNIZCA kitap başlığında arama yapıyoruz:
        conditions.push(`b.title ILIKE ${p}`);
      });

      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += ` ORDER BY b.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("GET ALL BOOKS ERROR:", error);
    res.status(500).json({ message: "Kitaplar getirilemedi" });
  }
});

// Kullanıcının kitapları
router.get("/my-books/:author_id", async (req, res) => {
  try {
    const { author_id } = req.params;
    const result = await pool.query(
      `SELECT b.*, u.username as author_username
       FROM books b
       LEFT JOIN users u ON b.author_id = u.id
       WHERE b.author_id = $1
       ORDER BY b.created_at DESC`,
      [author_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("MY BOOKS ERROR:", error);
    res.status(500).json({ message: "Kitaplar getirilemedi" });
  }
});

// Kitap oluştur
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, status, cover_url } = req.body;
    const author_id = req.user.id; // Token'dan alıyoruz
    const result = await pool.query(
      `INSERT INTO books (title, description, category, status, author_id, cover_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description || null, category || null, status || "active", author_id, cover_url || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("CREATE BOOK ERROR:", error);
    res.status(500).json({ message: "Kitap oluşturulamadı" });
  }
});

// Tekil kitap getir (yazar adıyla)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*, u.username as author_username
       FROM books b
       LEFT JOIN users u ON b.author_id = u.id
       WHERE b.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Kitap bulunamadı" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("GET BOOK ERROR:", error);
    res.status(500).json({ message: "Kitap getirilemedi" });
  }
});

// Kitap güncelle
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, cover_url } = req.body;
    const result = await pool.query(
      `UPDATE books SET title=$1, description=$2, category=COALESCE($3, category), cover_url=$4 WHERE id=$5 AND author_id=$6 RETURNING *`,
      [title, description, category || null, cover_url || null, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Kitap bulunamadı veya yetkiniz yok" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("UPDATE BOOK ERROR:", error);
    res.status(500).json({ message: "Kitap güncellenemedi" });
  }
});

// Kitap sil
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const bookCheck = await pool.query("SELECT id FROM books WHERE id = $1 AND author_id = $2", [id, req.user.id]);
    if (bookCheck.rows.length === 0) return res.status(404).json({ message: "Kitap bulunamadı veya yetkiniz yok" });

    await pool.query("DELETE FROM comments WHERE chapter_id IN (SELECT id FROM chapters WHERE book_id = $1)", [id]);
    await pool.query("DELETE FROM chapters WHERE book_id = $1", [id]);
    await pool.query("DELETE FROM books WHERE id = $1 AND author_id = $2", [id, req.user.id]);
    res.json({ message: "Kitap silindi" });
  } catch (error) {
    console.error("DELETE BOOK ERROR:", error);
    res.status(500).json({ message: "Kitap silinemedi" });
  }
});


// Kitap okunma sayısını artır (Her bölüm sadece 1 kez sayılır)
router.post("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { chapter_id, user_id } = req.body || {};

    // Kullanıcı giriş yapmışsa ve chapter_id varsa: Tekilleştirme tablosuyla kontrol et
    if (chapter_id && user_id) {
      const check = await pool.query(
        "INSERT INTO user_chapter_reads (user_id, chapter_id) VALUES ($1, $2) ON CONFLICT (user_id, chapter_id) DO NOTHING RETURNING id",
        [Number(user_id), Number(chapter_id)]
      );
      // Daha önce okunduysa sayacı artırma
      if (check.rows.length === 0) {
        return res.json({ message: "Bu bölüm daha önce sayıldı", alreadyRead: true });
      }
    }

    const result = await pool.query(
      `UPDATE books SET read_count = COALESCE(read_count, 0) + 1 WHERE id = $1 RETURNING id, read_count`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Kitap bulunamadı" });

    res.json({ message: "Okunma sayısı artırıldı", read_count: result.rows[0].read_count });
  } catch (error) {
    console.error("INCREMENT READ COUNT ERROR:", error);
    res.status(500).json({ message: "Okunma sayısı artırılamadı" });
  }
});

export default router;