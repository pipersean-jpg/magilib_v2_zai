/**
 * M2D — Library Search & Filtering E2E tests
 *
 * Seed books created once in beforeAll:
 *   A — "M2D Card Table"     book format, signed, limited, archive URL,   topics: Card Magic
 *   B — "M2D Vernon Lecture" lecture_notes format, performer, archive URL, topics: Card Magic + Theory
 *   C — "M2D Mentalia"       manuscript format, magicref URL,             topics: Mentalism
 *   D — "M2D Zombie Booklet" booklet format, year 1945,                   topics: Stage Illusion
 */

import { test, expect } from '@playwright/test'
import { testEmail, TEST_PASSWORD, signUp, signIn } from './helpers/auth'
import { createBook, deleteBookByTitle } from './helpers/books'

const TS = Date.now()

const BOOKS = {
  A: {
    title: `M2D Card Table ${TS}`,
    authors: 'S. W. Erdnase',
    year: '1902',
    format: 'book',
    signed: true as const,
    limitedEditionNumber: '042',
    conjuringArchiveUrl: 'https://conjuringarchive.com/test',
    topics: ['Card Magic'],
  },
  B: {
    title: `M2D Vernon Lecture ${TS}`,
    authors: 'Dai Vernon',
    year: '1959',
    format: 'lecture_notes',
    performers: 'Dai Vernon',
    conjuringArchiveUrl: 'https://conjuringarchive.com/test2',
    topics: ['Card Magic', 'Theory & Performance'],
  },
  C: {
    title: `M2D Mentalia ${TS}`,
    authors: 'Bob Cassidy',
    format: 'manuscript',
    magicrefUrl: 'https://magicref.net/test',
    topics: ['Mentalism'],
  },
  D: {
    title: `M2D Zombie Booklet ${TS}`,
    authors: 'Joe Berg',
    publisher: 'Berg Publishing',
    year: '1945',
    format: 'booklet',
    topics: ['Stage Illusion'],
  },
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

    // Seed all four books
    for (const book of Object.values(BOOKS)) {
      await createBook(page, book)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Auth setup failed'
    authSkipReason = msg
    if (!msg.startsWith('SKIP:')) throw e
  }
  await ctx.close()
})

test.afterAll(async ({ browser }) => {
  if (!authReady) return
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await signIn(page, sharedEmail, TEST_PASSWORD)
  for (const book of Object.values(BOOKS)) {
    await deleteBookByTitle(page, book.title).catch(() => {/* already deleted */})
  }
  await ctx.close()
})

test.beforeEach(async ({ page }) => {
  if (!authReady) test.skip(true, authSkipReason)
  await signIn(page, sharedEmail, TEST_PASSWORD)
  await page.goto('/library')
  // Wait for search to appear — only shown after books load
  await expect(page.getByTestId('library-search')).toBeVisible({ timeout: 10_000 })
})

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

