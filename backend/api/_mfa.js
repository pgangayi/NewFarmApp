// Multi-Factor Authentication (MFA) System
// TOTP-based 2FA implementation using Web Crypto API
// Date: November 12, 2025

import crypto from "crypto";

export class MFAManager {
  constructor(env) {
    this.env = env;
  }

  // Generate a new TOTP secret for user
  generateTOTPSecret() {
    // Generate 32-byte secret for Base32 encoding
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);

    // Convert to base32 for user-friendly sharing
    return this.base32Encode(secretBytes);
  }

  // Generate QR code data for authenticator apps
  generateQRCodeData(secret, email, issuer = "Farmers Boot") {
    const label = encodeURIComponent(`${issuer}:${email}`);
    const issuerEncoded = encodeURIComponent(issuer);

    // TOTP URI format: otpauth://totp/Label?secret=SECRET&issuer=ISSUER
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuerEncoded}&digits=6&period=30&algorithm=SHA1`;
  }

  // Verify TOTP code
  async verifyTOTP(userId, providedCode) {
    try {
      // Get user's TOTP secret
      const user = await this.getUserMFA(userId);
      if (!user || !user.totp_secret) {
        return {
          valid: false,
          error: "MFA not enabled for this user",
        };
      }

      // Check if TOTP is currently valid
      const isValid = this.validateTOTP(providedCode, user.totp_secret);

      if (isValid) {
        // Log successful MFA verification
        await this.logMFAAttempt(userId, true, "TOTP verification successful");

        return {
          valid: true,
          message: "MFA verification successful",
        };
      } else {
        // Log failed MFA attempt
        await this.logMFAAttempt(userId, false, "Invalid TOTP code provided");

        return {
          valid: false,
          error: "Invalid MFA code",
        };
      }
    } catch (error) {
      console.error("MFA verification error:", error);
      return {
        valid: false,
        error: "MFA verification failed",
      };
    }
  }

  // Enable MFA for user
  async enableMFA(userId, secret, verificationCode) {
    try {
      // Verify the provided code first
      const verification = this.validateTOTP(verificationCode, secret);
      if (!verification) {
        return {
          success: false,
          error: "Invalid verification code. Please try again.",
        };
      }

      // Update user with TOTP secret
      await this.env.DB.prepare(
        `
        UPDATE users 
        SET totp_secret = ?, mfa_enabled = 1, mfa_enabled_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
        .bind(secret, userId)
        .run();

      // Log MFA enablement
      await this.logSecurityEvent(
        "mfa_enabled",
        userId,
        {},
        {
          method: "TOTP",
          enabledAt: new Date().toISOString(),
        }
      );

      return {
        success: true,
        message: "MFA enabled successfully",
      };
    } catch (error) {
      console.error("MFA enablement error:", error);
      return {
        success: false,
        error: "Failed to enable MFA",
      };
    }
  }

  // Disable MFA for user
  async disableMFA(userId, verificationCode) {
    try {
      // Verify the provided code first
      const verification = await this.verifyTOTP(userId, verificationCode);
      if (!verification.valid) {
        return {
          success: false,
          error: "Invalid verification code",
        };
      }

      // Update user to disable MFA
      await this.env.DB.prepare(
        `
        UPDATE users 
        SET totp_secret = NULL, mfa_enabled = 0, mfa_enabled_at = NULL
        WHERE id = ?
      `
      )
        .bind(userId)
        .run();

      // Log MFA disablement
      await this.logSecurityEvent(
        "mfa_disabled",
        userId,
        {},
        {
          method: "TOTP",
          disabledAt: new Date().toISOString(),
        }
      );

      return {
        success: true,
        message: "MFA disabled successfully",
      };
    } catch (error) {
      console.error("MFA disablement error:", error);
      return {
        success: false,
        error: "Failed to disable MFA",
      };
    }
  }

  // Check if user requires MFA
  async requiresMFA(userId) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT mfa_enabled FROM users WHERE id = ?
      `
      )
        .bind(userId)
        .all();

      return results && results.length > 0
        ? results[0].mfa_enabled === 1
        : false;
    } catch (error) {
      console.error("Error checking MFA requirement:", error);
      return false;
    }
  }

  // Get user MFA status
  async getUserMFA(userId) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT id, email, mfa_enabled, totp_secret, mfa_enabled_at 
        FROM users 
        WHERE id = ?
      `
      )
        .bind(userId)
        .all();

      return results && results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Error getting user MFA:", error);
      return null;
    }
  }

  // Validate TOTP code using time-based algorithm
  validateTOTP(providedCode, secret) {
    if (!providedCode || !secret) return false;

    // Remove spaces and convert to uppercase
    const code = providedCode.replace(/\s/g, "").toUpperCase();

    // Get current time step (30-second windows)
    const timeStep = Math.floor(Date.now() / 1000 / 30);

    // Check current time step and previous one (to account for clock skew)
    for (let i = -1; i <= 1; i++) {
      const testTime = timeStep + i;
      const expectedCode = this.generateTOTP(secret, testTime);

      if (this.secureCompare(code, expectedCode)) {
        return true;
      }
    }

    return false;
  }

  // Generate TOTP code for given secret and time step
  generateTOTP(secret, timeStep) {
    // Decode base32 secret
    const secretBytes = this.base32Decode(secret);

    // Create time buffer (8 bytes, big-endian)
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, timeStep, false); // big-endian

    // Generate HMAC-SHA1
    const key = crypto.createHmac("sha1", secretBytes);
    key.update(timeBuffer);
    const hmac = key.digest();

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1000000;

    // Return 6-digit code with leading zeros
    return code.toString().padStart(6, "0");
  }

  // Base32 encoding
  base32Encode(bytes) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let output = "";
    let buffer = 0;
    let bitsLeft = 0;

    for (const byte of bytes) {
      buffer = (buffer << 8) | byte;
      bitsLeft += 8;

      while (bitsLeft >= 5) {
        output += alphabet[(buffer >>> (bitsLeft - 5)) & 31];
        bitsLeft -= 5;
      }
    }

    if (bitsLeft > 0) {
      output += alphabet[(buffer << (5 - bitsLeft)) & 31];
    }

    return output;
  }

  // Base32 decoding
  base32Decode(base32) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleanBase32 = base32.toUpperCase().replace(/=+$/, "");

    let bits = 0;
    let value = 0;
    const result = [];

    for (const char of cleanBase32) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        result.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(result);
  }

  // Constant-time string comparison
  secureCompare(a, b) {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Log MFA attempts for security monitoring
  async logMFAAttempt(userId, success, details) {
    try {
      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (
          id, event_type, user_id, ip_address, user_agent, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          `mfa_${Date.now()}_${crypto.randomUUID().replace(/-/g, "")}`,
          success ? "mfa_success" : "mfa_failure",
          userId,
          "unknown", // Would be populated from request context
          "unknown", // Would be populated from request context
          JSON.stringify({ details, method: "TOTP" })
        )
        .run();
    } catch (error) {
      console.error("Error logging MFA attempt:", error);
    }
  }

  // Log security events
  async logSecurityEvent(eventType, userId, requestContext, eventData = {}) {
    try {
      const eventId = `mfa_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO security_events (
          id, event_type, severity, user_id, ip_address, user_agent, event_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          eventId,
          eventType,
          "medium",
          userId,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          JSON.stringify(eventData)
        )
        .run();
    } catch (error) {
      console.error("Error logging MFA security event:", error);
    }
  }

  // Generate backup codes for account recovery
  generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-digit codes
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  }

  // Hash and store backup codes
  async storeBackupCodes(userId, codes) {
    try {
      const hashedCodes = codes.map((code) =>
        crypto.createHash("sha256").update(code).digest("hex")
      );

      // Delete existing backup codes
      await this.env.DB.prepare(
        `
        DELETE FROM mfa_backup_codes WHERE user_id = ?
      `
      )
        .bind(userId)
        .run();

      // Insert new backup codes
      for (const code of hashedCodes) {
        await this.env.DB.prepare(
          `
          INSERT INTO mfa_backup_codes (id, user_id, code_hash, used_at)
          VALUES (?, ?, ?, NULL)
        `
        )
          .bind(
            `backup_${Date.now()}_${crypto.randomUUID().replace(/-/g, "")}`,
            userId,
            code
          )
          .run();
      }

      return {
        success: true,
        codes: codes, // Return unhashed codes to user once
      };
    } catch (error) {
      console.error("Error storing backup codes:", error);
      return {
        success: false,
        error: "Failed to store backup codes",
      };
    }
  }

  // Verify backup code
  async verifyBackupCode(userId, providedCode) {
    try {
      const codeHash = crypto
        .createHash("sha256")
        .update(providedCode)
        .digest("hex");

      const { results } = await this.env.DB.prepare(
        `
        SELECT id FROM mfa_backup_codes 
        WHERE user_id = ? AND code_hash = ? AND used_at IS NULL
      `
      )
        .bind(userId, codeHash)
        .all();

      if (results && results.length > 0) {
        // Mark code as used
        await this.env.DB.prepare(
          `
          UPDATE mfa_backup_codes 
          SET used_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `
        )
          .bind(results[0].id)
          .run();

        await this.logSecurityEvent(
          "backup_code_used",
          userId,
          {},
          {
            codeUsed: true,
          }
        );

        return {
          valid: true,
          message: "Backup code verified successfully",
        };
      }

      return {
        valid: false,
        error: "Invalid or already used backup code",
      };
    } catch (error) {
      console.error("Error verifying backup code:", error);
      return {
        valid: false,
        error: "Failed to verify backup code",
      };
    }
  }
}

// Export utility functions
export const MFAUtils = {
  // Generate secure random string for various purposes
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString("hex");
  },

  // Validate email format for MFA setup
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};
