// Encryption utilities for sensitive data at rest
// Uses AES-256-GCM for encryption
// Date: January 22, 2026

export class DataEncryption {
  constructor(env) {
    // Use a derived key from environment secret
    this.keyPromise = this.deriveKey(env.JWT_SECRET || "fallback_secret_key");
  }

  // Derive encryption key from JWT secret. Use Node's crypto when available for deterministic behavior in tests,
  // otherwise fall back to Web Crypto API (for Workers runtime compatibility).
  async deriveKey(secret) {
    try {
      const nodeCrypto = require("crypto");
      // Use SHA-256 of secret + salt as 32-byte key (simple and deterministic for tests)
      const keyBuffer = nodeCrypto
        .createHash("sha256")
        .update(secret + "encryption_salt")
        .digest();
      return keyBuffer; // Buffer used by Node encrypt/decrypt paths
    } catch (e) {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"],
      );

      return crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: encoder.encode("encryption_salt"), // Fixed salt for key derivation
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
    }
  }

  // Encrypt data (uses Node crypto when available, otherwise Web Crypto API)
  async encrypt(plainText) {
    const key = await this.keyPromise;

    // Node crypto path (Buffer key)
    try {
      const nodeCrypto = require("crypto");
      const iv = nodeCrypto.randomBytes(12);
      const cipher = nodeCrypto.createCipheriv("aes-256-gcm", key, iv);
      const ciphertext = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      return (
        iv.toString("hex") +
        ":" +
        authTag.toString("hex") +
        ":" +
        ciphertext.toString("hex")
      );
    } catch (e) {
      // Fallback to Web Crypto API
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        data,
      );

      const encryptedArray = new Uint8Array(encrypted);
      const authTag = encryptedArray.slice(-16); // Last 16 bytes are auth tag
      const ciphertext = encryptedArray.slice(0, -16);

      return (
        Array.from(iv)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("") +
        ":" +
        Array.from(authTag)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("") +
        ":" +
        Array.from(ciphertext)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    }
  }

  // Decrypt data using Web Crypto API
  async decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(":");
      if (!parts || parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
      }

      const ivMatch = parts[0].match(/.{2}/g);
      const authMatch = parts[1].match(/.{2}/g);
      let cipherMatch = parts[2].match(/.{2}/g);

      if (!ivMatch || !authMatch) {
        throw new Error("Invalid encrypted data format");
      }

      if (!cipherMatch) {
        cipherMatch = [];
      }

      const iv = new Uint8Array(ivMatch.map((byte) => parseInt(byte, 16)));
      const authTag = new Uint8Array(
        authMatch.map((byte) => parseInt(byte, 16)),
      );
      const ciphertext = new Uint8Array(
        cipherMatch.map((byte) => parseInt(byte, 16)),
      );

      // Combine ciphertext and auth tag
      const encrypted = new Uint8Array(ciphertext.length + authTag.length);
      encrypted.set(ciphertext);
      encrypted.set(authTag, ciphertext.length);

      const key = await this.keyPromise;

      // Prefer Node crypto decryption when available (deterministic in tests)
      try {
        const nodeCrypto = require("crypto");
        const ivBuf = Buffer.from(parts[0], "hex");
        const authBuf = Buffer.from(parts[1], "hex");
        const cipherBuf = Buffer.from(parts[2] || "", "hex");

        const decipher = nodeCrypto.createDecipheriv("aes-256-gcm", key, ivBuf);
        decipher.setAuthTag(authBuf);
        const decryptedBuf = Buffer.concat([
          decipher.update(cipherBuf),
          decipher.final(),
        ]);
        return decryptedBuf.toString("utf8");
      } catch (e) {
        // Fallback to Web Crypto API; ensure key is a CryptoKey
        let subtleKey = key;
        if (typeof key === "object" && Buffer.isBuffer(key)) {
          subtleKey = await crypto.subtle.importKey(
            "raw",
            key,
            { name: "AES-GCM" },
            false,
            ["decrypt"],
          );
        }

        const decrypted = await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          subtleKey,
          encrypted,
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
      }
    } catch (error) {
      // Preserve explicit invalid-format errors for callers/tests
      if (
        error &&
        error.message &&
        error.message.includes("Invalid encrypted data format")
      ) {
        throw error;
      }
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }
  // Encrypt object (serialize to JSON first)
  async encryptObject(obj) {
    return await this.encrypt(JSON.stringify(obj));
  }

  // Decrypt object (parse from JSON)
  async decryptObject(encryptedText) {
    const decrypted = await this.decrypt(encryptedText);
    return JSON.parse(decrypted);
  }
}

// Utility functions for backward compatibility
export async function encryptSensitiveData(data, env) {
  const encrypter = new DataEncryption(env);
  return await encrypter.encrypt(data);
}

export async function decryptSensitiveData(encryptedData, env) {
  const encrypter = new DataEncryption(env);
  return await encrypter.decrypt(encryptedData);
}