test.describe('text search', () => {
  test('search by title filters results', async ({ page }) => {
    await page.getByTestId('library-search').fill('Erdnase')
    await expect(page.getByText(BOOKS.A.title)).toBeVisible()
    await expect(page.getByText(BOOKS.B.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.C.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.D.title)).not.toBeVisible()
  })

  test('search by author filters results', async ({ page }) => {
    await page.getByTestId('library-search').fill('Dai Vernon')
    await expect(page.getByText(BOOKS.B.title)).toBeVisible()
    // Book A author is Erdnase — should not show
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
  })

  test('search by format label filters results', async ({ page }) => {
    await page.getByTestId('library-search').fill('Manuscript')
    await expect(page.getByText(BOOKS.C.title)).toBeVisible()
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
  })

  test('search by year filters results', async ({ page }) => {
    await page.getByTestId('library-search').fill('1945')
    await expect(page.getByText(BOOKS.D.title)).toBeVisible()
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
  })

  test('clearing search restores full list', async ({ page }) => {
    await page.getByTestId('library-search').fill('Erdnase')
    await expect(page.getByText(BOOKS.B.title)).not.toBeVisible()

    await page.getByTestId('library-search').clear()
    for (const book of Object.values(BOOKS)) {
      await expect(page.getByText(book.title)).toBeVisible()
    }
  })

  test('non-matching search shows no-results state', async ({ page }) => {
    await page.getByTestId('library-search').fill('zzznomatch99999')
    await expect(page.getByTestId('no-results-message')).toBeVisible()
    await expect(page.getByTestId('book-list')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

test.describe('format filter', () => {
  test('filters to lecture_notes only', async ({ page }) => {
    await page.getByTestId('filter-format').selectOption('lecture_notes')
    await expect(page.getByText(BOOKS.B.title)).toBeVisible()
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.C.title)).not.toBeVisible()
  })

  test('all formats option restores full list', async ({ page }) => {
    await page.getByTestId('filter-format').selectOption('lecture_notes')
    await page.getByTestId('filter-format').selectOption('')
    for (const book of Object.values(BOOKS)) {
      await expect(page.getByText(book.title)).toBeVisible()
    }
  })
})

test.describe('signed filter', () => {
  test('toggle shows only signed books', async ({ page }) => {
    await page.getByTestId('filter-signed').click()
    await expect(page.getByText(BOOKS.A.title)).toBeVisible()
    await expect(page.getByText(BOOKS.B.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.C.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.D.title)).not.toBeVisible()
  })

  test('toggle off restores all', async ({ page }) => {
    await page.getByTestId('filter-signed').click()
    await page.getByTestId('filter-signed').click()
    for (const book of Object.values(BOOKS)) {
      await expect(page.getByText(book.title)).toBeVisible()
    }
  })
})

test.describe('limited edition filter', () => {
  test('shows only limited books', async ({ page }) => {
    await page.getByTestId('filter-limited').click()
    await expect(page.getByText(BOOKS.A.title)).toBeVisible()
    await expect(page.getByText(BOOKS.B.title)).not.toBeVisible()
  })
})

test.describe('Conjuring Archive link filter', () => {
  test('shows only books with archive URL', async ({ page }) => {
    await page.getByTestId('filter-archive').click()
    await expect(page.getByText(BOOKS.A.title)).toBeVisible()
    await expect(page.getByText(BOOKS.B.title)).toBeVisible()
    await expect(page.getByText(BOOKS.C.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.D.title)).not.toBeVisible()
  })
})

test.describe('MagicRef link filter', () => {
  test('shows only books with MagicRef URL', async ({ page }) => {
    await page.getByTestId('filter-magicref').click()
    await expect(page.getByText(BOOKS.C.title)).toBeVisible()
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.D.title)).not.toBeVisible()
  })
})

test.describe('topics filter', () => {
  test('single topic filters correctly', async ({ page }) => {
    await page.getByTestId('filter-topics-toggle').click()
    await page.getByTestId('topic-mentalism').check()
    await expect(page.getByText(BOOKS.C.title)).toBeVisible()
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
    await expect(page.getByText(BOOKS.D.title)).not.toBeVisible()
  })

  test('multiple topics OR match', async ({ page }) => {
    await page.getByTestId('filter-topics-toggle').click()
    await page.getByTestId('topic-mentalism').check()
    await page.getByTestId('topic-stage').check()
    await expect(page.getByText(BOOKS.C.title)).toBeVisible()  // mentalism
    await expect(page.getByText(BOOKS.D.title)).toBeVisible()  // stage
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
  })

  test('unchecking all topics restores full list', async ({ page }) => {
    await page.getByTestId('filter-topics-toggle').click()
    await page.getByTestId('topic-mentalism').check()
    await page.getByTestId('topic-mentalism').uncheck()
    for (const book of Object.values(BOOKS)) {
      await expect(page.getByText(book.title)).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// Combined search + filter
// ---------------------------------------------------------------------------

test.describe('combined search and filter', () => {
  test('search + format filter AND correctly', async ({ page }) => {
    await page.getByTestId('library-search').fill('Vernon')
    await page.getByTestId('filter-format').selectOption('lecture_notes')
    // Book B matches both (Vernon author + lecture_notes)
    await expect(page.getByText(BOOKS.B.title)).toBeVisible()
    // Book A has no Vernon
    await expect(page.getByText(BOOKS.A.title)).not.toBeVisible()
  })

  test('no-results state with combined filters', async ({ page }) => {
    await page.getByTestId('filter-signed').click()     // only book A
    await page.getByTestId('filter-magicref').click()   // only book C — intersection = empty
    await expect(page.getByTestId('no-results-message')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Clear filters
// ---------------------------------------------------------------------------

test.describe('clear filters', () => {
  test('clear filters button restores full list', async ({ page }) => {
    await page.getByTestId('filter-signed').click()
    await expect(page.getByTestId('clear-filters')).toBeVisible()
    await page.getByTestId('clear-filters').click()
    for (const book of Object.values(BOOKS)) {
      await expect(page.getByText(book.title)).toBeVisible()
    }
  })

  test('clear filters from no-results state restores full list', async ({ page }) => {
    await page.getByTestId('library-search').fill('zzznomatch99999')
    await expect(page.getByTestId('no-results-message')).toBeVisible()
    // Click the clear button inside the no-results section
    await page.getByTestId('no-results-message').locator('..').getByRole('button', { name: 'Clear filters' }).click()
    for (const book of Object.values(BOOKS)) {
      await expect(page.getByText(book.title)).toBeVisible()
    }
  })
})

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

test.describe('sort', () => {
  test('title A-Z: first book is alphabetically earliest', async ({ page }) => {
    await page.getByTestId('filter-sort').selectOption('title_az')
    const cards = page.getByTestId('book-list').locator('a')
    const firstTitle = await cards.first().textContent()
    // All four titles start with M2D — lowest is "M2D Card Table"
    expect(firstTitle).toContain('Card Table')
  })

  test('title Z-A: first book is alphabetically latest', async ({ page }) => {
    await page.getByTestId('filter-sort').selectOption('title_za')
    const cards = page.getByTestId('book-list').locator('a')
    const firstTitle = await cards.first().textContent()
    expect(firstTitle).toContain('Zombie')
  })

  test('year newest: book with latest year appears first among year-having books', async ({ page }) => {
    await page.getByTestId('filter-sort').selectOption('year_newest')
    const cards = page.getByTestId('book-list').locator('a')
    const firstTitle = await cards.first().textContent()
    // 1959 is most recent among A(1902), B(1959), D(1945); C has no year
    expect(firstTitle).toContain('Vernon')
  })

  test('year oldest: book with earliest year appears first', async ({ page }) => {
    await page.getByTestId('filter-sort').selectOption('year_oldest')
    const cards = page.getByTestId('book-list').locator('a')
    const firstTitle = await cards.first().textContent()
    // 1902 is oldest
    expect(firstTitle).toContain('Card Table')
  })
})

// ---------------------------------------------------------------------------
// Result count
// ---------------------------------------------------------------------------

test.describe('result count', () => {
  test('shows partial count when filtered', async ({ page }) => {
    await page.getByTestId('filter-signed').click()
    const count = page.getByTestId('result-count')
    await expect(count).toBeVisible()
    await expect(count).toContainText('of')
  })

  test('count hidden when no filters active', async ({ page }) => {
    await expect(page.getByTestId('result-count')).not.toBeVisible()
  })
})
