// src/utils/coverHelper.js

/**
 * Kitap kapak URL'sini web ortamında doğru şekilde çözümler.
 * - Cloudinary veya harici tam URL'leri olduğu gibi döndürür.
 * - Mobil uygulamadan gelen hazır şablon kapak yollarını ('covers/zamanin_aynasi.jpg' vb.)
 *   web public klasöründeki statik dosyalara ('/covers/zamanin_aynasi.jpg') yönlendirir.
 */
export function getCoverUrl(coverUrl) {
  if (!coverUrl || typeof coverUrl !== "string") return null;
  const trimmed = coverUrl.trim();
  if (!trimmed) return null;

  // Tam URL ise (Cloudinary, Unsplash, http/https)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Ters bölüleri düz bölüye çevirip baştaki slash'ları temizle
  const normalized = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");

  // covers/ ile başlıyorsa başına / ekle
  if (normalized.startsWith("covers/")) {
    return `/${normalized}`;
  }

  // Sadece dosya adı verilmişse (ör: zamanin_aynasi.jpg)
  if (
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg") ||
    normalized.endsWith(".png") ||
    normalized.endsWith(".webp")
  ) {
    return `/covers/${normalized}`;
  }

  return `/${normalized}`;
}

