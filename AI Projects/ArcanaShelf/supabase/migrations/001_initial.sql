-- ArcanaShelf — Initial Schema
-- Milestone 1: manual book entry, cover images, user copy details

create table public.books (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,

  -- bibliographic
  title             text not null,
  subtitle          text,
  authors           text[] not null default '{}',
  publisher         text,
  year              integer,
  isbn_10           text,
  isbn_13           text,
  edition           text,
  printing          text,
  page_count        integer,
  binding           text,
  language          text not null default 'en',
  description       text,
  topics            text[] not null default '{}',
  in_print          boolean,

  -- user copy
  condition         text,
  purchase_price    numeric(10,2),
  purchase_currency text not null default 'USD',
  purchase_date     date,
  purchase_source   text,
  location          text,
  notes             text,

  -- workflow
  status            text not null default 'active',
  cover_image_path  text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- check constraints
  constraint books_status_check     check (status in ('active', 'archived', 'sold')),
  constraint books_condition_check  check (condition is null or condition in ('mint', 'near_mint', 'very_good', 'good', 'fair', 'poor'))
);

create table public.book_images (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references public.books(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  image_type   text not null,
  storage_path text not null,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),

  constraint book_images_type_check check (image_type in ('cover', 'title_page', 'copyright_page', 'other'))
);

-- Provenance stub — populated by future enrichment pipeline, not M1 UI
create table public.metadata_field_sources (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references public.books(id) on delete cascade,
  field_name  text not null,
  source      text not null,  -- manual | isbn_lookup | ai_ocr | ai_inferred | specialist | marketplace
  confidence  numeric(3,2),
  raw_value   text,
  created_at  timestamptz not null default now(),

  unique(book_id, field_name, source),
  constraint sources_confidence_check check (confidence is null or (confidence >= 0 and confidence <= 1))
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- RLS
alter table public.books enable row level security;
alter table public.book_images enable row level security;
alter table public.metadata_field_sources enable row level security;

-- books
create policy "own books select"  on public.books for select  using (auth.uid() = user_id);
create policy "own books insert"  on public.books for insert  with check (auth.uid() = user_id);
create policy "own books update"  on public.books for update  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own books delete"  on public.books for delete  using (auth.uid() = user_id);

-- book_images
create policy "own images select" on public.book_images for select  using (auth.uid() = user_id);
create policy "own images insert" on public.book_images for insert  with check (auth.uid() = user_id);
create policy "own images update" on public.book_images for update  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own images delete" on public.book_images for delete  using (auth.uid() = user_id);

-- metadata_field_sources (access via book ownership — no update in M1)
create policy "own sources select" on public.metadata_field_sources for select
  using (exists (select 1 from public.books where id = book_id and user_id = auth.uid()));
create policy "own sources insert" on public.metadata_field_sources for insert
  with check (exists (select 1 from public.books where id = book_id and user_id = auth.uid()));
create policy "own sources delete" on public.metadata_field_sources for delete
  using (exists (select 1 from public.books where id = book_id and user_id = auth.uid()));
-- Note: no UPDATE policy on metadata_field_sources in M1 (intentional — future enrichment pipeline will manage this)


-- Storage bucket: book-images (private)
-- Create in Supabase dashboard: Storage > New bucket > name: book-images > Public: OFF
-- Then run these policies in the SQL editor:

-- insert (upload own folder)
-- create policy "owner upload" on storage.objects for insert
--   with check (bucket_id = 'book-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- select (read own folder)
-- create policy "owner read" on storage.objects for select
--   using (bucket_id = 'book-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- delete (delete own folder) — image replacement = delete + re-upload, no update policy needed
-- create policy "owner delete" on storage.objects for delete
--   using (bucket_id = 'book-images' and (storage.foldername(name))[1] = auth.uid()::text);
