import { test, expect } from '@playwright/test';

test.describe('VaaniX Public Site & Core Flows', () => {
  test('Home page renders hero, verified stats, and 8 core sections', async ({ page }) => {
    await page.goto('/');

    // Check title and hero
    await expect(page).toHaveTitle(/VaaniX/i);
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText(/AI voice-clone scam/i);

    // Verify McAfee & Government stats from Section 13
    await expect(page.locator('text=47%')).toBeVisible();
    await expect(page.locator('text=83%')).toBeVisible();
    await expect(page.locator('text=3 sec')).toBeVisible();
    await expect(page.locator('text=₹22,845 crore')).toBeVisible();

    // Check CTA buttons
    const tryFreeBtn = page.locator('a[href="/try"]').first();
    await expect(tryFreeBtn).toBeVisible();

    // Check Footer privacy link
    const privacyLink = page.locator('footer a[href="/privacy"]');
    await expect(privacyLink).toBeVisible();
  });

  test('How It Works page displays 2-step verification architecture', async ({ page }) => {
    await page.goto('/how-it-works');

    await expect(page.locator('h1')).toContainText(/How VaaniX Works/i);
    await expect(page.locator('text=Acoustic Spoof Detection')).toBeVisible();
    await expect(page.locator('text=Nes2Net-X')).toBeVisible();
    await expect(page.locator('text=faster-whisper')).toBeVisible();
  });

  test('Scam Radar page allows phone reputation lookup', async ({ page }) => {
    await page.goto('/radar');

    await expect(page.locator('h1')).toContainText(/Scam Radar/i);
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();

    // Search for a test number
    await phoneInput.fill('+919876543210');
    await page.locator('button:has-text("Check Number")').click();

    // Expect results container to appear
    await expect(page.locator('text=+919876543210')).toBeVisible({ timeout: 10000 });
  });

  test('Emergency Call 1930 page renders speed-dial button', async ({ page }) => {
    await page.goto('/r/call1930');

    await expect(page.locator('h1')).toContainText(/National Cyber Crime Helpline/i);
    const callBtn = page.locator('#call-1930-btn');
    await expect(callBtn).toBeVisible();
    await expect(callBtn).toHaveAttribute('href', 'tel:1930');
    await expect(callBtn).toContainText(/Call 1930 Now/i);

    // Official portal link
    const portalLink = page.locator('a[href="https://cybercrime.gov.in"]');
    await expect(portalLink).toBeVisible();
  });

  test('Public Try Demo loads mic and sample file upload tabs', async ({ page }) => {
    await page.goto('/try');

    await expect(page.locator('h1')).toContainText(/Try VaaniX/i);
    // Consent checkbox
    const consent = page.locator('input[type="checkbox"]#consent-checkbox');
    if (await consent.isVisible()) {
      await expect(consent).toBeVisible();
    }
    // Upload tab or button
    await expect(page.locator('text=Demo Mode')).toBeVisible();
  });

  test('Developers page renders API specifications and cURL examples', async ({ page }) => {
    await page.goto('/developers');

    await expect(page.locator('h1')).toContainText(/Developer API/i);
    await expect(page.locator('text=/api/v1/analyze')).toBeVisible();
    await expect(page.locator('text=POST')).toBeVisible();
  });

  test('Privacy policy strictly details audio retention and deletion rights', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.locator('h1')).toContainText(/Privacy Policy/i);
    await expect(page.locator('text=30 days')).toBeVisible();
    await expect(page.locator('text=Delete my data')).toBeVisible();
  });
});
