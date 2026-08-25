begin;

-- ---------------------------------------------------------------------------
-- 1. DEVICE PUSH TOKENS
-- ---------------------------------------------------------------------------

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  expo_push_token text not null unique,

  platform text not null
    check (platform in ('android', 'ios')),

  device_id text null,

  is_active boolean not null default true,

  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  device_push_tokens_user_idx
on public.device_push_tokens(user_id);

create index if not exists
  device_push_tokens_active_user_idx
on public.device_push_tokens(user_id, is_active);

alter table public.device_push_tokens
  enable row level security;

drop policy if exists
  "Users read own push tokens"
on public.device_push_tokens;

create policy
  "Users read own push tokens"
on public.device_push_tokens
for select
to authenticated
using (
  user_id = auth.uid()
);

revoke insert, update, delete
on public.device_push_tokens
from authenticated;

-- ---------------------------------------------------------------------------
-- 2. PUSH OUTBOX / AUDIT TABLE
-- ---------------------------------------------------------------------------

create table if not exists public.push_notification_events (
  id uuid primary key default gen_random_uuid(),

  recipient_id uuid not null
    references public.profiles(id)
    on delete cascade,

  event_type text not null,

  title text not null,
  body text not null,

  assignment_id uuid null
    references public.employee_assignments(id)
    on delete set null,

  job_kind text null
    check (
      job_kind is null
      or job_kind in ('service', 'inspection')
    ),

  job_id uuid null,

  data jsonb not null default '{}'::jsonb,

  dedupe_key text not null unique,

  expo_ticket_ids jsonb not null default '[]'::jsonb,

  processed_at timestamptz null,
  send_error text null,

  created_at timestamptz not null default now()
);

create index if not exists
  push_notification_events_recipient_idx
on public.push_notification_events(recipient_id, created_at desc);

create index if not exists
  push_notification_events_unprocessed_idx
on public.push_notification_events(created_at)
where processed_at is null;

alter table public.push_notification_events
  enable row level security;

drop policy if exists
  "Admins read push events"
on public.push_notification_events;

create policy
  "Admins read push events"
on public.push_notification_events
for select
to authenticated
using (
  (select private.is_admin())
);

revoke insert, update, delete
on public.push_notification_events
from authenticated;

-- ---------------------------------------------------------------------------
-- 3. PUSH TOKEN RPCs
-- ---------------------------------------------------------------------------

create or replace function public.register_push_token(
  p_token text,
  p_platform text,
  p_device_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_id uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if trim(coalesce(p_token, '')) = '' then
    raise exception 'Push token is required';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception 'Invalid push platform';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_uid
      and p.role = 'inspector'
      and p.staff_status = 'active'
  ) then
    raise exception 'Active inspector access required';
  end if;

  -- A physical device token belongs to the currently signed-in user.
  delete from public.device_push_tokens
  where expo_push_token = trim(p_token)
    and user_id <> v_uid;

  insert into public.device_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_id,
    is_active,
    last_seen_at,
    updated_at
  )
  values (
    v_uid,
    trim(p_token),
    p_platform,
    nullif(trim(coalesce(p_device_id, '')), ''),
    true,
    now(),
    now()
  )
  on conflict (expo_push_token)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    device_id = excluded.device_id,
    is_active = true,
    last_seen_at = now(),
    updated_at = now()
  returning id
  into v_id;

  return v_id;
end;
$$;

