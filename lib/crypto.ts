// Encryption utilities for API key storage

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM

// Encrypt API key
export async function encryptApiKey(
  plaintext: string,
  encryptionKey: string
): Promise<{ encrypted: string; iv: string }> {
  // Derive key from secret using SHA-256
  const keyData = new TextEncoder().encode(encryptionKey);
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: ALGORITHM },
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the plaintext
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintextBytes
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

// Decrypt API key
export async function decryptApiKey(
  encrypted: string,
  iv: string,
  encryptionKey: string
): Promise<string> {
  // Derive key from secret using SHA-256
  const keyData = new TextEncoder().encode(encryptionKey);
  const keyHash = await crypto.subtle.digest('SHA-256', keyData);
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: ALGORITHM },
    false,
    ['decrypt']
  );

  // Decode base64
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes },
    key,
    cipherBytes
  );

  return new TextDecoder().decode(plaintext);
}

// Mask API key for display (show first 4 and last 4 characters)
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) return '****';
  return `${apiKey.slice(0, 4)}${'*'.repeat(apiKey.length - 8)}${apiKey.slice(-4)}`;
}
