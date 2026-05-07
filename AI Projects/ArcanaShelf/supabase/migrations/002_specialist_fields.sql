-- M2A: specialist fields for magic/niche book cataloguing
ALTER TABLE books
  ADD COLUMN format                 text,
  ADD COLUMN performers             text[] NOT NULL DEFAULT '{}',
  ADD COLUMN signed                 boolean,
  ADD COLUMN limited_edition_number text,
  ADD COLUMN conjuring_archive_url  text,
  ADD COLUMN magicref_url           text;
