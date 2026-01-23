#!/usr/bin/env node
// Simple environment validation script.
// Exits with non-zero code when CHECK_SECRETS=1 and required secrets are missing.

const required = [
  { key: 'APP_URL', required: true },
  { key: 'JWT_SECRET', required: true },
  // Resend API key is optional for production if you use a different provider,
  // but we recommend setting it for real email sends.
  { key: 'RESEND_API_KEY', required: false },
  { key: 'FROM_EMAIL', required: false },
  { key: 'SENTRY_DSN', required: false },
];

function check() {
  const missing = [];
  required.forEach((r) => {
    if (!process.env[r.key] || String(process.env[r.key]).trim() === '') {
      missing.push(r.key);
    }
  });

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing.join(', '));
  } else {
    console.log('All required environment variables are present.');
  }

  // If CHECK_SECRETS=1 or running on CI, exit non-zero when any required secrets missing
  const shouldFail = (process.env.CHECK_SECRETS === '1' || process.env.CI === 'true' || process.env.CI === '1');
  if (shouldFail && missing.length > 0) {
    console.error('Required environment variables missing, failing build/test as requested.');
    process.exit(1);
  }

  // Exit normally (0) when not forcing check
  process.exit(0);
}

check();
