# Fengxing production push setup

## Generated architecture

Admin/database change
-> Postgres trigger
-> public.push_notification_events INSERT
-> Supabase Database Webhook
-> fengxing-push Edge Function
-> Expo Push Service
-> FCM/APNs
-> inspector phone

The mobile app stores one Expo Push Token per device/account in
public.device_push_tokens through secure RPCs.

## Push events

- New service assignment
- New inspection assignment
- Appointment rescheduled
- Assignment/job cancelled
- Inspection finalised by admin

## Local-only event

- 1-hour appointment reminder

## 1. Apply database migration

If this project is linked to Supabase CLI:

npx supabase db push

Or copy the generated migration SQL into Supabase SQL Editor and run it.

## 2. Deploy Edge Function

npx supabase functions deploy fengxing-push

## 3. Create ONE Database Webhook

Supabase Dashboard
-> Database
-> Webhooks
-> Create webhook

Name:
fengxing-push-events

Table:
public.push_notification_events

Event:
INSERT

Webhook type:
Supabase Edge Function

Function:
fengxing-push

Method:
POST

Authentication:
Add auth header with service key

Content-Type:
application/json

## 4. Expo / Android push prerequisites

The app needs a real EAS projectId.

If missing:
npx eas init

Android also needs Firebase Cloud Messaging credentials attached to
the Expo/EAS project and google-services.json configured for this app.

After native config/credentials are ready:
npx expo run:android

## 5. Verify inspector token

After inspector login:

select
  p.employee_id,
  t.platform,
  t.expo_push_token,
  t.is_active,
  t.last_seen_at
from public.device_push_tokens t
join public.profiles p
  on p.id = t.user_id
where p.employee_id = '12345';

## 6. Test push from SQL Editor

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
select
  p.id,
  'manual_test',
  'Fengxing push test',
  'Production push notifications are connected.',
  null,
  null,
  null,
  jsonb_build_object(
    'eventType',
    'manual_test'
  ),
  'manual_test:' ||
    extract(epoch from now())::text
from public.profiles p
where p.employee_id = '12345';

If the webhook/function/token/FCM setup is correct, the physical Android
device should receive the notification even when the app is not open.

