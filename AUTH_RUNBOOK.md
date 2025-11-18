# Authentication System Runbook

## Overview

This runbook documents the simplified authentication system architecture, maintenance procedures, and troubleshooting guides.

## Architecture

### Core Components

- **JWT Authentication**: HS256 tokens with 15-minute access, 7-day refresh
- **Password Security**: bcrypt hashing with 12 salt rounds
- **CSRF Protection**: Double-submit cookie pattern with DB storage
- **Token Revocation**: Unified `revoked_tokens` table
- **Rate Limiting**: Failed login attempts tracking
- **Audit Logging**: Security events in `audit_logs` table

### Database Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Token revocation (unified)
CREATE TABLE revoked_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  user_id TEXT NOT NULL,
  token_type TEXT NOT NULL, -- 'access', 'refresh'
  reason TEXT,
  revoked_by TEXT, -- 'user', 'system', 'admin'
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME,
  revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CSRF protection
CREATE TABLE csrf_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security monitoring
CREATE TABLE login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempt_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Security Headers

All responses include:

```
Access-Control-Allow-Origin: https://your-frontend.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token
```

## Maintenance Procedures

### Regular Tasks

- **Monitor Failed Login Attempts**: Check `login_attempts` table for suspicious patterns
- **Clean Expired Tokens**: Periodically remove expired entries from `revoked_tokens`, `csrf_tokens`
- **Review Audit Logs**: Monitor `audit_logs` for security events
- **Update Dependencies**: Keep authentication libraries updated

### Secret Rotation

```bash
# Generate new JWT secret
openssl rand -base64 32

# Update in Cloudflare
wrangler secret put JWT_SECRET

# This invalidates all existing tokens
# Users will need to re-login
```

### Database Cleanup

```sql
-- Remove expired revoked tokens (run monthly)
DELETE FROM revoked_tokens
WHERE expires_at < datetime('now', '-30 days');

-- Remove old login attempts (run weekly)
DELETE FROM login_attempts
WHERE created_at < datetime('now', '-7 days');

-- Remove expired CSRF tokens (run daily)
DELETE FROM csrf_tokens
WHERE expires_at < datetime('now');
```

## Troubleshooting

### Common Issues

#### "Invalid token" errors

- Check if JWT_SECRET was rotated without user notification
- Verify token hasn't expired (15 min for access, 7 days for refresh)
- Check if token was revoked in `revoked_tokens` table

#### CORS errors

- Verify `FRONTEND_ORIGIN` environment variable is set correctly
- Check that request includes credentials: `credentials: 'include'`
- Ensure preflight OPTIONS requests are handled

#### CSRF validation fails

- Verify CSRF token is sent in `X-CSRF-Token` header
- Check that CSRF cookie is present
- Ensure tokens match and haven't expired

#### Password reset not working

- Check email service configuration
- Verify `password_reset_tokens` table has valid entries
- Ensure reset links aren't expired (24 hours)

### Debug Commands

```bash
# Check token status
wrangler d1 execute db --command="
SELECT * FROM revoked_tokens
WHERE token_hash = 'hash_here'
ORDER BY revoked_at DESC LIMIT 5;"

# View recent login attempts
wrangler d1 execute db --command="
SELECT email, success, ip_address, created_at
FROM login_attempts
ORDER BY created_at DESC LIMIT 20;"

# Check active sessions
wrangler d1 execute db --command="
SELECT user_id, COUNT(*) as active_sessions
FROM user_sessions
WHERE expires_at > datetime('now')
GROUP BY user_id;"
```

## Security Monitoring

### Alerts to Set Up

- Failed login rate > 10/minute from single IP
- Successful logins from multiple countries in short time
- Mass token revocation events
- CORS violations
- PII appearing in logs

### Log Analysis

```bash
# Search for security events
wrangler tail | grep -E "(login|token|csrf|security)"

# Check for PII leakage
wrangler tail | grep -i "email\|password\|token"
```

## Incident Response

### Token Compromise

1. **Immediate**: Revoke all user's tokens
   ```sql
   INSERT INTO revoked_tokens (id, token_hash, user_id, token_type, reason, revoked_by)
   SELECT 'incident_' || id, token_hash, user_id, 'all', 'security_incident', 'admin'
   FROM user_sessions WHERE user_id = 'compromised_user_id';
   ```
2. **User Communication**: Force password reset
3. **Investigation**: Review audit logs for compromise vector

### Mass Account Attack

1. **Rate Limiting**: Enable stricter rate limits
2. **IP Blocking**: Block attacking IPs at edge
3. **Monitoring**: Increase log retention
4. **User Notification**: Alert users about increased security measures

## Performance Optimization

### Database Indexes

Ensure these indexes exist:

```sql
CREATE INDEX idx_revoked_tokens_hash ON revoked_tokens(token_hash);
CREATE INDEX idx_revoked_tokens_user ON revoked_tokens(user_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_csrf_tokens_user ON csrf_tokens(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
```

### Caching Strategy

- Cache user data for token validation (avoid DB hits)
- Cache revoked token checks (with short TTL)
- Use Redis for distributed rate limiting if needed

## Development Guidelines

### Code Standards

- Never log emails, passwords, or tokens
- Use environment variables for all configuration
- Validate all inputs before processing
- Use parameterized queries to prevent SQL injection
- Test authentication flows thoroughly

### Testing

```bash
# Run auth tests
npm run test:auth

# Test with different scenarios:
# - Valid/invalid credentials
# - Token expiration
# - Concurrent sessions
# - CSRF protection
# - Rate limiting
```

## Contact Information

- **Security Team**: security@company.com
- **DevOps**: devops@company.com
- **On-call Engineer**: Current rotation schedule
