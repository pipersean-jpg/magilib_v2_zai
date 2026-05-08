import { test, expect, type Page } from '@playwright/test'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { deleteBookByTitle } from './helpers/books'

const SUFFIX = Date.now()

let sharedEmail: string
let authReady = false
let authSkipReason = ''

test.beforeAll(async ({ browser }) => {
  sharedEmail = testEmail()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    await signUp(page, sharedEmail, TEST_PASSWORD)
    authReady = true
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Auth setup failed'
    authSkipReason = msg
    if (!msg.startsWith('SKIP:')) throw e
  }
  await ctx.close()
})

test.beforeEach(async ({ page }) => {
  if (!authReady) test.skip(true, authSkipReason)
  await signIn(page, sharedEmail, TEST_PASSWORD)
})

async function mockIsbnRoute(page: Page, result: Record<string, unknown> | null) {
  await page.route('**/api/isbn-lookup**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result }),
    })
  })
}

test.describe('M2C ISBN Lookup', () => {
  test('button visible and disabled when both ISBN fields are empty', async ({ page }) => {
    await page.goto('/add')
    const btn = page.getByRole('button', { name: 'Look Up from ISBN' })
    await expect(btn).toBeVisible()
    await expect(btn).toBeDisabled()
  })

  test('button enables when ISBN-13 has a value', async ({ page }) => {
    await page.goto('/add')
    await page.getByLabel('ISBN-13').fill('9780486277714')
    await expect(page.getByRole('button', { name: 'Look Up from ISBN' })).toBeEnabled()
  })

  test('button enables when ISBN-10 has a value', async ({ page }) => {
    await page.goto('/add')
    await page.getByLabel('ISBN-10').fill('0486277712')
    await expect(page.getByRole('button', { name: 'Look Up from ISBN' })).toBeEnabled()
  })

  test('happy path: fills empty fields from lookup result', async ({ page }) => {
    const title = `Lookup Happy Path ${SUFFIX}`
    await mockIsbnRoute(page, {
      title,
      authors: ['Test Author'],
      publisher: 'Test Press',
      year: 1985,
      page_count: 200,
    })
    await page.goto('/add')
    await page.getByLabel('ISBN-13').fill('9780486277714')
    await page.getByRole('button', { name: 'Look Up from ISBN' }).click()

    await expect(page.getByText(/field.*filled/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel('Title *')).toHaveValue(title)
    await expect(page.getByLabel('Author(s)')).toHaveValue('Test Author')
    await expect(page.getByLabel('Publisher')).toHaveValue('Test Press')
    await expect(page.getByLabel('Year')).toHaveValue('1985')
    await expect(page.getByLabel('Pages')).toHaveValue('200')

    await page.getByRole('button', { name: 'Add to Library' }).click()
    await page.waitForURL(/\/library/, { timeout: 15_000 })
    await deleteBookByTitle(page, title)
  })

  test('no-match: shows no-match banner', async ({ page }) => {
    await mockIsbnRoute(page, null)
    await page.goto('/add')
    await page.getByLabel('ISBN-13').fill('9780000000000')
    await page.getByRole('button', { name: 'Look Up from ISBN' }).click()
    await expect(
      page.getByText('No match found — continue entering manually.'),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('error: shows error banner on API 500', async ({ page }) => {
    await page.route('**/api/isbn-lookup**', (route) => {
      route.fulfill({ status: 500 })
    })
    await page.goto('/add')
    await page.getByLabel('ISBN-13').fill('9780486277714')
    await page.getByRole('button', { name: 'Look Up from ISBN' }).click()
    await expect(
      page.getByText('Lookup failed — try again or continue manually.'),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('no-overwrite: pre-typed title preserved, empty fields filled', async ({ page }) => {
    await mockIsbnRoute(page, {
      title: 'Title From API',
      publisher: 'API Press',
    })
    await page.goto('/add')
    await page.getByLabel('Title *').fill('My Own Title')
    await page.getByLabel('ISBN-13').fill('9780486277714')
    await page.getByRole('button', { name: 'Look Up from ISBN' }).click()

    await expect(page.getByText(/field.*filled/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel('Title *')).toHaveValue('My Own Title')
    await expect(page.getByLabel('Publisher')).toHaveValue('API Press')
  })

  test('banner is dismissible', async ({ page }) => {
    await mockIsbnRoute(page, null)
    await page.goto('/add')
    await page.getByLabel('ISBN-13').fill('9780000000000')
    await page.getByRole('button', { name: 'Look Up from ISBN' }).click()
    await expect(
      page.getByText('No match found — continue entering manually.'),
    ).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: 'Dismiss lookup result' }).click()
    await expect(
      page.getByText('No match found — continue entering manually.'),
    ).not.toBeVisible()
  })

  test('lookup button does not appear on Edit form', async ({ page }) => {
    const title = `Lookup Edit Guard ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByRole('button', { name: 'Add to Library' }).click()
    await page.waitForURL(/\/library/, { timeout: 15_000 })

    await page.getByText(title).first().click()
    await page.waitForURL(/\/book\//)
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(/\/edit/)

    await expect(page.getByRole('button', { name: 'Look Up from ISBN' })).not.toBeVisible()
    await deleteBookByTitle(page, title)
  })
})
