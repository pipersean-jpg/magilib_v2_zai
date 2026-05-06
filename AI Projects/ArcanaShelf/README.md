# ArcanaShelf

Premium magic book cataloguing app. Next.js 16 + Supabase + Tailwind v4.

---

## M1 Status — COMPLETE

**Verified:** 2026-05-07

| Check | Result |
|-------|--------|
| `npm run build` | clean |
| `npx tsc --noEmit` | clean |
| `npx eslint .` | clean |
| `npm run test:e2e` | 19 passed, 2 skipped (seed — intentional), 0 failed |

### M1 features delivered

- Supabase email/password auth
- Protected app routes (proxy redirects unauthenticated requests to `/login`)
- Signup / login / logout flows
- Session persistence across hard reload
- Manual book creation (title, author, year, publisher, edition, condition, status, notes)
- Library view with cover thumbnails
- Book detail view
- Book editing
- Book deletion with storage cleanup
- Private cover image upload (`book-images` bucket, signed URLs)
- Signed URL cover display (library card + detail page)
- Cover replacement with old-file cleanup
- Storage object cleanup on book delete
- README setup documentation
- Playwright E2E test suite (auth, CRUD, images, seed)

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings.

### 3. Run database migrations

In the Supabase Dashboard → SQL Editor, paste and run the contents of:

```
supabase/migrations/001_initial.sql
```

### 4. Create the storage bucket

> **Required before image upload will work.**

In the Supabase Dashboard → Storage → New bucket:

- **Name:** `book-images`
- **Public:** OFF (private)

Then in the SQL Editor, run the three storage RLS policies commented out at the bottom of `supabase/migrations/001_initial.sql` (lines 116–126). Uncomment and run each `create policy` statement.

If this bucket does not exist, image uploads will fail with "Bucket not found". Book metadata will still save — you can add covers later by editing a book.

### 5. Run the dev server

```bash
npm run dev
```

### Optional: seed data

1. Create an account at `/login` using `test@example.com`
2. Run `supabase/seed.sql` in the Supabase SQL Editor
3. 5 classic magic books will appear in the library for that user

---

## Running E2E tests

E2E tests use Playwright against a real Supabase instance. Auth-dependent tests (signup, login, book CRUD, cover images) require a **dev/test Supabase project** with two specific Auth settings configured.

> **Never run E2E tests against a production Supabase project.**

### Recommended test setup

1. Create a separate Supabase project for testing (free tier is fine).
2. **Enable the Email provider** — Authentication → Providers → Email → Enable Email provider: ON.
3. **Disable email confirmations** — Authentication → Configuration → Email → uncheck "Confirm email".
4. Create the private `book-images` storage bucket (Storage → New bucket, Public: OFF).
5. Run `supabase/migrations/001_initial.sql` and the three storage policies in the SQL Editor.
6. Copy `.env.local.example` → `.env.local` and fill in the **test project** URL and anon key.
7. Run `npm run test:e2e`.

If either Auth setting is wrong, auth/book/image tests skip cleanly with a diagnostic code (`SKIP:EMAIL_SIGNUPS_DISABLED` or `SKIP:EMAIL_CONFIRM`). Route-protection tests still pass.

```bash
npm run test:e2e          # headless
npm run test:e2e:headed   # browser visible
npm run test:e2e:ui       # interactive Playwright UI
```

See [tests/e2e/README.md](tests/e2e/README.md) for full details.

---

## Build checks

```bash
npx eslint .
npx tsc --noEmit
npm run build
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript strict |
| Styling | Tailwind v4 (CSS-based config — no `tailwind.config.ts`) |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Deployment | Vercel (not yet configured) |

### Next.js 16 notes

- Middleware file is `proxy.ts` (not `middleware.ts`), export named `proxy`
- `params` in page components is a `Promise` — use `use(params)` in client components
- `cookies()` from `next/headers` must be awaited
- `next lint` removed — use `npx eslint .`

---

## M1 Known Limitations

### E2E / test environment

- **Seed tests require env vars.** `seed.spec.ts` skips unless `E2E_SEED_EMAIL` and `E2E_SEED_PASSWORD` are set. Create `test@example.com`, run `supabase/seed.sql`, then set the vars before running.
- **Email confirmation must be disabled** in the Supabase test project for auth tests to run. Never disable this in production — use a dedicated test project.
- **Use a separate Supabase project for testing.** Tests create real auth users and DB rows that are not automatically cleaned up.

### Product / runtime

- **Archived / sold books not visible.** Library filters `status = 'active'` only. No UI to view archived or sold books.
- **Signed URL expiry.** Cover images use 1-hour signed URLs with no auto-refresh. Covers show placeholder after expiry until page reload.
- **No error recovery in library / detail hooks.** `useBooks` and `useBook` have no retry — a Supabase error shows a static banner until full reload.
- **No pagination.** Library loads all books in one query. Fine for small collections.
- **Storage orphan edge case.** If a `cover_image_path` exists on a book but no `book_images` row exists, the storage object is orphaned on delete. Cannot happen through normal M1 UI flows.
- **`metadata_field_sources` has no UPDATE policy.** Intentional in M1 — future enrichment pipeline will own those writes.
- **No Vercel deployment.** Not yet configured.
- **No barcode scanning, OCR, AI enrichment, pricing aggregation, or wishlist.** Deferred to M2+.

---

## Recommended Next Step: M1.1 Hardening

> Scope only — do not implement until approved.

| Area | Work |
|------|------|
| Delete confirmation dialog | Prevent accidental deletes — confirm before removing book + storage |
| Form validation | Stronger client-side validation (required fields, year range, file size/type limits) |
| Loading / error / empty states | Skeleton loaders, retry buttons, better empty-library prompt |
| Mobile responsive polish | Audit layout on 375px viewport; fix any overflow / tap-target issues |
| Vercel deployment | `vercel.json`, environment variable setup, preview deployment workflow |
| Supabase production checklist | Email confirmation ON, strong RLS audit, storage bucket policy review |
| Local Supabase test setup | `supabase start` + local migrations so E2E tests run without a remote project |

---

## Deferred to M2+

- Barcode / ISBN scanning
- OCR (cover or title-page scan to metadata)
- AI metadata enrichment
- Pricing aggregation / market valuation
- Wishlist
- Background jobs / enrichment queue
- Capacitor / native mobile wrapper
- Specialist or marketplace comparables
