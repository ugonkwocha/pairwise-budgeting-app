-- Keep existing staging databases aligned after category inserts were hardened.

ALTER TABLE public.categories
  ALTER COLUMN needs_or_wants SET DEFAULT 'needs';
