// WebAuthn (Hardware Security Key) Implementation
// FIDO2/WebAuthn support for passwordless authentication
// Date: November 12, 2025

import crypto from "crypto";

export class WebAuthnManager {
  constructor(env) {
    this.env = env;
    this.rpName = "Farmers Boot";
    this.rpId = env.WEBAUTHN_RP_ID || "localhost";
    this.origin = env.WEBAUTHN_ORIGIN || "http://localhost:3000";
  }

  // Generate registration options for new authenticator
  async generateRegistrationOptions(userId, userName, userEmail) {
    try {
      const challenge = this.generateChallenge();

      // Store challenge for verification
      await this.storeChallenge(userId, challenge, "registration");

      return {
        challenge,
        rp: {
          name: this.rpName,
          id: this.rpId,
        },
        user: {
          id: this.base64urlEncode(userId),
          name: userEmail,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform",
          requireResidentKey: false,
          userVerification: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      };
    } catch (error) {
      console.error("Error generating registration options:", error);
      throw error;
    }
  }

  // Verify registration response
  async verifyRegistration(userId, attestationResponse) {
    try {
      const { response, id, rawId } = attestationResponse;

      // Get stored challenge
      const storedChallenge = await this.getStoredChallenge(
        userId,
        "registration"
      );
      if (
        !storedChallenge ||
        storedChallenge.challenge !== response.challenge
      ) {
        throw new Error("Invalid or expired challenge");
      }

      // Verify signature
      const verification = await this.verifyAttestationSignature(
        response,
        storedChallenge.challenge
      );

      if (verification.verified) {
        // Store authenticator credential
        await this.storeAuthenticatorCredential(userId, {
          credentialID: this.base64urlDecode(id),
          publicKey: verification.authenticatorData.publicKey,
          counter: verification.authenticatorData.counter,
          transports: response.response.transports || [],
          deviceType: response.response.deviceType || "singleDevice",
          backedUp: response.response.backedUp || false,
        });

        // Clean up challenge
        await this.removeChallenge(userId, "registration");

        return {
          success: true,
          credentialID: id,
          deviceType: response.response.deviceType,
          backedUp: response.response.backedUp,
        };
      }

      throw new Error("Signature verification failed");
    } catch (error) {
      console.error("Error verifying registration:", error);
      return { success: false, error: error.message };
    }
  }

  // Generate authentication options
  async generateAuthenticationOptions(userId, allowCredentials = []) {
    try {
      const challenge = this.generateChallenge();

      // Store challenge for verification
      await this.storeChallenge(userId, challenge, "authentication");

      const options = {
        challenge,
        rp: {
          name: this.rpName,
          id: this.rpId,
        },
        userVerification: "preferred",
        timeout: 60000,
      };

      // Add allowed credentials if provided
      if (allowCredentials.length > 0) {
        options.allowCredentials = allowCredentials.map((cred) => ({
          type: "public-key",
          id: cred.credentialID,
          transports: cred.transports || ["internal", "hybrid"],
        }));
      }

      return options;
    } catch (error) {
      console.error("Error generating authentication options:", error);
      throw error;
    }
  }

  // Verify authentication response
  async verifyAuthentication(userId, assertionResponse) {
    try {
      const { response, id } = assertionResponse;

      // Get stored challenge
      const storedChallenge = await this.getStoredChallenge(
        userId,
        "authentication"
      );
      if (
        !storedChallenge ||
        storedChallenge.challenge !== response.challenge
      ) {
        throw new Error("Invalid or expired challenge");
      }

      // Get authenticator credential
      const credential = await this.getAuthenticatorCredential(
        userId,
        this.base64urlDecode(id)
      );
      if (!credential) {
        throw new Error("Credential not found");
      }

      // Verify assertion signature
      const verification = await this.verifyAssertionSignature(
        response,
        credential.publicKey,
        storedChallenge.challenge
      );

      if (verification.verified) {
        // Update counter
        await this.updateAuthenticatorCounter(
          credential.id,
          verification.authenticatorData.counter
        );

        // Clean up challenge
        await this.removeChallenge(userId, "authentication");

        return {
          success: true,
          verified: true,
          newCounter: verification.authenticatorData.counter,
          userVerified: verification.authenticatorData.flags.userVerified,
        };
      }

      throw new Error("Assertion verification failed");
    } catch (error) {
      console.error("Error verifying authentication:", error);
      return { success: false, error: error.message };
    }
  }

  // Get user's registered authenticators
  async getUserAuthenticators(userId) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT id, credential_id, public_key, counter, transports, 
               device_type, backed_up, created_at, last_used
        FROM webauthn_credentials 
        WHERE user_id = ? AND disabled = 0
        ORDER BY last_used DESC
      `
      )
        .bind(userId)
        .all();

      return results.map((cred) => ({
        id: cred.id,
        credentialID: this.base64urlEncode(cred.credential_id),
        transports: JSON.parse(cred.transports || "[]"),
        deviceType: cred.device_type,
        backedUp: cred.backed_up,
        createdAt: cred.created_at,
        lastUsed: cred.last_used,
      }));
    } catch (error) {
      console.error("Error getting user authenticators:", error);
      return [];
    }
  }

  // Remove authenticator
  async removeAuthenticator(userId, credentialID) {
    try {
      const { changes } = await this.env.DB.prepare(
        "UPDATE webauthn_credentials SET disabled = 1 WHERE user_id = ? AND credential_id = ?"
      )
        .bind(userId, this.base64urlDecode(credentialID))
        .run();

      if (changes > 0) {
        await this.logSecurityEvent(
          "webauthn_credential_removed",
          userId,
          {},
          { credentialID }
        );
      }

      return { success: changes > 0 };
    } catch (error) {
      console.error("Error removing authenticator:", error);
      return { success: false, error: error.message };
    }
  }

  // Generate random challenge
  generateChallenge() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64urlEncode(array);
  }

  // Store challenge for verification
  async storeChallenge(userId, challenge, type) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const challengeId = `webauthn_challenge_${userId}_${type}_${Date.now()}`;

    await this.env.DB.prepare(
      `
      INSERT OR REPLACE INTO webauthn_challenges 
      (id, user_id, challenge, type, expires_at) 
      VALUES (?, ?, ?, ?, ?)
    `
    )
      .bind(challengeId, userId, challenge, type, expiresAt.toISOString())
      .run();
  }

  // Get stored challenge
  async getStoredChallenge(userId, type) {
    const { results } = await this.env.DB.prepare(
      `
      SELECT challenge FROM webauthn_challenges 
      WHERE user_id = ? AND type = ? AND expires_at > datetime('now')
      ORDER BY expires_at DESC LIMIT 1
    `
    )
      .bind(userId, type)
      .all();

    return results.length > 0 ? { challenge: results[0].challenge } : null;
  }

  // Remove challenge
  async removeChallenge(userId, type) {
    await this.env.DB.prepare(
      "DELETE FROM webauthn_challenges WHERE user_id = ? AND type = ?"
    )
      .bind(userId, type)
      .run();
  }

  // Store authenticator credential
  async storeAuthenticatorCredential(userId, credential) {
    const credentialId = `webauthn_cred_${userId}_${Date.now()}`;

    await this.env.DB.prepare(
      `
      INSERT INTO webauthn_credentials (
        id, user_id, credential_id, public_key, counter, 
        transports, device_type, backed_up
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        credentialId,
        userId,
        credential.credentialID,
        credential.publicKey,
        credential.counter,
        JSON.stringify(credential.transports),
        credential.deviceType,
        credential.backedUp ? 1 : 0
      )
      .run();

    // Log credential registration
    await this.logSecurityEvent(
      "webauthn_credential_registered",
      userId,
      {},
      {
        credentialID: credentialId,
        deviceType: credential.deviceType,
        backedUp: credential.backedUp,
      }
    );
  }

