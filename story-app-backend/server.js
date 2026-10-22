import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes    from "./routes/auth.js";
import bookRoutes    from "./routes/books.js";
import uploadRoutes  from "./routes/upload.js";
import chapterRoutes from "./routes/chapters.js";
import commentRoutes from "./routes/comments.js";
import userRoutes    from "./routes/users.js";
import errorHandler  from "./middleware/errorHandler.js";

const app = express();

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

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