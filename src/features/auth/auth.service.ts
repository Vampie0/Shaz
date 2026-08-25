import type { Session } from "@supabase/supabase-js";

import type {
  WorkerProfile,
} from "@/features/auth/auth.types";
import { supabase } from "@/services/supabase/client";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Session> {
  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error(
      "Supabase did not return a session after sign in.",
    );
  }

  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function getProfile(
  userId: string,
): Promise<WorkerProfile | null> {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "full_name",
        "phone",
        "avatar_url",
        "role",
        "employee_id",
        "staff_status",
      ].join(","),
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WorkerProfile | null) ?? null;
}

