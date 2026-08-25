import { supabase } from "@/services/supabase/client";

export type CustomerServiceBookingInput = {
  customerId: string;
  serviceTypeId: string;

  carMake: string;
  carModel: string;
  carRegistration: string;

  postcode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;

  preferredDate: string;
  preferredTime: string;

  notes: string;
};

type CreatedBookingRow = {
  id: string;
};

function optionalText(
  value: string,
) {
  const trimmed =
    value.trim();

  return trimmed
    ? trimmed
    : null;
}

function parsePreferredDate(
  value: string,
) {
  const trimmed =
    value.trim();

  const match =
    trimmed.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    );

  if (!match) {
    throw new Error(
      "Preferred date must use DD/MM/YYYY.",
    );
  }

  const day =
    Number(match[1]);

  const month =
    Number(match[2]);

  const year =
    Number(match[3]);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      "Enter a valid preferred date.",
    );
  }

  const today =
    new Date();

  const todayUtc =
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

  if (
    date.getTime() <
    todayUtc
  ) {
    throw new Error(
      "Preferred date cannot be in the past.",
    );
  }

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function parsePreferredTime(
  value: string,
) {
  const trimmed =
    value.trim();

  const match =
    trimmed.match(
      /^([01]?\d|2[0-3]):([0-5]\d)$/,
    );

  if (!match) {
    throw new Error(
      "Preferred time must use HH:MM in 24-hour format.",
    );
  }

  const hour =
    String(
      Number(match[1]),
    ).padStart(2, "0");

  const minute =
    match[2];

  return `${hour}:${minute}:00`;
}

export async function createCustomerServiceBooking(
  input: CustomerServiceBookingInput,
) {
  // BOOKING_REQUIRED_FIELDS_GUARD
  const requiredTextFields: Array<
    [
      string,
      string,
    ]
  > = [
    [
      input.carMake,
      "Vehicle make",
    ],
    [
      input.carModel,
      "Vehicle model",
    ],
    [
      input.postcode,
      "Postcode",
    ],
    [
      input.addressLine1,
      "Address line 1",
    ],
    [
      input.city,
      "City",
    ],
    [
      input.preferredDate,
      "Preferred date",
    ],
    [
      input.preferredTime,
      "Preferred time",
    ],
  ];

  for (
    const [
      value,
      label,
    ] of requiredTextFields
  ) {
    if (!value.trim()) {
      throw new Error(
        `${label} is required.`,
      );
    }
  }

  const preferredDate =
    parsePreferredDate(
      input.preferredDate,
    );

  const preferredTime =
    parsePreferredTime(
      input.preferredTime,
    );

  const {
    data,
    error,
  } = await supabase
    .from("service_bookings")
    .insert({
      customer_id:
        input.customerId,

      service_type_id:
        input.serviceTypeId,

      car_make:
        input.carMake.trim(),

      car_model:
        input.carModel.trim(),

      car_registration:
        optionalText(
          input.carRegistration,
        )?.toUpperCase() ??
        null,

      postcode:
        input.postcode
          .trim()
          .toUpperCase(),

      address_line_1:
        input.addressLine1.trim(),

      address_line_2:
        optionalText(
          input.addressLine2,
        ),

      city:
        input.city.trim(),

      preferred_date:
        preferredDate,

      preferred_time:
        preferredTime,

      notes:
        optionalText(
          input.notes,
        ),

      status:
        "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const created =
    data as unknown as
      | CreatedBookingRow
      | null;

  if (!created?.id) {
    throw new Error(
      "Booking was created but its ID was not returned.",
    );
  }

  return created.id;
}

