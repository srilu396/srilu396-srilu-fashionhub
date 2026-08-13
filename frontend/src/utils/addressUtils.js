/**
 * Address management & sanitization utilities for SRILU FashionHub
 */

/**
 * Safely sanitize address list:
 * - Filters out corrupted, empty name, or empty line1 placeholder records.
 * - Normalizes missing optional fields.
 * - Enforces single default address rule:
 *   - 0 addresses => 0 defaults
 *   - 1+ valid addresses => exactly 1 default address
 *
 * @param {Array} addresses - List of address objects
 * @returns {Array} Sanitized addresses
 */
export const sanitizeAddresses = (addresses) => {
  if (!Array.isArray(addresses)) return [];

  // 1. Filter out malformed/empty test entries
  const valid = addresses.filter(addr => {
    if (!addr || typeof addr !== 'object') return false;
    const name = (addr.name || '').trim();
    const line1 = (addr.line1 || addr.address || '').trim();
    // Allow valid if name and line1 are present
    return name.length > 0 && line1.length > 0;
  });

  if (valid.length === 0) return [];

  // 2. Enforce single default rule
  let hasDefault = false;
  const sanitized = valid.map((addr, idx) => {
    const isDefault = Boolean(addr.isDefault);
    if (isDefault && !hasDefault) {
      hasDefault = true;
      return { ...addr, isDefault: true };
    }
    return { ...addr, isDefault: false };
  });

  // If valid addresses exist but none was default, set the first address as default
  if (!hasDefault && sanitized.length > 0) {
    sanitized[0].isDefault = true;
  }

  return sanitized;
};

/**
 * Set target address as default and unset all others.
 *
 * @param {Array} addresses
 * @param {String} targetId
 * @returns {Array} Updated addresses
 */
export const setDefaultAddress = (addresses, targetId) => {
  if (!Array.isArray(addresses)) return [];
  return addresses.map(addr => ({
    ...addr,
    isDefault: addr.id === targetId
  }));
};
