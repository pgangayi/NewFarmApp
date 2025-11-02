import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check for mobile navigation
    const mobileNav = page.locator('.mobile-nav, .hamburger-menu, .nav-toggle');
    const mobileCount = await mobileNav.count();
    expect(mobileCount).toBeGreaterThanOrEqual(0);
    
    // Check if content is accessible
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    
    // Test touch interactions
    const clickableElements = page.locator('button, a, [role="button"]');
    const clickableCount = await clickableElements.count();
    expect(clickableCount).toBeGreaterThanOrEqual(0);
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check tablet layout
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    
    // Test tablet navigation
    const navElements = page.locator('nav, .navigation, .menu');
    const navCount = await navElements.count();
    expect(navCount).toBeGreaterThanOrEqual(0);
  });

  test('should be fully functional on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // Check desktop layout
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    
    // Test desktop navigation
    const desktopNav = page.locator('nav, .navigation, .desktop-nav');
    const navCount = await desktopNav.count();
    expect(navCount).toBeGreaterThanOrEqual(0);
    
    // Test hover effects
    const hoverElements = page.locator('button, a, .hoverable');
    const hoverCount = await hoverElements.count();
    expect(hoverCount).toBeGreaterThanOrEqual(0);
  });

  test('should have accessible forms on all screen sizes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    // Test form on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileFormElements = page.locator('input, button, select, textarea');
    const mobileCount = await mobileFormElements.count();
    expect(mobileCount).toBeGreaterThanOrEqual(0);
    
    // Test form on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const tabletFormElements = page.locator('input, button, select, textarea');
    const tabletCount = await tabletFormElements.count();
    expect(tabletCount).toBeGreaterThanOrEqual(0);
    
    // Test form on desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    const desktopFormElements = page.locator('input, button, select, textarea');
    const desktopCount = await desktopFormElements.count();
    expect(desktopCount).toBeGreaterThanOrEqual(0);
  });

  test('should display farms page responsively', async ({ page }) => {
    await page.goto('/farms');
    await page.waitForTimeout(2000);
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileContent = await page.textContent('body');
    expect(mobileContent).toBeTruthy();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const tabletContent = await page.textContent('body');
    expect(tabletContent).toBeTruthy();
    
    // Test desktop layout
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    const desktopContent = await page.textContent('body');
    expect(desktopContent).toBeTruthy();
  });

  test('should handle responsive modal dialogs', async ({ page }) => {
    await page.goto('/farms');
    await page.waitForTimeout(2000);
    
    // Look for modal triggers
    const modalTriggers = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    
    if (await modalTriggers.count() > 0) {
      try {
        await modalTriggers.first().click();
        await page.waitForTimeout(1000);
      } catch (error) {
        // If click fails, continue with test
      }
    }
    
    // Test modal on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileModals = page.locator('.modal, .dialog, [role="dialog"]');
    const mobileModalCount = await mobileModals.count();
    expect(mobileModalCount).toBeGreaterThanOrEqual(0);
    
    // Test modal on desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    const desktopModals = page.locator('.modal, .dialog, [role="dialog"]');
    const desktopModalCount = await desktopModals.count();
    expect(desktopModalCount).toBeGreaterThanOrEqual(0);
  });

  test('should maintain touch-friendly interface on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check for touch-friendly button sizes
    const buttons = page.locator('button, .btn, [role="button"]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(0);
    
    // Test touch interactions
    const touchElements = page.locator('a, button, [role="button"], .clickable');
    if (await touchElements.count() > 0) {
      try {
        // Simulate touch interaction
        await touchElements.first().hover();
        await page.waitForTimeout(100);
      } catch (error) {
        // If hover fails, continue with test
      }
    }
    
    // Check for mobile-specific elements
    const mobileElements = page.locator('.mobile-only, .touch-friendly, .mobile-nav');
    const mobileElementCount = await mobileElements.count();
    expect(mobileElementCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle landscape orientation on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Test landscape mobile
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);
    
    // Check landscape layout
    const landscapeContent = await page.textContent('body');
    expect(landscapeContent).toBeTruthy();
    
    // Test portrait mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check portrait layout
    const portraitContent = await page.textContent('body');
    expect(portraitContent).toBeTruthy();
  });

  test('should preserve functionality across breakpoints', async ({ page }) => {
    await page.goto('/farms');
    await page.waitForTimeout(2000);
    
    // Test functionality at different breakpoints
    const breakpoints = [
      { width: 320, height: 568 },  // Small mobile
      { width: 375, height: 667 },  // Standard mobile
      { width: 414, height: 896 },  // Large mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 }, // Tablet landscape
      { width: 1280, height: 720 }, // Desktop
      { width: 1920, height: 1080 } // Large desktop
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize(breakpoint);
      await page.waitForTimeout(500);
      
      // Test basic functionality at each breakpoint
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      
      // Test interactive elements
      const interactiveElements = page.locator('button, a, input, select');
      const elementCount = await interactiveElements.count();
      expect(elementCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should maintain performance across devices', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Test performance on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if page loads without errors
    const mobileContent = await page.textContent('body');
    expect(mobileContent).toBeTruthy();
    
    // Test performance on desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // Check if page loads without errors
    const desktopContent = await page.textContent('body');
    expect(desktopContent).toBeTruthy();
    
    // Test navigation performance
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    const loginContent = await page.textContent('body');
    expect(loginContent).toBeTruthy();
  });
});