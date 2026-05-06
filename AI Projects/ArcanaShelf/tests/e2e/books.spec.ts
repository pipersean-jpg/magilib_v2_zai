import { test, expect } from '@playwright/test'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { createBook, deleteBookByTitle } from './helpers/books'

const BOOK = {
  title: `E2E Book ${Date.now()}`,
  authors: 'Playwright Author',
  year: '1999',
}

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
    // SIGNUP_FAILED means a real Supabase error — store it but let tests fail visibly
    authSkipReason = msg
    if (!msg.startsWith('SKIP:')) throw e
  }
  await ctx.close()
})

test.beforeEach(async ({ page }) => {
  if (!authReady) test.skip(true, authSkipReason)
  await signIn(page, sharedEmail, TEST_PASSWORD)
})

test.describe('manual book CRUD — no image', () => {
  test('create book without image succeeds', async ({ page }) => {
    await createBook(page, BOOK)
    await expect(page).toHaveURL(/\/library/)
  })

  test('created book appears in library', async ({ page }) => {
    await page.goto('/library')
    await expect(page.getByText(BOOK.title)).toBeVisible({ timeout: 10_000 })
  })

  test('book detail page opens', async ({ page }) => {
    await page.goto('/library')
    await page.getByText(BOOK.title).first().click()
    await expect(page).toHaveURL(/\/book\//)
    await expect(page.getByRole('heading', { name: BOOK.title })).toBeVisible()
  })

  test('edit book title', async ({ page }) => {
    await page.goto('/library')
    await page.getByText(BOOK.title).first().click()
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page).toHaveURL(/\/edit/)

    const updatedTitle = `${BOOK.title} — edited`
    await page.getByLabel('Title *').clear()
    await page.getByLabel('Title *').fill(updatedTitle)
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page).toHaveURL(/\/book\//)
    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()

    // Restore title for subsequent tests
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Title *').clear()
    await page.getByLabel('Title *').fill(BOOK.title)
    await page.getByRole('button', { name: 'Save Changes' }).click()
  })

  test('delete book removes it from library', async ({ page }) => {
    await deleteBookByTitle(page, BOOK.title)
    await expect(page).toHaveURL(/\/library/)
    await expect(page.getByText(BOOK.title)).not.toBeVisible()
  })
})
