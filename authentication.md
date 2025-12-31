# Authentication System Documentation

## Overview

The authentication system in **Fin-Master** is a **local-first, robust client-side implementation** that simulates a full-stack security architecture. It runs entirely within the browser using **SQLite (via Wasm)** but is structured like a traditional backend service. This design allows for potential migration to a server (like Cloudflare Workers) in the future while providing a secure experience for the local-first application.

---

## 1. Architecture Overview

The system follows a clean layered architecture, ensuring separation of concerns:

- **UI Layer** (`AuthContext.tsx` & `useAuth.ts`):
  - Provides state management (user object, loading state, authentication status).
  - Exposes methods to React components (login, logout, reset password).
- **Adapter Layer** (`authServiceAdapter.ts`):
  - Acts as the "Backend API" abstraction.
  - Handles business logic including JWT generation, MFA orchestration, and token validation.
- **Domain Layer** (`UserService.ts`):
  - Handles direct database interactions.
  - Manages cryptographic operations (hashing) and user CRUD.
- **Persistence Layer** (`DatabaseAdapter.ts`):
  - Manages the underlying SQLite connection.
  - Persists data to IndexedDB for offline storage.

---

## 2. Security Specifications

### Credentials & Hashing

- **Algorithm**: **`bcryptjs`** is used for password hashing with **12 salt rounds**.
- **Legacy Support**: The system includes a fallback check for **SHA-256** hashes to support legacy or migrated users transparently.
- **Brute Force Protection**: Account lockout is enforced after **5 failed login attempts**. The account remains locked for **30 minutes**.

### Token Management (JWT)

The application validates identity using **JSON Web Tokens (JWT)** generated client-side via the `jose` library.

- **Access Token**:
  - Expires in **24 hours**.
  - Signed with `HS256`.
  - Used for short-term authorization.
- **Refresh Token**:
  - Expires in **7 days**.
  - Allows generating new access tokens without requiring the user to re-enter credentials.
- **Storage**:
  - Tokens are stored in the browser's `localStorage` (keys: `auth_token`, `refresh_token`).
- **Secrets**:
  - Development secrets are bundled in the client. In a production server environment, these would be environment variables.

### Multi-Factor Authentication (MFA)

- **Type**: **TOTP** (Time-based One-Time Password), compatible with apps like Google Authenticator and Authy.
- **Components**:
  - **Secret**: A base32 secret generated for each user.
  - **QR Code**: Generated via `otpauth://` URL.
- **Development Override**:
  - In development mode or for testing, the code `123456` can acts as a bypass if configured in the adapter.

---

## 3. Authentication Flows

### Login Flow

1.  **Submission**: User enters email and password in `AuthPage`.
2.  **Adapter Request**: `AuthContext` calls `AuthServiceAdapter.login()`.
3.  **Verification**:
    - Adapter calls `UserService` to retrieve the user.
    - `UserService` verifies the password using `bcrypt.compare`.
4.  **MFA Check**:
    - If the user has `mfa_enabled = 1`, the process halts.
    - The system returns `requiresMFA: true`.
    - The UI prompts the user for a 6-digit code.
    - Upon entry, `login` is called again or validated via `verifyMFA`.
5.  **Completion**:
    - On success, Access and Refresh tokens are generated.
    - User state is updated in the Context.
    - Session is persisted to `localStorage`.

### Password Reset

- **Mechanism**: Token-based reset system.
- **Token Life**: Secure random tokens are valid for **1 hour**.
- **Storage**: Currently implemented using an **in-memory map** (`passwordResetTokens`) within the adapter.
  - _Limitation_: Reset tokens are cleared if the browser tab is fully refreshed or closed.

---

## 4. Key Files

| Component    | File Path                                     | Description                                                    |
| ------------ | --------------------------------------------- | -------------------------------------------------------------- |
| **Context**  | `src/contexts/AuthContext.tsx`                | Main entry point for frontend components to access auth state. |
| **Adapter**  | `src/services/adapters/authServiceAdapter.ts` | The core logic for tokens, MFA, and auth orchestration.        |
| **Service**  | `src/services/domains/UserService.ts`         | Database queries, password hashing, and user mutations.        |
| **Database** | `src/core/DatabaseAdapter.ts`                 | Handles the `sql.js` connection and IndexedDB persistence.     |