create or replace function public.unregister_push_token(
  p_token text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.device_push_tokens
  set
    is_active = false,
    updated_at = now()
  where user_id = auth.uid()
    and expo_push_token = trim(p_token);
end;
$$;

revoke all
on function public.register_push_token(text, text, text)
from public;

revoke all
on function public.unregister_push_token(text)
from public;

grant execute
on function public.register_push_token(text, text, text)
to authenticated;

grant execute
on function public.unregister_push_token(text)
to authenticated;

-- ---------------------------------------------------------------------------
-- 4. PRIVATE ENQUEUE HELPER
-- ---------------------------------------------------------------------------

create or replace function private.fx_enqueue_push(
  p_recipient_id uuid,
  p_event_type text,
  p_title text,
  p_body text,
  p_assignment_id uuid,
  p_job_kind text,
  p_job_id uuid,
  p_dedupe_key text,
  p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient_id is null then
    return;
  end if;

  insert into public.push_notification_events (
    recipient_id,
    event_type,
    title,
    body,
    assignment_id,
    job_kind,
    job_id,
    data,
    dedupe_key
  )
  values (
    p_recipient_id,
    p_event_type,
    p_title,
    p_body,
    p_assignment_id,
    p_job_kind,
    p_job_id,
    coalesce(p_data, '{}'::jsonb),
    p_dedupe_key
  )
  on conflict (dedupe_key)
  do nothing;
end;
$$;

revoke all
on function private.fx_enqueue_push(
  uuid,
  text,
  text,
  text,
  uuid,
  text,
  uuid,
  text,
  jsonb
)
from public, authenticated;

-- ---------------------------------------------------------------------------
-- 5. NEW ASSIGNMENT + ASSIGNMENT CANCELLATION
-- ---------------------------------------------------------------------------

create or replace function private.fx_push_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind text;
  v_job_id uuid;
  v_vehicle text;
  v_registration text;
  v_title text;
  v_body text;
begin
  if new.service_booking_id is not null then
    v_kind := 'service';
    v_job_id := new.service_booking_id;

    select
      coalesce(
        nullif(
          trim(
            concat_ws(
              ' ',
              b.car_make,
              b.car_model
            )
          ),
          ''
        ),
        'Vehicle'
      ),
      nullif(trim(b.car_registration), '')
    into
      v_vehicle,
      v_registration
    from public.service_bookings b
    where b.id = new.service_booking_id;

  elsif new.verification_request_id is not null then
    v_kind := 'inspection';
    v_job_id := new.verification_request_id;

    select
      coalesce(
        nullif(
          trim(
            concat_ws(
              ' ',
              coalesce(v.external_make, c.make),
              coalesce(v.external_model, c.model)
            )
          ),
          ''
        ),
        'Vehicle'
      ),
      nullif(
        trim(
          coalesce(
            v.vehicle_registration,
            c.registration
          )
        ),
        ''
      )
    into
      v_vehicle,
      v_registration
    from public.verification_requests v
    left join public.cars c
      on c.id = v.car_id
    where v.id = new.verification_request_id;
  else
    return new;
  end if;

  v_body :=
    coalesce(v_vehicle, 'Vehicle') ||
    case
      when v_registration is not null
      then ' · ' || v_registration
      else ''
    end;

  if tg_op = 'INSERT'
    and new.status::text = 'assigned'
  then
    v_title :=
      case
        when v_kind = 'service'
        then 'New service job'
        else 'New inspection assigned'
      end;

    perform private.fx_enqueue_push(
      new.employee_id,
      'assignment_created',
      v_title,
      v_body,
      new.id,
      v_kind,
      v_job_id,
      'assignment_created:' || new.id::text,
      jsonb_build_object(
        'assignmentId', new.id,
        'jobId', v_job_id,
        'jobKind', v_kind,
        'eventType', 'assignment_created',
        'route', '/jobs/' || new.id::text
      )
    );
  end if;

  if tg_op = 'UPDATE'
    and old.status::text <> 'cancelled'
    and new.status::text = 'cancelled'
  then
    perform private.fx_enqueue_push(
      new.employee_id,
      'assignment_cancelled',
      'Assignment cancelled',
      v_body || ' is no longer an active assignment.',
      new.id,
      v_kind,
      v_job_id,
      'job_cancelled:' || new.id::text,
      jsonb_build_object(
        'assignmentId', new.id,
        'jobId', v_job_id,
        'jobKind', v_kind,
        'eventType', 'assignment_cancelled',
        'route', '/jobs/' || new.id::text
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists
  fx_push_assignment_change
on public.employee_assignments;

create trigger
  fx_push_assignment_change
after insert or update of status
on public.employee_assignments
for each row
execute function private.fx_push_assignment_change();

-- ---------------------------------------------------------------------------
-- 6. SERVICE SCHEDULE / CANCELLATION
-- ---------------------------------------------------------------------------

create or replace function private.fx_push_service_booking_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_vehicle text;
  v_registration text;
  v_body text;
  v_schedule_key text;
begin
  v_vehicle :=
    coalesce(
      nullif(
        trim(
          concat_ws(
            ' ',
            new.car_make,
            new.car_model
          )
        ),
        ''
      ),
      'Vehicle'
    );

  v_registration :=
    nullif(
      trim(new.car_registration),
      ''
    );

  v_body :=
    v_vehicle ||
    case
      when v_registration is not null
      then ' · ' || v_registration
      else ''
    end;

  if
    old.preferred_date is distinct from new.preferred_date
    or old.preferred_time is distinct from new.preferred_time
  then
    v_schedule_key :=
      coalesce(new.preferred_date::text, '') ||
      '|' ||
      coalesce(new.preferred_time::text, '');

    for r in
      select
        ea.id,
        ea.employee_id
      from public.employee_assignments ea
      where ea.service_booking_id = new.id
        and ea.status::text in (
          'assigned',
          'accepted',
          'in_progress'
        )
    loop
      perform private.fx_enqueue_push(
        r.employee_id,
        'appointment_updated',
        'Job appointment updated',
        v_body,
        r.id,
        'service',
        new.id,
        'service_schedule:' ||
          new.id::text ||
          ':' ||
          r.id::text ||
          ':' ||
          v_schedule_key,
        jsonb_build_object(
          'assignmentId', r.id,
          'jobId', new.id,
          'jobKind', 'service',
          'eventType', 'appointment_updated',
          'route', '/jobs/' || r.id::text
        )
      );
    end loop;
  end if;

  if
    old.status::text <> 'cancelled'
    and new.status::text = 'cancelled'
  then
    for r in
      select
        ea.id,
        ea.employee_id
      from public.employee_assignments ea
      where ea.service_booking_id = new.id
        and ea.status::text in (
          'assigned',
          'accepted',
          'in_progress'
        )
    loop
      perform private.fx_enqueue_push(
        r.employee_id,
        'assignment_cancelled',
        'Assignment cancelled',
        v_body || ' is no longer an active assignment.',
        r.id,
        'service',
        new.id,
        'job_cancelled:' || r.id::text,
        jsonb_build_object(
          'assignmentId', r.id,
          'jobId', new.id,
          'jobKind', 'service',
          'eventType', 'assignment_cancelled',
          'route', '/jobs/' || r.id::text
        )
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists
  fx_push_service_booking_change
on public.service_bookings;

create trigger
  fx_push_service_booking_change
after update of
  preferred_date,
  preferred_time,
  status
on public.service_bookings
for each row
execute function private.fx_push_service_booking_change();

-- ---------------------------------------------------------------------------
-- 7. INSPECTION SCHEDULE / CANCELLATION / ADMIN FINALISE
-- ---------------------------------------------------------------------------

create or replace function private.fx_push_verification_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_vehicle text;
  v_registration text;
  v_body text;
  v_schedule_key text;
begin
  select
    coalesce(
      nullif(
        trim(
          concat_ws(
            ' ',
            coalesce(new.external_make, c.make),
            coalesce(new.external_model, c.model)
          )
        ),
        ''
      ),
      'Vehicle'
    ),
    nullif(
      trim(
        coalesce(
          new.vehicle_registration,
          c.registration
        )
      ),
      ''
    )
  into
    v_vehicle,
    v_registration
  from public.cars c
  where c.id = new.car_id;

  if new.car_id is null then
    v_vehicle :=
      coalesce(
        nullif(
          trim(
            concat_ws(
              ' ',
              new.external_make,
              new.external_model
            )
          ),
          ''
        ),
        'Vehicle'
      );

    v_registration :=
      nullif(
        trim(new.vehicle_registration),
        ''
      );
  end if;

  v_body :=
    coalesce(v_vehicle, 'Vehicle') ||
    case
      when v_registration is not null
      then ' · ' || v_registration
      else ''
    end;

  if
    old.preferred_date is distinct from new.preferred_date
    or old.preferred_time is distinct from new.preferred_time
    or old.scheduled_for is distinct from new.scheduled_for
  then
    v_schedule_key :=
      coalesce(new.preferred_date::text, '') ||
      '|' ||
      coalesce(new.preferred_time::text, '') ||
      '|' ||
      coalesce(new.scheduled_for::text, '');

    for r in
      select
        ea.id,
        ea.employee_id
      from public.employee_assignments ea
      where ea.verification_request_id = new.id
        and ea.status::text in (
          'assigned',
          'accepted',
          'in_progress'
        )
    loop
      perform private.fx_enqueue_push(
        r.employee_id,
        'appointment_updated',
        'Job appointment updated',
        v_body,
        r.id,
        'inspection',
        new.id,
        'inspection_schedule:' ||
          new.id::text ||
          ':' ||
          r.id::text ||
          ':' ||
          v_schedule_key,
        jsonb_build_object(
          'assignmentId', r.id,
          'jobId', new.id,
          'jobKind', 'inspection',
          'eventType', 'appointment_updated',
          'route', '/jobs/' || r.id::text
        )
      );
    end loop;
  end if;

  if
    old.status::text <> 'cancelled'
    and new.status::text = 'cancelled'
  then
    for r in
      select
        ea.id,
        ea.employee_id
      from public.employee_assignments ea
      where ea.verification_request_id = new.id
        and ea.status::text in (
          'assigned',
          'accepted',
          'in_progress'
        )
    loop
      perform private.fx_enqueue_push(
        r.employee_id,
        'assignment_cancelled',
        'Assignment cancelled',
        v_body || ' is no longer an active assignment.',
        r.id,
        'inspection',
        new.id,
        'job_cancelled:' || r.id::text,
        jsonb_build_object(
          'assignmentId', r.id,
          'jobId', new.id,
          'jobKind', 'inspection',
          'eventType', 'assignment_cancelled',
          'route', '/jobs/' || r.id::text
        )
      );
    end loop;
  end if;

  if
    old.status::text <> 'completed'
    and new.status::text = 'completed'
  then
    for r in
      select
        ea.id,
        ea.employee_id
      from public.employee_assignments ea
      where ea.verification_request_id = new.id
        and ea.status::text in (
          'assigned',
          'accepted',
          'in_progress',
          'completed'
        )
    loop
      perform private.fx_enqueue_push(
        r.employee_id,
        'inspection_finalised',
        'Inspection finalised',
        v_body || ' has been finalised by Fengxing.',
        r.id,
        'inspection',
        new.id,
        'inspection_finalised:' ||
          new.id::text ||
          ':' ||
          r.id::text,
        jsonb_build_object(
          'assignmentId', r.id,
          'jobId', new.id,
          'jobKind', 'inspection',
          'eventType', 'inspection_finalised',
          'route', '/jobs/' || r.id::text
        )
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists
  fx_push_verification_change
on public.verification_requests;

create trigger
  fx_push_verification_change
after update of
  preferred_date,
  preferred_time,
  scheduled_for,
  status
on public.verification_requests
for each row
execute function private.fx_push_verification_change();

commit;

