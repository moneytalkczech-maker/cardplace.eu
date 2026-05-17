// Magic byte signatures pro povolené formát
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])], // RIFF....WEBP
};

const ALLOWED_TYPES = Object.keys(MAGIC_BYTES);

/**
 * Ověří, že soubor má očekávaný formát pomocí magic bytes (hlavičky souboru).
 * @param buffer Prvních 16+ bytů souboru
 * @param mimeType MIME typ deklarovaný klientem
 * @returns true pokud soubor odpovídá deklarovanému typu
 */
export function validateFileType(buffer: Buffer, mimeType: string): boolean {
  if (!ALLOWED_TYPES.includes(mimeType)) return false;

  const signatures = MAGIC_BYTES[mimeType];
  return signatures.some((sig) => {
    if (buffer.length < sig.length) return false;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) return false;
    }
    return true;
  });
}

export function getAllowedMimeTypes(): string[] {
  return [...ALLOWED_TYPES];
}
