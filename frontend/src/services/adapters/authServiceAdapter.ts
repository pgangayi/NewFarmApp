import { SignJWT, jwtVerify } from 'jose';
import { UserService } from '../domains/UserService';

/**
 * ADAPTER LAYER: Auth Service
 * ---------------------------
 * Orchestrates the login flow, token generation, and MFA checks.
 * Acts as the "Backend API" running in the client.
 */

// In robust local-first apps, we often keep a "client secret" for signing tokens
// that are respected by the local layout. In a real backed setup, this is env var.
const JWT_SECRET = new TextEncoder().encode('local_dev_secret_key_change_in_prod');

export class AuthServiceAdapter {
  static async login(email: string, password: string) {
    const user = await UserService.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await UserService.verifyPassword(user, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // MFA Check Placeholder (as per architecture doc request)
    if (user.mfa_enabled) {
      return { requiresMFA: true, userId: user.id };
    }

    // Generate Tokens
    const accessToken = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // In a full implementation, we'd also mint a Refresh Token here

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        created_at: user.created_at || new Date().toISOString(),
      },
      session: { access_token: accessToken },
    };
  }

  static async signup(email: string, password: string, name: string) {
    const user = await UserService.createUser({ email, password, name });

    // Auto-login after signup
    const accessToken = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return {
      user: { id: user.id, email: user.email, name: user.full_name, role: user.role },
      session: { access_token: accessToken },
    };
  }

  static async verifyToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const user = await UserService.findById(payload.sub as string);

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
      };
    } catch (e) {
      return null;
    }
  }
}
