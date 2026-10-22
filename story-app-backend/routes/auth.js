import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import  pool from "../db.js";

const router = express.Router();

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh"),
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

/* REGISTER */

router.post("/register", async (req, res) => {

  try {

    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "E-posta, kullanıcı adı ve şifre zorunludur." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır." });
    }

    const lowercaseEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, username, password) VALUES ($1,$2,$3) RETURNING id",
      [lowercaseEmail, username, hashedPassword]
    );

    const { accessToken, refreshToken } = generateTokens(result.rows[0].id);

    res.status(201).json({
      user: {
        id: result.rows[0].id,
        email: lowercaseEmail,
        username
      },
      token: accessToken,
      refreshToken
    });

  } catch (err) {

    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Bu e-posta veya kullanıcı adı zaten kullanımda." });
    }
    res.status(500).json({ error: "Kayıt işlemi başarısız oldu." });

  }

});

/* LOGIN */

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve şifre zorunludur." });
    }

    const lowercaseEmail = email.toLowerCase();

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [lowercaseEmail]
    );

    const user = result.rows[0];

    // Ortak hata mesajı kullanıyoruz.
    if (!user) {
      return res.status(401).json({ error: "Geçersiz e-posta veya şifre." });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Geçersiz e-posta veya şifre." });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token: accessToken,
      refreshToken
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Giriş işlemi başarısız oldu." });

  }

});

/* REFRESH TOKEN */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token zorunludur." });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh");
    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      console.error("REFRESH TOKEN VERIFICATION ERROR:", err);
      return res.status(401).json({ error: "Geçersiz veya süresi dolmuş refresh token." });
    }

    const tokens = generateTokens(decoded.id);

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    res.status(500).json({ error: "Token yenileme işlemi başarısız oldu." });
  }
});

export default router;