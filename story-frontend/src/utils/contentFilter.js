/**
 * Scribe Küfür, Hakaret ve Topluluk Kuralları Filtresi
 * Türkçe ve İngilizce yaygın küfür, argo ve nefret söylemi tespiti.
 */

const STRICT_PROFANITY_PATTERNS = [
  // Türkçe Kökler ve Kısaltmalar
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
  /\b(a[\s.*_-]*m[\s.*_-]*c[\s.*_-]*[iİ1*][\s.*_-]*k)\b/i,
  /\byavşak[\w]*/i,
  /\bpezevenk[\w]*/i,
  /\bkahpe[\w]*/i,
  /\bibne[\w]*/i,
  /\bgavat[\w]*/i,
  /\bpuşt[\w]*/i,
  /\bsürtük[\w]*/i,
  /\btaşak[\w]*/i,
  /\bdaşşak[\w]*/i,
  /\boç\b/i,
  /\bo\.ç\b/i,

  // İngilizce Kökler
  /\bfuck[\w]*/i,
  /\b(f[\s.*_-]*u[\s.*_-]*c[\s.*_-]*k)[\w]*/i,
  /\bbitch[\w]*/i,
  /\b(b[\s.*_-]*i[\s.*_-]*t[\s.*_-]*c[\s.*_-]*h)[\w]*/i,
  /\basshole[\w]*/i,
  /\bcunt[\w]*/i,
  /\bwhore[\w]*/i,
  /\bslut[\w]*/i,
  /\bdickhead[\w]*/i,
  /\bpussy[\w]*/i,
  /\bmotherfucker[\w]*/i,
];

const COMPACT_KEYWORDS = [
  'orospu',
  'amcik',
  'yarrak',
  'pezevenk',
  'kahpe',
  'gavat',
  'surtuk',
  'siktir',
  'fuck',
  'bitch',
  'asshole',
  'motherfucker',
];

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's');
}

/**
 * Metnin küfür veya topluluk kurallarına aykırı ifade içerip içermediğini kontrol eder.
 * @param {string} text
 * @returns {boolean}
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;

  const normalized = normalizeText(text);

  // 1. Regex kalıpları
  for (const pattern of STRICT_PROFANITY_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // 2. Noktalama işaretlerini kaldırıp bitişik kelimeleri yakala (örneğin o.r.o.s.p.u)
  const compact = normalized.replace(/[^a-zçğışöü]/gi, '');
  for (const word of COMPACT_KEYWORDS) {
    if (compact.includes(word)) {
      return true;
    }
  }

  return false;
}

