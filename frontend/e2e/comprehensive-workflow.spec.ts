import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const E2E_USER_EMAIL = 'e2e+user@example.com';
const E2E_USER_PASSWORD = 'TestPass123!';

test.describe('Farmers Boot - Comprehensive Workflow Tests', () => {
  let sessionData: any = null;

  test.beforeAll(() => {
    // Load session data from E2E seeding
    const sessionFile = path.join(process.cwd(), '.e2e_session.json');
    if (fs.existsSync(sessionFile)) {
      sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    }
  });

  test.beforeEach(async ({ page }) => {
    // Set up authenticated session if available
    if (sessionData?.token) {
      await page.addInitScript(token => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem(
          'user',
          JSON.stringify({ id: 'e2e-test-user-1', email: E2E_USER_EMAIL, name: 'E2E User' })
        );
      }, sessionData.token);
    }

    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test.describe('Authentication Workflow', () => {
    test('should complete full authentication flow', async ({ page }) => {
      // Start unauthenticated
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await page.reload();
      await page.waitForTimeout(1000);

      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/);

      // Fill login form
      await page.fill('input[type="email"]', E2E_USER_EMAIL);
      await page.fill('input[type="password"]', E2E_USER_PASSWORD);

      // Submit login
      await page.click(
        'button[type="submit"], button:has-text("Sign In"), button:has-text("Login")'
      );

      // Should redirect to dashboard
      await page.waitForURL(/.*dashboard.*/, { timeout: 10000 });
      expect(page.url()).toMatch(/.*dashboard.*/);

      // Verify user is logged in
      const userMenu = page.locator(
        '[data-testid="user-menu"], .user-menu, button:has-text("E2E User")'
      );
      await expect(userMenu).toBeVisible();
    });

    test('should handle logout properly', async ({ page }) => {
      // Ensure logged in first
      if (!sessionData?.token) {
        await page.goto('/login');
        await page.fill('input[type="email"]', E2E_USER_EMAIL);
        await page.fill('input[type="password"]', E2E_USER_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*dashboard.*/);
      }

      // Find and click logout
      const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout"]'
      );
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL(/.*login.*/, { timeout: 5000 });
        expect(page.url()).toMatch(/.*login.*/);
      }
    });
  });

  test.describe('Farm Management Workflow', () => {
    test('should view existing farms', async ({ page }) => {
      await page.goto('/farms');
      await page.waitForTimeout(2000);

      // Should show E2E Farm
      const farmCard = page.locator('text=E2E Farm').first();
      await expect(farmCard).toBeVisible();
    });

    test('should create new farm', async ({ page }) => {
      await page.goto('/farms');
      await page.waitForTimeout(2000);

      // Click create farm button
      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Farm")')
        .first();
      await createButton.click();

      // Wait for modal/form
      await page.waitForTimeout(1000);

      // Fill farm details
      const farmNameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      const locationInput = page
        .locator('input[name="location"], input[placeholder*="location"]')
        .first();
      const areaInput = page.locator('input[name="area_hectares"], input[type="number"]').first();

      await farmNameInput.fill('Test Farm E2E');
      await locationInput.fill('Test Location');
      await areaInput.fill('5.5');

      // Submit form
      const submitButton = page
        .locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
        .first();
      await submitButton.click();

      // Wait for success and verify farm appears
      await page.waitForTimeout(2000);
      const newFarm = page.locator('text=Test Farm E2E');
      await expect(newFarm).toBeVisible();
    });

    test('should edit farm details', async ({ page }) => {
      await page.goto('/farms');
      await page.waitForTimeout(2000);

      // Find Test Farm E2E and click edit
      const farmCard = page.locator('text=Test Farm E2E').first();
      await expect(farmCard).toBeVisible();

      // Click on the farm card or edit button
      const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-farm"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
      } else {
        await farmCard.click();
      }

      await page.waitForTimeout(1000);

      // Modify location
      const locationInput = page.locator('input[name="location"]').first();
      await locationInput.fill('Updated Test Location');

      // Save changes
      const saveButton = page.locator('button[type="submit"], button:has-text("Save")').first();
      await saveButton.click();

      // Verify changes
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Updated Test Location')).toBeVisible();
    });
  });

  test.describe('Crop Operations Workflow', () => {
    test('should view crops page', async ({ page }) => {
      await page.goto('/crops');
      await page.waitForTimeout(2000);

      // Should load crops page
      expect(page.url()).toMatch(/.*crops.*/);
    });

    test('should create new crop', async ({ page }) => {
      await page.goto('/crops');
      await page.waitForTimeout(2000);

      // Click add crop button
      const addButton = page
        .locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Crop")')
        .first();
      await addButton.click();

      await page.waitForTimeout(1000);

      // Fill crop form
      const cropTypeSelect = page
        .locator('select[name="crop_type"], input[placeholder*="crop type"]')
        .first();
      const plantingDateInput = page
        .locator('input[name="planting_date"], input[type="date"]')
        .first();

      // Select corn (should be available from seeding)
      if (await cropTypeSelect.isVisible()) {
        await cropTypeSelect.selectOption('Corn');
      }

      await plantingDateInput.fill('2025-04-01');

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();

      // Verify crop appears
      await page.waitForTimeout(2000);
      const cropEntry = page.locator('text=Corn, text=2025-04-01').first();
      await expect(cropEntry).toBeVisible();
    });

    test('should view crop details and observations', async ({ page }) => {
      await page.goto('/crops');
      await page.waitForTimeout(2000);

      // Find a crop and click to view details
      const cropRow = page.locator('text=Corn').first();
      await cropRow.click();

      await page.waitForTimeout(1000);

      // Should show crop details
      const detailsSection = page.locator('.crop-details, [data-testid="crop-details"]').first();
      await expect(detailsSection).toBeVisible();
    });
  });

  test.describe('Inventory Management Workflow', () => {
    test('should view inventory page', async ({ page }) => {
      await page.goto('/inventory');
      await page.waitForTimeout(2000);

      expect(page.url()).toMatch(/.*inventory.*/);
    });

    test('should add inventory item', async ({ page }) => {
      await page.goto('/inventory');
      await page.waitForTimeout(2000);

      // Click add item button
      const addButton = page
        .locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New Item")')
        .first();
      await addButton.click();

      await page.waitForTimeout(1000);

      // Fill item details
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]').first();
      const categorySelect = page
        .locator('select[name="category"], input[placeholder*="category"]')
        .first();
      const quantityInput = page.locator('input[name="quantity"], input[type="number"]').first();
      const unitInput = page.locator('input[name="unit"], select[name="unit"]').first();

      await nameInput.fill('Test Fertilizer');
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption('Fertilizer');
      }
      await quantityInput.fill('100');
      if (await unitInput.isVisible()) {
        await unitInput.fill('kg');
      }

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Add")').first();
      await submitButton.click();

      // Verify item appears
      await page.waitForTimeout(2000);
      const itemEntry = page.locator('text=Test Fertilizer').first();
      await expect(itemEntry).toBeVisible();
    });

    test('should record inventory transaction', async ({ page }) => {
      await page.goto('/inventory');
      await page.waitForTimeout(2000);

      // Find Test Fertilizer and click to manage
      const itemRow = page.locator('text=Test Fertilizer').first();
      await itemRow.click();

      await page.waitForTimeout(1000);

      // Click add transaction button
      const transactionButton = page
        .locator('button:has-text("Transaction"), button:has-text("Record")')
        .first();
      await transactionButton.click();

      await page.waitForTimeout(1000);

      // Fill transaction details
      const typeSelect = page.locator('select[name="type"], input[placeholder*="type"]').first();
      const quantityInput = page.locator('input[name="quantity"]').first();
      const notesInput = page.locator('textarea[name="notes"], input[name="notes"]').first();

      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('used');
      }
      await quantityInput.fill('10');
      await notesInput.fill('Used for corn field');

      // Submit transaction
      const submitButton = page.locator('button[type="submit"], button:has-text("Record")').first();
      await submitButton.click();

      // Verify transaction recorded
      await page.waitForTimeout(2000);
      const transactionEntry = page.locator('text=Used for corn field').first();
      await expect(transactionEntry).toBeVisible();
    });
  });

  test.describe('Task Management Workflow', () => {
    test('should view tasks page', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForTimeout(2000);

      expect(page.url()).toMatch(/.*tasks.*/);
    });

    test('should create new task', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForTimeout(2000);

      // Click create task button
      const createButton = page
        .locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Task")')
        .first();
      await createButton.click();

      await page.waitForTimeout(1000);

      // Fill task details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
      const descriptionInput = page
        .locator('textarea[name="description"], input[name="description"]')
        .first();
      const prioritySelect = page.locator('select[name="priority"]').first();
      const dueDateInput = page.locator('input[name="due_date"], input[type="date"]').first();

      await titleInput.fill('E2E Test Task');
      await descriptionInput.fill('Task created during E2E testing');
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption('high');
      }
      await dueDateInput.fill('2025-12-31');

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();

      // Verify task appears
      await page.waitForTimeout(2000);
      const taskEntry = page.locator('text=E2E Test Task').first();
      await expect(taskEntry).toBeVisible();
    });

    test('should mark task as complete', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForTimeout(2000);

      // Find E2E Test Task
      const taskRow = page.locator('text=E2E Test Task').first();
      await expect(taskRow).toBeVisible();

      // Click complete checkbox or button
      const completeButton = page
        .locator('input[type="checkbox"], button:has-text("Complete")')
        .first();
      await completeButton.click();

      // Verify task shows as completed
      await page.waitForTimeout(1000);
      const completedIndicator = page
        .locator('.completed, [data-completed="true"], .line-through')
        .first();
      await expect(completedIndicator).toBeVisible();
    });
  });

  test.describe('Dashboard Integration', () => {
    test('should display dashboard with farm data', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);

      // Should show dashboard content
      expect(page.url()).toMatch(/.*dashboard.*/);

      // Check for key dashboard elements
      const statsCards = page.locator('.stat-card, [data-testid="stat-card"]').first();
      await expect(statsCards).toBeVisible();
    });

    test('should navigate between sections from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Click farms link
      const farmsLink = page.locator('a[href="/farms"], button:has-text("Farms")').first();
      await farmsLink.click();

      await page.waitForURL(/.*farms.*/);
      expect(page.url()).toMatch(/.*farms.*/);

      // Navigate back to dashboard
      const dashboardLink = page
        .locator('a[href="/dashboard"], button:has-text("Dashboard")')
        .first();
      await dashboardLink.click();

      await page.waitForURL(/.*dashboard.*/);
      expect(page.url()).toMatch(/.*dashboard.*/);
    });
  });
});
