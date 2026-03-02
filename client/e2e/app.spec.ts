import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to auth when not logged in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*auth/);
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByRole('heading', { name: /MyCareCoach/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/mot de passe/i)).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder(/email/i).fill('test@invalid.com');
    await page.getByPlaceholder(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText(/erreur/i)).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.goto('/');
    // TODO: Add proper auth setup
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.getByText(/total clients/i)).toBeVisible();
    await expect(page.getByText(/séances/i)).toBeVisible();
  });

  test('should navigate to clients page', async ({ page }) => {
    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL(/.*clients/);
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
  });
});

test.describe('Clients', () => {
  test('should open add client modal', async ({ page }) => {
    await page.goto('/clients');
    await page.getByRole('button', { name: /nouveau client/i }).click();
    await expect(page.getByRole('heading', { name: /nouveau client/i })).toBeVisible();
  });

  test('should search clients', async ({ page }) => {
    await page.goto('/clients');
    await page.getByPlaceholder(/rechercher/i).fill('test');
    // TODO: Add assertions based on search results
  });
});

test.describe('Responsive', () => {
  test('should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
  });
});
