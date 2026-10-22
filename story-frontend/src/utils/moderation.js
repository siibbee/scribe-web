/**
 * Scribe Moderasyon ve Kullanıcı Engelleme Yöneticisi
 */

const STORAGE_KEY = 'Scribe_blocked_users';

/**
 * Engellenen kullanıcılar listesini getirir.
 * @returns {Array<{identifier: string|number, name: string, blockedAt: string}>}
 */
export function getBlockedUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load blocked users:', err);
    return [];
  }
}

/**
 * Bir kullanıcıyı engeller.
 * @param {{ identifier: string|number, name: string }} userToBlock
 */
export function blockUser({ identifier, name }) {
  if (!identifier) return false;
  try {
    const list = getBlockedUsers();
    const idStr = String(identifier).toLowerCase();
    
    // Zaten engelliyse güncelle
    const exists = list.some((u) => String(u.identifier).toLowerCase() === idStr);
    if (!exists) {
      list.unshift({
        identifier,
        name: name || 'Kullanıcı',
        blockedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    return true;
  } catch (err) {
    console.error('Failed to block user:', err);
    return false;
  }
}

/**
 * Bir kullanıcının engelini kaldırır.
 * @param {string|number} identifier
 */
export function unblockUser(identifier) {
  if (!identifier) return false;
  try {
    const list = getBlockedUsers();
    const idStr = String(identifier).toLowerCase();
    const filtered = list.filter((u) => String(u.identifier).toLowerCase() !== idStr);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to unblock user:', err);
    return false;
  }
}

/**
 * Bir kullanıcının engellenip engellenmediğini kontrol eder.
 * @param {string|number} identifier
 * @returns {boolean}
 */
export function isUserBlocked(identifier) {
  if (!identifier) return false;
  const list = getBlockedUsers();
  const idStr = String(identifier).toLowerCase();
  return list.some((u) => String(u.identifier).toLowerCase() === idStr);
}

