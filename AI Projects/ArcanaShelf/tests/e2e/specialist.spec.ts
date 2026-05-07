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

test.describe('specialist fields', () => {
  test('format field saved and displayed on detail page', async ({ page }) => {
    await createBook(page, { title: 'Format Field Test', format: 'lecture_notes' })
    await page.goto('/library')
    await page.getByText('Format Field Test').first().click()

    await expect(page.getByText('Lecture Notes')).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('performers field saved and displayed on detail page', async ({ page }) => {
    await createBook(page, {
      title: 'Performers Field Test',
      performers: 'Dai Vernon, Charlie Miller',
    })
    await page.goto('/library')
    await page.getByText('Performers Field Test').first().click()

    await expect(page.getByText('Performers')).toBeVisible()
    await expect(page.getByText('Dai Vernon, Charlie Miller')).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('signed checkbox saved and displayed on detail page', async ({ page }) => {
    await createBook(page, { title: 'Signed Field Test', signed: true })
    await page.goto('/library')
    await page.getByText('Signed Field Test').first().click()
    await page.waitForURL(/\/book\//, { timeout: 10_000 })

    await expect(page.getByText('Signed', { exact: true })).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('limited edition number saved and displayed on detail page', async ({ page }) => {
    await createBook(page, {
      title: 'Limited Edition Test',
      limitedEditionNumber: '47/200',
    })
    await page.goto('/library')
    await page.getByText('Limited Edition Test').first().click()

    await expect(page.getByText('Limited Edition')).toBeVisible()
    await expect(page.getByText('47/200')).toBeVisible()

    await deleteBookFromDetail(page)
  })

  test('conjuring archive URL saved and shown as external link', async ({ page }) => {
    await createBook(page, {
      title: 'Conjuring Archive URL Test',
      conjuringArchiveUrl: 'https://www.conjuringarchive.com/list/book/1234',
    })
    await page.goto('/library')
    await page.getByText('Conjuring Archive URL Test').first().click()

    const link = page.getByRole('link', { name: /conjuring archive/i })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', 'https://www.conjuringarchive.com/list/book/1234')
    await expect(link).toHaveAttribute('target', '_blank')

    await deleteBookFromDetail(page)
  })

  test('magicref URL saved and shown as external link', async ({ page }) => {
    await createBook(page, {
      title: 'MagicRef URL Test',
      magicrefUrl: 'https://magicref.net/magicbooks/123',
    })
    await page.goto('/library')
    await page.getByText('MagicRef URL Test').first().click()

    const link = page.getByRole('link', { name: /magicref/i })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', 'https://magicref.net/magicbooks/123')
    await expect(link).toHaveAttribute('target', '_blank')

    await deleteBookFromDetail(page)
  })

  test('book with no specialist fields shows no sources section', async ({ page }) => {
    await createBook(page, { title: 'No Specialist Fields Test' })
    await page.goto('/library')
    await page.getByText('No Specialist Fields Test').first().click()

    await expect(page.getByRole('link', { name: /conjuring archive/i })).not.toBeVisible()
    await expect(page.getByRole('link', { name: /magicref/i })).not.toBeVisible()

    await deleteBookFromDetail(page)
  })
})
