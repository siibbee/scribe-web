import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    let queryText = "SELECT id, username, email FROM users ORDER BY username ASC";
    if (req.query.has_book === "true") {
      queryText = `
        SELECT u.id, u.username, u.email,
               COUNT(b.id)::int as book_count
        FROM users u 
        JOIN books b ON u.id = b.author_id 
        GROUP BY u.id, u.username, u.email
        ORDER BY book_count DESC, u.username ASC
      `;
    }
    const result = await pool.query(queryText);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
