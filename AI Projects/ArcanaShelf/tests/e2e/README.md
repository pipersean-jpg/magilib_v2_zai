# ArcanaShelf E2E Tests

Playwright tests verifying M1 flows: auth, book CRUD, cover images, seed data.

---

## Recommended test setup

Use a **separate Supabase project for testing** — never run E2E tests against production data. Tests create real auth users and database rows.

1. Create a dedicated test Supabase project (free tier is fine).
2. **Enable the Email provider** — Authentication → Providers → Email → turn on "Enable Email provider". Without this, signup fails with "Email signups are disabled" and all auth tests skip.
3. **Disable email confirmations** — Authentication → Configuration → Email → uncheck "Confirm email". Without this, signup succeeds but no session is created, and all auth tests skip.
4. Create the private `book-images` storage bucket — Storage → New bucket, name: `book-images`, Public: OFF.
5. Run `supabase/migrations/001_initial.sql` in the SQL Editor.
6. Run the three storage `create policy` statements at the bottom of `001_initial.sql` (uncomment, then run).
7. Set `.env.local` to point at the **test project** URL and anon key.
8. Run `npm run test:e2e`.

---

## Supabase Auth settings required

Two separate settings must both be configured correctly. Both are safe to change in a dev/test project only.

### Setting 1 — Email provider enabled
> Dashboard → Authentication → **Providers** → Email → **Enable Email provider: ON**

If this is OFF, Supabase rejects signup with "Email signups are disabled".
Tests skip with: `SKIP:EMAIL_SIGNUPS_DISABLED`

### Setting 2 — Email confirmation disabled
> Dashboard → Authentication → **Configuration** → Email → **Confirm email: OFF** (uncheck)

If this is ON, Supabase creates the user but issues no session. The proxy redirects back to `/login`.
Tests skip with: `SKIP:EMAIL_CONFIRM`

Both settings must be correct for auth/book/image tests to run. Route-protection tests run regardless of either setting.

---

## Prerequisites summary

All of the following must be in place before running tests:

1. **`.env.local` configured** with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing at the **test project**

2. **Database migrations applied** — run `supabase/migrations/001_initial.sql` in the Supabase SQL Editor

3. **`book-images` storage bucket created** (Storage → New bucket, name: `book-images`, Public: OFF)
   - Without this, cover image tests fail at the display assertion. Auth and book CRUD tests still pass.

4. **Storage RLS policies applied** — the three `create policy` statements at the bottom of `001_initial.sql` (uncomment and run in SQL Editor)

5. **Email provider enabled** — Authentication → Providers → Email → Enable Email provider: ON
   - If OFF, auth/book/image tests skip with `SKIP:EMAIL_SIGNUPS_DISABLED`

6. **Email confirmation disabled** — Authentication → Configuration → Email → Confirm email: OFF
   - If ON, auth/book/image tests skip with `SKIP:EMAIL_CONFIRM`
   - Only disable in a dev/test project, never in production.

> Test accounts use the pattern `arcanashelf-e2e-{timestamp}@example.com` and are not automatically cleaned up.
> Test books are deleted during test cleanup where possible.

---

## Running tests

```bash
# Headless (default)
npm run test:e2e

# With browser UI visible
npm run test:e2e:headed

# Interactive Playwright UI
npm run test:e2e:ui
```

---

## Seed tests (optional)

`seed.spec.ts` is skipped unless env vars are set:

```bash
# 1. Create test@example.com account via /login
# 2. Run supabase/seed.sql in Supabase SQL Editor
# 3. Then run:
E2E_SEED_EMAIL=test@example.com E2E_SEED_PASSWORD=your-password npm run test:e2e
```

---

## Test files

| File | What it tests |
|------|--------------|
| `auth.spec.ts` | Route protection, signup, login, logout, session persistence |
| `books.spec.ts` | Create / view / edit / delete book (no image) |
| `images.spec.ts` | Cover upload, display, replacement, delete cleanup |
| `seed.spec.ts` | Seed data visible for test user, isolated from other users |

---

## Known limitations

- Test Supabase accounts (`arcanashelf-e2e-*@example.com`) accumulate over time — no client-side API to delete auth users. Clean up manually in Supabase Dashboard → Authentication → Users if needed.
- Image tests require the `book-images` bucket. If it doesn't exist, they fail at the cover display assertion.
- Signed URLs expire in 1 hour — if a test run is paused for >1hr mid-suite the image visibility assertion may fail.
