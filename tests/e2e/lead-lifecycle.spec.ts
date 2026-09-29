import { test, expect } from '@playwright/test';

/**
 * Lead2b E2E Lead Lifecycle & Offline Sync Test Suite
 * 
 * Verifies:
 * 1. Exhibitor Authentication & Redirect Guard
 * 2. OCR Business Card & Manual Lead Ingestion Flow
 * 3. Rapid Duplicate Detection & Warning Modal
 * 4. Offline Dexie Lead Persistence & Automatic Cloud Sync
 */

const BASE_URL = process.env.BASE_URL || 'https://app.dxb.llc';

test.describe('Lead2b - E2E Core Ingestion Lifecycle', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test('TC-E2E-01: Authenticate Exhibitor Admin & Access Dashboard', async ({ page }) => {
    // Fill credentials
    await page.fill('input[type="email"]', 'exhibitor@alphatech.com');
    await page.fill('input[type="password"]', 'Craftix@2026');
    await page.click('button[type="submit"]');

    // Expect redirect to Exhibitor Dashboard
    await expect(page).toHaveURL(/.*\/exhibitor\/dashboard/);
    await expect(page.locator('h1, h2')).toContainText(/Dashboard|Exhibitor/i);
  });

  test('TC-E2E-02: Business Card Capture & Field Auto-Population', async ({ page }) => {
    // Log in as booth sales rep
    await page.goto(`${BASE_URL}/login?demo=true`);
    await page.click('text=Tariq Mansoor'); // Pre-fill rep persona
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/app\/dashboard/);

    // Navigate to Card Scanner
    await page.goto(`${BASE_URL}/app/lead/card`);
    await expect(page.locator('text=Capture Business Card')).toBeVisible();

    // Fill form fields
    await page.fill('input[placeholder*="First Name"]', 'Ahmed');
    await page.fill('input[placeholder*="Last Name"]', 'Al-Mansoori');
    await page.fill('input[placeholder*="Company"]', 'Etisalat Global');
    await page.fill('input[placeholder*="Designation"]', 'VP Enterprise Sales');
    await page.fill('input[placeholder*="Email"]', `ahmed_${Date.now()}@etisalat.ae`);
    await page.fill('input[placeholder*="Phone"]', '+971 50 123 4567');

    // Submit lead
    await page.click('button:has-text("Save Lead")');

    // Expect confirmation and redirect to Lead Details
    await page.waitForURL(/.*\/app\/lead\/.*/);
    await expect(page.locator('text=Ahmed Al-Mansoori')).toBeVisible();
  });

  test('TC-E2E-03: Duplicate Visitor Detection & Alert Modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/login?demo=true`);
    await page.click('text=Tariq Mansoor');
    await page.click('button[type="submit"]');
    await page.goto(`${BASE_URL}/app/scan`);

    // Search for known existing attendee badge
    await page.fill('input[placeholder*="Badge ID"]', 'GITEX2026-ATT-00101');
    await page.click('button:has-text("Find")');

    // Qualify the attendee first time
    if (await page.locator('text=Qualify Lead').isVisible()) {
      await page.click('button:has-text("Save & Sync Lead")');
      await page.waitForTimeout(1500);
    }

    // Attempt to search same attendee badge a second time
    await page.fill('input[placeholder*="Badge ID"]', 'GITEX2026-ATT-00101');
    await page.click('button:has-text("Find")');

    // Expect Duplicate Lead Detected Modal
    await expect(page.locator('text=Duplicate Lead Detected')).toBeVisible();
    await expect(page.locator('text=This visitor has already been captured')).toBeVisible();
  });

  test('TC-E2E-04: Offline Lead Creation & Automatic Sync on Reconnect', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/login?demo=true`);
    await page.click('text=Tariq Mansoor');
    await page.click('button[type="submit"]');

    // Simulate Network Disconnect (Offline Mode)
    await context.setOffline(true);

    await page.goto(`${BASE_URL}/app/lead/new`);
    await page.fill('input[placeholder*="First Name"]', 'Rashid');
    await page.fill('input[placeholder*="Last Name"]', 'Kanoo');
    await page.fill('input[placeholder*="Email"]', `rashid_${Date.now()}@kanoo.ae`);
    await page.click('button:has-text("Save Lead")');

    // Check offline indicator
    await expect(page.locator('text=Saved Offline|Offline')).toBeVisible();

    // Re-establish Network Connectivity
    await context.setOffline(false);
    await page.waitForTimeout(2000);

    // Verify background sync triggered
    await page.goto(`${BASE_URL}/app/leads`);
    await expect(page.locator('text=Rashid Kanoo')).toBeVisible();
  });
});
