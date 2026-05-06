import { test, expect } from '@playwright/test'
import { signUp, signIn, signOut, testEmail, TEST_PASSWORD } from './helpers/auth'

async function trySignUp(
  page: Parameters<typeof signUp>[0],
  email: string,
  password: string
): Promise<boolean> {
  try {
    await signUp(page, email, password)
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('SKIP:')) {
      test.skip(true, e.message)
    }
    throw e
  }
}

test.describe('route protection — unauthenticated', () => {
  test('/library redirects to /login', async ({ page }) => {
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/add redirects to /login', async ({ page }) => {
    await page.goto('/add')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/settings redirects to /login', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/book/[id] redirects to /login', async ({ page }) => {
    await page.goto('/book/00000000-0000-0000-0000-000000000000')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('auth flow', () => {
  test('signup creates account and lands on /library', async ({ page }) => {
    await trySignUp(page, testEmail(), TEST_PASSWORD)
    await expect(page).toHaveURL(/\/library$/)
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible()
    await expect(page.getByText('Library is empty')).toBeVisible()
  })

  test('logout redirects to /login and clears session', async ({ page }) => {
    const email = testEmail()
    await trySignUp(page, email, TEST_PASSWORD)
    await signOut(page)
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login works', async ({ page }) => {
    const email = testEmail()
    await trySignUp(page, email, TEST_PASSWORD)
    await signOut(page)
    await signIn(page, email, TEST_PASSWORD)
    await expect(page).toHaveURL(/\/library/)
  })

  test('authenticated /login redirects to /library', async ({ page }) => {
    await trySignUp(page, testEmail(), TEST_PASSWORD)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/library/)
  })

  test('session persists after hard reload', async ({ page }) => {
    await trySignUp(page, testEmail(), TEST_PASSWORD)
    await page.reload()
    await expect(page).toHaveURL(/\/library/)
    await expect(page).not.toHaveURL(/\/login/)
  })
})

