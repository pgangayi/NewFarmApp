/**
 * Cryptographic utilities for secure token storage
 * Provides encoding/decoding with salt-based obfuscation
 */

/**
 * AuthUtils provides encoding/decoding for secure token storage
 */
export class AuthUtils {
  private static readonly SALT_LENGTH = 16;
  private static readonly SECRET_KEY = 'farmmanager_secure_2025_encoding';

  /**
   * Generates a random salt
   */
  private static generateSalt(): Uint8Array {
    const salt = new Uint8Array(AuthUtils.SALT_LENGTH);
    crypto.getRandomValues(salt);
    return salt;
  }

  /**
   * Encodes data with salt for basic obfuscation
   */
  static encode(data: string): string {
    if (!data) {
      return '';
    }

    try {
      // Generate random salt
      const salt = this.generateSalt();

      // Create a simple obfuscation key from secret
      const encoder = new TextEncoder();
      const secretBytes = encoder.encode(AuthUtils.SECRET_KEY);
      const dataBytes = encoder.encode(data);

      // Simple XOR obfuscation with salt
      const obfuscated = new Uint8Array(Math.max(salt.length, dataBytes.length));
      for (let i = 0; i < obfuscated.length; i++) {
        const saltByte = salt[i % salt.length] || 0;
        const secretByte = secretBytes[i % secretBytes.length] || 0;
        const dataByte = dataBytes[i % dataBytes.length] || 0;

        // Triple XOR for better obfuscation
        obfuscated[i] = saltByte ^ secretByte ^ dataByte;
      }

      // Combine salt and obfuscated data
      const combined = new Uint8Array(salt.length + obfuscated.length);
      combined.set(salt, 0);
      combined.set(obfuscated, salt.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encoding failed:', error);
      // Fallback to simple base64
      return btoa(data);
    }
  }

  /**
   * Decodes data that was encoded with salt
   */
  static decode(encodedData: string): string | null {
    if (!encodedData) {
      return null;
    }

    try {
      // Decode from base64
      const combined = Uint8Array.from(atob(encodedData), c => c.charCodeAt(0));

      if (combined.length < AuthUtils.SALT_LENGTH) {
        throw new Error('Invalid encoded data format');
      }

      // Extract salt and data
      const salt = combined.slice(0, AuthUtils.SALT_LENGTH);
      const obfuscated = combined.slice(AuthUtils.SALT_LENGTH);

      // Create secret bytes
      const encoder = new TextEncoder();
      const secretBytes = encoder.encode(AuthUtils.SECRET_KEY);

      // Reverse the obfuscation
      const dataBytes = new Uint8Array(obfuscated.length);
      for (let i = 0; i < obfuscated.length; i++) {
        const saltByte = salt[i % salt.length] || 0;
        const secretByte = secretBytes[i % secretBytes.length] || 0;
        const obfuscatedByte = obfuscated[i] || 0;

        // Reverse the triple XOR
        dataBytes[i] = saltByte ^ secretByte ^ obfuscatedByte;
      }

      // Convert back to string
      return new TextDecoder().decode(dataBytes);
    } catch (error) {
      console.error('Decoding failed:', error);
      // Try simple base64 fallback
      try {
        return atob(encodedData);
      } catch {
        return null;
      }
    }
  }

  /**
   * Securely compares two strings to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generates a cryptographically secure random token
   */
  static generateSecureToken(length: number = 64): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    // Convert to base64url for URL-safe token
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Creates a hash of sensitive data using SHA-256
   */
  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sanitizes sensitive data before logging
   */
  static sanitizeForLogging(data: string): string {
    if (!data) return '';

    // Mask email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    return data.replace(emailRegex, '[EMAIL_MASKED]');
  }
}

// Export utility functions
export const CryptoUtils = {
  /**
   * Encode data synchronously
   */
  encode: (data: string): string => AuthUtils.encode(data),

  /**
   * Decode data synchronously
   */
  decode: (encodedData: string): string | null => AuthUtils.decode(encodedData),

  /**
   * Generate secure random token
   */
  generateToken: (length?: number): string => AuthUtils.generateSecureToken(length),

  /**
   * Hash data asynchronously
   */
  hash: (data: string): Promise<string> => AuthUtils.hash(data),

  /**
   * Secure string comparison
   */
  secureCompare: (a: string, b: string): boolean => AuthUtils.secureCompare(a, b),
};
