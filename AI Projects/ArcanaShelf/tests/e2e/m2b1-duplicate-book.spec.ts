import { test, expect } from '@playwright/test'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { createBook, deleteBookByTitle, deleteBookFromDetail } from './helpers/books'

const SUFFIX = Date.now()
const ORIGINAL_TITLE = `Duplicate Original ${SUFFIX}`

let sharedEmail: string
let authReady = false
let authSkipReason = ''
let originalBookUrl = ''

test.beforeAll(async ({ browser }) => {
  sharedEmail = testEmail()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    await signUp(page, sharedEmail, TEST_PASSWORD)

    // Create the original book once for all duplicate tests
    await createBook(page, {
      title: ORIGINAL_TITLE,
      authors: 'S. W. Erdnase',
      year: '1902',
    })

    // Navigate to the book to get its URL
    await page.goto('/library')
    await page.getByText(ORIGINAL_TITLE).first().click()
    await page.waitForURL(/\/book\//)
    originalBookUrl = page.url()

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

test.describe('duplicate book flow', () => {
  test('Duplicate button is visible on Book Detail page', async ({ page }) => {
    await page.goto(originalBookUrl)
    await expect(page.getByRole('button', { name: 'Duplicate' })).toBeVisible()
  })

  test('duplicate confirmation dialog appears with cover-not-copied message', async ({ page }) => {
    await page.goto(originalBookUrl)
    await page.getByRole('button', { name: 'Duplicate' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await expect(dialog.getByText(/cover image will not be copied/i)).toBeVisible()
  })

  test('duplicate dialog cancel does not create a book', async ({ page }) => {
    await page.goto(originalBookUrl)
    await page.getByRole('button', { name: 'Duplicate' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5_000 })
    await dialog.getByRole('button', { name: 'Cancel' }).click()

    // Stay on detail page
    await expect(page).toHaveURL(new RegExp(originalBookUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  test('duplicate creates new book and redirects to edit page with banner', async ({ page }) => {
    await page.goto(originalBookUrl)
    await page.getByRole('button', { name: 'Duplicate' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5_000 })
    await dialog.getByRole('button', { name: 'Duplicate' }).click()

    // Should redirect to a new edit page with ?duplicated=1
    await page.waitForURL(/\/book\/.+\/edit\?duplicated=1/, { timeout: 15_000 })

    // Banner should be visible
    await expect(page.getByText('Duplicate created — review and save.')).toBeVisible({ timeout: 5_000 })

    // The edit form should have the original title
    await expect(page.getByLabel('Title *')).toHaveValue(ORIGINAL_TITLE)

    // Clean up the duplicate — save it first so we can navigate to and delete it
    const newBookIdMatch = page.url().match(/\/book\/([^/]+)\/edit/)
    if (newBookIdMatch) {
      await page.goto(`/book/${newBookIdMatch[1]}`)
      await deleteBookFromDetail(page)
    }
  })

  test('duplicate has no cover image (cover_image_path is null)', async ({ page }) => {
    await page.goto(originalBookUrl)
    await page.getByRole('button', { name: 'Duplicate' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5_000 })
    await dialog.getByRole('button', { name: 'Duplicate' }).click()

    await page.waitForURL(/\/book\/.+\/edit\?duplicated=1/, { timeout: 15_000 })

    // Navigate to the duplicate's detail page to check cover
    const newBookIdMatch = page.url().match(/\/book\/([^/]+)\/edit/)
    expect(newBookIdMatch).not.toBeNull()
    const newId = newBookIdMatch![1]

    await page.goto(`/book/${newId}`)
    // No <img alt="Book cover"> should be present — placeholder SVG is shown instead
    await expect(page.locator('img[alt="Book cover"]')).not.toBeVisible({ timeout: 5_000 })

    await deleteBookFromDetail(page)
  })

  test('original book is unchanged after duplicate', async ({ page }) => {
    // Create a fresh duplicate so we can check original is unchanged
    await page.goto(originalBookUrl)
    await page.getByRole('button', { name: 'Duplicate' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 5_000 })
    await dialog.getByRole('button', { name: 'Duplicate' }).click()

    await page.waitForURL(/\/book\/.+\/edit\?duplicated=1/, { timeout: 15_000 })
    const newBookIdMatch = page.url().match(/\/book\/([^/]+)\/edit/)

    // Navigate back to original and verify unchanged
    await page.goto(originalBookUrl)
    await expect(page.getByRole('heading', { name: ORIGINAL_TITLE })).toBeVisible()
    await expect(page.getByText('S. W. Erdnase')).toBeVisible()

    // Clean up duplicate
    if (newBookIdMatch) {
      await page.goto(`/book/${newBookIdMatch[1]}`)
      await deleteBookFromDetail(page)
    }
  })

  test.afterAll(async ({ browser }) => {
    if (!authReady) return
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await signIn(page, sharedEmail, TEST_PASSWORD)
    try { await deleteBookByTitle(page, ORIGINAL_TITLE) } catch { /* may already be deleted */ }
    await ctx.close()
  })
})
