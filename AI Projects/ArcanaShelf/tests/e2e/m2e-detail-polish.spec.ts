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

test.describe('M2E — BookDetail section structure', () => {
  test('Bibliographic section heading visible when bibliographic fields set', async ({ page }) => {
    await createBook(page, { title: 'Bib Section Test', year: '1987' })
    await page.goto('/library')
    await page.getByText('Bib Section Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByText('Bibliographic')).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('Your Copy section heading visible when copy fields set', async ({ page }) => {
    await createBook(page, { title: 'Copy Section Test', condition: 'very_good' })
    await page.goto('/library')
    await page.getByText('Copy Section Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByText('Your Copy')).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('Specialist section heading visible when specialist fields set', async ({ page }) => {
    await createBook(page, {
      title: 'Performers Detail Test',
      performers: 'Dai Vernon',
    })
    await page.goto('/library')
    await page.getByText('Performers Detail Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByRole('heading', { name: 'Specialist', exact: true })).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('Specialist section hidden when no specialist fields set', async ({ page }) => {
    await createBook(page, { title: 'No Specialist Section Test', year: '2001' })
    await page.goto('/library')
    await page.getByText('No Specialist Section Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByText('Specialist')).not.toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('signed appears in Specialist section', async ({ page }) => {
    await createBook(page, { title: 'Autographed Detail Test', signed: true })
    await page.goto('/library')
    await page.getByText('Autographed Detail Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByRole('heading', { name: 'Specialist', exact: true })).toBeVisible()
    await expect(page.getByText('Signed', { exact: true }).first()).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('limited edition appears in Specialist section', async ({ page }) => {
    await createBook(page, { title: 'Numbered Detail Test', limitedEditionNumber: '12/100' })
    await page.goto('/library')
    await page.getByText('Numbered Detail Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByRole('heading', { name: 'Specialist', exact: true })).toBeVisible()
    await expect(page.getByText('Limited Edition')).toBeVisible()
    await expect(page.getByText('12/100').first()).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('Conjuring Archive renders as tappable link row in Specialist section', async ({ page }) => {
    await createBook(page, {
      title: 'CA Link Row Test',
      conjuringArchiveUrl: 'https://www.conjuringarchive.com/list/book/9999',
    })
    await page.goto('/library')
    await page.getByText('CA Link Row Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByText('Specialist')).toBeVisible()
    const link = page.getByRole('link', { name: /conjuring archive/i })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', 'https://www.conjuringarchive.com/list/book/9999')
    await expect(link).toHaveAttribute('target', '_blank')

    await deleteBookFromDetail(page)
  })

  test('quick strip shows format badge on detail page', async ({ page }) => {
    await createBook(page, { title: 'Quick Strip Format Test', format: 'manuscript' })
    await page.goto('/library')
    await page.getByText('Quick Strip Format Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByText('Manuscript').first()).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('quick strip shows year badge on detail page', async ({ page }) => {
    await createBook(page, { title: 'Quick Strip Year Test', year: '1975' })
    await page.goto('/library')
    await page.getByText('Quick Strip Year Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    // Year appears at least once (quick strip + bibliographic row)
    await expect(page.getByText('1975').first()).toBeVisible()

    await deleteBookFromDetail(page)
  })
})

test.describe('M2E — BookCard density', () => {
  test('BookCard shows format pill in library', async ({ page }) => {
    await createBook(page, {
      title: 'Card Format Pill Test',
      format: 'lecture_notes',
    })
    await page.goto('/library')

    const card = page.locator('a').filter({ hasText: 'Card Format Pill Test' })
    await expect(card).toBeVisible()
    await expect(card.getByText('Lecture Notes')).toBeVisible()

    await page.getByText('Card Format Pill Test').first().click()
    await page.waitForURL(/\/book\//)
    await deleteBookFromDetail(page)
  })

  test('BookCard shows year in library', async ({ page }) => {
    await createBook(page, { title: 'Card Year Test', year: '1963' })
    await page.goto('/library')

    const card = page.locator('a').filter({ hasText: 'Card Year Test' })
    await expect(card).toBeVisible()
    await expect(card.getByText(/1963/)).toBeVisible()

    await page.getByText('Card Year Test').first().click()
    await page.waitForURL(/\/book\//)
    await deleteBookFromDetail(page)
  })

  test('BookCard shows Signed badge when signed', async ({ page }) => {
    await createBook(page, { title: 'Autographed Card Test', signed: true })
    await page.goto('/library')

    const card = page.locator('a').filter({ hasText: 'Autographed Card Test' })
    await expect(card).toBeVisible()
    await expect(card.getByText('Signed')).toBeVisible()

    await page.getByText('Autographed Card Test').first().click()
    await page.waitForURL(/\/book\//)
    await deleteBookFromDetail(page)
  })

  test('BookCard shows Ltd badge when limited edition set', async ({ page }) => {
    await createBook(page, { title: 'Card Ltd Test', limitedEditionNumber: '5/50' })
    await page.goto('/library')

    const card = page.locator('a').filter({ hasText: 'Card Ltd Test' })
    await expect(card).toBeVisible()
    await expect(card.getByText(/Ltd 5\/50/)).toBeVisible()

    await page.getByText('Card Ltd Test').first().click()
    await page.waitForURL(/\/book\//)
    await deleteBookFromDetail(page)
  })
})
