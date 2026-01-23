/**
 * Unit tests for _encryption.js
 * Tests data encryption and decryption functionality
 */

import {
  DataEncryption,
  encryptSensitiveData,
  decryptSensitiveData,
} from "../api/_encryption.js";

describe("DataEncryption", () => {
  let encryption;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      JWT_SECRET: "test_jwt_secret_for_encryption_testing_12345",
    };
    encryption = new DataEncryption(mockEnv);
  });

  describe("deriveKey", () => {
    it("should derive a consistent key from secret", async () => {
      const key1 = await encryption.deriveKey("test_secret");
      const key2 = await encryption.deriveKey("test_secret");

      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
    });

    it("should derive different keys for different secrets", async () => {
      const key1 = await encryption.deriveKey("secret1");
      const key2 = await encryption.deriveKey("secret2");

      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
    });
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt text correctly", async () => {
      const originalText = "Hello, World! This is a test message.";

      const encrypted = await encryption.encrypt(originalText);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it("should encrypt and decrypt empty string", async () => {
      const originalText = "";

      const encrypted = await encryption.encrypt(originalText);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it("should encrypt and decrypt special characters", async () => {
      const originalText = "Special chars: àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";

      const encrypted = await encryption.encrypt(originalText);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it("should produce different encrypted outputs for same input", async () => {
      const originalText = "Same input text";

      const encrypted1 = await encryption.encrypt(originalText);
      const encrypted2 = await encryption.encrypt(originalText);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same text
      const decrypted1 = await encryption.decrypt(encrypted1);
      const decrypted2 = await encryption.decrypt(encrypted2);

      expect(decrypted1).toBe(originalText);
      expect(decrypted2).toBe(originalText);
    });

    it("should fail to decrypt invalid format", async () => {
      await expect(encryption.decrypt("invalid")).rejects.toThrow(
        "Invalid encrypted data format",
      );
      await expect(encryption.decrypt("part1:part2")).rejects.toThrow(
        "Invalid encrypted data format",
      );
      await expect(
        encryption.decrypt("part1:part2:part3:part4"),
      ).rejects.toThrow("Invalid encrypted data format");
    });

    it("should fail to decrypt corrupted data", async () => {
      const originalText = "Test message";
      const encrypted = await encryption.encrypt(originalText);

      // Corrupt the encrypted data
      const corrupted = encrypted.replace(/.$/, "x");

      await expect(encryption.decrypt(corrupted)).rejects.toThrow(
        "Failed to decrypt data",
      );
    });

    it("should fail to decrypt with wrong key", async () => {
      const originalText = "Test message";
      const encryption1 = new DataEncryption({ JWT_SECRET: "secret1" });
      const encryption2 = new DataEncryption({ JWT_SECRET: "secret2" });

      const encrypted = await encryption1.encrypt(originalText);

      await expect(encryption2.decrypt(encrypted)).rejects.toThrow(
        "Failed to decrypt data",
      );
    });
  });

  describe("encryptObject and decryptObject", () => {
    it("should encrypt and decrypt objects correctly", async () => {
      const originalObj = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
        active: true,
        nested: {
          address: "123 Main St",
          city: "Anytown",
        },
      };

      const encrypted = await encryption.encryptObject(originalObj);
      const decrypted = await encryption.decryptObject(encrypted);

      expect(decrypted).toEqual(originalObj);
    });

    it("should encrypt and decrypt arrays", async () => {
      const originalArray = [1, "two", { three: 3 }, [4, 5]];

      const encrypted = await encryption.encryptObject(originalArray);
      const decrypted = await encryption.decryptObject(encrypted);

      expect(decrypted).toEqual(originalArray);
    });

    it("should handle null and undefined values", async () => {
      const originalObj = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: "",
        zero: 0,
        false: false,
      };

      const encrypted = await encryption.encryptObject(originalObj);
      const decrypted = await encryption.decryptObject(encrypted);

      expect(decrypted).toEqual(originalObj);
    });
  });

  describe("utility functions", () => {
    it("should encrypt and decrypt using utility functions", async () => {
      const data = "Sensitive information";
      const env = { JWT_SECRET: "utility_test_secret" };

      const encrypted = await encryptSensitiveData(data, env);
      const decrypted = await decryptSensitiveData(encrypted, env);

      expect(decrypted).toBe(data);
    });

    it("should use different instances for utility functions", async () => {
      const data = "Test data";
      const env1 = { JWT_SECRET: "secret1" };
      const env2 = { JWT_SECRET: "secret2" };

      const encrypted = await encryptSensitiveData(data, env1);

      // Should fail with different secret
      await expect(decryptSensitiveData(encrypted, env2)).rejects.toThrow(
        "Failed to decrypt data",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle large data", async () => {
      const largeData = "A".repeat(10000); // 10KB of data

      const encrypted = await encryption.encrypt(largeData);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(largeData);
    });

    it("should handle unicode characters", async () => {
      const unicodeData =
        "🚀 Unicode test: 中文, русский, español, français, العربية";

      const encrypted = await encryption.encrypt(unicodeData);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(unicodeData);
    });

    it("should handle binary-like data in strings", async () => {
      const binaryLike = "\x00\x01\x02\x03\x04\x05\xFF\xFE\xFD";

      const encrypted = await encryption.encrypt(binaryLike);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(binaryLike);
    });
  });
});
