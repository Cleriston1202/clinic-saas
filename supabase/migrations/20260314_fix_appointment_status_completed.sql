do $$
begin
  if exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'appointment_status'
  ) then
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

    if exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typnamespace = 'public'::regnamespace
        and t.typname = 'appointment_status'
        and e.enumlabel = 'cancelled'
    ) then
      begin
        alter type public.appointment_status rename value 'cancelled' to 'canceled';
      exception
        when others then
          null;
      end;
    end if;
  else
    create type public.appointment_status as enum ('scheduled', 'confirmed', 'completed', 'canceled');
  end if;
end $$;