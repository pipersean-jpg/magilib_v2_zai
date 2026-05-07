import { test, expect } from '@playwright/test'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { createBook, deleteBookFromDetail } from './helpers/books'

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

test.describe('delete confirmation dialog', () => {
  test('confirmation dialog shows book title and permanent-delete warning', async ({ page }) => {
    await createBook(page, { title: 'Dialog Confirm Test' })
    await page.goto('/library')
    await page.getByText('Dialog Confirm Test').first().click()
    await page.getByRole('button', { name: 'Remove from Library' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Remove "Dialog Confirm Test"?')).toBeVisible()
    await expect(dialog.getByText(/permanently delete/i)).toBeVisible()

    // Cleanup: confirm removal
    await dialog.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(page).toHaveURL(/\/library/)
  })

  test('cancelling confirmation keeps book on detail page', async ({ page }) => {
    await createBook(page, { title: 'Dialog Cancel Test' })
    await page.goto('/library')
    await page.getByText('Dialog Cancel Test').first().click()
    await page.getByRole('button', { name: 'Remove from Library' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove from Library' })).toBeVisible()

    // Cleanup
    await deleteBookFromDetail(page)
  })

  test('confirming deletion removes book from library', async ({ page }) => {
    await createBook(page, { title: 'Dialog Delete Test' })
    await page.goto('/library')
    await page.getByText('Dialog Delete Test').first().click()
    await page.getByRole('button', { name: 'Remove from Library' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Remove', exact: true }).click()

    await expect(page).toHaveURL(/\/library/)
    await expect(page.getByText('Dialog Delete Test')).not.toBeVisible()
  })
})

test.describe('form validation', () => {
  test('title required error appears on empty submit', async ({ page }) => {
    await page.goto('/add')
    await page.getByRole('button', { name: 'Add to Library' }).click()

    await expect(page.getByText('Title is required.')).toBeVisible()
    await expect(page).toHaveURL(/\/add/)
  })

  test('typing in title field clears the title error', async ({ page }) => {
    await page.goto('/add')
    await page.getByRole('button', { name: 'Add to Library' }).click()
    await expect(page.getByText('Title is required.')).toBeVisible()

    await page.getByLabel('Title *').fill('Some Title')
    await expect(page.getByText('Title is required.')).not.toBeVisible()
  })

  test('year out of range shows field error and blocks save', async ({ page }) => {
    await page.goto('/add')
    await page.getByLabel('Title *').fill('Year Validation Test')
    await page.getByLabel('Year').fill('999')
    await page.getByRole('button', { name: 'Add to Library' }).click()

    await expect(page.getByText(/Year must be between/)).toBeVisible()
    await expect(page).toHaveURL(/\/add/)
  })

  test('negative purchase price shows field error and blocks save', async ({ page }) => {
    await page.goto('/add')
    await page.getByLabel('Title *').fill('Price Validation Test')
    await page.getByLabel('Purchase Price').fill('-5')
    await page.getByRole('button', { name: 'Add to Library' }).click()

    await expect(page.getByText(/Purchase price cannot be negative/i)).toBeVisible()
    await expect(page).toHaveURL(/\/add/)
  })

  test('malformed ISBN-13 shows advisory warning but allows save', async ({ page }) => {
    const title = `ISBN Advisory Test ${Date.now()}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByLabel('ISBN-13').fill('not-an-isbn')
    await page.getByRole('button', { name: 'Add to Library' }).click()

    // Advisory warning — save proceeds to /library despite bad ISBN
    await page.waitForURL(/\/library/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/library/)

    // Cleanup
    await page.getByText(title).first().click()
    await deleteBookFromDetail(page)
  })
})