  // Get authenticator credential
  async getAuthenticatorCredential(userId, credentialID) {
    const { results } = await this.env.DB.prepare(
      `
      SELECT * FROM webauthn_credentials 
      WHERE user_id = ? AND credential_id = ? AND disabled = 0
    `
    )
      .bind(userId, credentialID)
      .all();

    return results.length > 0 ? results[0] : null;
  }

  // Update authenticator counter
  async updateAuthenticatorCounter(credentialId, newCounter) {
    await this.env.DB.prepare(
      `
      UPDATE webauthn_credentials 
      SET counter = ?, last_used = CURRENT_TIMESTAMP 
      WHERE id = ?
    `
    )
      .bind(newCounter, credentialId)
      .run();
  }

  // Basic signature verification (simplified for demo)
  async verifyAttestationSignature(response, challenge) {
    // In production, this would use proper WebAuthn verification
    // For demo purposes, we'll simulate verification
    return {
      verified: true,
      authenticatorData: {
        publicKey: "simulated_public_key",
        counter: response.response.authenticatorData ? 1 : 0,
        flags: {
          userVerified: true,
        },
      },
    };
  }

  async verifyAssertionSignature(response, publicKey, challenge) {
    // In production, this would use proper WebAuthn verification
    return {
      verified: true,
      authenticatorData: {
        counter: response.response.authenticatorData ? 1 : 0,
        flags: {
          userVerified: true,
        },
      },
    };
  }

  // Log security events
  async logSecurityEvent(eventType, userId, requestContext, eventData = {}) {
    try {
      const eventId = `webauthn_${Date.now()}_${crypto
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
      console.error("Error logging WebAuthn security event:", error);
    }
  }

  // Utility functions
  base64urlEncode(data) {
    return Buffer.from(data)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  base64urlDecode(data) {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64");
  }
}

// Export utility functions
export const WebAuthnUtils = {
  // Check if WebAuthn is supported by the browser
  isWebAuthnSupported() {
    return (
      typeof window !== "undefined" &&
      (window.PublicKeyCredential || window.webkitPublicKeyCredential)
    );
  },

  // Get available authenticators
  async getAvailableAuthenticators() {
    if (!this.isWebAuthnSupported()) return [];

    try {
      const authenticators = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 1000,
        },
      });
      return authenticators || [];
    } catch (error) {
      console.error("Error getting available authenticators:", error);
      return [];
    }
  },

  // Generate device fingerprint for session management
  generateDeviceFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Device fingerprint", 2, 2);

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      canvas: canvas.toDataURL(),
    };

    // Create hash of fingerprint
    const hash = crypto.createHash("sha256");
    hash.update(JSON.stringify(fingerprint));
    return hash.digest("hex");
  },
};
