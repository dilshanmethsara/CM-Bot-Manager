/**
 * Phone number formatting utilities for Baileys
 * Baileys expects E.164 format WITHOUT the + prefix
 */

export function formatForPairing(phone: string): string {
  // Strip all non-digits, ensure no leading +
  const digits = phone.replace(/\D/g, '');
  return digits;
}

export function formatForJid(phone: string): string {
  const digits = formatForPairing(phone);
  return `${digits}@s.whatsapp.net`;
}

export function formatForDisplay(phone: string): string {
  const digits = formatForPairing(phone);
  // Format as +XX XXX XXX XXXX for display
  if (digits.length >= 10) {
    const countryCode = digits.slice(0, digits.length - 10);
    const national = digits.slice(digits.length - 10);
    return `+${countryCode} ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
  return `+${digits}`;
}

export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    return { valid: false, error: 'Phone number too short (minimum 10 digits)' };
  }

  if (digits.length > 15) {
    return { valid: false, error: 'Phone number too long (maximum 15 digits)' };
  }

  // Check if it starts with a valid country code (1-3 digits)
  // This is a basic check - in production you might want libphonenumber-js
  return { valid: true };
}

export function extractCountryCode(phone: string): string {
  const digits = formatForPairing(phone);
  // Assume last 10 digits are national number for US-like numbers
  // This is simplified - real implementation needs proper lib
  return digits.slice(0, -10);
}
