create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'staff');
create type public.appointment_status as enum ('scheduled', 'confirmed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  birth_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  specialty text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  constraint appointment_time_check check (end_time > start_time)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  amount numeric(12, 2) not null,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists users_clinic_idx on public.users(clinic_id);
create index if not exists patients_clinic_idx on public.patients(clinic_id);
create index if not exists doctors_clinic_idx on public.doctors(clinic_id);
create index if not exists appointments_clinic_start_idx on public.appointments(clinic_id, start_time);
create index if not exists payments_clinic_created_idx on public.payments(clinic_id, created_at);

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
as $$
  select clinic_id from public.users where id = auth.uid();
$$;

alter table public.clinics enable row level security;
alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;

create policy "clinic_select_own"
on public.clinics for select
using (id = public.current_clinic_id());

create policy "clinic_insert_authenticated"
on public.clinics for insert
to authenticated
with check (true);

create policy "clinic_update_admin"
on public.clinics for update
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.clinic_id = clinics.id
      and u.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.clinic_id = clinics.id
      and u.role = 'admin'
  )
);

create policy "users_select_same_clinic"
on public.users for select
using (clinic_id = public.current_clinic_id());

create policy "users_insert_self"
on public.users for insert
to authenticated
with check (id = auth.uid());

create policy "users_update_admin_or_self"
on public.users for update
using (
  id = auth.uid()
  or exists (
    select 1
    from public.users owner
    where owner.id = auth.uid()
      and owner.clinic_id = users.clinic_id
      and owner.role = 'admin'
  )
)
with check (
  clinic_id = public.current_clinic_id()
);

create policy "patients_tenant_all"
on public.patients for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());

create policy "doctors_tenant_all"
on public.doctors for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());

create policy "appointments_tenant_all"
on public.appointments for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());

create policy "payments_tenant_all"
on public.payments for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());
