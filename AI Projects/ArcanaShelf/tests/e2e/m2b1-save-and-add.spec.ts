import { test, expect } from '@playwright/test'
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

test.describe('Save and Add Another', () => {
  test('"Save and Add Another" button absent on Edit form', async ({ page }) => {
    const title = `Edit Form No SAA ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByRole('button', { name: 'Add to Library' }).click()
    await page.waitForURL(/\/library/, { timeout: 15_000 })

    await page.getByText(title).first().click()
    await page.waitForURL(/\/book\//)
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(/\/edit/)

    await expect(page.getByRole('button', { name: 'Save and Add Another' })).not.toBeVisible()

    await deleteBookByTitle(page, title)
  })

  test('Save and Add Another shows inline banner, does not navigate', async ({ page }) => {
    const title = `SAA Banner Test ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByRole('button', { name: 'Save and Add Another' }).click()

    await expect(page).toHaveURL(/\/add/, { timeout: 15_000 })
    await expect(page.getByText(`Saved: ${title}. Fill next book.`)).toBeVisible({ timeout: 10_000 })

    await deleteBookByTitle(page, title)
  })

  test('form resets non-sticky fields after Save and Add Another', async ({ page }) => {
    const title = `SAA Reset Test ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByLabel('Author(s)').fill('Some Author')
    await page.getByRole('button', { name: 'Save and Add Another' }).click()

    await page.waitForSelector(`text=Saved: ${title}. Fill next book.`, { timeout: 15_000 })

    await expect(page.getByLabel('Title *')).toHaveValue('')
    await expect(page.getByLabel('Author(s)')).toHaveValue('')

    await deleteBookByTitle(page, title)
  })

  test('sticky fields pre-populate the next Add form after Save and Add Another', async ({ page }) => {
    const title = `SAA Sticky Pre ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByLabel('Format').selectOption('lecture_notes')
    await page.getByLabel('Publisher').fill('Hermetic Press')

    await page.getByRole('button', { name: 'Save and Add Another' }).click()
    await page.waitForSelector(`text=Saved: ${title}. Fill next book.`, { timeout: 15_000 })

    await expect(page.getByLabel('Publisher')).toHaveValue('Hermetic Press')
    await expect(page.getByLabel('Format')).toHaveValue('lecture_notes')
    await expect(page.getByLabel('Title *')).toHaveValue('')

    await deleteBookByTitle(page, title)
  })

  test('normal "Add to Library" Save still navigates to library', async ({ page }) => {
    const title = `Normal Save Test ${SUFFIX}`
    await page.goto('/add')
    await page.getByLabel('Title *').fill(title)
    await page.getByRole('button', { name: 'Add to Library' }).click()

    await page.waitForURL(/\/library/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/library/)

    await deleteBookByTitle(page, title)
  })
})
