import {
  createClient,
} from "npm:@supabase/supabase-js@2";

type PushEvent = {
  id: string;
  recipient_id: string;
  event_type: string;
  title: string;
  body: string;
  assignment_id: string | null;
  job_kind: string | null;
  job_id: string | null;
  data:
    | Record<string, unknown>
    | null;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: PushEvent;
};

type PushTokenRow = {
  id: string;
  expo_push_token: string;
};

type ExpoTicket = {
  status:
    | "ok"
    | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

function getServiceRoleKey() {
  const legacy =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

  if (legacy) {
    return legacy;
  }

  const raw =
    Deno.env.get(
      "SUPABASE_SECRET_KEYS",
    );

  if (!raw) {
    throw new Error(
      "Supabase service secret is unavailable.",
    );
  }

  const parsed =
    JSON.parse(raw) as
      Record<string, string>;

  const key =
    parsed.default ??
    Object.values(parsed)[0];

  if (!key) {
    throw new Error(
      "No Supabase secret key was found.",
    );
  }

  return key;
}

Deno.serve(
  async (req) => {
    if (
      req.method !==
      "POST"
    ) {
      return new Response(
        "Method not allowed",
        {
          status: 405,
        },
      );
    }

    const payload =
      (
        await req.json()
      ) as
        | WebhookPayload
        | PushEvent;

    const event =
      "record" in payload
        ? payload.record
        : payload;

    if (
      !event ||
      !event.id ||
      !event.recipient_id
    ) {
      return Response.json(
        {
          error:
            "Invalid push-event payload",
        },
        {
          status: 400,
        },
      );
    }

    const supabaseUrl =
      Deno.env.get(
        "SUPABASE_URL",
      );

    if (!supabaseUrl) {
      throw new Error(
        "SUPABASE_URL is missing.",
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        getServiceRoleKey(),
        {
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        },
      );

    try {
      const {
        data: tokens,
        error: tokenError,
      } =
        await supabase
          .from(
            "device_push_tokens",
          )
          .select(
            "id,expo_push_token",
          )
          .eq(
            "user_id",
            event.recipient_id,
          )
          .eq(
            "is_active",
            true,
          );

      if (tokenError) {
        throw tokenError;
      }

      const activeTokens =
        (
          tokens ??
          []
        ) as PushTokenRow[];

      if (
        activeTokens.length ===
        0
      ) {
        await supabase
          .from(
            "push_notification_events",
          )
          .update({
            processed_at:
              new Date()
                .toISOString(),
            send_error:
              "No active push token",
          })
          .eq(
            "id",
            event.id,
          );

        return Response.json({
          ok: true,
          sent: 0,
          reason:
            "no_active_tokens",
        });
      }

      const messages =
        activeTokens.map(
          (token) => ({
            to:
              token.expo_push_token,

            title:
              event.title,

            body:
              event.body,

            sound:
              "default",

            priority:
              "high",

            ttl:
              86400,

            channelId:
              "fengxing-jobs-v2",

            data: {
              ...(
                event.data ??
                {}
              ),

              assignmentId:
                event.assignment_id,

              jobKind:
                event.job_kind,

              jobId:
                event.job_id,

              eventType:
                event.event_type,
            },
          }),
        );

      const expoResponse =
        await fetch(
          "https://exp.host/--/api/v2/push/send",
          {
            method:
              "POST",

            headers: {
              Accept:
                "application/json",

              "Accept-Encoding":
                "gzip, deflate",

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                messages,
              ),
          },
        );

      const expoBody =
        await expoResponse
          .json();

      if (
        !expoResponse.ok
      ) {
        throw new Error(
          "Expo Push API failed: " +
            JSON.stringify(
              expoBody,
            ),
        );
      }

      const tickets =
        (
          Array.isArray(
            expoBody?.data,
          )
            ? expoBody.data
            : []
        ) as ExpoTicket[];

      const ticketIds:
        string[] = [];

      for (
        let i = 0;
        i <
        activeTokens.length;
        i += 1
      ) {
        const ticket =
          tickets[i];

        const token =
          activeTokens[i];

        if (
          ticket?.status ===
            "ok" &&
          ticket.id
        ) {
          ticketIds.push(
            ticket.id,
          );
          continue;
        }

        if (
          ticket?.details
            ?.error ===
          "DeviceNotRegistered"
        ) {
          await supabase
            .from(
              "device_push_tokens",
            )
            .update({
              is_active:
                false,
              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              token.id,
            );
        }
      }

      const ticketErrors =
        tickets
          .filter(
            (ticket) =>
              ticket.status ===
              "error",
          )
          .map(
            (ticket) =>
              ticket.message ??
              ticket.details
                ?.error ??
              "Unknown push error",
          );

      await supabase
        .from(
          "push_notification_events",
        )
        .update({
          processed_at:
            new Date()
              .toISOString(),

          expo_ticket_ids:
            ticketIds,

          send_error:
            ticketErrors.length
              ? ticketErrors.join(
                  " | ",
                )
              : null,
        })
        .eq(
          "id",
          event.id,
        );

      return Response.json({
        ok: true,
        sent:
          ticketIds.length,
        tickets:
          ticketIds,
        errors:
          ticketErrors,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      try {
        await supabase
          .from(
            "push_notification_events",
          )
          .update({
            send_error:
              message,
          })
          .eq(
            "id",
            event.id,
          );
      } catch {
        // Preserve original error.
      }

      console.error(
        "Fengxing push send failed:",
        error,
      );

      return Response.json(
        {
          error:
            message,
        },
        {
          status: 500,
        },
      );
    }
  },
);

