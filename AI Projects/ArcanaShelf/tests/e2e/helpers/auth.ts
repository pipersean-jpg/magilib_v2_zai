import type { Page } from '@playwright/test'

export const TEST_PASSWORD = 'TestPassword99!'

export const EMAIL_SIGNUPS_DISABLED_SKIP =
  'SKIP:EMAIL_SIGNUPS_DISABLED — Email/password signups are disabled in Supabase. ' +
  'Enable: Dashboard → Authentication → Providers → Email → turn on "Enable Email provider"'

export const EMAIL_CONFIRM_SKIP =
  'SKIP:EMAIL_CONFIRM — Supabase email confirmation is ON. ' +
  'Disable: Dashboard → Authentication → Configuration → Email → uncheck "Confirm email"'

export function testEmail(): string {
  return `arcanashelf-e2e-${Date.now()}@example.com`
}

export async function signUp(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  // Toggle to signup mode — "Create account" button is the toggle when in login mode
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Password').fill(password)
  // Submit — in signup mode the submit button also says "Create account"
  await page.getByRole('button', { name: 'Create account' }).click()
  // Wait specifically for /library. Using /login/ in the pattern would resolve
  // immediately because we are already on /login before the navigation starts.
  try {
    await page.waitForURL('**/library', { timeout: 10_000 })
  } catch {
    // Still on /login after timeout. Determine why.
    const pageError = await page.locator('p.text-red-600').first().textContent().catch(() => null)
    const msg = pageError?.trim() ?? ''
    if (/signup(s)? are disabled/i.test(msg) || /email provider/i.test(msg)) {
      throw new Error(EMAIL_SIGNUPS_DISABLED_SKIP)
    }
    if (msg) {
      // Other Supabase error (rate limit, domain block, weak password, etc.)
      throw new Error(`SIGNUP_FAILED: ${msg}`)
    }
    // No error visible — signup succeeded but no session was created (email confirmation ON)
    throw new Error(EMAIL_CONFIRM_SKIP)
  }
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/library', { timeout: 15_000 })
}

export async function signOut(page: Page): Promise<void> {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL('**/login', { timeout: 10_000 })
}
