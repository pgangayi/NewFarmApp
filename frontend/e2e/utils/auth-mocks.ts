import { Page, Route } from '@playwright/test';

/**
 * Test user fixtures for consistent test data
 */
export const TEST_USERS = {
  VALID_USER: {
    id: 'test-user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2023-01-01T00:00:00Z'
  },
  SIGNUP_USER: {
    id: 'signup-user-id-456',
    email: 'signup@example.com',
    name: 'New User',
    created_at: '2023-01-01T00:00:00Z'
  }
};

/**
 * Mock auth token for testing
 */
export const MOCK_AUTH_TOKEN = 'mock-jwt-token-for-testing-12345';

/**
 * Setup authentication mocks for the page
 * This function intercepts API calls and provides consistent test responses
 */
export async function setupAuthMocks(page: Page, options: {
  shouldMockSuccess?: boolean;
  shouldMockFailure?: boolean;
  customResponse?: any;
  delay?: number;
} = {}) {
  const { shouldMockSuccess = true, shouldMockFailure = false, customResponse, delay = 100 } = options;

  // Mock authentication endpoints
  await page.route('/api/auth/**', async (route: Route) => {
    // Add delay to simulate network latency
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const url = route.request().url();
    const method = route.request().method();
    const requestBody = route.request().postData();

    try {
      // Handle different auth endpoints
      if (url.includes('/api/auth/validate') && method === 'GET') {
        // Token validation endpoint
        const authHeader = route.request().headers()['authorization'];
        if (authHeader && authHeader.includes(MOCK_AUTH_TOKEN)) {
          // Valid token - return user
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: TEST_USERS.VALID_USER
            })
          });
          return;
        } else {
          // Invalid token
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: { message: 'Invalid token' } })
          });
          return;
        }
      }

      if (url.includes('/api/auth/login') && method === 'POST') {
        // Login endpoint
        if (shouldMockFailure) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: { message: 'Invalid credentials' } })
          });
          return;
        }

        if (customResponse) {
          await route.fulfill(customResponse);
          return;
        }

        // Success response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: TEST_USERS.VALID_USER,
            token: MOCK_AUTH_TOKEN
          })
        });
        return;
      }

      if (url.includes('/api/auth/signup') && method === 'POST') {
        // Signup endpoint
        if (shouldMockFailure) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: { message: 'User already exists' } })
          });
          return;
        }

        if (customResponse) {
          await route.fulfill(customResponse);
          return;
        }

        // Success response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: TEST_USERS.SIGNUP_USER,
            token: MOCK_AUTH_TOKEN
          })
        });
        return;
      }

      // Default fallback for unhandled auth routes
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Not found' } })
      });

    } catch (error) {
      console.error('Auth mock error:', error);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Internal server error' } })
      });
    }
  });
}

/**
 * Mock network errors for testing error handling
 */
export async function setupNetworkErrorMocks(page: Page, endpoint: string = '/api/auth/**') {
  await page.route(endpoint, async (route: Route) => {
    // Abort the request to simulate network failure
    await route.abort('internetdisconnected');
  });
}

/**
 * Clear all authentication state for clean test isolation
 */
export async function clearAuthState(page: Page) {
  // Clear cookies first (this should always work)
  await page.context().clearCookies();

  // Clear localStorage safely
  try {
    await page.evaluate(() => {
      try {
        localStorage.removeItem('auth_token');
      } catch (e) {
        // localStorage might be disabled in test environment
        console.warn('localStorage not available:', e);
      }
      try {
        sessionStorage.clear();
      } catch (e) {
        // sessionStorage might be disabled in test environment
        console.warn('sessionStorage not available:', e);
      }
    });
  } catch (error) {
    console.warn('Could not clear storage:', error);
  }

  // Clear any existing mocks
  await page.unroute('/api/auth/**');
}
/**
 * Set authenticated state for testing protected routes
 */
export async function setAuthenticatedState(page: Page, user = TEST_USERS.VALID_USER) {
  // Set auth token in localStorage
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    // Also set user data if needed
    (window as any).__TEST_USER__ = user;
  }, { token: MOCK_AUTH_TOKEN, user });
}

/**
 * Helper function to wait for loading states to complete
 */
export async function waitForLoadingComplete(page: Page, timeout = 5000) {
  // Wait for loading spinner to disappear
  await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout });
  
  // Additional wait for any async operations
  await page.waitForTimeout(200);
}

/**
 * Helper function to perform login with mocks
 */
export async function performLogin(page: Page, email: string = TEST_USERS.VALID_USER.email, password: string = 'testpassword') {
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit-button').click();
  
  // Wait for navigation or error
  await Promise.race([
    page.waitForURL('**/farms', { timeout: 3000 }),
    page.waitForSelector('[data-testid="login-error"]', { timeout: 3000 })
  ]);
}

/**
 * Helper function to perform signup with mocks
 */
export async function performSignup(page: Page, 
  name: string = TEST_USERS.SIGNUP_USER.name, 
  email: string = TEST_USERS.SIGNUP_USER.email, 
  password: string = 'testpassword123'
) {
  await page.getByTestId('signup-name').fill(name);
  await page.getByTestId('signup-email').fill(email);
  await page.getByTestId('signup-password').fill(password);
  await page.getByTestId('signup-submit-button').click();
  
  // Wait for navigation or error
  await Promise.race([
    page.waitForURL('**/farms', { timeout: 3000 }),
    page.waitForSelector('[data-testid="signup-error"]', { timeout: 3000 })
  ]);
}