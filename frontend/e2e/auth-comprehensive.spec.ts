import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - Comprehensive', () => {
  const timestamp = Date.now();
  const user = {
    email: `e2e_test_${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `E2E User ${timestamp}`,
  };

  test('should allow a user to sign up and then log in', async ({ page }) => {
    // --- Sign Up ---
    console.log(`Starting Signup with email: ${user.email}`);
    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[type="text"][placeholder*="name" i], input[id="name"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Submit signup
    const signupButton = page.locator('button[type="submit"]');
    await expect(signupButton).toBeEnabled();
    await signupButton.click();

    // Verify successful signup - expect redirect to dashboard or login
    // Adjust this expectation based on actual app behavior (signup -> dashboard is common)
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });

    // Verify user name appears (optional, generic check)
    // await expect(page.locator('body')).toContainText(user.name);

    // --- Logout ---
    // If we are logged in, we need to logout to test login
    // Try to find a logout button or profile menu
    // This is heuristic; adjust selectors if specific IDs are known
    const profileButton = page.locator(
      'button:has-text("Profile"), button:has-text("User"), [aria-label="Profile"]'
    );
    if ((await profileButton.count()) > 0 && (await profileButton.isVisible())) {
      await profileButton.click();
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      }
    } else {
      // If no profile button, maybe a direct logout button?
      const directLogout = page.locator('button:has-text("Logout")');
      if (await directLogout.isVisible()) {
        await directLogout.click();
      }
    }

    // Ensure we are back at login or landing
    await page.goto('/login');

    // --- Log In ---
    console.log('Starting Login');
    await page.fill('input[type="email"]', user.email);
    // There might be multiple password fields if the UI is confused, select the visible one or first
    await page.fill('input[type="password"]', user.password);

    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
  });
});
