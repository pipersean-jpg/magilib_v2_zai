import type { Page } from '@playwright/test'

export interface BookData {
  title: string
  authors?: string
  year?: string
  format?: string
  performers?: string
  signed?: boolean
  limitedEditionNumber?: string
  conjuringArchiveUrl?: string
  magicrefUrl?: string
}

export async function createBook(page: Page, book: BookData): Promise<void> {
  await page.goto('/add')
  await page.getByLabel('Title *').fill(book.title)
  if (book.authors) await page.getByLabel('Author(s)').fill(book.authors)
  if (book.year) await page.getByLabel('Year').fill(book.year)
  if (book.format) await page.getByLabel('Format').selectOption(book.format)
  if (book.performers) await page.getByLabel('Featured Performers').fill(book.performers)
  if (book.signed) await page.getByLabel('Signed copy').check()
  if (book.limitedEditionNumber) await page.getByLabel('Limited Edition').fill(book.limitedEditionNumber)
  if (book.conjuringArchiveUrl) await page.getByLabel('Conjuring Archive').fill(book.conjuringArchiveUrl)
  if (book.magicrefUrl) await page.getByLabel('MagicRef').fill(book.magicrefUrl)
  await page.getByRole('button', { name: 'Add to Library' }).click()
  // Match /library with or without ?saved=1 query param
  await page.waitForURL(/\/library/, { timeout: 15_000 })
}

export async function deleteBookFromDetail(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Remove from Library' }).click()
  // Scope confirm click to the dialog to avoid matching the trigger button
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible', timeout: 5_000 })
  await dialog.getByRole('button', { name: 'Remove', exact: true }).click()
  // Match /library with or without ?deleted=1 query param
  await page.waitForURL(/\/library/, { timeout: 10_000 })
}

export async function deleteBookByTitle(page: Page, title: string): Promise<void> {
  await page.goto('/library')
  await page.getByText(title).first().click()
  await page.waitForURL(/\/book\//)
  await deleteBookFromDetail(page)
}
