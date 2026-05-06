-- ArcanaShelf seed data
-- Step 1: Create an account at /login using test@example.com
-- Step 2: Run this in Supabase SQL editor

do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'test@example.com';
  if v_uid is null then
    raise notice 'No user found with test@example.com — create the account first, then re-run this seed.';
    return;
  end if;

  insert into public.books (user_id, title, authors, year, topics, condition, publisher, description)
  values
    (
      v_uid,
      'Expert at the Card Table',
      array['S. W. Erdnase'],
      1902,
      array['card_magic'],
      'good',
      'Chicago: self-published',
      'The foundational text of card technique. Required reading for any serious student of card magic.'
    ),
    (
      v_uid,
      'The Royal Road to Card Magic',
      array['Jean Hugard', 'Frederick Braue'],
      1949,
      array['card_magic'],
      'very_good',
      'Faber and Faber',
      'Classic beginner-to-intermediate card magic textbook covering sleights and routines.'
    ),
    (
      v_uid,
      'Dai Vernon Book of Magic',
      array['Dai Vernon', 'Lewis Ganson'],
      1957,
      array['card_magic', 'close_up'],
      'near_mint',
      'Supreme Magic Co.',
      'Lewis Ganson''s documentation of Vernon''s card work, covering his foundational sleights and philosophy.'
    ),
    (
      v_uid,
      'Strong Magic',
      array['Darwin Ortiz'],
      1994,
      array['theory', 'close_up'],
      'mint',
      'Kaufman and Company',
      'Comprehensive treatise on performance theory, technique application, and creating a strong close-up act.'
    ),
    (
      v_uid,
      '13 Steps to Mentalism',
      array['Tony Corinda'],
      1968,
      array['mentalism'],
      'good',
      'Corinda/Supreme Magic',
      'The definitive reference work on mentalism, covering billets, stooges, cold reading, hypnosis, and more.'
    );

  raise notice 'Seed complete — 5 books inserted for user %', v_uid;
end $$;
