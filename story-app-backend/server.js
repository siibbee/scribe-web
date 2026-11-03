import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes    from "./routes/auth.js";
import bookRoutes    from "./routes/books.js";
import uploadRoutes  from "./routes/upload.js";
import chapterRoutes from "./routes/chapters.js";
import commentRoutes from "./routes/comments.js";
import userRoutes    from "./routes/users.js";
import errorHandler  from "./middleware/errorHandler.js";

const app = express();

// Render / Cloudflare ters vekil (reverse proxy) arkasında doğru IP tespiti için
app.set("trust proxy", 1);

// HTTP Güvenlik Başlıkları (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));

// Genel API Hız Sınırlaması: IP başına 1 dakikada maks 150 istek (DDoS ve bot koruması)
const globalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  message: { error: "Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalApiLimiter);

// Sağlık kontrolü (Health check)
app.get("/", (req, res) => {
  res.json({ status: "online", message: "Scribe API Sunucusu Çalışıyor 🚀" });
});

app.use("/api/auth",     authRoutes);
app.use("/api/books",    bookRoutes);
app.use("/api/upload",   uploadRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users",    userRoutes);

// Tüm route'lardan sonra Error Handler eklenmeli
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
