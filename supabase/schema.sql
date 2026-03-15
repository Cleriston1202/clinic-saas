create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'clinic_member_role') then
    create type public.clinic_member_role as enum ('admin', 'doctor', 'receptionist');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'appointment_status') then
    create type public.appointment_status as enum ('scheduled', 'confirmed', 'completed', 'canceled');
  else
    begin
      alter type public.appointment_status add value if not exists 'completed';
    exception
      when others then
        null;
    end;
    begin
      alter type public.appointment_status add value if not exists 'canceled';
    exception
      when others then
        null;
    end;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;
end $$;

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  email text,
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create table if not exists public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.clinic_member_role not null default 'receptionist',
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete cascade,
  email text not null unique,
  role text not null default 'receptionist',
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  birth_date date,
  notes text,
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
  doctor_id uuid references public.doctors(id) on delete restrict,
  professional_id uuid references public.doctors(id) on delete restrict,
  service_id uuid,
  appointment_type text not null default 'general',
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  constraint appointment_time_check check (end_time > start_time)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null default 0,
  duration_minutes integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  amount numeric(12, 2) not null,
  payment_method text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'appointments'
      and constraint_name = 'appointments_service_id_fkey'
  ) then
    alter table public.appointments
      add constraint appointments_service_id_fkey
      foreign key (service_id) references public.services(id) on delete set null;
  end if;
end $$;

create index if not exists clinic_members_clinic_idx on public.clinic_members(clinic_id);
create index if not exists clinic_members_user_idx on public.clinic_members(user_id);
create index if not exists users_clinic_idx on public.users(clinic_id);
create index if not exists patients_clinic_idx on public.patients(clinic_id);
create index if not exists doctors_clinic_idx on public.doctors(clinic_id);
create index if not exists services_clinic_idx on public.services(clinic_id);
create index if not exists appointments_clinic_start_idx on public.appointments(clinic_id, start_time);
create index if not exists payments_clinic_created_idx on public.payments(clinic_id, created_at);

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
as $$
  select u.clinic_id
  from public.users u
  where u.id = auth.uid();
$$;

insert into public.clinic_members (clinic_id, user_id, role)
select u.clinic_id, u.id,
  case
    when lower(coalesce(u.role, '')) = 'admin' then 'admin'::public.clinic_member_role
    when lower(coalesce(u.role, '')) = 'doctor' then 'doctor'::public.clinic_member_role
    else 'receptionist'::public.clinic_member_role
  end
from public.users u
where u.clinic_id is not null
on conflict (clinic_id, user_id) do nothing;

alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;

drop policy if exists "clinic_select_own" on public.clinics;
create policy "clinic_select_own"
on public.clinics for select
using (id = public.current_clinic_id());

drop policy if exists "clinic_insert_authenticated" on public.clinics;
create policy "clinic_insert_authenticated"
on public.clinics for insert
to authenticated
with check (true);

drop policy if exists "clinic_update_admin" on public.clinics;
create policy "clinic_update_admin"
on public.clinics for update
using (
  exists (
    select 1 from public.clinic_members cm
    where cm.user_id = auth.uid()
      and cm.clinic_id = clinics.id
      and cm.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.clinic_members cm
    where cm.user_id = auth.uid()
      and cm.clinic_id = clinics.id
      and cm.role = 'admin'
  )
);

drop policy if exists "clinic_members_select_own_clinic" on public.clinic_members;
create policy "clinic_members_select_own_clinic"
on public.clinic_members for select
using (clinic_id = public.current_clinic_id());

drop policy if exists "clinic_members_insert_admin" on public.clinic_members;
create policy "clinic_members_insert_admin"
on public.clinic_members for insert
with check (
  clinic_id = public.current_clinic_id()
  and exists (
    select 1 from public.clinic_members cm
    where cm.user_id = auth.uid()
      and cm.clinic_id = public.current_clinic_id()
      and cm.role = 'admin'
  )
);

drop policy if exists "clinic_members_update_admin" on public.clinic_members;
create policy "clinic_members_update_admin"
on public.clinic_members for update
using (
  clinic_id = public.current_clinic_id()
  and exists (
    select 1 from public.clinic_members cm
    where cm.user_id = auth.uid()
      and cm.clinic_id = public.current_clinic_id()
      and cm.role = 'admin'
  )
)
with check (clinic_id = public.current_clinic_id());

drop policy if exists "users_select_self" on public.users;
create policy "users_select_self"
on public.users for select
using (id = auth.uid());

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users_update_admin_or_self" on public.users;
create policy "users_update_admin_or_self"
on public.users for update
using (
  id = auth.uid()
  or exists (
    select 1
    from public.clinic_members cm
    where cm.user_id = auth.uid()
      and cm.clinic_id = users.clinic_id
      and cm.role = 'admin'
  )
)
with check (
  clinic_id = public.current_clinic_id()
);

drop policy if exists "patients_tenant_all" on public.patients;
create policy "patients_tenant_all"
on public.patients for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());

drop policy if exists "doctors_tenant_all" on public.doctors;
create policy "doctors_tenant_all"
on public.doctors for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());

drop policy if exists "services_tenant_all" on public.services;
create policy "services_tenant_all"
on public.services for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());

drop policy if exists "appointments_tenant_all" on public.appointments;
create policy "appointments_tenant_all"
on public.appointments for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());

drop policy if exists "payments_tenant_all" on public.payments;
create policy "payments_tenant_all"
on public.payments for all
using (clinic_id = public.current_clinic_id())
with check (clinic_id = public.current_clinic_id());
