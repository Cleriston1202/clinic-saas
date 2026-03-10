alter table if exists public.clinics add column if not exists slug text;

update public.clinics
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6)
where coalesce(trim(slug), '') = '';

create unique index if not exists clinics_slug_unique_idx on public.clinics(slug);

alter table public.clinics alter column slug set not null;
