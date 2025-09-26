export function generateUUID(): string {
  const cryptoObj = globalThis?.crypto as Crypto | undefined;

  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);

    // Per RFC 4122 section 4.4
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1

    const toHex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${toHex.slice(0, 8)}-${toHex.slice(8, 12)}-${toHex.slice(12, 16)}-${toHex.slice(16, 20)}-${toHex.slice(20)}`;
  }

  // Final fallback – should rarely be used, but keeps the app functional in non-secure environments
  const randomSegment = (length: number) => Math.random().toString(16).slice(2, 2 + length).padEnd(length, '0');
  return `${randomSegment(8)}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(12)}`;
}
