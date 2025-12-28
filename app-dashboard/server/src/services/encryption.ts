/**
 * Simple Encryption Service
 * Uses Base64 encoding with a simple XOR cipher for API key storage
 * Note: For production, use proper encryption libraries like crypto-js or node's crypto module
 */

// Simple encryption key - in production, use environment variable
const ENCRYPTION_KEY = 'app-dashboard-secret-key-2024';

/**
 * Encrypt a string value
 * Uses XOR cipher with Base64 encoding
 */
export function encrypt(value: string): string {
  if (!value) return '';

  let result = '';
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }

  return Buffer.from(result).toString('base64');
}

/**
 * Decrypt an encrypted string value
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return '';

  try {
    const decoded = Buffer.from(encrypted, 'base64').toString();
    let result = '';

    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }

    return result;
  } catch {
    console.error('Failed to decrypt value');
    return '';
  }
}

/**
 * Validate Anthropic API key format
 * Anthropic API keys start with 'sk-ant-'
 */
export function validateAnthropicApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  return key.startsWith('sk-ant-') && key.length > 20;
}
