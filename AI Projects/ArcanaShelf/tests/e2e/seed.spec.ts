import { test, expect } from '@playwright/test'
import { signIn } from './helpers/auth'

const SEED_EMAIL = process.env.E2E_SEED_EMAIL ?? ''
const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? ''

const SEED_TITLES = [
  'Expert at the Card Table',
  'The Royal Road to Card Magic',
  'Dai Vernon Book of Magic',
  'Strong Magic',
  '13 Steps to Mentalism',
]

test.describe('seed data verification', () => {
  test.beforeAll(() => {
    if (!SEED_EMAIL || !SEED_PASSWORD) {
      console.log(
        'Skipping seed tests — set E2E_SEED_EMAIL and E2E_SEED_PASSWORD env vars ' +
          'after running supabase/seed.sql for test@example.com'
      )
    }
  })

  test('seeded books appear in library for test user', async ({ page }) => {
    if (!SEED_EMAIL || !SEED_PASSWORD) test.skip()

    await signIn(page, SEED_EMAIL, SEED_PASSWORD)
    await expect(page).toHaveURL(/\/library/)

    for (const title of SEED_TITLES) {
      await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })
    }
  })

  test('seeded books do not appear for a different user', async ({ page }) => {
    if (!SEED_EMAIL || !SEED_PASSWORD) test.skip()

    // Create a fresh account — should have zero books
    const freshEmail = `arcanashelf-isolation-${Date.now()}@example.com`
    await page.goto('/login')
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.getByPlaceholder('Email').fill(freshEmail)
    await page.getByPlaceholder('Password').fill('TestPassword99!')
    await page.getByRole('button', { name: 'Create account' }).click()
    await page.waitForURL('**/library', { timeout: 15_000 })

    for (const title of SEED_TITLES) {
      await expect(page.getByText(title)).not.toBeVisible()
    }
  })
})
