import { test, expect } from '@playwright/test';

// Note: This test uses the API directly (fast, reliable) and requires the backend
// to be running. It relies on the test-mode flag being enabled in the backend
// environment (TEST_ENABLE_RESET_LINK_TO_RESPONSE) so the reset link is returned
// when calling /api/auth/forgot-password?debug=1

const unique = () => `test+${Date.now()}@example.com`;

test('password reset flow (API)', async ({ request }) => {
  const email = unique();
  const password = 'ComplexPassw0rd!';
  const newPassword = 'NewComplexPassw0rd!';

  // 1) Signup
  const signup = await request.post('/api/auth/signup', {
    data: { email, password, name: 'E2E Test' },
  });
  expect(signup.ok()).toBeTruthy();

  // 2) Request password reset (debug mode -> backend returns reset link)
  const forgot = await request.post('/api/auth/forgot-password?debug=1', {
    data: { email },
  });
  expect(forgot.ok()).toBeTruthy();
  const forgotBody = await forgot.json();

  // Ensure debug link present
  expect(forgotBody).toBeTruthy();
  expect(forgotBody.debug && forgotBody.debug.resetLink).toBeTruthy();

  const resetLink = forgotBody.debug.resetLink;
  // Extract token query param
  const url = new URL(resetLink);
  const token = url.searchParams.get('token');
  expect(token).toBeTruthy();

  // 3) Reset the password
  const reset = await request.post('/api/auth/reset-password', {
    data: { token, newPassword },
  });
  expect(reset.ok()).toBeTruthy();

  // 4) Login with new password
  const login = await request.post('/api/auth/login', {
    data: { email, password: newPassword },
  });
  expect(login.ok()).toBeTruthy();
  const loginBody = await login.json();
  expect(loginBody).toHaveProperty('token');
});
