import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const connStr = process.env.DATABASE_URL;

if (!connStr) {
  console.error("KRİTİK HATA: DATABASE_URL ortam değişkeni (.env) bulunamadı!");
}

const pool = new Pool({
  connectionString: connStr,
});

export default pool;
