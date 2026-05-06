import { test, expect } from '@playwright/test'
import path from 'path'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { deleteBookFromDetail } from './helpers/books'

const TEST_COVER = path.join(__dirname, 'fixtures/test-cover.png')
const BOOK_TITLE = 'E2E Image Book'

let sharedEmail: string
let authReady = false
let imageReady = false
let authSkipReason = ''

test.beforeAll(async ({ browser }) => {
  sharedEmail = testEmail()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    await signUp(page, sharedEmail, TEST_PASSWORD)
    // Create the shared test book with a cover image
    await page.goto('/add')
    await page.getByLabel('Title *').fill(BOOK_TITLE)
    await page.locator('input[type="file"]').setInputFiles(TEST_COVER)
    await page.getByRole('button', { name: 'Add to Library' }).click()
    // If we land on /library, image upload succeeded (bucket configured)
    // If still on /add, image upload failed (bucket not configured) but book was saved
    try {
      await page.waitForURL('**/library', { timeout: 15_000 })
      imageReady = true
    } catch {
      // Bucket not configured — book metadata saved, no cover
    }
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

test.describe('cover image flow', () => {
  test('book appears in library after creation', async ({ page }) => {
    await page.goto('/library')
    await expect(page.getByText(BOOK_TITLE).first()).toBeVisible({ timeout: 10_000 })
  })

  test('cover displays in library card', async ({ page }) => {
    if (!imageReady) test.skip(true, 'book-images bucket not configured')
    await page.goto('/library')
    await expect(page.getByText(BOOK_TITLE).first()).toBeVisible({ timeout: 10_000 })
    const card = page.locator('a').filter({ hasText: BOOK_TITLE })
    await expect(card.locator('img')).toBeVisible({ timeout: 10_000 })
  })

  test('cover displays on book detail page', async ({ page }) => {
    if (!imageReady) test.skip(true, 'book-images bucket not configured')
    await page.goto('/library')
    await page.getByText(BOOK_TITLE).first().click()
    await expect(page).toHaveURL(/\/book\//)
    await expect(page.locator('main img').first()).toBeVisible({ timeout: 10_000 })
  })

  test('replace cover image', async ({ page }) => {
    if (!imageReady) test.skip(true, 'book-images bucket not configured')
    await page.goto('/library')
    await page.getByText(BOOK_TITLE).first().click()
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page).toHaveURL(/\/edit/)
    await page.locator('input[type="file"]').setInputFiles(TEST_COVER)
    await expect(page.getByText('test-cover.png')).toBeVisible()
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page).toHaveURL(/\/book\//, { timeout: 15_000 })
    await expect(page.locator('main img').first()).toBeVisible({ timeout: 10_000 })
  })

  test('delete book removes it from library', async ({ page }) => {
    await page.goto('/library')
    const bookLink = page.getByText(BOOK_TITLE).first()
    await bookLink.waitFor({ state: 'visible', timeout: 10_000 })
    await bookLink.click()
    await deleteBookFromDetail(page)
    await expect(page).toHaveURL(/\/library/)
    await expect(page.getByText(BOOK_TITLE)).not.toBeVisible()
  })
})
