import { test, expect } from '@playwright/test'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { deleteBookByTitle } from './helpers/books'

const SUFFIX = Date.now()
const KNOWN_PUBLISHER = `Autocomplete Press ${SUFFIX}`

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

test.describe('publisher autocomplete (datalist)', () => {
  test('publisher datalist includes known publisher from existing library book', async ({ page }) => {
    const seedTitle = `Publisher Seed Book ${SUFFIX}`

    // Create a book with a known publisher
    await page.goto('/add')
    await page.getByLabel('Title *').fill(seedTitle)
    await page.getByLabel('Publisher').fill(KNOWN_PUBLISHER)
    await page.getByRole('button', { name: 'Add to Library' }).click()
    await page.waitForURL(/\/library/, { timeout: 15_000 })

    // Go back to add form and verify datalist contains the publisher
    await page.goto('/add')
    const datalist = page.locator('#publisher-suggestions')
    await expect(datalist).toBeAttached({ timeout: 5_000 })
    // datalist options are self-closing with value attribute, not inner text
    const matchingOption = datalist.locator(`option[value="${KNOWN_PUBLISHER}"]`)
    await expect(matchingOption).toHaveCount(1, { timeout: 5_000 })

    await deleteBookByTitle(page, seedTitle)
  })

  test('free-entry publisher saves and retrieves correctly', async ({ page }) => {
    const title = `Free Entry Publisher Test ${SUFFIX}`
    const publisher = `Unlisted Publisher ${SUFFIX}`

    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByLabel('Publisher').fill(publisher)
    await page.getByRole('button', { name: 'Add to Library' }).click()
    await page.waitForURL(/\/library/, { timeout: 15_000 })

    await page.getByText(title).first().click()
    await page.waitForURL(/\/book\//)
    await expect(page.getByText(publisher)).toBeVisible()

    await deleteBookByTitle(page, title)
  })

  test('publisher datalist is not shown when library has no publishers', async ({ page }) => {
    // Fresh user has no books, so datalist should have no options (or not be present)
    await page.goto('/add')
    const datalist = page.locator('#publisher-suggestions')

    // Datalist should either not be in DOM or have zero option children
    const count = await datalist.count()
    if (count > 0) {
      const options = datalist.locator('option')
      await expect(options).toHaveCount(0)
    }
    // Either outcome is acceptable — the datalist is only rendered when publishers.length > 0
  })
})
