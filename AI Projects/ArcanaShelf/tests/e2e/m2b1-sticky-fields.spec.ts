import { test, expect } from '@playwright/test'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { deleteBookByTitle } from './helpers/books'

const SUFFIX = Date.now()
const STICKY_KEY = 'arcanashelf_sticky_v1'

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
  // Clear any leftover sticky state before each test
  await page.evaluate((key) => localStorage.removeItem(key), STICKY_KEY)
})

test.describe('sticky fields', () => {
  test('sticky indicator appears after Save and Add Another', async ({ page }) => {
    const title = `Sticky Indicator Test ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByLabel('Publisher').fill('Dover Publications')
    await page.getByRole('button', { name: 'Save and Add Another' }).click()

    await page.waitForSelector(`text=Saved: ${title}. Fill next book.`, { timeout: 15_000 })

    await expect(
      page.getByText('Carrying format, publisher, topics from last save.')
    ).toBeVisible()

    await deleteBookByTitle(page, title)
  })

  test('"Clear" link removes sticky indicator and resets sticky fields', async ({ page }) => {
    const title = `Sticky Clear Test ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByLabel('Publisher').fill('Hermetic Press')
    await page.getByRole('button', { name: 'Save and Add Another' }).click()

    await page.waitForSelector(`text=Saved: ${title}. Fill next book.`, { timeout: 15_000 })

    await expect(page.getByLabel('Publisher')).toHaveValue('Hermetic Press')

    await page.getByRole('button', { name: 'Clear' }).click()

    await expect(
      page.getByText('Carrying format, publisher, topics from last save.')
    ).not.toBeVisible()
    await expect(page.getByLabel('Publisher')).toHaveValue('')

    await deleteBookByTitle(page, title)
  })

  test('sticky does NOT appear on Edit form', async ({ page }) => {
    const title = `Sticky Edit Guard Test ${SUFFIX}`

    // Write sticky directly so we can test without going through Save and Add Another
    await page.goto('/add')
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
      {
        key: STICKY_KEY,
        value: { format: 'lecture_notes', publisher: 'Test Publisher', topics: [], ts: Date.now() },
      }
    )

    // Create a book via the normal flow
    await page.getByLabel('Title *').fill(title)
    await page.getByRole('button', { name: 'Add to Library' }).click()
    await page.waitForURL(/\/library/, { timeout: 15_000 })

    // Navigate to edit
    await page.getByText(title).first().click()
    await page.waitForURL(/\/book\//)
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(/\/edit/)

    await expect(
      page.getByText('Carrying format, publisher, topics from last save.')
    ).not.toBeVisible()

    await deleteBookByTitle(page, title)
  })

  test('sticky values survive page reload within TTL', async ({ page }) => {
    const title = `Sticky Reload Test ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByLabel('Publisher').fill('Vanishing Inc.')
    await page.getByRole('button', { name: 'Save and Add Another' }).click()

    await page.waitForSelector(`text=Saved: ${title}. Fill next book.`, { timeout: 15_000 })

    // Reload the add page
    await page.reload()
    await page.waitForURL(/\/add/)

    // Sticky values should still be present
    await expect(page.getByLabel('Publisher')).toHaveValue('Vanishing Inc.')
    await expect(
      page.getByText('Carrying format, publisher, topics from last save.')
    ).toBeVisible()

    await deleteBookByTitle(page, title)
  })

  test('expired sticky does not pre-populate fields', async ({ page }) => {
    // Navigate to the app first so we're on the right origin for localStorage
    await page.goto('/add')

    // Write an expired sticky entry directly to localStorage
    const expiredTs = Date.now() - 31 * 60 * 1000 // 31 minutes ago
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
      {
        key: STICKY_KEY,
        value: { format: 'book', publisher: 'Expired Publisher', topics: [], ts: expiredTs },
      }
    )

    // Reload to trigger the sticky read on mount
    await page.reload()
    await page.waitForURL(/\/add/)

    await expect(page.getByLabel('Publisher')).toHaveValue('')
    await expect(
      page.getByText('Carrying format, publisher, topics from last save.')
    ).not.toBeVisible()
  })
})
