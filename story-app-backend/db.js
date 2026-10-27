import pkg from "pg";
const { Pool } = pkg;

const UNIFIED_DATABASE_URL = "postgresql://neondb_owner:npg_vtSBVgKzj91W@ep-withered-wave-b11g5lg1-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Eski veritabanı (ep-green-wind) yerine ortak Neon DB (ep-withered-wave) kullanımı
const connStr = (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("ep-green-wind"))
  ? process.env.DATABASE_URL
  : UNIFIED_DATABASE_URL;

const pool = new Pool({
  connectionString: connStr,
});

export default pool;
